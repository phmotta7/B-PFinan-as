// Painel "Para onde vai o dinheiro" (2A): contas por carteira e categoria, média e sugestões.
import { describe, expect, it } from 'vitest';
import { aplicar } from './mudanca';
import { lancarCompra } from './operacoes';
import { comprasDaCategoria, painelDoMes, pedacosDoMes, SEM_CATEGORIA } from './painel';
import { retratoCenario, IDS, cat } from './cenario';
import type { Retrato } from './tipos';

const lancar = (r: Retrato, data: string, descricao: string, valor: number, pagador: string, escopo: 'pessoal' | 'casal', categoria: string, parcelas = 1) =>
  aplicar(r, lancarCompra(r, { cartao: IDS.bb, data, descricao, valorTotal: valor, parcelas, pagador, escopo, categoria: cat(categoria) }));

describe('painel do mês', () => {
  it('conta só Pedro, Bruna e Casal; Eliete e Lucimar ficam no fechamento', () => {
    const r = retratoCenario();
    const { pedacos } = pedacosDoMes(r, '2026-11');
    expect(pedacos.every(p => [IDS.pedro, IDS.bruna, 'casal'].includes(p.carteira))).toBe(true);
    const p = painelDoMes(r, '2026-11');
    expect(p.total).toBe(pedacos.reduce((s, x) => s + x.valor, 0));
    expect(p.total).toBe(painelDoMes(r, '2026-11', IDS.pedro).total + painelDoMes(r, '2026-11', IDS.bruna).total + painelDoMes(r, '2026-11', 'casal').total);
  });

  it('a compra Casal vai para o Casal; a pessoal, para quem pagou', () => {
    const r = retratoCenario();
    const casal = painelDoMes(r, '2026-11', 'casal');
    expect(casal.categorias.find(c => c.id === cat('Mercado'))?.valor).toBe(21030); // Pão de Açúcar no BB
    expect(painelDoMes(r, '2026-11', IDS.pedro).categorias.find(c => c.id === cat('Transporte'))?.valor).toBe(2300 + 7540);
  });

  it('compra dividida entre Pedro e Eliete: só a parte do Pedro entra', () => {
    let r = retratoCenario();
    const antes = painelDoMes(r, '2026-11', IDS.pedro).total;
    r = aplicar(r, lancarCompra(r, { cartao: IDS.bb, data: '2026-10-25', descricao: 'Jantar', valorTotal: 10000, parcelas: 1, pagador: IDS.pedro, escopo: 'pessoal', categoria: cat('Alimentação fora'), divisao: [{ pessoa: IDS.pedro, valor: 5000 }, { pessoa: IDS.eliete, valor: 5000 }] }));
    expect(painelDoMes(r, '2026-11', IDS.pedro).total - antes).toBe(5000);
  });

  it('no primeiro mês não há média nem comparação (D17)', () => {
    const p = painelDoMes(retratoCenario(), '2026-11');
    expect(p.media).toBeNull();
    expect(p.meses.map(m => m.mes)).toEqual(['2026-11']);
    expect(p.sugestoes.some(s => s.tom !== 'nota')).toBe(false);
  });

  it('meses antes de novembro/26 não entram na média', () => {
    const r = lancar(retratoCenario(), '2026-08-20', 'Restaurante', 90000, IDS.pedro, 'pessoal', 'Alimentação fora');
    expect(painelDoMes(r, '2026-11').media).toBeNull();
  });

  it('compara com o mês anterior e diz o que subiu e o que caiu', () => {
    let r = retratoCenario();
    // Fatura Dez/26 do BB: compras entre 07/11 e 06/12
    r = lancar(r, '2026-11-10', 'Pão de Açúcar', 5000, IDS.bruna, 'casal', 'Mercado');
    r = lancar(r, '2026-11-12', 'Restaurante', 40000, IDS.bruna, 'casal', 'Alimentação fora');
    const p = painelDoMes(r, '2026-12', 'casal');
    expect(p.mesesNaMedia).toBe(1);
    expect(p.meses.map(m => m.mes)).toEqual(['2026-11', '2026-12']);
    const mercado = p.categorias.find(c => c.id === cat('Mercado'))!;
    expect(mercado.media).toBe(painelDoMes(r, '2026-11', 'casal').categorias.find(c => c.id === cat('Mercado'))!.valor);
    expect(p.sugestoes.find(s => s.categoria === cat('Mercado'))).toMatchObject({ tom: 'menos' });
    expect(p.sugestoes.find(s => s.categoria === cat('Alimentação fora'))).toMatchObject({ tom: 'mais' });
    expect(p.sugestoes.find(s => s.categoria === cat('Mercado'))!.texto).toMatch(/^Mercado caiu R\$ [\d.]+ em relação ao mês passado\.$/);
  });

  it('mês ainda aberto: total parcial, sem comparar com a média', () => {
    let r = retratoCenario();
    r = lancar(r, '2026-11-10', 'Restaurante', 40000, IDS.bruna, 'casal', 'Alimentação fora');
    const p = painelDoMes(r, '2026-12', 'casal', '2026-11-20');
    expect(p.aberto).toBe(true);
    expect(p.media).not.toBeNull();
    expect(p.sugestoes.some(s => s.tom !== 'nota')).toBe(false);
    expect(painelDoMes(r, '2026-12', 'casal', '2026-12-10').aberto).toBe(false);
  });

  it('diferença pequena não vira sugestão', () => {
    let r = retratoCenario();
    r = lancar(r, '2026-11-10', 'Pão de Açúcar', 21030 + 2000, IDS.bruna, 'casal', 'Mercado');
    expect(painelDoMes(r, '2026-12', 'casal').sugestoes.find(s => s.categoria === cat('Mercado'))).toBeUndefined();
  });

  it('avisa as parcelas que já estão no mês seguinte', () => {
    const r = retratoCenario();
    const p = painelDoMes(r, '2026-11');
    expect(p.parcelasSeguinte).toBeGreaterThan(0);
    expect(p.sugestoes.find(s => s.id === 'parcelas')?.texto).toMatch(/^Dezembro já tem R\$ [\d.]+ em parcelas\.$/);
  });

  it('compra sem categoria fica em "Sem categoria", por último', () => {
    let r = retratoCenario();
    r = aplicar(r, lancarCompra(r, { cartao: IDS.bb, data: '2026-10-25', descricao: 'Loja', valorTotal: 999999, parcelas: 1, pagador: IDS.pedro, escopo: 'pessoal', categoria: null }));
    const cats = painelDoMes(r, '2026-11', IDS.pedro).categorias;
    expect(cats[cats.length - 1].id).toBe(SEM_CATEGORIA);
  });

  it('as compras de uma categoria somam o valor da categoria', () => {
    const p = painelDoMes(retratoCenario(), '2026-11', IDS.pedro);
    for (const c of p.categorias) expect(comprasDaCategoria(p, c.id).reduce((s, x) => s + x.valor, 0)).toBe(c.valor);
    expect(comprasDaCategoria(p, cat('Transporte')).map(x => x.descricao)).toEqual(['Posto Ipiranga', 'Uber']);
  });

  it('gasto do extrato entra pelo mês da data; receita e Pix entre contas não entram (2B)', () => {
    let r = retratoCenario();
    const antes = painelDoMes(r, '2026-11', IDS.pedro).total;
    const lanc = (id: string, valor: number, tipo: 'despesa' | 'receita' | 'transferencia_propria', data = '2026-11-05') =>
      ({ id, pessoa: IDS.pedro, conta: 'k', data, descricao: 'Compra no débito - FORT ATACADISTA', valor, tipo, escopo: 'pessoal' as const, categoria: cat('Mercado'), origem: 'importacao' as const });
    r = { ...r, lancamento: [lanc('a', -9758, 'despesa'), lanc('b', 50000, 'receita'), lanc('c', -130451, 'transferencia_propria'), lanc('d', -1000, 'despesa', '2026-12-01')] };
    const p = painelDoMes(r, '2026-11', IDS.pedro);
    expect(p.total - antes).toBe(9758);
    expect(comprasDaCategoria(p, cat('Mercado'))).toEqual([expect.objectContaining({ origem: 'conta', descricao: 'FORT ATACADISTA', valor: 9758 })]);
  });
});
