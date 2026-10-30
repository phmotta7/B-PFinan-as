// Abre a fatura em PDF no próprio aparelho (pdf.js, da Mozilla) e devolve cada pedaço de texto com a sua posição.
// O arquivo e a senha não saem do celular; a senha só serve para abrir o PDF e não é guardada.
import type { ItemPdf } from '@/dominio/leitores';

/** O PDF pede senha (errada = a senha digitada não abriu). */
export class PdfComSenha extends Error {
  errada: boolean;
  constructor(errada: boolean) { super(errada ? 'Senha incorreta.' : 'Este PDF pede senha.'); this.errada = errada; }
}

export const ehPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

export async function lerItensDoPdf(dados: ArrayBuffer, senha?: string): Promise<ItemPdf[]> {
  // Versão "legacy": funciona também em iPhone e Android mais antigos. Carregada só quando alguém escolhe um PDF.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  let doc;
  try {
    // Cópia dos bytes: o pdf.js toma posse do que recebe, e a mesma leitura pode ser repetida com outra senha
    doc = await pdfjs.getDocument({ data: new Uint8Array(dados.slice(0)), password: senha, verbosity: pdfjs.VerbosityLevel.ERRORS }).promise;
  } catch (e) {
    if (e instanceof Error && e.name === 'PasswordException') throw new PdfComSenha(!!senha);
    throw e;
  }
  const itens: ItemPdf[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const { items } = await (await doc.getPage(p)).getTextContent();
    for (const it of items) if ('str' in it) itens.push({ pagina: p, x: it.transform[4], y: it.transform[5], texto: it.str });
  }
  await doc.destroy();
  return itens;
}
