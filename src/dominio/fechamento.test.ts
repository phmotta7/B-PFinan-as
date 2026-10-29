import { describe, expect, it } from 'vitest';
import { calcularFechamento, aReceber, type ItemFatura, type ParcelaDivida } from './fechamento';

const item = (pagador: string, valor: number, cartao = 'nu'): ItemFatura =>
  ({ id: `${pagador}${valor}`, cartao, titular: 'B', pagador, valor, data: '2026-10-10', loja: 'Loja', tipo: 'compra' });
const itens: ItemFatura[] = [item('P', 31210), item('P', 7540, 'bb'), item('E', 15400), item('L', 12590), item('L', 8050, 'bb'), item('B', 100000), item('P', -1000)];
const dividas: ParcelaDivida[] = [
  { id: 'emp', nome: 'Empréstimo Banco Alfa', responsavel: 'P', titular: 'B', valor: 35000, atual: 5, total: 24 },
  { id: 'shp', nome: 'Shopee', responsavel: 'P', titular: 'B', valor: 7490, atual: 2, total: 6 },
];

describe('calcularFechamento (§5.1)', () => {
  it('soma as linhas da pessoa nas faturas do mês, as dívidas dela e abate estornos', () => {
    // 312,10 + 75,40 − 10,00 + 350,00 + 74,90 = 802,40
    expect(calcularFechamento('P', 'B', itens, dividas, []).total).toBe(80240);
  });
  it('Eliete e Lucimar só têm as próprias linhas', () => {
    expect(calcularFechamento('E', 'B', itens, dividas, []).total).toBe(15400);
    expect(calcularFechamento('L', 'B', itens, dividas, []).total).toBe(20640);
  });
  it('a titular não tem fechamento consigo mesma', () => {
    expect(() => calcularFechamento('B', 'B', itens, dividas, [])).toThrow();
  });
  it('linha de cartão de outro titular não entra (RN-AC-05)', () => {
    const outro = [...itens, { ...item('L', 999), titular: 'P' }];
    expect(calcularFechamento('L', 'B', outro, dividas, []).total).toBe(20640);
  });
});

describe('situação do fechamento (RN-FE-10, RN-FE-11)', () => {
  it('sem pagamento fica Pendente', () => {
    expect(calcularFechamento('L', 'B', itens, [], [])).toMatchObject({ pago: 0, emAberto: 20640, situacao: 'Pendente' });
  });
  it('pagamento parcial deixa saldo em aberto visível', () => {
    expect(calcularFechamento('L', 'B', itens, [], [{ valor: 20000, data: '2026-11-05' }])).toMatchObject({ pago: 20000, emAberto: 640, situacao: 'Parcial' });
  });
  it('pagamento do total fica Pago', () => {
    expect(calcularFechamento('E', 'B', itens, [], [{ valor: 15400, data: '2026-11-05' }]).situacao).toBe('Pago');
  });
});

describe('aReceber (RN-FE-14)', () => {
  it('lista só o que ficou em aberto, sem passar saldo para o mês seguinte', () => {
    const lista = aReceber([
      { pessoa: 'E', mes: '2026-10', total: 17400, pago: 15400 },
      { pessoa: 'L', mes: '2026-10', total: 9850, pago: 9850 },
      { pessoa: 'L', mes: '2026-11', total: 20640, pago: 20000 },
    ]);
    expect(lista).toEqual([{ pessoa: 'E', mes: '2026-10', emAberto: 2000 }, { pessoa: 'L', mes: '2026-11', emAberto: 640 }]);
  });
});
