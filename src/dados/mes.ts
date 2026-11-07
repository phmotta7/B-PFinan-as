// Meu mês (entrega 2C, PLANEJAMENTO §6.6 e §6.7): contas fixas do mês, lançamentos à mão e a sobra de cada um.
// Cada um vê só a própria sobra (decidido com o Pedro em 07/11/2026): ela sai de receitas e extrato, que são privados (D15).
//
// Sobra = receitas − gastos, onde gastos são:
//   cartão (as partes da pessoa nas faturas que vencem no mês, inclusive o que ela pagou para o Casal)
// + extrato (gastos da pessoa com data no mês)
// + parcelas de dívida que a pessoa paga pelo fechamento (titular é outra pessoa; quem é titular e paga o banco já tem isso no extrato)
// + contas fixas ainda não pagas (só na previsão).
// Pix entre contas, pagamento de fechamento e de cartão não entram (§6.2): por isso não há dupla contagem.
import { datasDaFatura, somarMeses, type Mes } from '@/dominio/ciclo';
import type { Centavos } from '@/dominio/dinheiro';
import { parcelasDeDividaNoMes } from './consultas';
import { pedacosDoMes } from './painel';
import { novoId } from './operacoes';
import type { Escopo, Lancamento, Mudanca, Recorrente, Retrato } from './tipos';
import { mudancaVazia } from './tipos';

const diaNoMes = (mes: Mes, dia: number) => {
  const [a, m] = mes.split('-').map(Number);
  return `${mes}-${String(Math.min(dia, new Date(Date.UTC(a, m, 0)).getUTCDate())).padStart(2, '0')}`;
};
const dias = (a: string, b: string) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 864e5);
export const valeNoMes = (x: Recorrente, mes: Mes) => x.ativo && x.inicio <= mes && (!x.fim || x.fim >= mes);

export type FixaDoMes = { rec: Recorrente; data: string; pago: Lancamento | null; situacao: 'paga' | 'prevista' | 'atrasada' };
/** As contas fixas (e receitas fixas) do mês, com o lançamento que pagou cada uma, se já houver. */
export function fixasDoMes(r: Retrato, mes: Mes, hoje: string, pessoa?: string): FixaDoMes[] {
  return r.recorrente.filter(x => valeNoMes(x, mes) && (!pessoa || x.pessoa === pessoa || x.escopo === 'casal')).map(rec => {
    const data = diaNoMes(mes, rec.dia);
    const pago = r.lancamento.find(l => l.recorrente === rec.id && l.data.slice(0, 7) === mes) ?? null;
    return { rec, data, pago, situacao: pago ? 'paga' as const : hoje > data ? 'atrasada' as const : 'prevista' as const };
  }).sort((a, b) => a.data.localeCompare(b.data) || a.rec.descricao.localeCompare(b.rec.descricao));
}

/** RN-RE-03: a linha do extrato que paga uma conta fixa ainda em aberto (mesma pessoa, valor ±10%, data ±5 dias do dia combinado). */
export function contaFixaDaLinha(r: Retrato, pessoa: string, l: { valor: Centavos; data: string }): Recorrente | null {
  const tipo = l.valor < 0 ? 'despesa' : 'receita', valor = Math.abs(l.valor);
  const candidatas = r.recorrente.filter(x => x.pessoa === pessoa && x.tipo === tipo && Math.abs(valor - x.valor) <= x.valor * 0.1).flatMap(rec =>
    [l.data.slice(0, 7), somarMeses(l.data.slice(0, 7), 1), somarMeses(l.data.slice(0, 7), -1)].filter(m => valeNoMes(rec, m))
      .map(m => ({ rec, m, longe: Math.abs(dias(l.data, diaNoMes(m, rec.dia))) }))
      .filter(x => x.longe <= 5 && !r.lancamento.some(y => y.recorrente === rec.id && y.data.slice(0, 7) === l.data.slice(0, 7))));
  candidatas.sort((a, b) => a.longe - b.longe || Math.abs(valor - a.rec.valor) - Math.abs(valor - b.rec.valor));
  return candidatas[0]?.rec ?? null;
}

export type NovoLancamento = { pessoa: string; tipo: 'despesa' | 'receita'; valor: Centavos; data: string; descricao: string; escopo: Escopo; categoria: string | null; recorrente?: string | null; observacao?: string | null };
/** Gasto ou receita fora do cartão, lançado à mão (§6.4); o valor vem positivo e o sinal sai do tipo. */
export function lancarManual(n: NovoLancamento): Mudanca {
  const m = mudancaVazia();
  m.inserir.lancamento = [{
    id: novoId(), pessoa: n.pessoa, conta: null, data: n.data, descricao: n.descricao.trim(), contraparte: null, valor: n.tipo === 'despesa' ? -Math.abs(n.valor) : Math.abs(n.valor),
    tipo: n.tipo, escopo: n.escopo, categoria: n.categoria, observacao: n.observacao ?? null, fitid: null, par: null, pagamento: null, origem: 'manual', recorrente: n.recorrente ?? null,
  }];
  return m;
}
/** RN-RE-02: marcar a conta fixa do mês como paga (ou recebida), com o valor real. */
export const pagarFixa = (rec: Recorrente, valor: Centavos, data: string) =>
  lancarManual({ pessoa: rec.pessoa, tipo: rec.tipo, valor, data, descricao: rec.descricao, escopo: rec.escopo ?? 'pessoal', categoria: rec.categoria ?? null, recorrente: rec.id });

/** Liga uma linha já gravada a uma conta fixa (ou desliga, com null). */
export function ligarFixa(r: Retrato, lancamento: string, recorrente: string | null): Mudanca {
  const m = mudancaVazia(), l = r.lancamento.find(x => x.id === lancamento);
  if (l) m.atualizar.lancamento = [{ ...l, recorrente }];
  return m;
}

export type Sobra = {
  mes: Mes; pessoa: string;
  receitas: Centavos; receitasPrevistas: Centavos;
  cartao: Centavos; extrato: Centavos; dividas: Centavos; fixasPrevistas: Centavos;
  gastos: Centavos; sobraAteAgora: Centavos; sobraPrevista: Centavos;
  paraOCasal: Centavos; // quanto dos gastos foi para o Casal (§6.1: "contribuições para o casal")
  fixas: FixaDoMes[]; aberto: boolean;
};

export function sobraDoMes(r: Retrato, mes: Mes, pessoa: string, hoje: string): Sobra {
  const meus = pedacosDoMes(r, mes).pedacos.filter(p => p.pessoa === pessoa);
  const soma = (xs: { valor: number }[]) => xs.reduce((s, x) => s + x.valor, 0);
  const cartao = soma(meus.filter(p => p.origem === 'cartao')), extrato = soma(meus.filter(p => p.origem === 'conta'));
  const dividas = parcelasDeDividaNoMes(r, mes).filter(d => d.responsavel === pessoa && d.titular !== pessoa).reduce((s, d) => s + d.valor, 0);
  const receitas = r.lancamento.filter(l => l.pessoa === pessoa && l.tipo === 'receita' && l.data.slice(0, 7) === mes).reduce((s, l) => s + l.valor, 0);
  const fixas = fixasDoMes(r, mes, hoje, pessoa);
  const minhasAbertas = fixas.filter(f => !f.pago && f.rec.pessoa === pessoa);
  const receitasPrevistas = minhasAbertas.filter(f => f.rec.tipo === 'receita').reduce((s, f) => s + f.rec.valor, 0);
  const fixasPrevistas = minhasAbertas.filter(f => f.rec.tipo === 'despesa').reduce((s, f) => s + f.rec.valor, 0);
  const gastos = cartao + extrato + dividas;
  const paraOCasal = soma(meus.filter(p => p.carteira === 'casal')) + minhasAbertas.filter(f => f.rec.tipo === 'despesa' && f.rec.escopo === 'casal').reduce((s, f) => s + f.rec.valor, 0);
  const ultimoDia = diaNoMes(mes, 31);
  const aberto = hoje <= ultimoDia || r.cartao.some(c => c.ativo && hoje < datasDaFatura(c, mes).fechamento);
  return {
    mes, pessoa, receitas, receitasPrevistas, cartao, extrato, dividas, fixasPrevistas, gastos,
    sobraAteAgora: receitas - gastos, sobraPrevista: receitas + receitasPrevistas - gastos - fixasPrevistas, paraOCasal, fixas, aberto,
  };
}

/** Custo do Casal no mês e quanto cada um pôs (§6.7: o Casal não tem sobra, porque não tem receita própria). */
export function custoDoCasal(r: Retrato, mes: Mes, hoje: string) {
  const casal = pedacosDoMes(r, mes).pedacos.filter(p => p.carteira === 'casal');
  const fixas = fixasDoMes(r, mes, hoje).filter(f => f.rec.escopo === 'casal' && f.rec.tipo === 'despesa' && !f.pago);
  const porPessoa = new Map<string, number>();
  for (const p of casal) porPessoa.set(p.pessoa, (porPessoa.get(p.pessoa) ?? 0) + p.valor);
  return { total: casal.reduce((s, p) => s + p.valor, 0), previsto: fixas.reduce((s, f) => s + f.rec.valor, 0), porPessoa };
}
