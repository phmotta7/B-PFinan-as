// Valores calculados a partir do retrato (não guardados): linhas da fatura, totais, fechamentos, pendências.
import { calcularFechamento, type ItemFatura, type ParcelaDivida } from '@/dominio/fechamento';
import { montarMensagem } from '@/dominio/mensagem';
import { somarMeses, type Mes } from '@/dominio/ciclo';
import type { Compra, Fatura, ParcelaCartao, Pessoa, Retrato } from './tipos';

export type LinhaFatura = { parcela: ParcelaCartao; compra: Compra; valor: number; data: string; numero: number; total: number; prevista: boolean; pendente: boolean };

export const faturaDe = (r: Retrato, cartao: string, mes: Mes): Fatura | undefined => r.fatura.find(f => f.cartao === cartao && f.mes === mes);

/** Numa fatura importada, só valem as linhas do banco (RN-CO-01); previstas que não vieram ficam na conferência. */
export function linhasDaFatura(r: Retrato, faturaId: string, incluirNaoEncontradas = false): LinhaFatura[] {
  const compras = new Map(r.compra.map(c => [c.id, c]));
  const importada = r.fatura.find(f => f.id === faturaId)?.status === 'importada';
  return r.parcela_cartao.filter(p => p.fatura === faturaId && (incluirNaoEncontradas || !importada || p.status === 'confirmada')).map(p => {
    const c = compras.get(p.compra)!;
    return { parcela: p, compra: c, valor: p.valor, data: c.data, numero: p.numero, total: c.parcelas, prevista: p.status === 'prevista', pendente: !!c.pendencia };
  }).sort((a, b) => a.data.localeCompare(b.data) || (a.compra.tipo === 'iof' ? 1 : 0) - (b.compra.tipo === 'iof' ? 1 : 0));
}

export function totaisDaFatura(linhas: LinhaFatura[]) {
  const porPessoa = new Map<string, number>();
  let total = 0, semDono = 0, valorSemDono = 0, pendentes = 0, valorPendente = 0;
  for (const l of linhas) {
    total += l.valor;
    if (l.pendente) { pendentes++; valorPendente += l.valor; }
    else if (!l.compra.pagador) { semDono++; valorSemDono += l.valor; }
    else porPessoa.set(l.compra.pagador, (porPessoa.get(l.compra.pagador) ?? 0) + l.valor);
  }
  return { total, porPessoa, semDono, valorSemDono, pendentes, valorPendente, quantidade: linhas.length };
}

/** "Fechada" quando a data de fechamento já passou (RN-CA-04; o status é informativo). */
export function situacaoDaFatura(f: Fatura, hoje: string) {
  if (f.status === 'importada' || f.status === 'encerrada') return f.status;
  return hoje >= f.dataFechamento ? 'fechada' : 'aberta';
}

const itemDe = (r: Retrato, l: LinhaFatura, titular: string): ItemFatura => ({
  id: l.parcela.id, cartao: l.compra.cartao, titular, pagador: l.compra.pagador ?? '', valor: l.valor, data: l.data,
  dataCompra: l.compra.data, loja: l.compra.descricao, tipo: l.compra.tipo === 'multa' ? 'juros' : l.compra.tipo,
  parcela: l.total > 1 ? { atual: l.numero, total: l.total } : undefined,
  iofDe: l.compra.tipo === 'iof' && l.compra.compraOrigem ? r.compra.find(c => c.id === l.compra.compraOrigem)?.descricao : undefined,
});

/** Todas as linhas das faturas que vencem no mês, nos cartões em que `credor` é titular. */
export function itensDoMes(r: Retrato, mes: Mes, credor: string): ItemFatura[] {
  return r.cartao.filter(c => c.titular === credor).flatMap(c => {
    const f = faturaDe(r, c.id, mes); if (!f) return [];
    return linhasDaFatura(r, f.id).filter(l => !l.pendente).map(l => itemDe(r, l, c.titular));
  });
}
export function parcelasDeDividaNoMes(r: Retrato, mes: Mes): ParcelaDivida[] {
  return r.divida.filter(d => d.situacao === 'ativa').flatMap(d => {
    let n = d.parcelaAtual, m = d.mesParcelaAtual;
    while (m < mes) { m = somarMeses(m, 1); n++; }
    while (m > mes) { m = somarMeses(m, -1); n--; }
    return n >= 1 && n <= d.totalParcelas ? [{ id: d.id, nome: d.nome, responsavel: d.responsavel, titular: d.titular, valor: d.valorParcela, atual: n, total: d.totalParcelas }] : [];
  });
}

export function fechamentosDoMes(r: Retrato, mes: Mes, credor: string) {
  const itens = itensDoMes(r, mes, credor), dividas = parcelasDeDividaNoMes(r, mes);
  return r.pessoa.filter(p => p.id !== credor).map(pessoa => {
    const reg = r.fechamento.find(f => f.devedor === pessoa.id && f.credor === credor && f.mes === mes);
    const pagamentos = reg ? r.pagamento_fechamento.filter(x => x.fechamento === reg.id) : [];
    return { ...calcularFechamento(pessoa.id, credor, itens, dividas, pagamentos), pessoa, mes, enviadoEm: reg?.enviadoEm ?? null, registro: reg };
  });
}

export function gastosDaTitularNoMes(r: Retrato, mes: Mes, credor: string) {
  return itensDoMes(r, mes, credor).filter(i => i.pagador === credor).reduce((s, i) => s + i.valor, 0);
}

export function mensagemDe(r: Retrato, pessoa: Pessoa, mes: Mes, credor: string) {
  const f = fechamentosDoMes(r, mes, credor).find(x => x.pessoa.id === pessoa.id)!;
  const titular = r.pessoa.find(p => p.id === credor);
  const cartoes = r.cartao.filter(c => c.titular === credor).map(c => {
    const fa = faturaDe(r, c.id, mes);
    return { id: c.id, nome: c.banco === 'nubank' ? 'Nubank' : c.banco === 'bb' ? 'BB' : c.apelido, vencimento: fa?.dataVencimento ?? `${mes}-01` };
  });
  return montarMensagem({ pessoa: pessoa.nome, mes, cartoes, itens: f.itens, dividas: f.dividas, pago: f.pago, chavePix: titular?.chavePix || '<cadastre a chave Pix da ' + (titular?.nome ?? 'titular') + '>' });
}

/** Saldo em aberto de meses anteriores (RN-FE-14). */
export function aReceberAntesDe(r: Retrato, mes: Mes, credor: string) {
  const meses = [...new Set(r.fechamento.filter(f => f.credor === credor && f.mes < mes).map(f => f.mes))].sort();
  return meses.flatMap(m => fechamentosDoMes(r, m, credor).filter(f => f.registro && f.emAberto > 0).map(f => ({ ...f, mes: m })));
}

export function parcelasNaoEncontradas(r: Retrato, faturaId: string) {
  const f = r.fatura.find(x => x.id === faturaId);
  if (!f || f.status !== 'importada') return [];
  return linhasDaFatura(r, faturaId, true).filter(l => l.prevista);
}
