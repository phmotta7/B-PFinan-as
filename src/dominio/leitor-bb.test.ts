import { describe, expect, it } from 'vitest';
import { lerBbPdf, lojaDoBb, ErroDeLeitura, type ItemPdf } from './leitores';

// Fatura fictícia no mesmo desenho do PDF do Ourocard: duas colunas na página 1, a cidade na linha de baixo,
// títulos de categoria entre as compras, e uma página de "lançamentos em processamento" no fim.
const L = (pagina: number, y: number, pedacos: [number, string][]): ItemPdf[] => pedacos.map(([x, texto]) => ({ pagina, x, y, texto }));
const DIR = 283; // a coluna da direita começa 283 pontos depois da da esquerda
const d = (p: [number, string][]) => p.map(([x, t]) => [x + DIR, t] as [number, string]);

const FATURA: ItemPdf[] = [
  ...L(1, 716, [[20, '> Cartão']]), ...L(1, 697, [[31, 'OUROCARD FACIL VISA']]),
  ...L(1, 618, [[31, '• As transações efetuadas em moeda estrangeira foram convertidas pela cotação']]),
  ...L(1, 569, [[20, 'Lançamentos Futuros']]),
  ...L(1, 522, [[26, 'Data'], [54, 'Transações'], [189, 'País'], [214, 'Moeda'], [256, 'Valor'], [309, 'Data'], [337, 'Transações'], [472, 'País'], [497, 'Moeda'], [539, 'Valor']]),
  ...L(1, 502, [[53, 'Pagamentos/Créditos'], [336, 'Compras Diversas']]),
  ...L(1, 479, [[24, '13/10'], [53, 'PGTO DEBITO CONTA 1234'], [220, 'R$'], [257, '-1.000,00'], ...d([[24, '05/10'], [53, 'MERCADO EXEMPLO 12'], [121, 'CAMPO'], [220, 'R$'], [269, '74,19']])]),
  ...L(1, 467, [[53, '000000001 100'], ...d([[53, 'GRANDE']])]),
  ...L(1, 457, d([[24, '06/07'], [53, 'LOJA PARCELADA PARC 04/08'], [220, 'R$'], [266, '153,10']])),
  ...L(1, 445, d([[53, 'FRANCA']])),
  ...L(1, 435, [[53, 'Compras Diversas']]),
  ...L(1, 412, [[24, '01/10'], [53, 'PIX -'], [74, 'FULANO DE TAL'], [220, 'R$'], [266, '150,00'], ...d([[24, '07/10'], [53, 'DL'], [81, '*UberRides Sao Paulo'], [220, 'R$'], [273, '17,93']])]),
  ...L(1, 400, [[53, 'SOBRENOME']]),
  ...L(1, 390, [[24, '01/10'], [53, 'IOF DIARIO SAQUE PIX'], [220, 'R$'], [273, '0,49'], ...d([[24, '07/10'], [53, 'LOJA DE FORA'], [214, 'US$'], [269, '12,00']])]),
  ...L(1, 379, [[24, '01/10'], [53, 'JUROS SAQUE PIX'], [220, 'R$'], [273, '9,01']]),
  ...L(1, 368, [[24, '31/08'], [53, 'LOJA ONLINE PARC 02/04 SAO'], [220, 'R$'], [266, '208,24']]),
  ...L(1, 357, [[53, 'PAULO']]),
  ...L(1, 335, [[24, '04/10'], [53, 'FEIRA EXEMPLO'], [220, 'R$'], [269, '44,66']]),
  ...L(1, 303, [[53, 'Restaurantes'], ...d([[53, 'Restaurantes']])]),
  ...L(1, 280, [[24, '04/10'], [53, 'IFD*iFood'], [112, 'OSASCO'], [220, 'R$'], [269, '12,49']]),
  ...L(1, 63, [[20, 'Banco do Brasil S.A.'], [101, '- CNPJ']]),
  ...L(2, 816, [[26, 'Data'], [54, 'Transações'], [189, 'País'], [214, 'Moeda'], [256, 'Valor']]),
  ...L(2, 773, [[24, '09/10'], [53, 'SALAO EXEMPLO'], [220, 'R$'], [269, '56,00']]),
  ...L(2, 761, [[53, 'CAMPO GRANDE']]),
  ...L(2, 751, [[24, '09/10'], [53, 'SALAO EXEMPLO'], [220, 'R$'], [269, '56,00']]),
  ...L(3, 813, [[20, 'Lançamentos em processamento']]),
  ...L(3, 766, [[26, 'Data'], [54, 'Descrição'], [256, 'Valor']]),
  ...L(3, 723, [[24, '27/10'], [53, 'HOTEL EXEMPLO'], [266, '461,42']]),
];

describe('lerBbPdf (fatura do BB em PDF)', () => {
  const r = lerBbPdf(FATURA, 'bb', '2026-10-30');
  const de = (loja: string) => r.linhas.filter(l => l.loja === loja);

  it('lê as duas colunas da página e as páginas seguintes', () => {
    expect(r.linhas.map(l => l.loja)).toEqual(['PIX - FULANO DE TAL', 'IOF DIARIO SAQUE PIX', 'JUROS SAQUE PIX', 'LOJA ONLINE', 'FEIRA EXEMPLO', 'iFood',
      'MERCADO EXEMPLO 12', 'LOJA PARCELADA', 'Uber', 'SALAO EXEMPLO', 'SALAO EXEMPLO']);
  });
  it('junta a linha de baixo (cidade ou resto do nome) à descrição, mas não o título de categoria', () => {
    expect(de('PIX - FULANO DE TAL')[0].descricao).toBe('PIX - FULANO DE TAL SOBRENOME');
    expect(de('MERCADO EXEMPLO 12')[0].descricao).toBe('MERCADO EXEMPLO 12 CAMPO GRANDE');
    expect(de('FEIRA EXEMPLO')[0].descricao).toBe('FEIRA EXEMPLO');
  });
  it('tira a cidade do nome da loja', () => {
    expect(de('iFood')[0].descricao).toBe('IFD*iFood OSASCO');
  });
  it('reconhece a parcela e deixa a loja sem a cidade que vem depois do PARC', () => {
    expect(de('LOJA ONLINE')[0]).toMatchObject({ tipo: 'parcela', parcela: { atual: 2, total: 4 }, valor: 20824, data: '2026-08-31' });
    expect(de('LOJA PARCELADA')[0]).toMatchObject({ parcela: { atual: 4, total: 8 }, data: '2026-07-06' });
  });
  it('lê valor brasileiro em centavos e reconhece IOF e juros', () => {
    expect(de('MERCADO EXEMPLO 12')[0]).toMatchObject({ valor: 7419, tipo: 'compra', data: '2026-10-05' });
    expect(de('IOF DIARIO SAQUE PIX')[0].tipo).toBe('iof');
    expect(de('JUROS SAQUE PIX')[0].tipo).toBe('juros');
  });
  it('separa o pagamento, a compra em outra moeda e o que ainda está em processamento, dizendo o motivo', () => {
    expect(r.ignoradas.map(l => [l.descricao, l.motivo.split('.')[0]])).toEqual([
      ['PGTO DEBITO CONTA 1234 000000001 100', 'É o pagamento da fatura, não uma compra'],
      ['LOJA DE FORA', 'Valor em US$'],
      ['HOTEL EXEMPLO', 'Ainda em processamento no banco'],
    ]);
  });
  it('compras iguais no mesmo dia ganham impressões digitais diferentes (RN-IM-01)', () => {
    const [a, b] = de('SALAO EXEMPLO');
    expect(a.digital).not.toBe(b.digital);
  });
  it('liga o IOF do saque Pix ao saque do mesmo dia, para ir para quem sacou (§4.7)', () => {
    expect(de('IOF DIARIO SAQUE PIX')[0].iofDe).toBe('PIX - FULANO DE TAL');
  });
  it('data mais de 45 dias à frente é do ano passado', () => {
    const virada = lerBbPdf([...L(1, 700, [[20, 'OUROCARD']]), ...L(1, 600, [[26, 'Data'], [256, 'Valor']]), ...L(1, 500, [[24, '20/12'], [53, 'LOJA'], [220, 'R$'], [269, '10,00']])], 'bb', '2027-01-10');
    expect(virada.linhas[0].data).toBe('2026-12-20');
  });
  it('recusa um PDF que não é do BB', () => {
    expect(() => lerBbPdf(L(1, 500, [[24, 'Fatura de outro banco']]), 'bb', '2026-10-30')).toThrow(ErroDeLeitura);
  });
});

describe('lojaDoBb (nome da loja como a pessoa reconhece)', () => {
  it('troca o nome do intermediário pela marca conhecida', () => {
    expect(lojaDoBb('DL *UberRides Sao Paulo')).toBe('Uber');
    expect(lojaDoBb('DL*UberRides')).toBe('Uber');
    expect(lojaDoBb('IFD*iFood')).toBe('iFood');
    expect(lojaDoBb('MAGALU*Magalu')).toBe('Magalu');
    expect(lojaDoBb('Globo Globoplay')).toBe('Globoplay');
  });
  it('nos marketplaces, guarda a loja e o vendedor', () => {
    expect(lojaDoBb('SHOPEE *Viane')).toBe('Shopee · Viane');
    expect(lojaDoBb('SHEIN *SHEIN')).toBe('Shein');
  });
  it('tira o intermediário do pagamento da frente do nome', () => {
    expect(lojaDoBb('MP*RCORTINTAS')).toBe('RCORTINTAS');
    expect(lojaDoBb('CAPPTA *DRY CAPAS')).toBe('DRY CAPAS');
    expect(lojaDoBb('JIM.COM 58245')).toBe('JIM.COM 58245');
  });
  it('tira o começo da cidade colado no fim, quando a linha de baixo completa a cidade', () => {
    expect(lojaDoBb('JIM.COM PAZ TENIS E BEACAMPO', 'GRANDE')).toBe('PAZ TENIS E BEA');
    expect(lojaDoBb('ASSAI ATACADISTA LJ24 CAMPO', 'GRANDE')).toBe('ASSAI ATACADISTA LJ24');
    expect(lojaDoBb('SAMUEL NUNES MONTEIRO', 'CAMPO GRANDE')).toBe('SAMUEL NUNES MONTEIRO');
  });
  it('não confunde nome de lugar com a marca', () => {
    expect(lojaDoBb('SUPERMERCADO UBERLANDIA')).toBe('SUPERMERCADO UBERLANDIA');
  });
});
