// Divisão de uma compra entre pessoas (decidido com o Pedro em 31/10/2026): "metade é minha, metade é da Bruna".
// A divisão é guardada no valor total da compra; cada parcela é repartida na mesma proporção.
// Centavos que sobram de uma conta que não fecha (R$ 0,01 dividido por 2) ficam com a primeira pessoa da divisão.
import type { Centavos } from './dinheiro';

export type Parte = { pessoa: string; valor: Centavos };

/** Partes iguais de um valor; o centavo que sobra fica com a primeira pessoa. */
export function partesIguais(valor: Centavos, pessoas: string[]): Parte[] {
  if (!pessoas.length) return [];
  const base = Math.trunc(valor / pessoas.length), sobra = valor - base * pessoas.length;
  return pessoas.map((pessoa, i) => ({ pessoa, valor: base + (i === 0 ? sobra : 0) }));
}

/** Reparte um valor (a parcela do mês) na proporção da divisão da compra inteira. */
export function repartir(valor: Centavos, divisao: Parte[]): Parte[] {
  const total = divisao.reduce((s, p) => s + p.valor, 0);
  if (!total) return partesIguais(valor, divisao.map(p => p.pessoa));
  const partes = divisao.map(p => ({ pessoa: p.pessoa, valor: Math.trunc((valor * p.valor) / total) }));
  partes[0].valor += valor - partes.reduce((s, p) => s + p.valor, 0);
  return partes;
}

/** De quem é cada pedaço de uma linha da fatura: a divisão, quando a compra é dividida; senão, o pagador inteiro. */
export function partesDaLinha(compra: { pagador?: string | null; divisao?: Parte[] | null }, valor: Centavos): Parte[] {
  if (compra.divisao && compra.divisao.length > 1) return repartir(valor, compra.divisao);
  return compra.pagador ? [{ pessoa: compra.pagador, valor }] : [];
}

/** A divisão confere com o total da compra? Devolve quanto falta (positivo) ou sobra (negativo). */
export const faltaDividir = (total: Centavos, partes: Parte[]) => total - partes.reduce((s, p) => s + p.valor, 0);
