// Dados fictícios do protótipo (cenário §18 do PLANEJAMENTO.md). Valores em centavos.
// "Hoje" no protótipo: 04/11/2026, um dia depois do fechamento do Nubank.
const HOJE = '2026-11-04';

const PESSOAS = {
  P: { nome: 'Pedro', classe: 'p', tel: '(11) 90000-0001' },
  B: { nome: 'Bruna', classe: 'b', tel: '(11) 90000-0002' },
  E: { nome: 'Eliete', classe: 'e', tel: '(11) 90000-0003' },
  L: { nome: 'Lucimar', classe: 'l', tel: '(11) 90000-0004' },
};
const CHAVE_PIX = 'bruna@exemplo.com';

const CARTOES = [
  { id: 'nu', apelido: 'Nubank da Bruna', curto: 'Nubank', banco: 'nubank', fecha: 3, vence: 10 },
  { id: 'bb', apelido: 'BB da Bruna', curto: 'BB', banco: 'bb', fecha: 7, vence: 17 },
];

const CATEGORIAS = ['Moradia', 'Contas da casa', 'Mercado', 'Alimentação fora', 'Transporte', 'Saúde', 'Compras pessoais',
  'Lazer', 'Assinaturas', 'Educação', 'Presentes e doações', 'Dívidas e encargos', 'Outros'];

// Logo por loja: a chave é procurada no nome da loja (D9). Sem logo, aparece a inicial.
const LOJA_LOGO = [['nubank','nubank'],['uber','uber'],['drogasil','drogasil'],['magazine luiza','magalu'],['magalu','magalu'],
  ['centauro','centauro'],['ifood','ifood'],['amazon','amazon'],['renner','renner'],['shopee','shopee']];

// Linha: [data, loja, valor, dono, escopo, categoria, parcela "x/y" ou '', extra]
// dono null = sem dono. "alvo" guarda de quem a linha vira no cenário (para o atalho de demonstração).
const L = (d, loja, v, dono, esc, cat, parc = '', extra = {}) => ({ d, loja, v, dono, esc, cat, parc, ...extra });

const FATURAS = {
  'nu-2026-11': {
    cartao: 'nu', mes: '2026-11', fecha: '2026-11-03', vence: '2026-11-10', status: 'Importada', importadaEm: '03/11',
    linhas: [
      // Pedro
      L('2026-10-15', 'Uber *Trip', 2300, null, '', '', '', { pend: 'd1' }),
      L('2026-10-12', 'Centauro', 10000, 'P', 'Pessoal', 'Compras pessoais', '1/3', { compra: '2026-10-12', conc: 'serie' }),
      L('2026-10-20', 'iFood', 4780, null, '', '', '', { pend: 'a1' }),
      L('2026-10-23', 'Uber *Trip', 1890, 'P', 'Pessoal', 'Transporte'),
      L('2026-10-26', 'Amazon', 12240, 'P', 'Casal', 'Moradia'),
      // Eliete (sem dono no começo)
      L('2026-10-09', 'Drogasil', 6240, null, '', '', '', { alvo: 'E' }),
      L('2026-10-16', 'Farmácia Pague Menos', 4160, null, '', '', '', { alvo: 'E' }),
      L('2026-10-24', 'Cacau Show', 5000, null, '', '', '', { alvo: 'E' }),
      // Lucimar
      L('2026-10-04', 'Magazine Luiza', 8000, 'L', '', '', '3/10', { compra: '2026-08-15', conc: 'serie' }),
      L('2026-10-05', 'Farmácia São João', 1290, null, '', '', '', { alvo: 'L' }),
      L('2026-10-10', 'Shopee', 1150, null, '', '', '', { alvo: 'L' }),
      L('2026-10-18', 'Uber *Trip', 760, null, '', '', '', { alvo: 'L' }),
      L('2026-10-22', 'Kalunga', 540, null, '', '', '', { alvo: 'L' }),
      L('2026-10-29', 'Panvel', 850, null, '', '', '', { alvo: 'L' }),
      // Bruna
      L('2026-10-04', 'Pão de Açúcar', 9837, 'B', 'Casal', 'Mercado'),
      L('2026-10-03', 'Drogasil', 5490, 'B', 'Pessoal', 'Saúde'),
      L('2026-10-05', 'iFood', 3890, 'B', 'Casal', 'Alimentação fora'),
      L('2026-10-06', 'Amazon', 9171, 'B', 'Pessoal', 'Compras pessoais', '', { intl: true }),
      L('2026-10-06', 'IOF Amazon', 321, 'B', 'Pessoal', 'Dívidas e encargos', '', { tipo: 'iof', de: 'Amazon' }),
      L('2026-10-07', 'Netflix', 4490, 'B', 'Casal', 'Assinaturas'),
      L('2026-10-07', 'Spotify', 2190, 'B', 'Pessoal', 'Assinaturas'),
      L('2026-10-08', 'Renner', 7990, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-10-09', 'Uber *Trip', 1640, 'B', 'Pessoal', 'Transporte'),
      L('2026-10-11', 'Pão de Açúcar', 7662, 'B', 'Casal', 'Mercado'),
      L('2026-10-11', 'Magazine Luiza', 6650, 'B', 'Pessoal', 'Compras pessoais', '4/6', { compra: '2026-07-11' }),
      L('2026-10-13', 'Drogasil', 2780, 'B', 'Pessoal', 'Saúde'),
      L('2026-10-14', 'Shopee', 3490, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-10-16', 'iFood', 5230, null, '', '', '', { alvo: 'B', alvoEsc: 'Casal', alvoCat: 'Alimentação fora' }),
      L('2026-10-17', 'Centauro', 8990, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-10-18', 'Posto Ipiranga', 9000, 'B', 'Casal', 'Transporte'),
      L('2026-10-19', 'Pão de Açúcar', 9645, 'B', 'Casal', 'Mercado'),
      L('2026-10-20', 'Kalunga', 2350, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-10-21', 'Uber *Trip', 1280, 'B', 'Pessoal', 'Transporte'),
      L('2026-10-22', 'Amazon', 5990, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-10-24', 'Cinemark', 6400, null, '', '', '', { alvo: 'B', alvoEsc: 'Casal', alvoCat: 'Lazer' }),
      L('2026-10-25', 'iFood', 4120, 'B', 'Pessoal', 'Alimentação fora'),
      L('2026-10-26', 'Drogasil', 1890, 'B', 'Pessoal', 'Saúde'),
      L('2026-10-27', 'Pão de Açúcar', 6108, 'B', 'Casal', 'Mercado'),
      L('2026-10-27', 'Renner', 4500, 'B', 'Pessoal', 'Compras pessoais', '2/4', { compra: '2026-09-27' }),
      L('2026-10-28', 'Smart Fit', 9990, 'B', 'Pessoal', 'Saúde'),
      L('2026-10-29', 'Padaria Real', 1460, null, '', '', '', { alvo: 'B', alvoEsc: 'Casal', alvoCat: 'Alimentação fora' }),
      L('2026-10-30', 'Uber *Trip', 2270, 'B', 'Pessoal', 'Transporte'),
      L('2026-10-31', 'Shopee', 1990, null, '', '', '', { alvo: 'B', alvoEsc: 'Pessoal', alvoCat: 'Compras pessoais' }),
      L('2026-11-01', 'Magazine Luiza', 4990, 'B', 'Pessoal', 'Compras pessoais'),
      L('2026-11-01', 'iFood', 3340, 'B', 'Pessoal', 'Alimentação fora'),
      L('2026-11-02', 'Kopenhagen', 1593, 'B', 'Pessoal', 'Presentes e doações'),
      L('2026-11-03', 'Anuidade', 2500, 'B', 'Pessoal', 'Dívidas e encargos', '', { tipo: 'anuidade' }),
    ],
  },
  'bb-2026-11': {
    cartao: 'bb', mes: '2026-11', fecha: '2026-11-07', vence: '2026-11-17', status: 'Aberta',
    linhas: [
      L('2026-10-12', 'Padaria Pão Quente', 1800, 'L', '', ''),
      L('2026-10-20', 'Renner', 6250, 'L', '', '', '1/4', { compra: '2026-10-20', prev: true }),
      L('2026-10-14', 'Posto Ipiranga', 7540, 'P', 'Pessoal', 'Transporte'),
      L('2026-10-15', 'Pão de Açúcar', 21030, 'B', 'Casal', 'Mercado'),
      L('2026-10-22', 'Drogasil', 3990, 'B', 'Pessoal', 'Saúde'),
      L('2026-10-25', 'Magazine Luiza', 23410, 'B', 'Pessoal', 'Compras pessoais', '2/5', { compra: '2026-09-25', prev: true }),
    ],
  },
};

// Total de uma série parcelada (para "faltam" e "restante") = valor da parcela × parcelas, salvo exceções
const DIVIDAS = [
  { id: 'emp', nome: 'Empréstimo Banco Alfa', resp: 'P', titular: 'B', parcela: 35000, atual: 5, total: 24, vence: 10 },
  { id: 'shp', nome: 'Shopee', resp: 'P', titular: 'B', parcela: 7490, atual: 2, total: 6, vence: 10 },
];

// Conciliação da importação Nubank de 03/11
const CONCILIACAO = {
  duplicidades: [
    { id: 'd1', manual: { loja: 'Uber', v: 2300, d: '2026-10-14' }, fatura: { loja: 'UBER *TRIP', v: 2300, d: '2026-10-15' },
      copia: { dono: 'P', esc: 'Pessoal', cat: 'Transporte' }, estado: 'aberta' },
  ],
  ambiguas: [
    { id: 'a1', fatura: { loja: 'IFOOD *IFD', v: 4780, d: '2026-10-20' },
      candidatas: [{ id: 'c1', loja: 'iFood', v: 4780, d: '2026-10-19', dono: 'P', esc: 'Pessoal' },
                   { id: 'c2', loja: 'iFood', v: 4780, d: '2026-10-21', dono: 'B', esc: 'Casal' }], estado: 'aberta' },
  ],
  series: [
    { loja: 'Centauro', parc: '1/3', v: 10000, dono: 'P', nota: 'Tênis lançado pelo Pedro em 12/10. As parcelas 2/3 e 3/3 já estavam previstas.' },
    { loja: 'Magazine Luiza', parc: '3/10', v: 8000, dono: 'L', nota: 'Série que já existia desde a fatura de setembro.' },
    { loja: 'Magazine Luiza', parc: '4/6', v: 6650, dono: 'B', nota: 'Série que já existia.' },
    { loja: 'Renner', parc: '2/4', v: 4500, dono: 'B', nota: 'Série que já existia.' },
  ],
  naoEncontradas: [
    { id: 'n1', loja: 'Curso de inglês', parc: '2/6', v: 4900, dono: 'B', estado: 'aberta' },
  ],
};

// Fechamentos já registrados (pagamentos e envios)
const FECHAMENTOS = {
  '2026-10': { E: { total: 17400, pagos: [{ v: 15400, d: '2026-10-12' }], enviado: '03/10' },
               L: { total: 9850, pagos: [{ v: 9850, d: '2026-10-11' }], enviado: '03/10' },
               P: { total: 70210, pagos: [{ v: 70210, d: '2026-10-09' }], enviado: '03/10' } },
  '2026-11': { E: { pagos: [] }, L: { pagos: [] }, P: { pagos: [] } },
};

const EMAILS = ['pedro@exemplo.com', 'bruna@exemplo.com'];
