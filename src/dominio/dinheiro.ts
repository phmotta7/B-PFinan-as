// Dinheiro sempre em centavos inteiros (PLANEJAMENTO §14). Formato brasileiro: R$ 1.234,56.

export type Centavos = number;

export function formatarReais(valor: Centavos): string {
  const absoluto = Math.abs(valor);
  const reais = Math.floor(absoluto / 100);
  const centavos = String(absoluto % 100).padStart(2, '0');
  const comMilhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}R$ ${comMilhar},${centavos}`;
}

/** Lê o que a pessoa digitou no formato brasileiro ("1.234,56", "50,5", "300"). Texto inválido vira 0. */
export function lerValorDigitado(texto: string): Centavos {
  const limpo = texto.replace(/[^\d,]/g, '');
  if (!limpo) return 0;
  const [inteiro, decimal = ''] = limpo.split(',');
  return (Number(inteiro) || 0) * 100 + Number((decimal + '00').slice(0, 2));
}
