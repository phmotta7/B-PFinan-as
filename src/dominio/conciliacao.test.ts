import { describe, expect, it } from 'vitest';
import { conciliar, parcelasFuturas, type Importada, type Lancamento } from './conciliacao';

const imp = (id: string, data: string, loja: string, valor: number, parcela?: [number, number]): Importada =>
  ({ id, data, loja, valor, parcela: parcela && { atual: parcela[0], total: parcela[1] } });

const lancados: Lancamento[] = [
  { id: 'uber', tipo: 'manual', data: '2026-10-14', loja: 'Uber', valor: 2300 },
  { id: 'tenis-1', tipo: 'prevista', data: '2026-10-12', loja: 'Tênis Centauro', valor: 10000, parcela: { atual: 1, total: 3 }, fatura: '2026-11' },
  { id: 'magalu-3', tipo: 'prevista', data: '2026-08-15', loja: 'Magazine Luiza', valor: 8000, parcela: { atual: 3, total: 10 }, fatura: '2026-11' },
  { id: 'ifood-a', tipo: 'manual', data: '2026-10-19', loja: 'iFood', valor: 4780 },
  { id: 'ifood-b', tipo: 'manual', data: '2026-10-21', loja: 'iFood', valor: 4780 },
  { id: 'curso-2', tipo: 'prevista', data: '2026-09-08', loja: 'Curso de inglês', valor: 4900, parcela: { atual: 2, total: 6 }, fatura: '2026-11' },
  { id: 'longe', tipo: 'manual', data: '2026-10-01', loja: 'Uber', valor: 2300 },
];

describe('conciliar (§4.5), com o cenário de novembro', () => {
  const r = conciliar([
    imp('a', '2026-10-15', 'UBER *TRIP', 2300),
    imp('b', '2026-10-12', 'Centauro', 10000, [1, 3]),
    imp('c', '2026-10-04', 'Magazine Luiza', 8000, [3, 10]),
    imp('d', '2026-10-20', 'IFOOD *IFD', 4780),
    imp('e', '2026-10-25', 'Drogasil', 6240),
  ], lancados, '2026-11');
  const de = (id: string) => r.linhas.find(l => l.importada === id)!;

  it('1) parcela de série conhecida dá baixa na parcela prevista', () => {
    expect(de('b')).toEqual({ importada: 'b', resultado: 'serie', lancamento: 'tenis-1' });
    expect(de('c')).toEqual({ importada: 'c', resultado: 'serie', lancamento: 'magalu-3' });
  });
  it('2) lançamento manual com mesmo valor e data até 3 dias vira aviso de duplicidade', () => {
    expect(de('a')).toEqual({ importada: 'a', resultado: 'duplicidade', lancamento: 'uber' });
  });
  it('3) mais de um candidato vira escolha do usuário', () => {
    expect(de('d')).toEqual({ importada: 'd', resultado: 'ambigua', candidatos: ['ifood-a', 'ifood-b'] });
  });
  it('4) sem par entra como sem dono', () => {
    expect(de('e')).toEqual({ importada: 'e', resultado: 'sem_par' });
  });
  it('RN-CO-03: parcela prevista para esta fatura que não veio é sinalizada', () => {
    expect(r.naoEncontradas).toEqual(['curso-2']);
  });
});

describe('conciliar: limites', () => {
  it('data a 4 dias de distância não é duplicidade', () => {
    const r = conciliar([imp('x', '2026-10-05', 'Uber', 2300)], [{ id: 'u', tipo: 'manual', data: '2026-10-01', loja: 'Uber', valor: 2300 }], '2026-11');
    expect(r.linhas[0].resultado).toBe('sem_par');
  });
  it('parcela com até 5 centavos de diferença ainda casa com a série', () => {
    const r = conciliar([imp('x', '2026-10-04', 'Magazine Luiza', 8005, [3, 10])], [lancados[2]], '2026-11');
    expect(r.linhas[0].resultado).toBe('serie');
  });
  it('um mesmo lançamento não é usado duas vezes', () => {
    const r = conciliar([imp('x', '2026-10-14', 'Uber', 2300), imp('y', '2026-10-15', 'Uber', 2300)], [lancados[0]], '2026-11');
    expect(r.linhas.map(l => l.resultado)).toEqual(['duplicidade', 'sem_par']);
  });
});

describe('parcelasFuturas (RN-CO-02, D5)', () => {
  it('a parcela 1/3 gera a 2/3 e a 3/3 nas faturas seguintes, com o mesmo valor', () => {
    expect(parcelasFuturas({ atual: 1, total: 3 }, 10000, '2026-11')).toEqual([
      { parcela: { atual: 2, total: 3 }, valor: 10000, fatura: '2026-12' },
      { parcela: { atual: 3, total: 3 }, valor: 10000, fatura: '2027-01' },
    ]);
  });
  it('a última parcela não gera nada', () => {
    expect(parcelasFuturas({ atual: 10, total: 10 }, 8000, '2026-11')).toEqual([]);
  });
});
