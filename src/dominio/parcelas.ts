import type { Centavos } from './dinheiro';

/** RN-CA-11: valor ÷ n arredondado para baixo no centavo; a diferença vai para a 1ª parcela. */
export function dividirEmParcelas(total: Centavos, n: number): Centavos[] {
  if (!Number.isInteger(n) || n < 1) throw new Error('Número de parcelas precisa ser inteiro e maior que zero.');
  const base = Math.floor(total / n);
  const resto = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + resto : base));
}
