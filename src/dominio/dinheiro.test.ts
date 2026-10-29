import { describe, expect, it } from 'vitest';
import { formatarReais, lerValorDigitado } from './dinheiro';

describe('formatarReais', () => {
  it('mostra centavos no formato brasileiro com separador de milhar', () => {
    expect(formatarReais(123456)).toBe('R$ 1.234,56');
  });
});

describe('formatarReais com valores negativos e pequenos', () => {
  it('estorno aparece com sinal antes do R$', () => {
    expect(formatarReais(-1200)).toBe('-R$ 12,00');
  });
  it('centavos soltos ganham zero à esquerda', () => {
    expect(formatarReais(5)).toBe('R$ 0,05');
  });
});

describe('lerValorDigitado', () => {
  it.each([
    ['300', 30000],
    ['50,5', 5050],
    ['1.234,56', 123456],
    ['R$ 89,90', 8990],
    ['', 0],
    ['abc', 0],
  ])('"%s" vira %i centavos', (texto, esperado) => {
    expect(lerValorDigitado(texto)).toBe(esperado);
  });
});
