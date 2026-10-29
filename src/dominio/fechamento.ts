// Fechamento: quanto cada pessoa deve à titular num mês de vencimento (PLANEJAMENTO §5).
import type { Centavos } from './dinheiro';
import type { Parcela, TipoLinha } from './leitores';
import type { Mes } from './ciclo';

export type ItemFatura = {
  id: string; cartao: string; titular: string; pagador: string;
  valor: Centavos; data: string; dataCompra?: string; loja: string; tipo: TipoLinha;
  parcela?: Parcela; iofDe?: string;
};
export type ParcelaDivida = { id: string; nome: string; responsavel: string; titular: string; valor: Centavos; atual: number; total: number };
export type Pagamento = { valor: Centavos; data: string };
export type Situacao = 'Pendente' | 'Parcial' | 'Pago';

/** Os itens recebidos já são os das faturas que vencem no mês e as parcelas de dívida que vencem no mês. */
export function calcularFechamento(pessoa: string, titular: string, itens: ItemFatura[], dividas: ParcelaDivida[], pagamentos: Pagamento[]) {
  if (pessoa === titular) throw new Error('A titular não tem fechamento consigo mesma.');
  const meus = itens.filter(i => i.pagador === pessoa && i.titular === titular);
  const minhasDividas = dividas.filter(d => d.responsavel === pessoa && d.titular === titular);
  const total = meus.reduce((s, i) => s + i.valor, 0) + minhasDividas.reduce((s, d) => s + d.valor, 0);
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const emAberto = Math.max(0, total - pago);
  const situacao: Situacao = pago === 0 ? 'Pendente' : emAberto === 0 ? 'Pago' : 'Parcial';
  return { pessoa, total, pago, emAberto, situacao, itens: meus, dividas: minhasDividas };
}

/** RN-FE-14: o saldo fica no fechamento de origem e aparece aqui até ser quitado. */
export function aReceber(fechamentos: { pessoa: string; mes: Mes; total: Centavos; pago: Centavos }[]) {
  return fechamentos.filter(f => f.total > f.pago).map(f => ({ pessoa: f.pessoa, mes: f.mes, emAberto: f.total - f.pago }));
}
