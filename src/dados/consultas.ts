// Valores calculados a partir do retrato (não guardados): linhas da fatura, totais, fechamentos, pendências.
import { calcularFechamento, type ItemFatura, type ParcelaDivida } from '@/dominio/fechamento';
import { montarMensagem } from '@/dominio/mensagem';
import { somarMeses, type Mes } from '@/dominio/ciclo';
import { partesDaLinha } from '@/dominio/divisao';
import type { Compra, Fatura, ParcelaCartao, Pessoa, Retrato } from './tipos';

export type LinhaFatura = { parcela: ParcelaCartao; compra: Compra; valor: number; data: string; numero: number; total: number; prevista: boolean; pendente: boolean };

/** Data em que a linha aparece na fatura: a do arquivo do banco quando veio dele; senão, a da compra. */
let _linhas: Map<string, string> | null = null, _ref: unknown = null;
function dataNaFatura(p: ParcelaCartao, c: Compra): string { return (p.linhaImportada && _linhas?.get(p.linhaImportada)) || c.data; }
export const faturaDe = (r: Retrato, cartao: string, mes: Mes): Fatura | undefined => r.fatura.find(f => f.cartao === cartao && f.mes === mes);

/** Numa fatura importada, só valem as linhas do banco (RN-CO-01); previstas que não vieram ficam na conferência. */
export function linhasDaFatura(r: Retrato, faturaId: string, incluirNaoEncontradas = false): LinhaFatura[] {
  const compras = new Map(r.compra.map(c => [c.id, c]));
  const importada = r.fatura.find(f => f.id === faturaId)?.status === 'importada';
  if (_ref !== r.linha_importada) { _ref = r.linha_importada; _linhas = new Map(r.linha_importada.map(l => [l.id, String((l.dados as { data?: string }).data ?? '')])); }
  return r.parcela_cartao.filter(p => p.fatura === faturaId && (incluirNaoEncontradas || !importada || p.status === 'confirmada')).map(p => {
    const c = compras.get(p.compra)!;
    return { parcela: p, compra: c, valor: p.valor, data: dataNaFatura(p, c), numero: p.numero, total: c.parcelas, prevista: p.status === 'prevista', pendente: !!c.pendencia };
  }).sort((a, b) => a.data.localeCompare(b.data) || (a.compra.tipo === 'iof' ? 1 : 0) - (b.compra.tipo === 'iof' ? 1 : 0));
}

export function totaisDaFatura(linhas: LinhaFatura[]) {
  const porPessoa = new Map<string, number>();
  let total = 0, semDono = 0, valorSemDono = 0, pendentes = 0, valorPendente = 0;
  for (const l of linhas) {
    total += l.valor;
    if (l.pendente) { pendentes++; valorPendente += l.valor; }
    else if (!l.compra.pagador) { semDono++; valorSemDono += l.valor; }
    else for (const p of partesDaLinha(l.compra, l.valor)) porPessoa.set(p.pessoa, (porPessoa.get(p.pessoa) ?? 0) + p.valor);
  }
  return { total, porPessoa, semDono, valorSemDono, pendentes, valorPendente, quantidade: linhas.length };
}

/** "Fechada" quando a data de fechamento já passou (RN-CA-04; o status é informativo). */
export function situacaoDaFatura(f: Fatura, hoje: string) {
  if (f.status === 'importada' || f.status === 'encerrada') return f.status;
  return hoje >= f.dataFechamento ? 'fechada' : 'aberta';
}

// Compra dividida vira um item por pessoa, com a parte dela; o item lembra o valor inteiro para a mensagem dizer "metade de…"
const itensDe = (r: Retrato, l: LinhaFatura, titular: string): ItemFatura[] => {
  const partes = partesDaLinha(l.compra, l.valor);
  if (partes.length < 2) return [itemDe(r, l, titular, l.compra.pagador ?? '', l.valor)];
  const igual = partes.every(p => Math.abs(p.valor - partes[0].valor) <= 1);
  return partes.map(p => ({ ...itemDe(r, l, titular, p.pessoa, p.valor), id: `${l.parcela.id}:${p.pessoa}`, dividida: { total: l.valor, partes: partes.length, igual } }));
};
const itemDe = (r: Retrato, l: LinhaFatura, titular: string, pagador: string, valor: number): ItemFatura => ({
  id: l.parcela.id, cartao: l.compra.cartao, titular, pagador, valor, data: l.data,
  dataCompra: l.compra.data, loja: l.compra.descricao, tipo: l.compra.tipo === 'multa' ? 'juros' : l.compra.tipo,
  parcela: l.total > 1 ? { atual: l.numero, total: l.total } : undefined,
  iofDe: l.compra.tipo === 'iof' && l.compra.compraOrigem ? r.compra.find(c => c.id === l.compra.compraOrigem)?.descricao : undefined,
});

/** Todas as linhas das faturas que vencem no mês, nos cartões em que `credor` é titular. */
export function itensDoMes(r: Retrato, mes: Mes, credor: string): ItemFatura[] {
  return r.cartao.filter(c => c.titular === credor).flatMap(c => {
    const f = faturaDe(r, c.id, mes); if (!f) return [];
    return linhasDaFatura(r, f.id).filter(l => !l.pendente).flatMap(l => itensDe(r, l, c.titular));
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
