// Sugestões pelo histórico, troca de categoria em massa e "devem vir nesta fatura" (pedido de 02/11/2026).
import { describe, expect, it } from 'vitest';
import { lerNubank } from '@/dominio/leitores';
import { aplicar } from './mudanca';
import { aceitarSugestoes, ajustarCompras, dividir, importarFatura, marcar } from './operacoes';
import { categoriaDaLoja, categoriasRecentes, chaveLoja, devemVir, escopoRecente, sugestaoPara, sugestoesDaFatura } from './sugestoes';
import { faturaDe } from './consultas';
import { retratoCenario, cat, IDS } from './cenario';
import type { Retrato } from './tipos';

const importar = (r: Retrato, mes: string, linhas: string[]) => aplicar(r, importarFatura(r, {
  cartao: IDS.nubank, mes, leitura: lerNubank(['date,title,amount', ...linhas].join('\n'), IDS.nubank), formato: 'nubank_csv', arquivoNome: `${mes}.csv`, hoje: `${mes}-05` }).mudanca);
const daLoja = (r: Retrato, loja: string, mes: string) => {
  const f = faturaDe(r, IDS.nubank, mes)!;
  const ids = new Set(r.parcela_cartao.filter(x => x.fatura === f.id).map(x => x.compra));
  return r.compra.filter(c => ids.has(c.id) && c.descricao === loja);
};
const marcarLoja = (r: Retrato, loja: string, mes: string, pagador: string, escopo: 'pessoal' | 'casal' | null, categoria: string | null) =>
  aplicar(r, marcar(r, daLoja(r, loja, mes).map(c => c.id), { pagador, escopo, categoria }));

describe('sugestões pelo histórico', () => {
  let r = importar(retratoCenario(), '2026-12', ['2026-11-07,Netflix.com,44.90', '2026-11-08,Uber *Trip,12.00']);
  r = marcarLoja(r, 'Netflix.com', '2026-12', IDS.bruna, 'casal', cat('Assinaturas'));
  r = marcarLoja(r, 'Uber *Trip', '2026-12', IDS.pedro, 'pessoal', cat('Transporte'));
  r = importar(r, '2027-01', ['2026-12-07,NETFLIX.COM,44.90', '2026-12-09,Uber *Trip,15.00', '2026-12-10,Loja Nova,30.00']);
  r = importar(r, '2027-01', ['2026-12-11,Uber *Trip,9.00']);
  const fJan = faturaDe(r, IDS.nubank, '2027-01')!;

  it('compara o nome da loja sem maiúscula, acento e pontuação', () => {
    expect(chaveLoja('NETFLIX.COM')).toBe(chaveLoja('Netflix.com'));
    expect(chaveLoja('Pão de Açúcar')).toBe('pao de acucar');
  });
  it('sugere pessoa, Pessoal/Casal e categoria da última vez; loja nova não ganha sugestão', () => {
    const s = sugestoesDaFatura(r, fJan.id);
    const netflix = daLoja(r, 'NETFLIX.COM', '2027-01')[0];
    expect(s.get(netflix.id)).toMatchObject({ pagador: IDS.bruna, escopo: 'casal', categoria: cat('Assinaturas') });
    expect(s.has(daLoja(r, 'Loja Nova', '2027-01')[0].id)).toBe(false);
  });
  it('nada é marcado sozinho: a compra continua sem dono até aceitar', () => {
    expect(daLoja(r, 'NETFLIX.COM', '2027-01')[0].pagador ?? null).toBeNull();
  });
  it('aceitar marca todas as sugeridas de uma vez', () => {
    const r2 = aplicar(r, aceitarSugestoes(r, sugestoesDaFatura(r, fJan.id)));
    expect(daLoja(r2, 'NETFLIX.COM', '2027-01')[0]).toMatchObject({ pagador: IDS.bruna, escopo: 'casal', categoria: cat('Assinaturas') });
    expect(daLoja(r2, 'Uber *Trip', '2027-01').every(c => c.pagador === IDS.pedro)).toBe(true);
    expect(daLoja(r2, 'Loja Nova', '2027-01')[0].pagador ?? null).toBeNull();
  });
  it('loja que muda de dono nas duas últimas vezes não ganha sugestão', () => {
    const [u1, u2] = daLoja(r, 'Uber *Trip', '2027-01');
    let r2 = aplicar(r, marcar(r, [u1.id], { pagador: IDS.lucimar, escopo: null, categoria: null }));
    expect(sugestaoPara(r2, u2.id)).toBeNull();
    r2 = aplicar(r2, marcar(r2, [u2.id], { pagador: IDS.pedro, escopo: 'pessoal', categoria: null }));
    expect(sugestaoPara(r2, u2.id)).toBeNull(); // já tem dono
  });
  it('divisão meio a meio da última vez vale para o valor novo', () => {
    let r2 = aplicar(r, dividir(r, daLoja(r, 'Netflix.com', '2026-12').map(c => c.id), { pessoas: [IDS.pedro, IDS.bruna], escopo: null, categoria: cat('Assinaturas') }));
    const nova = daLoja(r2, 'NETFLIX.COM', '2027-01')[0];
    r2 = aplicar(r2, aceitarSugestoes(r2, new Map([[nova.id, sugestaoPara(r2, nova.id)!]])));
    const c = r2.compra.find(x => x.id === nova.id)!;
    expect(c.divisao?.map(p => p.valor)).toEqual([2245, 2245]);
    expect(c.escopo).toBe('casal');
  });
  it('a categoria da loja vem primeiro, mesmo para outra pessoa', () => {
    expect(categoriaDaLoja(r, daLoja(r, 'NETFLIX.COM', '2027-01')[0].id)).toBe(cat('Assinaturas'));
  });
});

describe('lembranças pelo histórico (iguais nos dois celulares)', () => {
  const r = retratoCenario();
  it('categorias recentes da pessoa, da compra mais nova para a mais antiga', () => {
    expect(categoriasRecentes(r, IDS.bruna).slice(0, 3)).toEqual(['Saúde', 'Alimentação fora', 'Mercado']);
  });
  it('Pessoal/Casal da última compra da pessoa', () => {
    expect(escopoRecente(r, IDS.bruna)).toBe('pessoal');
    expect(escopoRecente(r, IDS.eliete)).toBe('pessoal');
  });
});

describe('trocar categoria e Pessoal/Casal de várias linhas', () => {
  it('não mexe na pessoa; Pessoal/Casal só nas de Pedro ou Bruna', () => {
    const r = retratoCenario();
    const ids = ['m-uber', 'b-padaria'];
    const r2 = aplicar(r, ajustarCompras(r, ids, { escopo: 'casal', categoria: cat('Lazer') }));
    const [uber, padaria] = ids.map(id => r2.compra.find(c => c.id === id)!);
    expect(uber).toMatchObject({ pagador: IDS.pedro, escopo: 'casal', categoria: cat('Lazer') });
    expect(padaria).toMatchObject({ pagador: IDS.lucimar, escopo: null, categoria: cat('Lazer') });
  });
  it('só a categoria: o Pessoal/Casal fica como estava', () => {
    const r = retratoCenario();
    const r2 = aplicar(r, ajustarCompras(r, ['b-pao'], { categoria: cat('Lazer') }));
    expect(r2.compra.find(c => c.id === 'b-pao')).toMatchObject({ escopo: 'casal', categoria: cat('Lazer') });
  });
});

describe('devem vir nesta fatura', () => {
  let r = importar(retratoCenario(), '2026-12', ['2026-11-07,Netflix,44.90', '2026-11-08,Spotify,21.90', '2026-11-09,Padaria,8.00']);
  r = importar(r, '2027-01', ['2026-12-07,Netflix,44.90', '2026-12-08,Spotify,23.90', '2026-12-09,Padaria,8.00']);
  r = importar(r, '2027-02', ['2027-01-09,Padaria,8.00']);
  it('mesma loja e mesmo valor nos dois meses anteriores, e ainda não está na fatura', () => {
    expect(devemVir(r, IDS.nubank, '2027-02').map(d => [d.descricao, d.valor])).toEqual([['Netflix', 4490]]);
  });
  it('fatura sem as duas anteriores não mostra nada', () => {
    expect(devemVir(r, IDS.nubank, '2027-01')).toEqual([]);
  });
});
