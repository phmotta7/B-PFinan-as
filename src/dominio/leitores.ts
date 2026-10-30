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

// ---------- BB em PDF ----------
// O PDF da fatura do Ourocard não tem colunas de verdade: cada pedaço de texto tem uma posição na página.
// O leitor remonta as linhas pela posição: o cabeçalho "Data … Valor" diz onde começa cada coluna (a página pode ter duas),
// a linha com data (dd/mm) e valor é uma compra, e a linha logo abaixo, sem data nem valor, é o resto do nome ou a cidade.
// Títulos como "Compras Diversas" ou "Restaurantes" ficam mais longe da compra de cima e são ignorados.
export type ItemPdf = { pagina: number; x: number; y: number; texto: string };

const DATA_CURTA = /^(\d{2})\/(\d{2})$/;
const VALOR_BR = /^-?[\d.]*\d,\d{2}$/;
const MOEDA = /^(R\$|US\$|U\$S|USD|EUR|€|GBP|£)$/i;

/** O PDF só traz dia e mês: o ano é o de hoje, a não ser que a data caia mais de 45 dias no futuro (aí é do ano passado). */
function comAno(dia: string, mes: string, hoje: string): string {
  const ano = Number(hoje.slice(0, 4));
  const data = `${ano}-${mes}-${dia}`;
  const limite = new Date(hoje + 'T12:00:00'); limite.setDate(limite.getDate() + 45);
  return new Date(data + 'T12:00:00') > limite ? `${ano - 1}-${mes}-${dia}` : data;
}

export function lerBbPdf(itens: ItemPdf[], cartao: string, hoje: string): Leitura {
  const limpos = itens.map(i => ({ ...i, texto: i.texto.replace(/\s+/g, ' ').trim() })).filter(i => i.texto);
  if (!/ourocard|banco do brasil/i.test(limpos.map(i => i.texto).join(' ')))
    throw new ErroDeLeitura('Não reconheci este PDF como fatura do cartão do Banco do Brasil.');

  type Linha = { y: number; itens: ItemPdf[] };
  const lidas: Omit<LinhaLida, 'digital'>[] = [], ignoradas: LinhaIgnorada[] = [];
  const restos: string[] = []; // a linha de baixo de cada compra lida (cidade ou resto do nome)
  let colunas: number[] = [];
  let emProcessamento = false;
  const paginas = [...new Set(limpos.map(i => i.pagina))].sort((a, b) => a - b);

  for (const p of paginas) {
    const daPagina = limpos.filter(i => i.pagina === p);
    // Agrupa em linhas pela altura (os pedaços de uma mesma linha variam 1 ou 2 pontos)
    const linhas: Linha[] = [];
    for (const it of [...daPagina].sort((a, b) => b.y - a.y)) {
      const l = linhas.find(x => Math.abs(x.y - it.y) <= 2);
      if (l) l.itens.push(it); else linhas.push({ y: it.y, itens: [it] });
    }
    linhas.forEach(l => l.itens.sort((a, b) => a.x - b.x));

    // Cabeçalho "Data … Valor": cada "Data" abre uma coluna. Acima dele fica o aviso do banco, que não interessa.
    const cab = linhas.find(l => l.itens.some(i => i.texto === 'Data') && l.itens.some(i => i.texto === 'Valor'));
    if (cab) colunas = cab.itens.filter(i => i.texto === 'Data').map(i => i.x - 6);
    if (!colunas.length) continue;
    const titulos = linhas.filter(l => /lançamentos em processamento|lancamentos em processamento|lançamentos futuros|lancamentos futuros/i.test(l.itens.map(i => i.texto).join(' ')));

    for (let c = 0; c < colunas.length; c++) {
      const ini = colunas[c], fim = colunas[c + 1] ?? Infinity;
      let anterior: { y: number; idx: number; alvo: 'lida' | 'ignorada' } | null = null;
      let processamentoNaColuna: boolean = emProcessamento;
      for (const l of linhas) {
        if (cab && l.y >= cab.y - 1) continue;
        const titulo = titulos.find(t => t.y > l.y && !titulos.some(o => o.y > l.y && o.y < t.y));
        if (titulo) processamentoNaColuna = /processamento/i.test(titulo.itens.map(i => i.texto).join(' '));
        const meus = l.itens.filter(i => i.x >= ini && i.x < fim);
        if (!meus.length) continue;
        const data = meus[0].texto.match(DATA_CURTA);
        let iValor = -1; meus.forEach((i, k) => { if (VALOR_BR.test(i.texto)) iValor = k; });
        if (!data || iValor < 1) {
          // Sem data e sem valor: se vier logo abaixo de uma compra, é o resto do nome ou a cidade
          if (anterior && anterior.y - l.y <= 14 && !meus.some(i => DATA_CURTA.test(i.texto) || VALOR_BR.test(i.texto))) {
            const resto = meus.map(i => i.texto).join(' ');
            const alvo = anterior.alvo === 'lida' ? lidas[anterior.idx] : ignoradas[anterior.idx];
            alvo.descricao = `${alvo.descricao} ${resto}`;
            if (anterior.alvo === 'lida') restos[anterior.idx] = resto;
          }
          anterior = null;
          continue;
        }
        const meio = meus.slice(1, iValor);
        const moeda = meio.find(i => MOEDA.test(i.texto))?.texto ?? 'R$';
        const partes = meio.filter(i => !MOEDA.test(i.texto));
        const descricao = partes.map(i => i.texto).join(' ');
        // Nome da loja: sem a cidade, que o BB põe num pedaço separado bem à direita do começo do nome
        const loja = partes.filter((i, k) => k === 0 || i.x - partes[0].x < 45).map(i => i.texto).join(' ');
        const valor = paraCentavos(meus[iValor].texto, ',');
        const quando = comAno(data[1], data[2], hoje);
        const ignorar = (motivo: string) => { ignoradas.push({ data: quando, descricao, valor, motivo }); anterior = { y: l.y, idx: ignoradas.length - 1, alvo: 'ignorada' }; };
        if (processamentoNaColuna) { ignorar('Ainda em processamento no banco. Entra quando o BB lançar na fatura.'); continue; }
        if (/^(pgto|pagamento)\b/i.test(descricao)) { ignorar('É o pagamento da fatura, não uma compra.'); continue; }
        if (!/^R\$$/.test(moeda)) { ignorar(`Valor em ${moeda}. Confira o valor em reais na fatura fechada e lance à mão.`); continue; }
        const lida = classificar(quando, loja, valor);
        // Na parcelada, o BB põe a cidade logo depois do "PARC 02/04": a loja é só o que vem antes
        const nomeLoja = lida.parcela ? loja.split(/\s+PARC\b/i)[0] : lida.loja;
        lidas.push({ ...lida, descricao, loja: nomeLoja.replace(/\s+/g, ' ').trim() });
        anterior = { y: l.y, idx: lidas.length - 1, alvo: 'lida' };
      }
      if (c === colunas.length - 1) emProcessamento = processamentoNaColuna;
    }
  }
  if (!lidas.length && !ignoradas.length) throw new ErroDeLeitura('Não encontrei nenhuma compra neste PDF. Confira se é a fatura do cartão do BB.');
  lidas.forEach((l, i) => { if (l.tipo !== 'iof' && l.tipo !== 'juros') l.loja = lojaDoBb(l.loja, restos[i]); });
  // IOF do saque Pix: o BB escreve "IOF … SAQUE PIX"; liga ao saque do mesmo dia, para ir para quem sacou (§4.7)
  for (const l of lidas) {
    if (l.tipo !== 'iof' || !/saque/i.test(l.iofDe ?? '')) continue;
    const saque = lidas.find(o => o.tipo === 'compra' && o.data === l.data && /^pix\b/i.test(o.loja));
    if (saque) l.iofDe = saque.loja;
  }
  return { linhas: comDigitais(cartao, lidas), ignoradas };
}

// Nome da loja como a pessoa reconhece. O BB escreve o nome com o intermediário do pagamento na frente ("DL*UberRides",
// "IFD*iFood", "MP*LOJA") e às vezes o começo da cidade colado no fim ("…CAMPO" com "GRANDE" na linha de baixo).
// Um nome limpo deixa a loja igual à compra lançada à mão, e a conferência acha a duplicidade.
const MARCAS: [RegExp, string][] = [[/uber\s*\*|uberrides|uber\s*trip|^uber\b/i, 'Uber'], [/ifood|^ifd\s*\*/i, 'iFood'], [/^magalu\s*\*|magazine\s*luiza/i, 'Magalu'],
  [/netflix/i, 'Netflix'], [/spotify/i, 'Spotify'], [/globoplay/i, 'Globoplay'], [/melimais/i, 'Meli+']];
const MERCADOS = /^(shopee|shein|aliexpress|amazon)\s*\*\s*(.+)$/i;
const INTERMEDIARIO = /^(?:mp|pg|zp|hna|cappta|ec|pag|pagseguro|sumup|ebn|dl)\s*\*\s*|^jim\.com\s+/i;
const CIDADES: [string, string][] = [['CAMPO', 'GRANDE'], ['SAO', 'PAULO'], ['RIO DE', 'JANEIR'], ['RIO', 'DE JANEIR'], ['BELO', 'HORIZONTE'], ['PORTO', 'ALEGRE'], ['VILA', 'OLIMPIA']];
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function lojaDoBb(nome: string, resto?: string): string {
  const marca = MARCAS.find(([re]) => re.test(nome));
  if (marca) return marca[1];
  const mercado = nome.match(MERCADOS);
  if (mercado) {
    const loja = capitalizar(mercado[1]), vendedor = mercado[2].trim();
    return vendedor.toLowerCase() === mercado[1].toLowerCase() ? loja : `${loja} · ${vendedor}`;
  }
  let limpo = nome;
  const semIntermediario = limpo.replace(INTERMEDIARIO, '');
  if (/[a-z]{3}/i.test(semIntermediario)) limpo = semIntermediario;
  if (resto) for (const [comeco, fim] of CIDADES) {
    if (!resto.toUpperCase().startsWith(fim)) continue;
    const corte = limpo.toUpperCase().lastIndexOf(comeco);
    if (corte > 0 && corte + comeco.length === limpo.length) { limpo = limpo.slice(0, corte); break; }
  }
  return limpo.replace(/\s+/g, ' ').trim() || nome;
}
