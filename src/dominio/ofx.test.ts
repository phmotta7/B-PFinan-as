// Leitor OFX (RN-OF-01/02) com cópias fictícias dos extratos reais do Pedro (Nubank e Inter, recebidos em 07/11/2026).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodificarOfx, lerOfx } from './ofx';

const exemplo = (nome: string) => decodificarOfx(readFileSync(join(__dirname, '../../design/exemplos', nome)));

describe('extrato do Nubank (conta)', () => {
  const e = lerOfx(exemplo('Nubank_conta_2026-11_ficticio.ofx'));
  it('lê banco, conta, período e todas as linhas', () => {
    expect(e).toMatchObject({ banco: '0260', inicio: '2026-11-01', fim: '2026-11-06' });
    expect(e.linhas).toHaveLength(36);
    expect(e.linhas.every(l => /^2026-11-0[1-6]$/.test(l.data))).toBe(true);
  });
  it('entrada positiva, saída negativa, em centavos', () => {
    expect(e.linhas[0]).toMatchObject({ data: '2026-11-01', tipoBanco: 'CREDIT', contraparte: 'Bruna Exemplo Teste' });
    expect(e.linhas[0].valor).toBeGreaterThan(0);
    expect(e.linhas.find(l => l.descricao === 'Compra no débito - BURGER KING')!.valor).toBeLessThan(0);
  });
  it('acha a contraparte do Pix nos dois jeitos que o Nubank escreve', () => {
    expect(e.linhas.find(l => /PEDRO EXEMPLO TESTE - •••/.test(l.descricao))?.contraparte).toBe('PEDRO EXEMPLO TESTE');
    expect(e.linhas.find(l => /Bruna Exemplo Teste \(Transferência enviada\)/.test(l.descricao))?.contraparte).toBe('Bruna Exemplo Teste');
    expect(e.linhas.find(l => /BURGER KING/.test(l.descricao))?.contraparte).toBeUndefined();
  });
  it('identificador de cada linha é único (reimportar não duplica)', () => {
    expect(new Set(e.linhas.map(l => l.fitid)).size).toBe(e.linhas.length);
  });
});

describe('extrato do Inter', () => {
  const e = lerOfx(exemplo('Inter_conta_30d_ficticio.ofx'));
  it('lê datas sem hora e o tipo PAYMENT como saída', () => {
    expect(e).toMatchObject({ banco: '077', inicio: '2026-10-09', fim: '2026-11-07' });
    expect(e.linhas.filter(l => l.tipoBanco === 'PAYMENT').every(l => l.valor < 0)).toBe(true);
  });
  it('contraparte vem do nome, sem a cidade colada', () => {
    expect(e.linhas.find(l => /POSTO SAO CRISTOVAO/.test(l.descricao))?.contraparte).toBe('Posto Sao Cristovao');
    expect(e.linhas.find(l => /Seguro Premiavel/.test(l.descricao))?.contraparte).toBe('Seguro Premiável/fgts + Premiável');
  });
  it('a transferência do Inter para o Nubank tem o mesmo valor nos dois arquivos', () => {
    const nubank = lerOfx(exemplo('Nubank_conta_2026-11_ficticio.ofx'));
    const saida = e.linhas.find(l => l.data === '2026-11-06' && l.valor < 0)!;
    expect(nubank.linhas.some(l => l.data === '2026-11-06' && l.valor === -saida.valor)).toBe(true);
  });
});

describe('arquivos que não são extrato', () => {
  it('avisa quando não é OFX', () => expect(() => lerOfx('date,title,amount\n')).toThrow(/não parece um extrato OFX/));
  it('avisa quando é OFX de cartão de crédito', () => expect(() => lerOfx('<OFX><CREDITCARDMSGSRSV1><CCSTMTRS></CCSTMTRS></OFX>')).toThrow(/cartão de crédito/));
  it('aceita OFX com tags fechadas e vírgula decimal', () => {
    const e = lerOfx('<OFX><BANKID>001</BANKID><ACCTID>1</ACCTID><STMTRS><STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261105120000</DTPOSTED><TRNAMT>-1.234,56</TRNAMT><FITID>a</FITID><MEMO>Luz &amp; água</MEMO></STMTTRN></STMTRS></OFX>');
    expect(e.linhas[0]).toMatchObject({ data: '2026-11-05', valor: -123456, descricao: 'Luz & água' });
  });
  it('lê arquivo em Windows-1252', () => {
    const bytes = new Uint8Array([...new TextEncoder().encode('<OFX><MEMO>Premi'), 0xe1, ...new TextEncoder().encode('vel')]);
    expect(decodificarOfx(bytes)).toContain('Premiável');
  });
});
