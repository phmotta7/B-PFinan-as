import { beforeEach, describe, expect, it, vi } from 'vitest';

// O pdf.js de verdade precisa do navegador; aqui ele é trocado por um PDF de mentira que pede a senha "1234".
const pdfjs = vi.hoisted(() => {
  class PasswordException extends Error { constructor(m: string) { super(m); this.name = 'PasswordException'; } }
  // A promessa só nasce quando alguém a pede, para não sobrar recusa sem dono
  const abrir = (o?: { data: Uint8Array; password?: string }) => ({
    get promise() {
      return o?.password === '1234'
        ? Promise.resolve({ numPages: 1, destroy: vi.fn(), getPage: async () => ({ getTextContent: async () => ({ items: [{ str: 'OUROCARD', transform: [1, 0, 0, 1, 31, 697] }, { type: 'beginMarkedContent' }] }) }) })
        : Promise.reject(new PasswordException(o?.password ? 'Incorrect Password' : 'No password given'));
    },
  });
  return { getDocument: vi.fn(abrir), GlobalWorkerOptions: { workerSrc: '' }, VerbosityLevel: { ERRORS: 0 } };
});
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => pdfjs);

import { ehPdf, lerItensDoPdf, PdfComSenha } from './pdf';

describe('lerItensDoPdf', () => {
  const dados = new ArrayBuffer(8);
  beforeEach(() => pdfjs.getDocument.mockClear());

  it('sem senha, avisa que o PDF pede senha', async () => {
    await expect(lerItensDoPdf(dados)).rejects.toMatchObject({ errada: false });
    await expect(lerItensDoPdf(dados)).rejects.toBeInstanceOf(PdfComSenha);
  });
  it('com a senha errada, avisa que a senha não abriu', async () => {
    await expect(lerItensDoPdf(dados, '0000')).rejects.toMatchObject({ errada: true });
  });
  it('com a senha certa, devolve cada pedaço de texto com página e posição', async () => {
    expect(await lerItensDoPdf(dados, '1234')).toEqual([{ pagina: 1, x: 31, y: 697, texto: 'OUROCARD' }]);
  });
  it('entrega uma cópia dos bytes a cada tentativa, para poder tentar de novo com outra senha', async () => {
    await lerItensDoPdf(dados, '0000').catch(() => undefined);
    await lerItensDoPdf(dados, '1234');
    expect(dados.byteLength).toBe(8);
    expect(pdfjs.getDocument.mock.calls.filter(([o]) => o).map(([o]) => o!.password)).toEqual(['0000', '1234']);
  });
});

describe('ehPdf', () => {
  it('reconhece pelo tipo ou pela extensão', () => {
    expect(ehPdf(new File([''], 'fatura.PDF'))).toBe(true);
    expect(ehPdf(new File([''], 'fatura', { type: 'application/pdf' }))).toBe(true);
    expect(ehPdf(new File([''], 'fatura.csv', { type: 'text/csv' }))).toBe(false);
  });
});
