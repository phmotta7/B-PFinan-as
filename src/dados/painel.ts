// Painel "Para onde vai o dinheiro" (entrega 2A, D14–D18): só com o que o app já sabe do cartão.
// Conta os gastos do Pedro, da Bruna e do Casal nas faturas que vencem no mês (Eliete e Lucimar ficam só no fechamento, D15).
// Os dois veem tudo o que é do cartão (decidido com o Pedro em 07/11/2026). Desde a 2B entram também os gastos do extrato
// (lançamentos do tipo "Gasto", pelo mês da data); cada um só recebe do banco os próprios e os de Casal (D15), então o painel mostra só esses.
import { datasDaFatura, somarMeses, type Mes } from '@/dominio/ciclo';
import { partesDaLinha } from '@/dominio/divisao';
import { faturaDe, linhasDaFatura, type LinhaFatura } from './consultas';
import type { Retrato } from './tipos';
import { formatarReais } from '@/dominio/dinheiro';

/** D17: sem histórico anterior a novembro/26; faturas antigas só guardam parcelas de séries e deixariam a média torta. */
export const INICIO_PAINEL: Mes = '2026-11';
/** Quantos meses anteriores entram na média. */
export const MESES_DA_MEDIA = 3;

/** 'todos' soma Pedro, Bruna e Casal; 'casal' é o que foi marcado como Casal; um id de pessoa é a carteira pessoal dela. */
export type Carteira = 'todos' | 'casal' | string;
export const SEM_CATEGORIA = 'sem-categoria';
const ENCARGOS = new Set(['iof', 'anuidade', 'juros', 'multa']);

/** Um pedaço de gasto: de uma linha da fatura (por pessoa, se dividida) ou de um gasto do extrato. */
export type Pedaco = {
  chave: string; data: string; descricao: string; carteira: string; categoria: string; valor: number;
  origem: 'cartao' | 'conta'; onde: string; // id do cartão ou da conta
  valorInteiro: number; parcela?: { numero: number; total: number }; prevista: boolean; tipoCompra?: string;
  linha?: LinhaFatura;
};

/** Cada linha das faturas do mês vira um pedaço por pessoa (compra dividida reparte), só das carteiras do Pedro, da Bruna e do Casal. */
export function pedacosDoMes(r: Retrato, mes: Mes) {
  const usuarios = new Set(r.pessoa.filter(p => p.tipo === 'usuario').map(p => p.id));
  const encargos = r.categoria.find(c => c.nome === 'Dívidas e encargos')?.id;
  const pedacos: Pedaco[] = [];
  let semDono = 0, valorSemDono = 0, previstas = 0;
  for (const c of r.cartao) {
    const f = faturaDe(r, c.id, mes); if (!f) continue;
    for (const l of linhasDaFatura(r, f.id)) {
      if (l.pendente) continue;
      if (!l.compra.pagador) { semDono++; valorSemDono += l.valor; continue; }
      const categoria = l.compra.categoria || (ENCARGOS.has(l.compra.tipo) && encargos) || SEM_CATEGORIA;
      for (const p of partesDaLinha(l.compra, l.valor)) {
        if (!usuarios.has(p.pessoa)) continue;
        pedacos.push({ chave: l.parcela.id, data: l.data, descricao: l.compra.descricao, carteira: l.compra.escopo === 'casal' ? 'casal' : p.pessoa, categoria, valor: p.valor,
          origem: 'cartao', onde: l.compra.cartao, valorInteiro: l.valor, parcela: l.total > 1 ? { numero: l.numero, total: l.total } : undefined, prevista: l.prevista, tipoCompra: l.compra.tipo, linha: l });
        if (l.prevista) previstas += p.valor;
      }
    }
  }
  // Gastos do extrato (2B): pelo mês da data em que o dinheiro saiu
  for (const x of r.lancamento ?? []) {
    if (x.tipo !== 'despesa' || x.data.slice(0, 7) !== mes || !usuarios.has(x.pessoa)) continue;
    pedacos.push({ chave: x.id, data: x.data, descricao: x.contraparte && !/compra no d[ée]bito/i.test(x.descricao) ? x.contraparte : x.descricao.replace(/^Compra no d[ée]bito(?::| -)\s*"?(No estabelecimento\s+)?/i, '').replace(/"$/, ''),
      carteira: x.escopo === 'casal' ? 'casal' : x.pessoa, categoria: x.categoria || SEM_CATEGORIA, valor: -x.valor, origem: 'conta', onde: x.conta ?? '', valorInteiro: -x.valor, prevista: false });
  }
  return { pedacos, semDono, valorSemDono, previstas };
}

const daCarteira = (carteira: Carteira) => (p: Pedaco) => carteira === 'todos' || p.carteira === carteira;
const somar = (ps: Pedaco[]) => ps.reduce((s, p) => s + p.valor, 0);
function porCategoria(ps: Pedaco[]) {
  const m = new Map<string, number>();
  for (const p of ps) m.set(p.categoria, (m.get(p.categoria) ?? 0) + p.valor);
  return m;
}

/** Meses anteriores (desde novembro/26) com algum gasto, os mais recentes primeiro, até MESES_DA_MEDIA. */
function mesesDaMedia(r: Retrato, mes: Mes, carteira: Carteira): Mes[] {
  const meses: Mes[] = [];
  for (let m = somarMeses(mes, -1); m >= INICIO_PAINEL && meses.length < MESES_DA_MEDIA; m = somarMeses(m, -1))
    if (pedacosDoMes(r, m).pedacos.some(daCarteira(carteira))) meses.push(m);
  return meses;
}

export type CategoriaNoMes = { id: string; nome: string; valor: number; media: number | null; compras: number };
export type MesNoGrafico = { mes: Mes; valor: number; atual: boolean };
export type Sugestao = { id: string; tom: 'menos' | 'mais' | 'nota'; texto: string; categoria?: string };

/** `hoje` diz se o mês ainda está aberto (alguma fatura não fechou): aí o total é parcial e não dá para comparar com a média. */
export function painelDoMes(r: Retrato, mes: Mes, carteira: Carteira = 'todos', hoje?: string) {
  const aberto = !!hoje && r.cartao.some(c => c.ativo && hoje < datasDaFatura(c, mes).fechamento);
  const mesAtual = pedacosDoMes(r, mes);
  const meus = mesAtual.pedacos.filter(daCarteira(carteira));
  const total = somar(meus);
  const anteriores = mesesDaMedia(r, mes, carteira);
  const historico = anteriores.map(m => porCategoria(pedacosDoMes(r, m).pedacos.filter(daCarteira(carteira))));
  const totaisAnteriores = historico.map(h => [...h.values()].reduce((s, v) => s + v, 0));
  const media = anteriores.length ? Math.round(totaisAnteriores.reduce((s, v) => s + v, 0) / anteriores.length) : null;
  const nome = (id: string) => (id === SEM_CATEGORIA ? 'Sem categoria' : r.categoria.find(c => c.id === id)?.nome ?? 'Sem categoria');

  const agora = porCategoria(meus);
  const ids = new Set([...agora.keys(), ...historico.flatMap(h => [...h.keys()])]);
  const categorias: CategoriaNoMes[] = [...ids].map(id => ({
    id, nome: nome(id), valor: agora.get(id) ?? 0,
    media: anteriores.length ? Math.round(historico.reduce((s, h) => s + (h.get(id) ?? 0), 0) / anteriores.length) : null,
    compras: new Set(meus.filter(p => p.categoria === id).map(p => p.chave)).size,
  })).filter(c => c.valor > 0 || (c.media ?? 0) > 0)
    // "Sem categoria" vai para o fim: não diz para onde foi o dinheiro
    .sort((a, b) => Number(a.id === SEM_CATEGORIA) - Number(b.id === SEM_CATEGORIA) || b.valor - a.valor || a.nome.localeCompare(b.nome));

  // Gráfico por mês: de novembro/26 até o mês escolhido, no máximo os 6 últimos
  const meses: MesNoGrafico[] = [];
  for (let m = mes, i = 0; m >= INICIO_PAINEL && i < 6; m = somarMeses(m, -1), i++)
    meses.unshift({ mes: m, valor: m === mes ? total : somar(pedacosDoMes(r, m).pedacos.filter(daCarteira(carteira))), atual: m === mes });

  // O que já está guardado para o mês seguinte em parcelas (compras parceladas que continuam)
  const seguinte = somarMeses(mes, 1);
  const parcelasSeguinte = somar(pedacosDoMes(r, seguinte).pedacos.filter(daCarteira(carteira)).filter(p => (p.parcela?.total ?? 1) > 1));

  return {
    mes, carteira, aberto, total, media, pedacos: meus, mesesNaMedia: anteriores.length, categorias, meses,
    semDono: mesAtual.semDono, valorSemDono: mesAtual.valorSemDono, previstas: somar(meus.filter(p => p.prevista)),
    seguinte, parcelasSeguinte,
    sugestoes: sugestoes(r, { total, media: aberto ? null : media, categorias: aberto ? categorias.map(c => ({ ...c, media: null })) : categorias, meus, seguinte, parcelasSeguinte, mesesNaMedia: anteriores.length }),
  };
}
export type Painel = ReturnType<typeof painelDoMes>;

/** As compras de uma categoria no mês (o pedaço de cada pessoa da carteira), na ordem da fatura. */
export const comprasDaCategoria = (p: Painel, categoria: string) =>
  p.pedacos.filter(x => x.categoria === categoria).sort((a, b) => a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao));

/** Uma diferença só vira sugestão quando é de pelo menos R$ 50 e 20% da média (para não falar de trocados). */
const relevante = (agora: number, media: number) => Math.abs(agora - media) >= 5000 && Math.abs(agora - media) >= media * 0.2;
const reaisCurtos = (c: number) => `R$ ${Math.round(Math.abs(c) / 100).toLocaleString('pt-BR')}`;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeDoMes = (m: Mes) => MESES[Number(m.slice(5, 7)) - 1];

/** D18: regras simples, feitas no próprio app. O tom é de quem conta, nunca de bronca. */
function sugestoes(r: Retrato, x: { total: number; media: number | null; categorias: CategoriaNoMes[]; meus: Pedaco[]; seguinte: Mes; parcelasSeguinte: number; mesesNaMedia: number }): Sugestao[] {
  const s: Sugestao[] = [];
  const daMedia = x.mesesNaMedia === 1 ? 'o mês passado' : `a média dos últimos ${x.mesesNaMedia} meses`;
  const emRelacao = x.mesesNaMedia === 1 ? 'ao mês passado' : `à média dos últimos ${x.mesesNaMedia} meses`;
  if (x.media !== null && relevante(x.total, x.media))
    s.push(x.total < x.media
      ? { id: 'total', tom: 'menos', texto: `No total, ${reaisCurtos(x.media - x.total)} a menos que ${daMedia}.` }
      : { id: 'total', tom: 'mais', texto: `No total, ${reaisCurtos(x.total - x.media)} a mais que ${daMedia}.` });
  const variacoes = x.categorias.filter(c => c.id !== SEM_CATEGORIA && c.media !== null && relevante(c.valor, c.media!))
    .sort((a, b) => Math.abs(b.valor - b.media!) - Math.abs(a.valor - a.media!)).slice(0, 3);
  for (const c of variacoes)
    s.push(c.valor > c.media!
      ? { id: 'cat-' + c.id, tom: 'mais', categoria: c.id, texto: `${c.nome} subiu ${reaisCurtos(c.valor - c.media!)} em relação ${emRelacao}.` }
      : { id: 'cat-' + c.id, tom: 'menos', categoria: c.id, texto: `${c.nome} caiu ${reaisCurtos(c.media! - c.valor)} em relação ${emRelacao}.` });

  const assinaturas = r.categoria.find(c => c.nome === 'Assinaturas')?.id;
  const ass = x.meus.filter(p => p.categoria === assinaturas);
  const lojas = new Set(ass.map(p => p.descricao.trim().toLowerCase()));
  if (lojas.size >= 2) s.push({ id: 'assinaturas', tom: 'nota', categoria: assinaturas, texto: `${lojas.size} assinaturas somam ${formatarReais(somar(ass))} por mês.` });

  const enc = x.meus.filter(p => ENCARGOS.has(p.tipoCompra ?? ''));
  if (somar(enc) > 0) {
    const tipos = [...new Set(enc.map(p => ({ iof: 'IOF', anuidade: 'anuidade', juros: 'juros', multa: 'multa' } as Record<string, string>)[p.tipoCompra ?? '']))];
    s.push({ id: 'encargos', tom: 'nota', texto: `${formatarReais(somar(enc))} foram de encargos (${tipos.join(', ')}).` });
  }
  if (x.parcelasSeguinte > 0) {
    const n = nomeDoMes(x.seguinte);
    s.push({ id: 'parcelas', tom: 'nota', texto: `${n[0].toUpperCase() + n.slice(1)} já tem ${reaisCurtos(x.parcelasSeguinte)} em parcelas.` });
  }
  return s;
}
