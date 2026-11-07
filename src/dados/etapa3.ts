// Etapa 3 (PLANEJAMENTO §8, §9 e §10): dívidas completas, orçamento por categoria e metas com reserva de emergência.
// Tudo calculado a partir do retrato; o banco só entrega a cada um o que é dele e o que é do Casal (decidido em 07/11/2026).
import { faturaDaCompra, somarMeses, type Mes } from '@/dominio/ciclo';
import type { Centavos } from '@/dominio/dinheiro';
import { partesDaLinha } from '@/dominio/divisao';
import { faturaDe, fechamentosDoMes, linhasDaFatura, parcelasDeDividaNoMes } from './consultas';
import { INICIO_PAINEL, painelDoMes, type Carteira } from './painel';
import { valeNoMes } from './mes';
import type { Divida, Meta, Retrato } from './tipos';

const diaNoMes = (mes: Mes, dia: number) => {
  const [a, m] = mes.split('-').map(Number);
  return `${mes}-${String(Math.min(dia, new Date(Date.UTC(a, m, 0)).getUTCDate())).padStart(2, '0')}`;
};
const dias = (a: string, b: string) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 864e5);
const mesesEntre = (a: Mes, b: Mes) => { const [x, y] = a.split('-').map(Number), [z, w] = b.split('-').map(Number); return (z - x) * 12 + (w - y); };

// ---------- Dívidas (§8) ----------
/** Último mês com parcela: o da parcela atual mais as que faltam. */
export const fimDaDivida = (d: Divida): Mes => somarMeses(d.mesParcelaAtual, d.totalParcelas - d.parcelaAtual);

export type SituacaoDivida = {
  d: Divida; parcelaNoMes: number | null; paga: boolean; restantes: number; saldo: Centavos; saldoInformado: boolean; fim: Mes; ativa: boolean;
};
/** Onde a dívida está no mês: qual parcela vence, se já foi paga, quantas faltam e o saldo (RN-DV-03). */
export function situacaoDivida(r: Retrato, d: Divida, mes: Mes): SituacaoDivida {
  const fim = fimDaDivida(d);
  const n = d.parcelaAtual + mesesEntre(d.mesParcelaAtual, mes);
  const parcelaNoMes = n >= 1 && n <= d.totalParcelas ? n : null;
  // Paga: um lançamento ligado a ela no mês; quando outra pessoa é a titular, a parcela vai no fechamento e conta como paga quando ele quita
  const viaFechamento = d.responsavel !== d.titular && !!parcelaNoMes && fechamentosDoMes(r, mes, d.titular).some(f => f.pessoa.id === d.responsavel && f.registro && f.total > 0 && f.emAberto <= 0);
  const paga = !!parcelaNoMes && (viaFechamento || r.lancamento.some(l => l.divida === d.id && l.data.slice(0, 7) === mes));
  const restantes = d.situacao === 'quitada' || n > d.totalParcelas ? 0 : n < 1 ? d.totalParcelas : d.totalParcelas - n + (paga ? 0 : 1);
  const saldoInformado = d.saldoInformado != null && d.saldoInformado > 0;
  return { d, parcelaNoMes, paga, restantes, saldo: saldoInformado ? d.saldoInformado! : restantes * d.valorParcela, saldoInformado, fim, ativa: d.situacao === 'ativa' && restantes > 0 };
}

/** Linha do extrato que paga a parcela de uma dívida da própria pessoa (valor ±10%, data ±5 dias do vencimento). */
export function dividaDaLinha(r: Retrato, pessoa: string, l: { valor: Centavos; data: string }): Divida | null {
  if (l.valor >= 0) return null;
  const mes = l.data.slice(0, 7), valor = -l.valor;
  const c = r.divida.filter(d => d.situacao === 'ativa' && d.responsavel === pessoa && d.titular === pessoa && Math.abs(valor - d.valorParcela) <= d.valorParcela * 0.1)
    .filter(d => situacaoDivida(r, d, mes).parcelaNoMes && !situacaoDivida(r, d, mes).paga && Math.abs(dias(l.data, diaNoMes(mes, d.diaVencimento))) <= 5)
    .sort((a, b) => Math.abs(valor - a.valorParcela) - Math.abs(valor - b.valorParcela));
  return c[0] ?? null;
}

/** RN-DV-04: quitada; some dos fechamentos e do comprometido dali para frente. */
export const quitar = (d: Divida): Divida => ({ ...d, situacao: 'quitada' });

/** Compras parceladas no cartão ainda com parcelas pela frente, com o mês da última. */
export function parceladasEmAberto(r: Retrato, desde: Mes) {
  return r.compra.filter(c => c.parcelas > 1 && c.tipo !== 'iof').map(c => {
    const cartao = r.cartao.find(x => x.id === c.cartao);
    const primeira = cartao ? faturaDaCompra(cartao, c.data) : c.data.slice(0, 7);
    // A parcela de maior número já conhecida diz onde a série termina (vale também para série importada a partir do meio)
    const ps = r.parcela_cartao.filter(p => p.compra === c.id).map(p => ({ n: p.numero, mes: r.fatura.find(f => f.id === p.fatura)?.mes ?? primeira }));
    const maior = ps.sort((a, b) => b.n - a.n)[0];
    const fim = maior ? somarMeses(maior.mes, c.parcelas - maior.n) : somarMeses(primeira, c.parcelas - 1);
    return { compra: c, fim };
  }).filter(x => x.fim >= desde);
}

/** "Comprometido em cartões" (§8.4): parcelas já conhecidas das compras parceladas, por mês e por pessoa. */
export function comprometidoEmCartoes(r: Retrato, desde: Mes, meses = 12) {
  return Array.from({ length: meses }, (_, i) => {
    const mes = somarMeses(desde, i), porPessoa = new Map<string, number>();
    let total = 0;
    for (const c of r.cartao) {
      const f = faturaDe(r, c.id, mes); if (!f) continue;
      for (const l of linhasDaFatura(r, f.id)) {
        if (l.total < 2 || l.pendente) continue;
        total += l.valor;
        const partes = partesDaLinha(l.compra, l.valor);
        if (!partes.length) porPessoa.set('', (porPessoa.get('') ?? 0) + l.valor);
        for (const p of partes) porPessoa.set(p.pessoa, (porPessoa.get(p.pessoa) ?? 0) + p.valor);
      }
    }
    return { mes, total, porPessoa };
  });
}

/** "Quando ficamos livres" (§8.4): por mês, quanto já está comprometido em dívidas e parcelas de cartão, caindo ao longo do tempo. */
export function quandoFicamosLivres(r: Retrato, desde: Mes, meses = 24) {
  const cartao = comprometidoEmCartoes(r, desde, meses);
  const curva = cartao.map(c => {
    const dividas = parcelasDeDividaNoMes(r, c.mes).reduce((s, d) => s + d.valor, 0);
    return { mes: c.mes, dividas, cartao: c.total, total: dividas + c.total };
  });
  const fins = [
    ...r.divida.filter(d => d.situacao === 'ativa' && fimDaDivida(d) >= desde).map(d => ({ nome: d.nome, fim: fimDaDivida(d), tipo: 'divida' as const, valor: d.valorParcela })),
    ...parceladasEmAberto(r, desde).map(x => ({ nome: x.compra.descricao, fim: x.fim, tipo: 'cartao' as const, valor: Math.round(x.compra.valorTotal / x.compra.parcelas) })),
  ].sort((a, b) => a.fim.localeCompare(b.fim) || b.valor - a.valor);
  const livre = [...curva].reverse().find(c => c.total > 0);
  return { curva, fins, ultimoMesComprometido: livre?.mes ?? null };
}

/** Ordem de quitação sugerida (§8.4): maior juros primeiro; sem juros informado vai para o fim. Só informativo. */
export function ordemDeQuitacao(dividas: Divida[]) {
  return dividas.filter(d => d.situacao === 'ativa').sort((a, b) => (b.jurosMensal ?? -1) - (a.jurosMensal ?? -1) || a.nome.localeCompare(b.nome));
}

// ---------- Orçamento (§9) ----------
/** RN-OR-02: dois meses completos de observação a partir do início do app (nov/26). */
export const fimDaObservacao = somarMeses(INICIO_PAINEL, 2);
export const emObservacao = (mes: Mes) => mes < fimDaObservacao;

/** RN-OR-06: o limite vale do mês em que foi definido até ser trocado. */
export function limiteVigente(r: Retrato, carteira: string, categoria: string, mes: Mes) {
  return r.orcamento.filter(o => o.carteira === carteira && o.categoria === categoria && o.desde <= mes).sort((a, b) => b.desde.localeCompare(a.desde))[0] ?? null;
}

/** RN-OR-03: média dos meses observados, arredondada para cima em múltiplo de R$ 10. */
export function sugestaoDeLimite(r: Retrato, carteira: Carteira, categoria: string, mes: Mes): Centavos | null {
  const meses: Mes[] = [];
  for (let m = INICIO_PAINEL; m < mes && m < somarMeses(INICIO_PAINEL, 3); m = somarMeses(m, 1)) meses.push(m);
  if (meses.length < 2) return null;
  const media = meses.reduce((s, m) => s + (painelDoMes(r, m, carteira).categorias.find(c => c.id === categoria)?.valor ?? 0), 0) / meses.length;
  return media > 0 ? Math.ceil(media / 1000) * 1000 : null;
}

export type LinhaOrcamento = { categoria: string; nome: string; gasto: Centavos; previsto: Centavos; limite: Centavos | null; sugestao: Centavos | null; pct: number | null; estado: 'ok' | 'perto' | 'passou' | 'sem-limite' };
/** RN-OR-04/05: gasto de competência (cartão no mês da fatura; previstas do cartão separadas como comprometido), aviso em 80% e 100%. */
export function orcamentoDoMes(r: Retrato, mes: Mes, carteira: Carteira): LinhaOrcamento[] {
  const p = painelDoMes(r, mes, carteira);
  const ids = new Set([...p.categorias.map(c => c.id), ...r.orcamento.filter(o => o.carteira === carteira && o.desde <= mes).map(o => o.categoria)]);
  return [...ids].filter(id => id !== 'sem-categoria').map(id => {
    const doMes = p.pedacos.filter(x => x.categoria === id);
    const previsto = doMes.filter(x => x.prevista).reduce((s, x) => s + x.valor, 0);
    const gasto = doMes.reduce((s, x) => s + x.valor, 0) - previsto;
    const lim = limiteVigente(r, carteira, id, mes)?.limite ?? null;
    const pct = lim ? (gasto + previsto) / lim : null;
    return {
      categoria: id, nome: r.categoria.find(c => c.id === id)?.nome ?? 'Categoria', gasto, previsto, limite: lim, sugestao: lim ? null : sugestaoDeLimite(r, carteira, id, mes), pct,
      estado: pct === null ? 'sem-limite' as const : pct >= 1 ? 'passou' as const : pct >= 0.8 ? 'perto' as const : 'ok' as const,
    };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.gasto + b.previsto - (a.gasto + a.previsto));
}

// ---------- Metas e reserva (§10) ----------
/** Custo fixo do mês: contas fixas + parcelas de dívida (o que a reserva precisa cobrir). Composição mostrada para ajustar. */
export function custoFixo(r: Retrato, mes: Mes, carteira: Carteira) {
  const daCarteira = (pessoa: string, escopo?: string | null) => carteira === 'todos' || (carteira === 'casal' ? escopo === 'casal' : pessoa === carteira && escopo !== 'casal');
  const fixas = r.recorrente.filter(x => x.tipo === 'despesa' && valeNoMes(x, mes) && daCarteira(x.pessoa, x.escopo)).map(x => ({ nome: x.descricao, valor: x.valor }));
  const dividas = parcelasDeDividaNoMes(r, mes).filter(d => { const dv = r.divida.find(x => x.id === d.id); return dv && daCarteira(dv.responsavel, dv.escopo); }).map(d => ({ nome: d.nome, valor: d.valor }));
  const itens = [...fixas, ...dividas];
  return { itens, total: itens.reduce((s, x) => s + x.valor, 0) };
}

export function progressoDaMeta(r: Retrato, m: Meta, hoje: string) {
  const movs = r.movimento_meta.filter(x => x.meta === m.id).sort((a, b) => a.data.localeCompare(b.data));
  const guardado = movs.reduce((s, x) => s + (x.tipo === 'aporte' ? x.valor : -x.valor), 0);
  const falta = Math.max(0, m.alvo - guardado);
  // RN-MT-02: ritmo = média do que entrou por mês nos últimos 3 meses; sem histórico, o aporte planejado
  const mes = hoje.slice(0, 7), inicio = somarMeses(mes, -2);
  const recentes = movs.filter(x => x.data.slice(0, 7) >= inicio).reduce((s, x) => s + (x.tipo === 'aporte' ? x.valor : -x.valor), 0);
  const mesesComDados = movs.length ? Math.min(3, mesesEntre(movs[0].data.slice(0, 7), mes) + 1) : 0;
  const ritmo = mesesComDados ? Math.round(recentes / mesesComDados) : m.aportePlanejado ?? 0;
  const mesesParaChegar = falta === 0 ? 0 : ritmo > 0 ? Math.ceil(falta / ritmo) : null;
  return { guardado, falta, pct: Math.min(1, guardado / m.alvo), ritmo, chegaEm: mesesParaChegar === null ? null : somarMeses(mes, mesesParaChegar), movs };
}
