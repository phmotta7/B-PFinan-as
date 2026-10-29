import { describe, expect, it } from 'vitest';
import { lerNubank, lerCsvGenerico, ErroDeLeitura } from './leitores';

const NUBANK = `date,title,amount
2026-10-03,Drogasil,54.90
2026-10-04,Magazine Luiza - Parcela 3/10,80.00
2026-10-06,Amazon,91.71
2026-10-06,"IOF de ""Amazon""",3.21
2026-10-09,Uber *Trip,16.40
2026-10-09,Uber *Trip,16.40
2026-10-20,Estorno Drogasil,-12.00
2026-11-02,Pagamento recebido,-1950.40
2026-11-03,Anuidade,25.00
`;

describe('lerNubank (§4.4.1)', () => {
  const r = lerNubank(NUBANK, 'nu');
  const porDesc = (d: string) => r.linhas.filter(l => l.descricao === d);

  it('lê data, descrição e valor em centavos, com compra positiva', () => {
    expect(porDesc('Drogasil')[0]).toMatchObject({ data: '2026-10-03', valor: 5490, tipo: 'compra' });
  });
  it('reconhece "Parcela X/Y" e separa o nome da loja', () => {
    expect(porDesc('Magazine Luiza - Parcela 3/10')[0]).toMatchObject({ loja: 'Magazine Luiza', parcela: { atual: 3, total: 10 }, tipo: 'parcela' });
  });
  it('reconhece IOF e diz de qual compra ele é', () => {
    expect(porDesc('IOF de "Amazon"')[0]).toMatchObject({ tipo: 'iof', iofDe: 'Amazon', valor: 321 });
  });
  it('valor negativo que não é pagamento vira estorno', () => {
    expect(porDesc('Estorno Drogasil')[0]).toMatchObject({ tipo: 'estorno', valor: -1200 });
  });
  it('ignora "Pagamento recebido", com o motivo', () => {
    expect(r.linhas.some(l => l.descricao === 'Pagamento recebido')).toBe(false);
    expect(r.ignoradas).toEqual([expect.objectContaining({ descricao: 'Pagamento recebido', motivo: expect.stringContaining('pagamento') })]);
  });
  it('reconhece anuidade como encargo', () => {
    expect(porDesc('Anuidade')[0]).toMatchObject({ tipo: 'anuidade' });
  });
  it('duas linhas iguais no mesmo arquivo ganham impressões digitais diferentes (RN-IM-01)', () => {
    const [a, b] = porDesc('Uber *Trip');
    expect(a.digital).not.toBe(b.digital);
  });
  it('ler o mesmo arquivo de novo gera as mesmas impressões digitais', () => {
    expect(lerNubank(NUBANK, 'nu').linhas.map(l => l.digital)).toEqual(r.linhas.map(l => l.digital));
  });
  it('arquivo de extrato OFX dá um erro que explica o que fazer', () => {
    expect(() => lerNubank('OFXHEADER:100\n<OFX>', 'nu')).toThrow(ErroDeLeitura);
    expect(() => lerNubank('OFXHEADER:100\n<OFX>', 'nu')).toThrow(/extrato/);
  });
  it('arquivo sem as colunas esperadas dá erro dizendo quais faltam', () => {
    expect(() => lerNubank('data;historico\n03/10;x', 'nu')).toThrow(/date, title, amount/);
  });
});

const BB = `Extrato de cartão
Data;Lançamento;Valor (R$);Detalhe
12/10/2026;PADARIA PAO QUENTE;18,00;Compra
20/10/2026;RENNER PARC 01/04;62,50;Parcelado
25/10/2026;MAGAZINE LUIZA PARCELA 2 DE 5;"1.234,10";Parcelado
26/10/2026;ESTORNO LOJA X;-10,00;Crédito
`;

describe('lerCsvGenerico (§4.4.2)', () => {
  const mapa = { colData: 'Data', colDescricao: 'Lançamento', colValor: 'Valor (R$)', formatoData: 'dd/mm/aaaa', decimal: ',', compraPositiva: true, pularLinhas: 1 } as const;
  const r = lerCsvGenerico(BB, 'bb', mapa);

  it('usa o mapeamento de colunas, data dd/mm/aaaa e vírgula decimal com milhar', () => {
    expect(r.linhas[2]).toMatchObject({ data: '2026-10-25', valor: 123410 });
  });
  it('acha parcela nos padrões "PARC 01/04" e "PARCELA 2 DE 5"', () => {
    expect(r.linhas[1].parcela).toEqual({ atual: 1, total: 4 });
    expect(r.linhas[2].parcela).toEqual({ atual: 2, total: 5 });
  });
  it('quando compra vem negativa no banco, inverte o sinal', () => {
    const neg = lerCsvGenerico(BB.replace('18,00', '-18,00'), 'bb', { ...mapa, compraPositiva: false });
    expect(neg.linhas[0].valor).toBe(1800);
  });
  it('linha com valor negativo vira estorno', () => {
    expect(r.linhas[3]).toMatchObject({ tipo: 'estorno', valor: -1000 });
  });
  it('coluna do mapeamento que não existe no arquivo dá erro claro', () => {
    expect(() => lerCsvGenerico(BB, 'bb', { ...mapa, colValor: 'Valor' })).toThrow(/Valor/);
  });
});
