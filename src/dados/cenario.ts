// Cenário fictício de novembro/26 (PLANEJAMENTO §18): usado nos testes de aceite e no modo demonstração.
import { retratoVazio, type Compra, type ParcelaCartao, type Retrato, type Escopo } from './tipos';
import { datasDaFatura, faturaDaCompra, somarMeses, type Mes } from '@/dominio/ciclo';
import { dividirEmParcelas } from '@/dominio/parcelas';

export const IDS = {
  casa: 'casa', pedro: 'p-pedro', bruna: 'p-bruna', eliete: 'p-eliete', lucimar: 'p-lucimar',
  nubank: 'c-nubank', bb: 'c-bb', ifoodPedro: 'm-ifood-pedro',
  alvos: {} as Record<string, { pagador: string; escopo?: Escopo; categoria?: string }>,
};
const CATS = ['Moradia', 'Contas da casa', 'Mercado', 'Alimentação fora', 'Transporte', 'Saúde', 'Compras pessoais', 'Lazer', 'Assinaturas', 'Educação', 'Presentes e doações', 'Dívidas e encargos', 'Outros'];
export const cat = (nome: string) => 'cat-' + CATS.indexOf(nome);

// Linhas do arquivo do Nubank (fatura Nov/26) e de quem cada uma é no fim do cenário
type L = [data: string, titulo: string, valor: number, dono: 'P' | 'B' | 'E' | 'L', escopo?: Escopo, categoria?: string];
const LINHAS_NU: L[] = [
  ['2026-10-15', 'Uber *Trip', 2300, 'P'], ['2026-10-12', 'Centauro - Parcela 1/3', 10000, 'P'], ['2026-10-20', 'IFOOD *IFD', 4780, 'P'],
  ['2026-10-23', 'Uber *Trip', 1890, 'P', 'pessoal', 'Transporte'], ['2026-10-26', 'Amazon', 12240, 'P', 'casal', 'Moradia'],
  ['2026-10-09', 'Drogasil', 6240, 'E'], ['2026-10-16', 'Farmácia Pague Menos', 4160, 'E'], ['2026-10-24', 'Cacau Show', 5000, 'E'],
  ['2026-10-04', 'Magazine Luiza - Parcela 3/10', 8000, 'L'], ['2026-10-05', 'Farmácia São João', 1290, 'L'], ['2026-10-10', 'Shopee', 1150, 'L'],
  ['2026-10-18', 'Uber *Trip', 760, 'L'], ['2026-10-22', 'Kalunga', 540, 'L'], ['2026-10-29', 'Panvel', 850, 'L'],
  ['2026-10-04', 'Pão de Açúcar', 9837, 'B', 'casal', 'Mercado'], ['2026-10-03', 'Drogasil', 5490, 'B', 'pessoal', 'Saúde'],
  ['2026-10-05', 'iFood', 3890, 'B', 'casal', 'Alimentação fora'], ['2026-10-06', 'Amazon', 9171, 'B', 'pessoal', 'Compras pessoais'],
  ['2026-10-06', 'IOF de "Amazon"', 321, 'B', 'pessoal', 'Dívidas e encargos'], ['2026-10-07', 'Netflix', 4490, 'B', 'casal', 'Assinaturas'],
  ['2026-10-07', 'Spotify', 2190, 'B', 'pessoal', 'Assinaturas'], ['2026-10-08', 'Renner', 7990, 'B', 'pessoal', 'Compras pessoais'],
  ['2026-10-09', 'Uber *Trip', 1640, 'B', 'pessoal', 'Transporte'], ['2026-10-11', 'Pão de Açúcar', 7662, 'B', 'casal', 'Mercado'],
  ['2026-10-11', 'Magazine Luiza - Parcela 4/6', 6650, 'B'], ['2026-10-13', 'Drogasil', 2780, 'B', 'pessoal', 'Saúde'],
  ['2026-10-14', 'Shopee', 3490, 'B', 'pessoal', 'Compras pessoais'], ['2026-10-16', 'iFood', 5230, 'B', 'casal', 'Alimentação fora'],
  ['2026-10-17', 'Centauro', 8990, 'B', 'pessoal', 'Compras pessoais'], ['2026-10-18', 'Posto Ipiranga', 9000, 'B', 'casal', 'Transporte'],
  ['2026-10-19', 'Pão de Açúcar', 9645, 'B', 'casal', 'Mercado'], ['2026-10-20', 'Kalunga', 2350, 'B', 'pessoal', 'Compras pessoais'],
  ['2026-10-21', 'Uber *Trip', 1280, 'B', 'pessoal', 'Transporte'], ['2026-10-22', 'Amazon', 5990, 'B', 'pessoal', 'Compras pessoais'],
  ['2026-10-24', 'Cinemark', 6400, 'B', 'casal', 'Lazer'], ['2026-10-25', 'iFood', 4120, 'B', 'pessoal', 'Alimentação fora'],
  ['2026-10-26', 'Drogasil', 1890, 'B', 'pessoal', 'Saúde'], ['2026-10-27', 'Pão de Açúcar', 6108, 'B', 'casal', 'Mercado'],
  ['2026-10-27', 'Renner - Parcela 2/4', 4500, 'B'], ['2026-10-28', 'Smart Fit', 9990, 'B', 'pessoal', 'Saúde'],
  ['2026-10-29', 'Padaria Real', 1460, 'B', 'casal', 'Alimentação fora'], ['2026-10-30', 'Uber *Trip', 2270, 'B', 'pessoal', 'Transporte'],
  ['2026-10-31', 'Shopee', 1990, 'B', 'pessoal', 'Compras pessoais'], ['2026-11-01', 'Magazine Luiza', 4990, 'B', 'pessoal', 'Compras pessoais'],
  ['2026-11-01', 'iFood', 3340, 'B', 'pessoal', 'Alimentação fora'], ['2026-11-02', 'Kopenhagen', 1593, 'B', 'pessoal', 'Presentes e doações'],
  ['2026-11-03', 'Anuidade', 2500, 'B', 'pessoal', 'Dívidas e encargos'],
];
const csv = (s: string) => (/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export const ARQUIVO_NUBANK_NOV = ['date,title,amount', ...LINHAS_NU.map(([d, t, v]) => `${d},${csv(t)},${(v / 100).toFixed(2)}`), '2026-11-02,Pagamento recebido,-1950.40'].join('\n') + '\n';

const P = { P: IDS.pedro, B: IDS.bruna, E: IDS.eliete, L: IDS.lucimar };
for (const [, t, v, dono, escopo, categoria] of LINHAS_NU) {
  const loja = t.replace(/\s*-\s*Parcela.*$/, '');
  IDS.alvos[`${loja}|${v}`] = { pagador: P[dono], escopo: dono === 'P' || dono === 'B' ? escopo ?? 'pessoal' : undefined, categoria: categoria ? cat(categoria) : undefined };
}

export function retratoCenario(): Retrato {
  const r = retratoVazio();
  r.pessoa.push(
    { id: IDS.pedro, nome: 'Pedro', tipo: 'usuario', cor: '#56b4e9', telefoneWhatsapp: '(11) 90000-0001', chavePix: null },
    { id: IDS.bruna, nome: 'Bruna', tipo: 'usuario', cor: '#bd4a87', telefoneWhatsapp: '(11) 90000-0002', chavePix: 'bruna@exemplo.com' },
    { id: IDS.eliete, nome: 'Eliete', tipo: 'participante', cor: '#054836', telefoneWhatsapp: '(11) 90000-0003', chavePix: null },
    { id: IDS.lucimar, nome: 'Lucimar', tipo: 'participante', cor: '#e69f00', telefoneWhatsapp: '(11) 90000-0004', chavePix: null },
  );
  r.usuario_autorizado.push({ id: 'u1', email: 'pedro@exemplo.com', pessoa: IDS.pedro }, { id: 'u2', email: 'bruna@exemplo.com', pessoa: IDS.bruna });
  CATS.forEach((nome, i) => r.categoria.push({ id: cat(nome), nome, tipo: 'despesa', ordem: i + 1, ativa: true }));
  r.cartao.push(
    { id: IDS.nubank, apelido: 'Nubank da Bruna', banco: 'nubank', titular: IDS.bruna, diaFechamento: 3, diaVencimento: 10, ativo: true },
    { id: IDS.bb, apelido: 'BB da Bruna', banco: 'bb', titular: IDS.bruna, diaFechamento: 7, diaVencimento: 17, ativo: true },
  );
  r.divida.push(
    { id: 'd-emp', nome: 'Empréstimo Banco Alfa', tipo: 'emprestimo', titular: IDS.bruna, responsavel: IDS.pedro, escopo: 'pessoal', valorParcela: 35000, parcelaAtual: 5, mesParcelaAtual: '2026-11', totalParcelas: 24, diaVencimento: 10, situacao: 'ativa' },
    { id: 'd-shp', nome: 'Shopee', tipo: 'parcelamento_externo', titular: IDS.bruna, responsavel: IDS.pedro, escopo: 'pessoal', valorParcela: 7490, parcelaAtual: 2, mesParcelaAtual: '2026-11', totalParcelas: 6, diaVencimento: 10, situacao: 'ativa' },
  );

  // Compras lançadas no app antes da importação (manuais e séries de faturas anteriores)
  const fat = (cartao: string, mes: Mes) => {
    let f = r.fatura.find(x => x.cartao === cartao && x.mes === mes);
    if (!f) {
      const c = r.cartao.find(x => x.id === cartao)!;
      const d = datasDaFatura(c, mes);
      f = { id: `f-${cartao}-${mes}`, cartao, mes, dataFechamento: d.fechamento, dataVencimento: d.vencimento, status: mes < '2026-11' ? 'importada' : 'aberta' };
      r.fatura.push(f);
    }
    return f.id;
  };
  const compra = (id: string, cartao: string, data: string, descricao: string, total: number, n: number, dono: string, escopo: Escopo | null, categoria: string | null, origem: Compra['origem'], confirmadasAte = 0) => {
    const c = r.cartao.find(x => x.id === cartao)!;
    r.compra.push({ id, cartao, data, descricao, valorTotal: total, parcelas: n, tipo: 'compra', pagador: dono, escopo, categoria, origem, conciliada: confirmadasAte > 0 });
    const m1 = faturaDaCompra(c, data);
    dividirEmParcelas(total, n).forEach((valor, i) => {
      const p: ParcelaCartao = { id: `${id}-${i + 1}`, compra: id, fatura: fat(cartao, somarMeses(m1, i)), numero: i + 1, valor, status: i < confirmadasAte ? 'confirmada' : 'prevista' };
      r.parcela_cartao.push(p);
    });
  };
  compra('m-uber', IDS.nubank, '2026-10-14', 'Uber', 2300, 1, IDS.pedro, 'pessoal', cat('Transporte'), 'manual');
  compra('m-tenis', IDS.nubank, '2026-10-12', 'Tênis Centauro', 30000, 3, IDS.pedro, 'pessoal', cat('Compras pessoais'), 'manual');
  compra(IDS.ifoodPedro, IDS.nubank, '2026-10-19', 'iFood', 4780, 1, IDS.pedro, 'pessoal', cat('Alimentação fora'), 'manual');
  compra('m-ifood-bruna', IDS.nubank, '2026-10-21', 'iFood', 4780, 1, IDS.bruna, 'casal', cat('Alimentação fora'), 'manual');
  compra('s-magalu-luc', IDS.nubank, '2026-08-15', 'Magazine Luiza', 80000, 10, IDS.lucimar, null, null, 'importacao', 2);
  compra('s-magalu-bru', IDS.nubank, '2026-07-11', 'Magazine Luiza', 39900, 6, IDS.bruna, 'pessoal', cat('Compras pessoais'), 'importacao', 3);
  compra('s-renner-bru', IDS.nubank, '2026-09-27', 'Renner', 18000, 4, IDS.bruna, 'pessoal', cat('Compras pessoais'), 'importacao', 1);
  compra('s-curso', IDS.nubank, '2026-09-08', 'Curso de inglês', 29400, 6, IDS.bruna, 'pessoal', cat('Educação'), 'importacao', 1);
  compra('o-eliete', IDS.nubank, '2026-09-20', 'Drogasil', 17400, 1, IDS.eliete, null, null, 'importacao', 1); // fatura Out/26
  // BB: fatura Nov/26 ainda aberta, só com lançamentos do app
  compra('b-padaria', IDS.bb, '2026-10-12', 'Padaria Pão Quente', 1800, 1, IDS.lucimar, null, null, 'manual');
  compra('b-renner', IDS.bb, '2026-10-20', 'Renner', 25000, 4, IDS.lucimar, null, null, 'manual');
  compra('b-posto', IDS.bb, '2026-10-14', 'Posto Ipiranga', 7540, 1, IDS.pedro, 'pessoal', cat('Transporte'), 'manual');
  compra('b-pao', IDS.bb, '2026-10-15', 'Pão de Açúcar', 21030, 1, IDS.bruna, 'casal', cat('Mercado'), 'manual');
  compra('b-droga', IDS.bb, '2026-10-22', 'Drogasil', 3990, 1, IDS.bruna, 'pessoal', cat('Saúde'), 'manual');
  compra('b-magalu', IDS.bb, '2026-09-25', 'Magazine Luiza', 117050, 5, IDS.bruna, 'pessoal', cat('Compras pessoais'), 'importacao', 1);

  // Fechamentos de outubro, para "A receber"
  r.fechamento.push(
    { id: 'fe-out-e', devedor: IDS.eliete, credor: IDS.bruna, mes: '2026-10', enviadoEm: '2026-10-03' },
  );
  r.pagamento_fechamento.push({ id: 'pg-out-e', fechamento: 'fe-out-e', valor: 15400, data: '2026-10-12' });
  return r;
}
