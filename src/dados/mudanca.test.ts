import { describe, expect, it } from 'vitest';
import { aplicar, inverter } from './mudanca';
import { marcar, lancarCompra } from './operacoes';
import { retratoCenario, IDS } from './cenario';

describe('desfazer', () => {
  it('aplicar a mudança e depois o inverso volta exatamente ao retrato de antes', () => {
    const antes = retratoCenario();
    for (const m of [
      marcar(antes, ['m-uber'], { pagador: IDS.eliete, escopo: null, categoria: null }),
      lancarCompra(antes, { cartao: IDS.nubank, data: '2026-11-03', descricao: 'Mesa', valorTotal: 10000, parcelas: 3, pagador: IDS.pedro, escopo: 'casal', categoria: null }),
    ]) {
      const depois = aplicar(antes, m);
      expect(depois).not.toEqual(antes);
      expect(aplicar(depois, inverter(antes, m))).toEqual(antes);
    }
  });
});
