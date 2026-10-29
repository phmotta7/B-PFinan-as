import { describe, expect, it } from 'vitest';
import { dividirEmParcelas } from './parcelas';

describe('dividirEmParcelas (RN-CA-11)', () => {
  it('a diferença do arredondamento vai para a 1ª parcela', () => {
    expect(dividirEmParcelas(10000, 3)).toEqual([3334, 3333, 3333]);
  });
  it('valor que divide exato fica igual em todas', () => {
    expect(dividirEmParcelas(30000, 3)).toEqual([10000, 10000, 10000]);
  });
  it('à vista é uma parcela só', () => {
    expect(dividirEmParcelas(5490, 1)).toEqual([5490]);
  });
  it('a soma das parcelas sempre fecha com o total', () => {
    const p = dividirEmParcelas(99999, 7);
    expect(p.reduce((a, b) => a + b, 0)).toBe(99999);
  });
  it('recusa zero parcelas ou número quebrado', () => {
    expect(() => dividirEmParcelas(1000, 0)).toThrow();
    expect(() => dividirEmParcelas(1000, 2.5)).toThrow();
  });
});
