// Compra dividida entre pessoas: cada uma paga só a sua parte, na fatura, no fechamento e na mensagem do WhatsApp.
import { describe, expect, it } from 'vitest';
import { aplicar } from './mudanca';
import { dividir, marcar } from './operacoes';
import { faturaDe, fechamentosDoMes, linhasDaFatura, mensagemDe, totaisDaFatura } from './consultas';
import { retratoCenario, IDS } from './cenario';

const MES = '2026-11';
function cenario() {
  const r = retratoCenario();
  const f = faturaDe(r, IDS.bb, MES)!;
  const avista = linhasDaFatura(r, f.id).filter(l => l.total === 1 && l.compra.tipo === 'compra');
  const linha = avista.find(l => l.valor % 2 === 1) ?? avista[0]; // de preferência valor ímpar, para sobrar um centavo
  return { r, f, linha };
}
const doPedro = (r: ReturnType<typeof retratoCenario>) => fechamentosDoMes(r, MES, IDS.bruna).find(x => x.pessoa.id === IDS.pedro)!;

describe('dividir uma compra', () => {
  it('meio a meio entre Pedro e Bruna: cada um fica com metade, o centavo que sobra com o primeiro, e vira Casal', () => {
    const { r, linha } = cenario();
    const depois = aplicar(r, dividir(r, [linha.compra.id], { pessoas: [IDS.pedro, IDS.bruna], escopo: null, categoria: null }));
    const c = depois.compra.find(x => x.id === linha.compra.id)!;
    const meio = Math.trunc(linha.valor / 2);
    expect(c.divisao).toEqual([{ pessoa: IDS.pedro, valor: linha.valor - meio }, { pessoa: IDS.bruna, valor: meio }]);
    expect(c).toMatchObject({ pagador: IDS.pedro, escopo: 'casal' });
  });

  it('o total de cada pessoa na fatura e o fechamento do Pedro levam só a parte dele', () => {
    const { r, f, linha } = cenario();
    const r1 = aplicar(r, marcar(r, [linha.compra.id], { pagador: IDS.bruna, escopo: 'pessoal', categoria: null }));
    const antesPedro = totaisDaFatura(linhasDaFatura(r1, f.id)).porPessoa.get(IDS.pedro) ?? 0;
    const antesFech = doPedro(r1).total;
    const r2 = aplicar(r1, dividir(r1, [linha.compra.id], { pessoas: [IDS.pedro, IDS.bruna], escopo: null, categoria: null }));
    const t = totaisDaFatura(linhasDaFatura(r2, f.id));
    const parte = linha.valor - Math.trunc(linha.valor / 2);
    expect((t.porPessoa.get(IDS.pedro) ?? 0) - antesPedro).toBe(parte);
    expect([...t.porPessoa.values()].reduce((s, v) => s + v, 0) + t.valorSemDono + t.valorPendente).toBe(t.total); // nada some nem duplica
    expect(doPedro(r2).total - antesFech).toBe(parte);
  });

  it('a mensagem do WhatsApp diz que é metade e de quanto', () => {
    const { r, linha } = cenario();
    const r2 = aplicar(r, dividir(r, [linha.compra.id], { pessoas: [IDS.pedro, IDS.bruna], escopo: null, categoria: null }));
    const pedro = r2.pessoa.find(p => p.id === IDS.pedro)!;
    const valor = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
    expect(mensagemDe(r2, pedro, MES, IDS.bruna)).toContain(` – metade de ${valor(linha.valor)} (`);
  });

  it('valores escolhidos (70/30) entre Pedro e Eliete: a parte do Pedro segue o Pessoal/Casal escolhido', () => {
    const { r, linha } = cenario();
    const setenta = Math.round(linha.valor * 0.7);
    const r2 = aplicar(r, dividir(r, [linha.compra.id], { pessoas: [IDS.eliete, IDS.pedro], valores: [setenta, linha.valor - setenta], escopo: 'casal', categoria: null }));
    expect(r2.compra.find(x => x.id === linha.compra.id)).toMatchObject({ pagador: IDS.eliete, escopo: 'casal', divisao: [{ pessoa: IDS.eliete, valor: setenta }, { pessoa: IDS.pedro, valor: linha.valor - setenta }] });
  });

  it('marcar para uma pessoa só desfaz a divisão', () => {
    const { r, linha } = cenario();
    const r2 = aplicar(r, dividir(r, [linha.compra.id], { pessoas: [IDS.pedro, IDS.bruna], escopo: null, categoria: null }));
    const r3 = aplicar(r2, marcar(r2, [linha.compra.id], { pagador: IDS.lucimar, escopo: null, categoria: null }));
    expect(r3.compra.find(x => x.id === linha.compra.id)).toMatchObject({ pagador: IDS.lucimar, divisao: null });
  });
});
