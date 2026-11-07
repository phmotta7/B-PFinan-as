// Importação de extrato (entrega 2B, PLANEJAMENTO §6.5, §7 e D21): o app sugere o que cada linha é e a pessoa confirma.
// Nada é classificado em silêncio (RN-OF-05); reimportar não duplica (RN-OF-02); o Pix entre os dois pode baixar o fechamento (RN-CT-01 a 03).
// Regras pedidas pelo Pedro em 07/11/2026: entrada de empresa (renda extra) vira receita em "Outras receitas"; Pix da Eliete para ele é presente
// (receita); Pix para o Mercado Pago é pagamento de dívida; pagamento da fatura do cartão Inter não é gasto.
import { somarMeses, type Mes } from '@/dominio/ciclo';
import type { Extrato, LinhaDoExtrato } from '@/dominio/ofx';
import { fechamentosDoMes } from './consultas';
import { Pacote, fechamentoDe, novoId } from './operacoes';
import type { Conta, Escopo, Lancamento, Mudanca, Retrato, TipoLancamento } from './tipos';
import { contaFixaDaLinha } from './mes';
import { dividaDaLinha } from './etapa3';

export const NOME_DO_TIPO: Record<TipoLancamento, string> = {
  despesa: 'Gasto', receita: 'Receita', transferencia_propria: 'Entre minhas contas', transferencia: 'Transferência entre os dois',
  pagamento_fechamento: 'Pagamento do fechamento', pagamento_cartao: 'Pagamento de cartão', investimento: 'Investimento',
};
/** Só gasto e receita entram nas contas do mês; o resto é dinheiro mudando de lugar (§6.2). */
export const CONTA_NO_MES = (t: TipoLancamento) => t === 'despesa' || t === 'receita';

const BANCOS: Record<string, string> = { '260': 'Nubank', '77': 'Inter', '1': 'BB', '33': 'Santander', '341': 'Itaú', '237': 'Bradesco', '104': 'Caixa', '323': 'Mercado Pago' };
export const nomeDoBanco = (codigo: string) => BANCOS[String(Number(codigo))] ?? (codigo ? `Banco ${codigo}` : 'Conta');

const normal = (s?: string | null) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const catPorNome = (r: Retrato, ...nomes: string[]) => nomes.map(n => r.categoria.find(c => normal(c.nome) === normal(n))?.id).find(Boolean) ?? null;
/** Loja de uma compra no débito ("Compra no débito - FORT ATACADISTA", "No estabelecimento POSTO SAO CRISTOVAO"). */
type TemTexto = { descricao: string; contraparte?: string | null; valor: number };
export const lojaDaLinha = (l: Omit<TemTexto, 'valor'>) =>
  l.descricao.match(/Compra no d[ée]bito(?::| -)\s*"?(?:No estabelecimento\s+)?([^"]+)"?/i)?.[1]?.trim() ?? l.contraparte ?? l.descricao;
/** Quem está do outro lado, para lembrar a escolha da próxima vez. */
export const chaveDaLinha = (l: TemTexto) => `${l.valor < 0 ? 's' : 'e'}:${normal(/compra no d[ée]bito/i.test(l.descricao) ? lojaDaLinha(l) : l.contraparte || l.descricao)}`;

export type FechamentoAlvo = { devedor: string; credor: string; mes: Mes };
export type Escolha = { tipo: TipoLancamento; categoria: string | null; escopo: Escopo | null; fechamento?: FechamentoAlvo | null; recorrente?: string | null; divida?: string | null };
export type Sugestao = Escolha & { motivo: string };

/** Fechamento em aberto entre `devedor` e `credor` que este Pix pode pagar: o do mês da data ou o anterior (RN-CT-02). */
function fechamentoAberto(r: Retrato, devedor: string, credor: string, data: string, valor: number): (FechamentoAlvo & { emAberto: number }) | null {
  const mes = data.slice(0, 7);
  for (const m of [mes, somarMeses(mes, 1), somarMeses(mes, -1)]) {
    const f = fechamentosDoMes(r, m, credor).find(x => x.pessoa.id === devedor);
    if (f && f.emAberto > 0 && valor <= f.emAberto + 100) return { devedor, credor, mes: m, emAberto: f.emAberto };
  }
  return null;
}

/** Alguém da casa do outro lado do Pix, pelo primeiro ou segundo nome ("Maria Eliete ..." é a Eliete). */
export function pessoaDaLinha(r: Retrato, l: { descricao: string; contraparte?: string | null }) {
  const nomes = normal(l.contraparte || l.descricao.match(/Cp\s*:\s*\d+-(.+)$/i)?.[1]).replace(/^\d+\s+/, '').split(' ').slice(0, 2);
  return nomes[0] ? r.pessoa.find(p => normal(p.nome) === nomes[0]) ?? r.pessoa.find(p => normal(p.nome) === nomes[1]) : undefined;
}
/** Fechamento que esta linha pode pagar (Pix com alguém da casa), para a folha oferecer "Pagamento do fechamento". */
export function fechamentoPara(r: Retrato, dono: string, l: { descricao: string; contraparte?: string | null; valor: number; data: string }): FechamentoAlvo | null {
  const pessoa = pessoaDaLinha(r, l); if (!pessoa || pessoa.id === dono) return null;
  const devedor = l.valor < 0 ? dono : pessoa.id, credor = l.valor < 0 ? pessoa.id : dono;
  const f = fechamentoAberto(r, devedor, credor, l.data, Math.abs(l.valor));
  return f ? { devedor, credor, mes: f.mes } : null;
}

export function sugerir(r: Retrato, dono: string, l: LinhaDoExtrato, anteriores: Lancamento[] = r.lancamento): Sugestao {
  const saida = l.valor < 0, texto = normal(`${l.descricao} ${l.contraparte ?? ''}`);
  const gasto = (categoria: string | null, motivo: string, escopo: Escopo = 'pessoal'): Sugestao => ({ tipo: 'despesa', categoria, escopo, motivo });
  const receita = (motivo: string): Sugestao => ({ tipo: 'receita', categoria: catPorNome(r, 'Outras receitas', 'Renda extra'), escopo: 'pessoal', motivo });

  if (/pagamento (de )?fatura|pagamento efetuado.*cartao/.test(texto)) return { tipo: 'pagamento_cartao', categoria: null, escopo: null, motivo: 'Pagamento de fatura de cartão' };
  if (/\b(resgate|aplicacao|cdb|rdb|lci|lca|tesouro|poupanca|caixinha)\b/.test(texto)) return { tipo: 'investimento', categoria: null, escopo: null, motivo: 'Dinheiro guardado ou resgatado' };

  // Pix com alguém da casa, pelo primeiro ou segundo nome de quem está do outro lado ("Maria Eliete ..." é a Eliete)
  const pessoa = pessoaDaLinha(r, l);
  if (pessoa?.id === dono) return { tipo: 'transferencia_propria', categoria: null, escopo: null, motivo: 'Para outra conta sua' };
  if (pessoa) {
    const devedor = saida ? dono : pessoa.id, credor = saida ? pessoa.id : dono;
    const f = fechamentoAberto(r, devedor, credor, l.data, Math.abs(l.valor));
    if (f) return { tipo: 'pagamento_fechamento', categoria: null, escopo: null, fechamento: { devedor, credor, mes: f.mes }, motivo: `Fechamento em aberto de ${r.pessoa.find(p => p.id === devedor)?.nome}` };
    if (pessoa.tipo === 'usuario') return { tipo: 'transferencia', categoria: null, escopo: null, motivo: `Pix ${saida ? 'para' : 'de'} ${pessoa.nome}, sem fechamento em aberto` };
    if (!saida) return receita(`Pix de ${pessoa.nome}`);
  }

  // Conta fixa ou receita fixa esperando este valor por estes dias (RN-RE-03)
  const fixa = contaFixaDaLinha(r, dono, l);
  if (fixa) return { tipo: fixa.tipo, categoria: fixa.categoria ?? null, escopo: fixa.escopo ?? 'pessoal', recorrente: fixa.id, motivo: `${fixa.tipo === 'despesa' ? 'Conta fixa' : 'Receita fixa'}: ${fixa.descricao}` };

  // Parcela de dívida cadastrada da própria pessoa (RN-DV-03)
  const divida = dividaDaLinha(r, dono, l);
  if (divida) return { tipo: 'despesa', categoria: catPorNome(r, 'Dívidas e encargos'), escopo: divida.escopo ?? 'pessoal', divida: divida.id, motivo: `Parcela de ${divida.nome}` };

  // O que a pessoa escolheu da última vez para o mesmo lado (D21)
  const chave = chaveDaLinha(l);
  const ultimo = [...anteriores].filter(x => x.pessoa === dono && chaveDaLinha(x) === chave && x.tipo !== 'pagamento_fechamento').sort((a, b) => b.data.localeCompare(a.data))[0];
  if (ultimo) return { tipo: ultimo.tipo, categoria: ultimo.categoria ?? null, escopo: ultimo.escopo ?? null, motivo: 'Como da última vez' };

  if (saida && /mercado pago/.test(texto)) return gasto(catPorNome(r, 'Dívidas e encargos'), 'Mercado Pago: parcela de dívida');
  if (!saida) return receita('Entrada de dinheiro');
  // Compra no débito: a categoria que essa loja já teve no cartão ou no extrato
  const loja = normal(lojaDaLinha(l));
  const doCartao = [...r.compra].reverse().find(c => c.categoria && normal(c.descricao) === loja)?.categoria;
  return gasto(doCartao ?? null, doCartao ? 'Mesma categoria da loja no cartão' : 'Gasto');
}

export type ItemPrevia = { linha: LinhaDoExtrato; repetida: boolean; sugestao: Sugestao };
export type Previa = { conta: Conta; contaNova: boolean; itens: ItemPrevia[] };

/** Acha a conta do arquivo (pelo banco e número) ou prepara uma nova; marca o que já foi importado e sugere o resto. */
export function prepararExtrato(r: Retrato, dono: string, e: Extrato): Previa {
  const existente = r.conta.find(c => c.pessoa === dono && c.banco === e.banco && (c.numero ?? '') === e.conta);
  const nomeDono = r.pessoa.find(p => p.id === dono)?.nome ?? '';
  const conta: Conta = existente ?? { id: novoId(), pessoa: dono, banco: e.banco, apelido: `${nomeDoBanco(e.banco)} · ${nomeDono}`, numero: e.conta || null, ativa: true };
  const ja = new Set(r.lancamento.filter(x => x.conta === conta.id && x.fitid).map(x => x.fitid));
  const itens = e.linhas.map(linha => ({ linha, repetida: ja.has(linha.fitid), sugestao: sugerir(r, dono, linha) }));
  return { conta, contaNova: !existente, itens };
}

/** A outra ponta de uma transferência entre contas da mesma pessoa: valor oposto, até 1 dia de diferença, outra conta. */
function acharPar(lancs: Lancamento[], x: Lancamento) {
  const dia = (d: string) => Date.parse(d + 'T12:00:00Z') / 864e5;
  return lancs.find(y => y.id !== x.id && y.pessoa === x.pessoa && y.conta !== x.conta && y.tipo === 'transferencia_propria' && !y.par && y.valor === -x.valor && Math.abs(dia(y.data) - dia(x.data)) <= 1);
}

/** Registra o Pix no fechamento; se o mesmo pagamento já está lá (o outro importou o extrato dele, ou foi lançado à mão), só liga (RN-CT-03). */
function pagarFechamento(p: Pacote, f: FechamentoAlvo, valor: number, data: string): string {
  const reg = fechamentoDe(p, f.devedor, f.credor, f.mes);
  const dia = (d: string) => Date.parse(d + 'T12:00:00Z') / 864e5;
  const igual = p.todos('pagamento_fechamento').find(x => x.fechamento === reg.id && x.valor === valor && Math.abs(dia(x.data) - dia(data)) <= 1);
  if (igual) return igual.id;
  return p.inserir('pagamento_fechamento', { id: novoId(), fechamento: reg.id, valor, data, observacao: 'Pix do extrato' }).id;
}

export function gravarExtrato(r: Retrato, previa: Previa, escolhas: Map<string, Escolha>): Mudanca {
  const p = new Pacote(r);
  if (previa.contaNova) p.inserir('conta', previa.conta);
  const novos: Lancamento[] = [];
  for (const it of previa.itens) {
    if (it.repetida) continue;
    const e = escolhas.get(it.linha.fitid) ?? it.sugestao;
    const l = it.linha;
    const lanc: Lancamento = {
      id: novoId(), pessoa: previa.conta.pessoa, conta: previa.conta.id, data: l.data, descricao: l.descricao, contraparte: l.contraparte ?? null, valor: l.valor,
      tipo: e.tipo, escopo: CONTA_NO_MES(e.tipo) ? e.escopo ?? 'pessoal' : null, categoria: CONTA_NO_MES(e.tipo) ? e.categoria : null,
      observacao: null, fitid: l.fitid, par: null, pagamento: null, origem: 'importacao', recorrente: CONTA_NO_MES(e.tipo) ? e.recorrente ?? null : null, divida: e.tipo === 'despesa' ? e.divida ?? null : null,
    };
    if (e.tipo === 'pagamento_fechamento' && e.fechamento) lanc.pagamento = pagarFechamento(p, e.fechamento, Math.abs(l.valor), l.data);
    novos.push(lanc);
  }
  // Transferência entre contas próprias: liga as duas pontas, nesta importação ou com uma anterior
  const todos = [...r.lancamento.map(y => ({ ...y })), ...novos]; // cópias: o retrato atual não é alterado
  for (const x of novos) {
    if (x.tipo !== 'transferencia_propria' || x.par) continue;
    const y = acharPar(todos, x);
    if (!y) continue;
    x.par = y.id; y.par = x.id;
    if (!novos.includes(y)) p.atualizar('lancamento', y);
  }
  for (const x of novos) p.inserir('lancamento', x);
  return p.m;
}

/** Trocar o que um lançamento é depois de gravado. Se deixa de ser pagamento de fechamento, o pagamento sai (se nenhum outro Pix usa). */
export function alterarLancamento(r: Retrato, id: string, e: Escolha): Mudanca {
  const p = new Pacote(r);
  const x = p.ver('lancamento', id); if (!x) return p.m;
  const novo: Lancamento = { ...x, tipo: e.tipo, escopo: CONTA_NO_MES(e.tipo) ? e.escopo ?? 'pessoal' : null, categoria: CONTA_NO_MES(e.tipo) ? e.categoria : null,
    recorrente: CONTA_NO_MES(e.tipo) ? (e.recorrente !== undefined ? e.recorrente : x.recorrente ?? null) : null,
    divida: e.tipo === 'despesa' ? (e.divida !== undefined ? e.divida : x.divida ?? null) : null };
  if (x.pagamento && (e.tipo !== 'pagamento_fechamento' || e.fechamento)) {
    if (!r.lancamento.some(y => y.id !== x.id && y.pagamento === x.pagamento)) p.apagar('pagamento_fechamento', x.pagamento);
    novo.pagamento = null;
  }
  if (e.tipo === 'pagamento_fechamento' && e.fechamento) novo.pagamento = pagarFechamento(p, e.fechamento, Math.abs(x.valor), x.data);
  if (x.par && e.tipo !== 'transferencia_propria') { const y = p.ver('lancamento', x.par); if (y) p.atualizar('lancamento', { ...y, par: null }); novo.par = null; }
  p.atualizar('lancamento', novo);
  return p.m;
}

/** Tira os lançamentos de um extrato (ex.: arquivo errado). Pagamentos de fechamento criados por eles saem junto. */
export function apagarLancamentos(r: Retrato, ids: string[]): Mudanca {
  const p = new Pacote(r), sai = new Set(ids);
  for (const id of ids) {
    const x = r.lancamento.find(y => y.id === id); if (!x) continue;
    if (x.pagamento && !r.lancamento.some(y => !sai.has(y.id) && y.pagamento === x.pagamento)) p.apagar('pagamento_fechamento', x.pagamento);
    if (x.par && !sai.has(x.par)) { const y = p.ver('lancamento', x.par); if (y) p.atualizar('lancamento', { ...y, par: null }); }
  }
  for (const id of ids) p.apagar('lancamento', id);
  return p.m;
}
