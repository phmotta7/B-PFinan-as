// Operações do app. Cada uma lê o retrato atual e devolve um pacote de mudança (nada é gravado aqui).
import { datasDaFatura, faturaDaCompra, somarMeses, type Mes } from '@/dominio/ciclo';
import { dividirEmParcelas } from '@/dominio/parcelas';
import { conciliar, parcelasFuturas, type Importada, type Lancamento } from '@/dominio/conciliacao';
import type { Leitura } from '@/dominio/leitores';
import type { Centavos } from '@/dominio/dinheiro';
import { mudancaVazia, type Compra, type Escopo, type Fatura, type Mudanca, type ParcelaCartao, type Retrato, type Tabela, type Tabelas } from './tipos';

export const novoId = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}-${Date.now()}`);

/** Ajuda a montar um pacote olhando também o que já foi incluído nele. */
class Pacote {
  m: Mudanca = mudancaVazia();
  constructor(private r: Retrato) {}
  inserir<T extends Tabela>(t: T, x: Tabelas[T]) { ((this.m.inserir[t] ??= []) as Tabelas[T][]).push(x); return x; }
  atualizar<T extends Tabela>(t: T, x: Tabelas[T]) {
    const ins = (this.m.inserir[t] ?? []) as (Tabelas[T] & { id: string })[];
    const i = ins.findIndex(y => y.id === (x as { id: string }).id);
    if (i >= 0) { ins[i] = x as never; return; }
    const at = ((this.m.atualizar[t] ??= []) as (Tabelas[T] & { id: string })[]);
    const j = at.findIndex(y => y.id === (x as { id: string }).id);
    if (j >= 0) at[j] = x as never; else at.push(x as never);
  }
  apagar(t: Tabela, id: string) { (this.m.apagar[t] ??= []).push(id); }
  /** Registro atual, considerando o que já está no pacote. */
  ver<T extends Tabela>(t: T, id: string): Tabelas[T] | undefined {
    const busca = (l?: unknown[]) => (l as ({ id: string } & Tabelas[T])[] | undefined)?.find(x => x.id === id);
    return busca(this.m.atualizar[t]) ?? busca(this.m.inserir[t]) ?? busca(this.r[t] as unknown[]);
  }
  todos<T extends Tabela>(t: T): Tabelas[T][] {
    const apagados = new Set(this.m.apagar[t] ?? []);
    const at = new Map(((this.m.atualizar[t] ?? []) as { id: string }[]).map(x => [x.id, x]));
    return [...(this.r[t] as { id: string }[]).filter(x => !apagados.has(x.id)).map(x => at.get(x.id) ?? x), ...((this.m.inserir[t] ?? []) as { id: string }[])] as Tabelas[T][];
  }
  fatura(cartao: string, mes: Mes): Fatura {
    const existente = this.todos('fatura').find(f => f.cartao === cartao && f.mes === mes);
    if (existente) return existente;
    const c = this.ver('cartao', cartao)!;
    const d = datasDaFatura(c, mes);
    return this.inserir('fatura', { id: novoId(), cartao, mes, dataFechamento: d.fechamento, dataVencimento: d.vencimento, status: 'aberta' });
  }
}

// ---------- Lançar compra no cartão (§4.3) ----------
export type NovaCompra = { cartao: string; data: string; descricao: string; valorTotal: Centavos; parcelas: number; pagador: string | null; escopo: Escopo | null; categoria: string | null; observacao?: string | null };
export function lancarCompra(r: Retrato, n: NovaCompra): Mudanca {
  const p = new Pacote(r);
  const cartao = r.cartao.find(c => c.id === n.cartao)!;
  const compra: Compra = { id: novoId(), cartao: n.cartao, data: n.data, descricao: n.descricao.trim(), valorTotal: n.valorTotal, parcelas: n.parcelas, tipo: 'compra',
    pagador: n.pagador, escopo: n.escopo, categoria: n.categoria, observacao: n.observacao ?? null, origem: 'manual', conciliada: false };
  p.inserir('compra', compra);
  const m1 = faturaDaCompra(cartao, n.data); // RN-CA-02
  dividirEmParcelas(n.valorTotal, n.parcelas).forEach((valor, i) => // RN-CA-10, RN-CA-11, RN-CA-12
    p.inserir('parcela_cartao', { id: novoId(), compra: compra.id, fatura: p.fatura(n.cartao, somarMeses(m1, i)).id, numero: i + 1, valor, status: 'prevista' }));
  return p.m;
}

// ---------- Importar fatura (§4.4, §4.5) ----------
export type PedidoImportacao = { cartao: string; mes: Mes; leitura: Leitura; formato: 'nubank_csv' | 'csv_generico' | 'bb_pdf'; arquivoNome: string; hoje: string };
export function importarFatura(r: Retrato, q: PedidoImportacao) {
  const p = new Pacote(r);
  const cartao = r.cartao.find(c => c.id === q.cartao)!;
  const fatura = p.fatura(q.cartao, q.mes); // D1: todas as linhas vão para a fatura confirmada
  p.atualizar('fatura', { ...fatura, status: 'importada' });
  const importacao = p.inserir('importacao', { id: novoId(), formato: q.formato, cartao: q.cartao, fatura: fatura.id, arquivoNome: q.arquivoNome, total: 0, linhasNovas: 0, linhasRepetidas: 0, linhasIgnoradas: q.leitura.ignoradas.length, criadoEm: q.hoje });

  // RN-IM-01: linhas já importadas (mesma impressão digital) não entram de novo
  const jaTem = new Set(r.linha_importada.filter(l => l.cartao === q.cartao && l.situacao !== 'ignorada').map(l => l.digital));
  const novas = q.leitura.linhas.filter(l => !jaTem.has(l.digital));
  const linhaId = new Map(novas.map(l => [l.digital, novoId()]));

  // Candidatos à conciliação: compras manuais à vista ainda não conciliadas e parcelas previstas do cartão
  const comprasCartao = r.compra.filter(c => c.cartao === q.cartao);
  // Nome para comparar: o que a pessoa deu à compra e o que veio do banco (se ela renomeou "CleberSalvado" para "iPad",
  // a próxima parcela, que o banco ainda chama de CleberSalvado, continua sendo reconhecida)
  const nomeDoBanco = (compra: string) => {
    const lid = r.parcela_cartao.find(x => x.compra === compra && x.linhaImportada)?.linhaImportada;
    const loja = r.linha_importada.find(l => l.id === lid)?.dados.loja;
    return typeof loja === 'string' ? loja : '';
  };
  const nomes = (c: Compra) => [c.descricao, nomeDoBanco(c.id)].filter(Boolean).join(' ');
  const lancados: Lancamento[] = [
    ...comprasCartao.filter(c => c.origem === 'manual' && !c.conciliada && c.parcelas === 1).map(c => ({ id: 'c:' + c.id, tipo: 'manual' as const, data: c.data, loja: c.descricao, valor: c.valorTotal })),
    ...r.parcela_cartao.filter(x => x.status === 'prevista').flatMap(x => {
      const c = comprasCartao.find(y => y.id === x.compra); if (!c || c.parcelas === 1) return [];
      return [{ id: 'p:' + x.id, tipo: 'prevista' as const, data: c.data, loja: nomes(c), valor: x.valor, parcela: { atual: x.numero, total: c.parcelas }, fatura: r.fatura.find(f => f.id === x.fatura)?.mes }];
    }),
  ];
  const importadas: Importada[] = novas.map(l => ({ id: l.digital, data: l.data, loja: l.loja, valor: l.valor, parcela: l.parcela }));
  const conc = conciliar(importadas, lancados, q.mes);

  const criadas: Compra[] = [];
  let total = 0;
  for (const l of novas) {
    total += l.valor;
    const res = conc.linhas.find(x => x.importada === l.digital)!;
    const lid = linhaId.get(l.digital)!;
    p.inserir('linha_importada', { id: lid, importacao: importacao.id, cartao: q.cartao, dados: { ...l }, digital: l.digital, situacao: res.resultado === 'serie' ? 'conciliada' : 'nova' });

    if (res.resultado === 'serie') { // baixa na parcela prevista; valor da fatura prevalece (RN-CO-01)
      const parc = p.ver('parcela_cartao', res.lancamento.slice(2))!;
      p.atualizar('parcela_cartao', { ...parc, status: 'confirmada', valor: l.valor, fatura: fatura.id, linhaImportada: lid });
      const c = p.ver('compra', parc.compra)!;
      if (!c.conciliada) p.atualizar('compra', { ...c, conciliada: true });
      continue;
    }
    // Compra nova vinda do arquivo
    const total_ = l.parcela ? l.valor * l.parcela.total : l.valor;
    const titularPaga = l.tipo === 'anuidade' || l.tipo === 'juros'; // §4.7: encargos do titular
    const compra: Compra = {
      id: novoId(), cartao: q.cartao, data: l.data, descricao: l.loja, valorTotal: total_, parcelas: l.parcela?.total ?? 1, tipo: l.tipo,
      pagador: titularPaga ? cartao.titular : null, escopo: titularPaga ? 'pessoal' : null, categoria: null, origem: 'importacao', conciliada: true,
      pendencia: res.resultado === 'duplicidade' ? { tipo: 'duplicidade', manual: res.lancamento.slice(2) }
        : res.resultado === 'ambigua' ? { tipo: 'ambigua', candidatos: res.candidatos.map(id => id.startsWith('p:') ? p.ver('parcela_cartao', id.slice(2))!.compra : id.slice(2)) } : null,
    };
    p.inserir('compra', compra); criadas.push(compra);
    p.inserir('parcela_cartao', { id: novoId(), compra: compra.id, fatura: fatura.id, numero: l.parcela?.atual ?? 1, valor: l.valor, status: 'confirmada', linhaImportada: lid });
    if (l.parcela && res.resultado === 'sem_par') // RN-CO-02 e D5: série desconhecida gera as parcelas restantes
      for (const f of parcelasFuturas(l.parcela, l.valor, q.mes))
        p.inserir('parcela_cartao', { id: novoId(), compra: compra.id, fatura: p.fatura(q.cartao, f.fatura).id, numero: f.parcela.atual, valor: f.valor, status: 'prevista' });
  }
  // IOF e estorno: ligar à compra de origem e herdar o pagador (§4.7)
  for (const c of criadas.filter(c => c.tipo === 'iof' || c.tipo === 'estorno')) {
    const dados = novas.find(l => l.loja === c.descricao && l.data === c.data && l.tipo === c.tipo);
    const alvo = (dados?.iofDe ?? c.descricao).toLowerCase();
    const origem = [...criadas, ...p.todos('compra')].filter(o => o.id !== c.id && o.tipo !== 'iof' && o.tipo !== 'estorno' && o.descricao.toLowerCase() === alvo)
      .sort((a, b) => Math.abs(Date.parse(a.data) - Date.parse(c.data)) - Math.abs(Date.parse(b.data) - Date.parse(c.data)))[0];
    if (origem) p.atualizar('compra', { ...p.ver('compra', c.id)!, compraOrigem: origem.id, pagador: origem.pagador ?? null, escopo: origem.escopo ?? null });
  }
  p.atualizar('importacao', { ...importacao, total, linhasNovas: novas.length, linhasRepetidas: q.leitura.linhas.length - novas.length });
  return { mudanca: p.m, resumo: { novas: novas.length, repetidas: q.leitura.linhas.length - novas.length, ignoradas: q.leitura.ignoradas.length, fatura: fatura.id } };
}

// ---------- Conferência da importação (§4.5) ----------
function absorver(p: Pacote, importada: Compra, manualId: string) {
  const manual = p.ver('compra', manualId)!;
  p.atualizar('compra', { ...importada, pagador: manual.pagador, escopo: manual.escopo, categoria: manual.categoria, observacao: manual.observacao, pendencia: null });
  for (const x of p.todos('parcela_cartao').filter(x => x.compra === manualId)) p.apagar('parcela_cartao', x.id);
  p.apagar('compra', manualId);
}
/** Confirmar: o lançamento manual sai e seus dados vão para a linha da fatura. */
export function confirmarDuplicidade(r: Retrato, compraId: string): Mudanca {
  const p = new Pacote(r); const c = p.ver('compra', compraId)!;
  if (c.pendencia?.tipo !== 'duplicidade') return p.m;
  absorver(p, c, c.pendencia.manual); return p.m;
}
/** "Não é a mesma": a linha da fatura fica sem dono e o lançamento manual continua. */
export function negarDuplicidade(r: Retrato, compraId: string): Mudanca {
  const p = new Pacote(r); const c = p.ver('compra', compraId)!;
  p.atualizar('compra', { ...c, pendencia: null }); return p.m;
}
/** Ambíguo: o usuário escolhe qual lançamento é (ou nenhum). */
export function escolherCandidata(r: Retrato, compraId: string, candidata: string | null): Mudanca {
  const p = new Pacote(r); const c = p.ver('compra', compraId)!;
  if (!candidata) { p.atualizar('compra', { ...c, pendencia: null }); return p.m; }
  const cand = p.ver('compra', candidata)!;
  if (cand.parcelas === 1) absorver(p, c, candidata);
  else p.atualizar('compra', { ...c, pagador: cand.pagador, escopo: cand.escopo, categoria: cand.categoria, pendencia: null });
  return p.m;
}
/** RN-CO-03: parcela esperada e não encontrada → próxima fatura. */
export function moverParaProximaFatura(r: Retrato, parcelaId: string): Mudanca {
  const p = new Pacote(r); const x = p.ver('parcela_cartao', parcelaId)!;
  const f = p.ver('fatura', x.fatura)!;
  p.atualizar('parcela_cartao', { ...x, fatura: p.fatura(f.cartao, somarMeses(f.mes, 1)).id }); return p.m;
}
/** RN-CO-03 / RN-CA-14: excluir parcela prevista (só não confirmadas). */
export function excluirParcelaPrevista(r: Retrato, parcelaId: string): Mudanca {
  const p = new Pacote(r); const x = p.ver('parcela_cartao', parcelaId)!;
  if (x.status !== 'prevista') return p.m;
  p.apagar('parcela_cartao', x.id);
  if (!p.todos('parcela_cartao').some(y => y.compra === x.compra)) p.apagar('compra', x.compra);
  return p.m;
}
/** RN-CA-14: excluir compra parcelada apaga as parcelas não confirmadas. */
export function excluirCompra(r: Retrato, compraId: string): Mudanca {
  const p = new Pacote(r);
  const ps = p.todos('parcela_cartao').filter(x => x.compra === compraId);
  ps.filter(x => x.status === 'prevista').forEach(x => p.apagar('parcela_cartao', x.id));
  if (ps.every(x => x.status === 'prevista')) p.apagar('compra', compraId);
  return p.m;
}

// ---------- Marcação (§4.6) ----------
export function marcar(r: Retrato, compras: string[], m: { pagador: string; escopo: Escopo | null; categoria: string | null }): Mudanca {
  const p = new Pacote(r);
  const ids = new Set(compras);
  // IOF e estorno ligados seguem o pagador da compra de origem (§4.7)
  p.todos('compra').filter(c => c.compraOrigem && ids.has(c.compraOrigem) && !c.pagador).forEach(c => ids.add(c.id));
  for (const id of ids) {
    const c = p.ver('compra', id)!;
    const pb = r.pessoa.find(x => x.id === m.pagador)?.tipo === 'usuario';
    p.atualizar('compra', { ...c, pagador: m.pagador, escopo: pb ? m.escopo ?? 'pessoal' : null, categoria: m.categoria ?? c.categoria ?? null });
  }
  return p.m;
}

// ---------- Fechamento (§5.2, RN-WA-10) ----------
function fechamentoDe(p: Pacote, devedor: string, credor: string, mes: Mes) {
  return p.todos('fechamento').find(f => f.devedor === devedor && f.credor === credor && f.mes === mes)
    ?? p.inserir('fechamento', { id: novoId(), devedor, credor, mes, enviadoEm: null });
}
export function registrarPagamento(r: Retrato, q: { devedor: string; credor: string; mes: Mes; valor: Centavos; data: string; observacao?: string }): Mudanca {
  const p = new Pacote(r);
  const f = fechamentoDe(p, q.devedor, q.credor, q.mes);
  p.inserir('pagamento_fechamento', { id: novoId(), fechamento: f.id, valor: q.valor, data: q.data, observacao: q.observacao ?? null });
  return p.m;
}
export function marcarEnviado(r: Retrato, q: { devedor: string; credor: string; mes: Mes; data: string }): Mudanca {
  const p = new Pacote(r);
  const f = fechamentoDe(p, q.devedor, q.credor, q.mes);
  p.atualizar('fechamento', { ...f, enviadoEm: q.data });
  return p.m;
}

// ---------- Cadastros ----------
export function salvar<T extends Tabela>(r: Retrato, t: T, x: Tabelas[T]): Mudanca {
  const p = new Pacote(r);
  if (p.ver(t, (x as { id: string }).id)) p.atualizar(t, x); else p.inserir(t, x);
  return p.m;
}
export function remover(r: Retrato, t: Tabela, id: string): Mudanca { const p = new Pacote(r); p.apagar(t, id); return p.m; }
export type { ParcelaCartao };
