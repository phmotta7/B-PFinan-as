// Etapa 3: dívidas completas, orçamento e metas (PLANEJAMENTO §8, §9, §10).
import { describe, expect, it } from 'vitest';
import { aplicar } from './mudanca';
import { gravarExtrato, prepararExtrato, sugerir } from './extrato';
import { comprometidoEmCartoes, custoFixo, dividaDaLinha, emObservacao, fimDaDivida, limiteVigente, orcamentoDoMes, ordemDeQuitacao, progressoDaMeta, quandoFicamosLivres, quitar, situacaoDivida, sugestaoDeLimite } from './etapa3';
import { painelDoMes } from './painel';
import { retratoCenario, IDS, cat } from './cenario';
import type { Divida, Meta, Retrato } from './tipos';
import type { LinhaDoExtrato } from '@/dominio/ofx';

const mp = (x: Partial<Divida> = {}): Divida => ({ id: 'd-mp', nome: 'Mercado Pago', tipo: 'emprestimo', titular: IDS.pedro, responsavel: IDS.pedro, escopo: 'pessoal', valorParcela: 71797, parcelaAtual: 3, mesParcelaAtual: '2026-11', totalParcelas: 10, diaVencimento: 2, situacao: 'ativa', jurosMensal: 4.5, ...x });
const com = (r: Retrato, x: Partial<Retrato>): Retrato => ({ ...r, ...Object.fromEntries(Object.entries(x).map(([k, v]) => [k, [...(r[k as keyof Retrato] as unknown[]), ...(v as unknown[])]])) } as Retrato);
const linha = (x: Partial<LinhaDoExtrato>): LinhaDoExtrato => ({ fitid: 'm1', data: '2026-11-02', valor: -71797, descricao: 'Transferência enviada pelo Pix - MERCADO PAGO INSTITUICAO DE PAGAMENTO LTDA', tipoBanco: 'DEBIT', ...x });

describe('dívidas', () => {
  it('parcela do mês, restantes, saldo e mês de término', () => {
    const r = com(retratoCenario(), { divida: [mp()] });
    expect(fimDaDivida(mp())).toBe('2027-06');
    expect(situacaoDivida(r, mp(), '2026-11')).toMatchObject({ parcelaNoMes: 3, paga: false, restantes: 8, saldo: 8 * 71797, ativa: true });
    expect(situacaoDivida(r, mp(), '2027-07')).toMatchObject({ parcelaNoMes: null, restantes: 0, ativa: false });
    expect(situacaoDivida(r, mp({ saldoInformado: 450000 }), '2026-11')).toMatchObject({ saldo: 450000, saldoInformado: true });
    expect(situacaoDivida(r, quitar(mp()), '2026-11').restantes).toBe(0);
  });
  it('o Pix do extrato que paga a parcela é reconhecido e baixa a parcela do mês (RN-DV-03)', () => {
    let r = com(retratoCenario(), { divida: [mp()] });
    expect(dividaDaLinha(r, IDS.pedro, linha({}))?.id).toBe('d-mp');
    expect(dividaDaLinha(r, IDS.bruna, linha({}))).toBeNull();
    expect(dividaDaLinha(r, IDS.pedro, linha({ data: '2026-11-15' }))).toBeNull();
    expect(sugerir(r, IDS.pedro, linha({}))).toMatchObject({ tipo: 'despesa', divida: 'd-mp', categoria: cat('Dívidas e encargos'), motivo: 'Parcela de Mercado Pago' });
    r = aplicar(r, gravarExtrato(r, prepararExtrato(r, IDS.pedro, { banco: '0260', nomeBanco: '', conta: '1', linhas: [linha({})] }), new Map()));
    expect(situacaoDivida(r, mp(), '2026-11')).toMatchObject({ paga: true, restantes: 7 });
    expect(dividaDaLinha(r, IDS.pedro, linha({ fitid: 'm2' }))).toBeNull();
  });
  it('sem dívida cadastrada, o Pix para o Mercado Pago continua como gasto em Dívidas e encargos', () =>
    expect(sugerir(retratoCenario(), IDS.pedro, linha({}))).toMatchObject({ tipo: 'despesa', categoria: cat('Dívidas e encargos'), motivo: 'Mercado Pago: parcela de dívida' }));
  it('ordem de quitação: maior juros primeiro, sem juros no fim', () => {
    const lista = ordemDeQuitacao([mp({ id: 'a', nome: 'A', jurosMensal: null }), mp({ id: 'b', nome: 'B', jurosMensal: 2 }), mp({ id: 'c', nome: 'C', jurosMensal: 8 }), quitar(mp({ id: 'q' }))]);
    expect(lista.map(d => d.id)).toEqual(['c', 'b', 'a']);
  });
  it('comprometido em cartões e quando ficamos livres', () => {
    const r = retratoCenario();
    const dez = comprometidoEmCartoes(r, '2026-12', 1)[0];
    expect(dez.total).toBeGreaterThan(0);
    expect([...dez.porPessoa.values()].reduce((s, v) => s + v, 0)).toBe(dez.total);
    const livres = quandoFicamosLivres(com(r, { divida: [mp()] }), '2026-11');
    expect(livres.curva[0].total).toBeGreaterThanOrEqual(livres.curva[livres.curva.length - 1].total);
    expect(livres.fins.find(f => f.nome === 'Mercado Pago')?.fim).toBe('2027-06');
    expect(livres.fins.find(f => f.nome === 'Tênis Centauro')?.fim).toBe('2027-01');
    expect(livres.fins.find(f => f.nome === 'Empréstimo Banco Alfa')?.fim).toBe(fimDaDivida(r.divida[0]));
  });
});

describe('orçamento', () => {
  it('dois meses de observação (RN-OR-02)', () => {
    expect(emObservacao('2026-11')).toBe(true);
    expect(emObservacao('2026-12')).toBe(true);
    expect(emObservacao('2027-01')).toBe(false);
  });
  it('limite vale do mês em que foi definido até ser trocado (RN-OR-06)', () => {
    const r = com(retratoCenario(), { orcamento: [{ id: 'o1', carteira: 'casal', categoria: cat('Mercado'), limite: 60000, desde: '2026-11' }, { id: 'o2', carteira: 'casal', categoria: cat('Mercado'), limite: 80000, desde: '2027-02' }] });
    expect(limiteVigente(r, 'casal', cat('Mercado'), '2026-10')).toBeNull();
    expect(limiteVigente(r, 'casal', cat('Mercado'), '2027-01')?.limite).toBe(60000);
    expect(limiteVigente(r, 'casal', cat('Mercado'), '2027-03')?.limite).toBe(80000);
  });
  it('aviso em 80% e em 100% (RN-OR-04), contando o previsto do cartão (RN-OR-05)', () => {
    const r0 = retratoCenario();
    const mercado = painelDoMes(r0, '2026-11', 'casal').categorias.find(c => c.id === cat('Mercado'))!.valor; // 210,30 do Pão de Açúcar no BB
    const com80 = com(r0, { orcamento: [{ id: 'o', carteira: 'casal', categoria: cat('Mercado'), limite: Math.ceil(mercado / 0.85), desde: '2026-11' }] });
    expect(orcamentoDoMes(com80, '2026-11', 'casal').find(l => l.categoria === cat('Mercado'))).toMatchObject({ estado: 'perto', previsto: mercado });
    const passou = com(r0, { orcamento: [{ id: 'o', carteira: 'casal', categoria: cat('Mercado'), limite: 10000, desde: '2026-11' }] });
    expect(orcamentoDoMes(passou, '2026-11', 'casal')[0]).toMatchObject({ categoria: cat('Mercado'), estado: 'passou' });
  });
  it('sugestão de limite: média dos meses observados, para cima em múltiplo de R$ 10 (RN-OR-03)', () => {
    const r = retratoCenario();
    expect(sugestaoDeLimite(r, 'casal', cat('Mercado'), '2026-12')).toBeNull(); // só um mês observado
    const s = sugestaoDeLimite(r, 'casal', cat('Mercado'), '2027-01');
    expect(s! % 1000).toBe(0);
    expect(s).toBeGreaterThanOrEqual(21030 / 2);
  });
});

describe('metas e reserva', () => {
  const meta = (x: Partial<Meta> = {}): Meta => ({ id: 'mt', carteira: 'casal', nome: 'Reserva', alvo: 300000, aportePlanejado: 50000, reserva: true, mesesReserva: 3, encerrada: false, ...x });
  it('custo fixo soma contas fixas e parcelas de dívida da carteira', () => {
    const r = com(retratoCenario(), { recorrente: [{ id: 'l', pessoa: IDS.bruna, descricao: 'Luz', tipo: 'despesa', valor: 18000, dia: 15, escopo: 'casal', categoria: null, inicio: '2026-11', fim: null, ativo: true }] });
    expect(custoFixo(r, '2026-11', 'casal').total).toBe(18000);
    expect(custoFixo(r, '2026-11', IDS.pedro).total).toBe(35000 + 7490);
  });
  it('progresso, ritmo e previsão de chegada (RN-MT-02)', () => {
    let r = com(retratoCenario(), { meta: [meta()] });
    expect(progressoDaMeta(r, meta(), '2026-11-20')).toMatchObject({ guardado: 0, ritmo: 50000, chegaEm: '2027-05' });
    r = com(r, { movimento_meta: [{ id: 'a', meta: 'mt', pessoa: IDS.pedro, tipo: 'aporte', valor: 100000, data: '2026-11-05' }, { id: 'b', meta: 'mt', pessoa: IDS.bruna, tipo: 'resgate', valor: 10000, data: '2026-11-10' }] });
    expect(progressoDaMeta(r, meta(), '2026-11-20')).toMatchObject({ guardado: 90000, falta: 210000, ritmo: 90000, chegaEm: '2027-02' });
  });
});
