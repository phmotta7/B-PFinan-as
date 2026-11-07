// Leitor de extrato OFX (PLANEJAMENTO §7.2, RN-OF-01 e RN-OF-02): um leitor só para os bancos da casa.
// Só lê; quem decide o que cada linha é (gasto, receita, Pix entre os dois...) é a classificação, com a pessoa confirmando (RN-OF-05).
// Formatos vistos em 07/11/2026 (Nubank e Inter do Pedro): OFX 1.02 "SGML", tags sem fechamento possível, datas com ou sem hora e fuso.
import type { Centavos } from './dinheiro';
import { ErroDeLeitura } from './leitores';

export type LinhaDoExtrato = {
  fitid: string;        // identificador da transação no banco (RN-OF-02)
  data: string;         // AAAA-MM-DD, data em que caiu na conta
  valor: Centavos;      // entrada positiva, saída negativa
  descricao: string;    // texto do banco (MEMO; NAME quando não há MEMO)
  contraparte?: string; // quem mandou ou recebeu, quando o banco diz (NAME do Inter, nome no Pix do Nubank)
  tipoBanco: string;    // CREDIT, DEBIT, PAYMENT... como veio
};
export type Extrato = {
  banco: string;        // código do banco (0260 Nubank, 077 Inter, 001 BB)
  nomeBanco: string;    // ORG do arquivo
  conta: string;        // número da conta como veio (serve para reconhecer a conta na próxima vez)
  inicio?: string; fim?: string;
  linhas: LinhaDoExtrato[];
};

/** Bytes do arquivo → texto. Alguns bancos dizem CHARSET:1252 mas mandam UTF-8 (o Inter faz isso): tenta UTF-8 primeiro. */
export function decodificarOfx(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}

/** "20261101000000[-3:BRT]" ou "20261107" → "2026-11-01". A data do banco já é a do dia no Brasil; o fuso não muda o dia. */
const dataOfx = (v?: string) => {
  const m = v?.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};
/** "-717.97", "1499,44", "1.234,56" → centavos. */
function centavos(v: string): Centavos {
  let s = v.trim().replace(/\s/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  if (!Number.isFinite(n)) throw new ErroDeLeitura(`Valor que o app não entendeu: "${v}".`);
  return Math.round(n * 100);
}
const limpar = (s?: string) => (s ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/** Valor de uma tag dentro de um bloco; aceita <TAG>valor</TAG> e <TAG>valor (sem fechar, como no SGML). */
function tag(bloco: string, nome: string, bruta = false): string | undefined {
  const m = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i'));
  return m ? (bruta ? m[1] : limpar(m[1])) : undefined;
}

// Nubank: "Transferência recebida pelo Pix - NOME - •••.123.456-•• - BANCO..." / "Transferência enviada pelo Pix - NOME (Transferência enviada)"
function contraparteNubank(memo: string): string | undefined {
  const m = memo.match(/^Transfer[êe]ncia (?:recebida|enviada)(?: pelo Pix)? - (.+?)(?: - |\s*\(|$)/i);
  return m ? m[1].trim() : undefined;
}
// Inter: o NAME traz a contraparte; em compra no débito vem a loja com a cidade colada ("Posto Sao Cristovao   Campo Grande Bra")
const contraparteInter = (name?: string) => (name ? limpar(name.replace(/\s{2,}.*$/, '')) : undefined);

export function lerOfx(texto: string): Extrato {
  if (!/<OFX>/i.test(texto)) throw new ErroDeLeitura('Este arquivo não parece um extrato OFX. No app do banco, procure "Exportar extrato" e escolha OFX.');
  if (/<CCSTMTRS>/i.test(texto) && !/<STMTRS>/i.test(texto)) throw new ErroDeLeitura('Este OFX é de cartão de crédito. Para o cartão, importe a fatura em Cartões.');
  const banco = tag(texto, 'BANKID') ?? tag(texto, 'FID') ?? '';
  const nomeBanco = tag(texto, 'ORG') ?? '';
  const conta = tag(texto, 'ACCTID') ?? '';
  const ehNubank = /^0?260$/.test(banco) || /NU PAGAMENTOS/i.test(nomeBanco);
  const blocos = texto.split(/<STMTTRN>/i).slice(1).map(b => b.split(/<\/STMTTRN>/i)[0]);
  const linhas: LinhaDoExtrato[] = blocos.map((b, i) => {
    const data = dataOfx(tag(b, 'DTPOSTED'));
    const valor = tag(b, 'TRNAMT');
    if (!data || valor === undefined) throw new ErroDeLeitura(`A linha ${i + 1} do extrato veio sem data ou sem valor.`);
    const memo = tag(b, 'MEMO') ?? '', name = tag(b, 'NAME') ?? '';
    const descricao = memo || name;
    const contraparte = ehNubank ? contraparteNubank(memo) : contraparteInter(tag(b, 'NAME', true)) || undefined;
    // Sem FITID (raro), o identificador sai da própria linha, para reimportar não duplicar
    const fitid = tag(b, 'FITID') || `sem-id:${data}:${valor}:${descricao}`;
    return { fitid, data, valor: centavos(valor), descricao, contraparte, tipoBanco: (tag(b, 'TRNTYPE') ?? '').toUpperCase() };
  });
  if (!linhas.length) throw new ErroDeLeitura('O extrato não tem nenhuma movimentação no período escolhido.');
  return { banco, nomeBanco, conta, inicio: dataOfx(tag(texto, 'DTSTART')), fim: dataOfx(tag(texto, 'DTEND')), linhas };
}
