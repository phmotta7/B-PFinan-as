import { describe, expect, it } from 'vitest';
import { montarMensagem, linkWhatsApp } from './mensagem';
import type { ItemFatura, ParcelaDivida } from './fechamento';

const it_ = (cartao: string, loja: string, valor: number, data: string, extra: Partial<ItemFatura> = {}): ItemFatura =>
  ({ id: loja + valor, cartao, titular: 'B', pagador: 'L', loja, valor, data, tipo: 'compra', ...extra });
const cartoes = [{ id: 'nu', nome: 'Nubank', vencimento: '2026-11-10' }, { id: 'bb', nome: 'BB', vencimento: '2026-11-17' }];

describe('montarMensagem (§5.3, D2, D12)', () => {
  it('reproduz o exemplo do planejamento, ordenado pela data da compra', () => {
    const itens = [
      it_('nu', 'Farmácia São João', 4590, '2026-10-02'),
      it_('nu', 'Magazine Luiza', 8000, '2026-10-04', { tipo: 'parcela', parcela: { atual: 3, total: 10 }, dataCompra: '2026-08-15' }),
      it_('bb', 'Renner', 6250, '2026-10-20', { tipo: 'parcela', parcela: { atual: 1, total: 4 }, dataCompra: '2026-10-20' }),
      it_('bb', 'Padaria Pão Quente', 1800, '2026-10-12'),
    ];
    expect(montarMensagem({ pessoa: 'Lucimar', mes: '2026-11', cartoes, itens, dividas: [], pago: 0, chavePix: 'chave-da-bruna' })).toBe(
`Resumo Fatura Nov/26 – Lucimar

💳 Nubank (vence 10/11)
• Magazine Luiza – 3/10 – R$ 80,00 – faltam 7x – restante R$ 560,00 (15/08)
• Farmácia São João – R$ 45,90 (02/10)
Subtotal Nubank: R$ 125,90

💳 BB (vence 17/11)
• Padaria Pão Quente – R$ 18,00 (12/10)
• Renner – 1/4 – R$ 62,50 – faltam 3x – restante R$ 187,50 (20/10)
Subtotal BB: R$ 80,50

TOTAL: R$ 206,40
Pix: chave-da-bruna`);
  });

  it('última parcela, estorno e IOF logo abaixo da compra (RN-WA-02, RN-WA-03, D2)', () => {
    const itens = [
      it_('nu', 'Amazon', 9171, '2026-10-06'),
      it_('nu', 'IOF Amazon', 321, '2026-10-06', { tipo: 'iof', iofDe: 'Amazon' }),
      it_('nu', 'Centauro', 10000, '2026-10-05', { tipo: 'parcela', parcela: { atual: 3, total: 3 }, dataCompra: '2026-08-05' }),
      it_('nu', 'Drogasil', -1200, '2026-10-20', { tipo: 'estorno' }),
    ];
    const txt = montarMensagem({ pessoa: 'Eliete', mes: '2026-11', cartoes, itens, dividas: [], pago: 0, chavePix: 'x' });
    expect(txt).toContain(`• Centauro – 3/3 – R$ 100,00 – última parcela (05/08)
• Amazon – R$ 91,71 (06/10)
• IOF Amazon – R$ 3,21 (06/10)
• Estorno Drogasil – -R$ 12,00 (20/10)
Subtotal Nubank: R$ 182,92`);
    expect(txt).not.toContain('BB');
  });

  it('bloco Outros com as dívidas e linhas de pagamento parcial (RN-WA-06, RN-WA-07)', () => {
    const dividas: ParcelaDivida[] = [
      { id: 'e', nome: 'Empréstimo Banco Alfa', responsavel: 'P', titular: 'B', valor: 35000, atual: 5, total: 24 },
      { id: 's', nome: 'Shopee', responsavel: 'P', titular: 'B', valor: 7490, atual: 2, total: 6 },
    ];
    const txt = montarMensagem({ pessoa: 'Pedro', mes: '2026-11', cartoes, itens: [it_('nu', 'Uber', 2300, '2026-10-15')], dividas, pago: 20000, chavePix: 'x' });
    expect(txt).toContain(`📄 Outros
• Empréstimo Banco Alfa – 5/24 – R$ 350,00 – faltam 19x – restante R$ 6.650,00
• Shopee – 2/6 – R$ 74,90 – faltam 4x – restante R$ 299,60
Subtotal Outros: R$ 424,90

Já pago: -R$ 200,00
Falta pagar: R$ 247,90
TOTAL: R$ 447,90`);
  });
});

describe('linkWhatsApp', () => {
  it('abre wa.me com o telefone só em dígitos, com 55 na frente, e o texto codificado', () => {
    expect(linkWhatsApp('(11) 90000-0004', 'TOTAL: R$ 1,00')).toBe('https://wa.me/5511900000004?text=TOTAL%3A%20R%24%201%2C00');
  });
});
