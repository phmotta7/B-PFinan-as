import { describe, expect, it } from 'vitest';
import { faltaDividir, partesDaLinha, partesIguais, repartir } from './divisao';

describe('divisão de uma compra', () => {
  it('meio a meio: o centavo que sobra fica com a primeira pessoa', () => {
    expect(partesIguais(46821, ['pedro', 'bruna'])).toEqual([{ pessoa: 'pedro', valor: 23411 }, { pessoa: 'bruna', valor: 23410 }]);
    expect(partesIguais(10000, ['a', 'b', 'c'])).toEqual([{ pessoa: 'a', valor: 3334 }, { pessoa: 'b', valor: 3333 }, { pessoa: 'c', valor: 3333 }]);
  });
  it('cada parcela é repartida na proporção da compra inteira, e a soma sempre fecha', () => {
    // iPad de R$ 2.283,50 em 10x, 70% Pedro e 30% Bruna; a parcela é R$ 228,35
    const divisao = [{ pessoa: 'pedro', valor: 159845 }, { pessoa: 'bruna', valor: 68505 }];
    const partes = repartir(22835, divisao);
    expect(partes).toEqual([{ pessoa: 'pedro', valor: 15985 }, { pessoa: 'bruna', valor: 6850 }]);
    expect(partes[0].valor + partes[1].valor).toBe(22835);
  });
  it('estorno (valor negativo) também é repartido e fecha', () => {
    const partes = repartir(-1001, [{ pessoa: 'a', valor: 500 }, { pessoa: 'b', valor: 500 }]);
    expect(partes.reduce((s, p) => s + p.valor, 0)).toBe(-1001);
  });
  it('compra sem divisão é inteira do pagador; sem pagador, de ninguém', () => {
    expect(partesDaLinha({ pagador: 'eliete' }, 5000)).toEqual([{ pessoa: 'eliete', valor: 5000 }]);
    expect(partesDaLinha({ pagador: null }, 5000)).toEqual([]);
    expect(partesDaLinha({ pagador: 'pedro', divisao: [{ pessoa: 'pedro', valor: 50 }, { pessoa: 'bruna', valor: 50 }] }, 3001))
      .toEqual([{ pessoa: 'pedro', valor: 1501 }, { pessoa: 'bruna', valor: 1500 }]);
  });
  it('diz quanto falta dividir', () => {
    expect(faltaDividir(10000, [{ pessoa: 'a', valor: 7000 }, { pessoa: 'b', valor: 2000 }])).toBe(1000);
  });
});
