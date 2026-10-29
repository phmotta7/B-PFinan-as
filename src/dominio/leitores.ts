// Leitores de fatura (PLANEJAMENTO §4.4). Só leem e classificam; nada é gravado aqui.
import type { Centavos } from './dinheiro';

export type TipoLinha = 'compra' | 'parcela' | 'iof' | 'estorno' | 'anuidade' | 'juros' | 'ajuste';
export type Parcela = { atual: number; total: number };
export type LinhaLida = {
  data: string; // AAAA-MM-DD
  descricao: string; // como veio no arquivo
  loja: string; // descrição sem o pedaço da parcela
  valor: Centavos; // compra positiva, crédito negativo
  tipo: TipoLinha;
  parcela?: Parcela;
  iofDe?: string;
  digital: string; // impressão digital (RN-IM-01)
};
export type LinhaIgnorada = { data: string; descricao: string; valor: Centavos; motivo: string };
export type Leitura = { linhas: LinhaLida[]; ignoradas: LinhaIgnorada[] };

export class ErroDeLeitura extends Error {}

// ---------- CSV ----------
function separadorProvavel(linha: string): string {
  const conta = (c: string) => linha.split(c).length;
  return conta(';') > conta(',') ? ';' : conta('\t') > conta(',') ? '\t' : ',';
}
function lerCsv(texto: string, pular = 0): { cabecalho: string[]; linhas: string[][] } {
  const brutas = texto.replace(/^﻿/, '').split(/\r?\n/).slice(pular).filter(l => l.trim() !== '');
  if (!brutas.length) throw new ErroDeLeitura('O arquivo está vazio.');
  const sep = separadorProvavel(brutas[0]);
  const corta = (linha: string) => {
    const out: string[] = []; let atual = '', aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (c === '"') { if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas; }
      else if (c === sep && !aspas) { out.push(atual); atual = ''; }
      else atual += c;
    }
    out.push(atual);
    return out.map(s => s.trim());
  };
  const [cabecalho, ...linhas] = brutas.map(corta);
  return { cabecalho, linhas };
}

function paraCentavos(texto: string, decimal: ',' | '.'): Centavos {
  let t = texto.replace(/[^\d,.-]/g, '');
  t = decimal === ',' ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  const n = Number(t);
  if (!Number.isFinite(n) || t === '') throw new ErroDeLeitura(`Não entendi o valor "${texto}".`);
  return Math.round(n * 100);
}

export type FormatoData = 'dd/mm/aaaa' | 'mm/dd/aaaa' | 'aaaa-mm-dd';
function paraData(texto: string, formato: FormatoData): string {
  const p = texto.trim().split(/[/.-]/).map(Number);
  const [d, m, ano] = formato === 'dd/mm/aaaa' ? p : formato === 'mm/dd/aaaa' ? [p[1], p[0], p[2]] : [p[2], p[1], p[0]];
  const a = ano < 100 ? ano + 2000 : ano;
  if (!d || !m || !a || m > 12 || d > 31) throw new ErroDeLeitura(`Não entendi a data "${texto}".`);
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ---------- Classificação ----------
const PADROES_PARCELA = [/\bparcela\s+(\d{1,2})\s*\/\s*(\d{1,2})\b/i, /\bparcela\s+(\d{1,2})\s+de\s+(\d{1,2})\b/i, /\bparc\.?\s*(\d{1,2})\s*\/\s*(\d{1,2})\b/i, /\b(\d{1,2})\s*\/\s*(\d{1,2})\s*$/];
function acharParcela(descricao: string): { parcela?: Parcela; loja: string } {
  for (const p of PADROES_PARCELA) {
    const m = descricao.match(p);
    if (m) {
      const atual = Number(m[1]), total = Number(m[2]);
      if (atual >= 1 && total >= atual) return { parcela: { atual, total }, loja: descricao.replace(m[0], '').replace(/[\s\-–]+$/, '').trim() };
    }
  }
  return { loja: descricao };
}
function classificar(data: string, descricao: string, valor: Centavos): Omit<LinhaLida, 'digital'> {
  const iof = descricao.match(/^IOF\s+(?:de\s+)?["“]?(.+?)["”]?$/i);
  if (iof) return { data, descricao, loja: descricao, valor, tipo: 'iof', iofDe: iof[1].trim() };
  if (/anuidade/i.test(descricao)) return { data, descricao, loja: descricao, valor, tipo: 'anuidade' };
  if (/\b(juros|multa|mora)\b/i.test(descricao)) return { data, descricao, loja: descricao, valor, tipo: 'juros' };
  const { parcela, loja } = acharParcela(descricao);
  if (valor < 0) return { data, descricao, loja: loja.replace(/^estorno\s+(de\s+)?/i, '') || loja, valor, tipo: 'estorno' };
  if (/^ajuste/i.test(descricao)) return { data, descricao, loja, valor, tipo: 'ajuste' };
  return parcela ? { data, descricao, loja, valor, tipo: 'parcela', parcela } : { data, descricao, loja, valor, tipo: 'compra' };
}

/** RN-IM-01: cartão + data + descrição + valor + parcela + ordem de ocorrência no arquivo. */
function comDigitais(cartao: string, linhas: Omit<LinhaLida, 'digital'>[]): LinhaLida[] {
  const vistos = new Map<string, number>();
  return linhas.map(l => {
    const base = [cartao, l.data, l.descricao.toLowerCase(), l.valor, l.parcela ? `${l.parcela.atual}/${l.parcela.total}` : ''].join('|');
    const n = (vistos.get(base) ?? 0) + 1; vistos.set(base, n);
    return { ...l, digital: `${base}|${n}` };
  });
}

function recusarExtrato(texto: string) {
  if (/OFXHEADER|<OFX>/i.test(texto.slice(0, 500)))
    throw new ErroDeLeitura('Este arquivo parece ser um extrato da conta (OFX), não a fatura do cartão. Baixe a fatura em CSV no app do banco e tente de novo.');
}

// ---------- Nubank ----------
export function lerNubank(texto: string, cartao: string): Leitura {
  recusarExtrato(texto);
  const { cabecalho, linhas } = lerCsv(texto);
  const col = (n: string) => cabecalho.findIndex(c => c.toLowerCase() === n);
  const [iData, iTitulo, iValor] = [col('date'), col('title'), col('amount')];
  if (iData < 0 || iTitulo < 0 || iValor < 0)
    throw new ErroDeLeitura('Não reconheci este arquivo como fatura do Nubank: faltam as colunas date, title, amount.');
  const lidas: Omit<LinhaLida, 'digital'>[] = [], ignoradas: LinhaIgnorada[] = [];
  for (const l of linhas) {
    const data = paraData(l[iData], /^\d{4}-/.test(l[iData]) ? 'aaaa-mm-dd' : 'dd/mm/aaaa');
    const descricao = l[iTitulo], valor = paraCentavos(l[iValor], '.');
    if (/^pagamento recebido/i.test(descricao)) { ignoradas.push({ data, descricao, valor, motivo: 'É o pagamento da fatura, não uma compra.' }); continue; }
    lidas.push(classificar(data, descricao, valor));
  }
  return { linhas: comDigitais(cartao, lidas), ignoradas };
}

// ---------- CSV genérico (BB até haver leitor próprio) ----------
export type MapaDeColunas = {
  colData: string; colDescricao: string; colValor: string; colParcela?: string;
  formatoData: FormatoData; decimal: ',' | '.'; compraPositiva: boolean; pularLinhas: number;
};
export function lerCsvGenerico(texto: string, cartao: string, mapa: MapaDeColunas): Leitura {
  recusarExtrato(texto);
  const { cabecalho, linhas } = lerCsv(texto, mapa.pularLinhas);
  const idx = (nome: string) => {
    const i = cabecalho.indexOf(nome);
    if (i < 0) throw new ErroDeLeitura(`A coluna "${nome}" não existe neste arquivo. Colunas encontradas: ${cabecalho.join(', ')}.`);
    return i;
  };
  const [iData, iDesc, iValor] = [idx(mapa.colData), idx(mapa.colDescricao), idx(mapa.colValor)];
  const iParc = mapa.colParcela ? idx(mapa.colParcela) : -1;
  const lidas: Omit<LinhaLida, 'digital'>[] = [], ignoradas: LinhaIgnorada[] = [];
  for (const l of linhas) {
    if (!l[iData] || !l[iValor]) continue;
    const data = paraData(l[iData], mapa.formatoData);
    const bruto = paraCentavos(l[iValor], mapa.decimal);
    const valor = mapa.compraPositiva ? bruto : -bruto;
    const descricao = iParc >= 0 && l[iParc] ? `${l[iDesc]} ${l[iParc]}` : l[iDesc];
    if (/^pagamento/i.test(l[iDesc])) { ignoradas.push({ data, descricao, valor, motivo: 'É o pagamento da fatura, não uma compra.' }); continue; }
    lidas.push(classificar(data, descricao, valor));
  }
  return { linhas: comDigitais(cartao, lidas), ignoradas };
}
