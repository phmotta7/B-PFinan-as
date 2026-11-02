// Excluir um lançamento e remover uma importação que veio errada (pedido de 02/11/2026).
import { describe, expect, it } from 'vitest';
import { lerNubank } from '@/dominio/leitores';
import { aplicar, inverter } from './mudanca';
import { excluirCompra, excluirImportacao, importarFatura, marcar } from './operacoes';
import { faturaDe, linhasDaFatura } from './consultas';
import { retratoCenario, ARQUIVO_NUBANK_NOV, IDS } from './cenario';

const HOJE = '2026-11-03';
const importar = (r = retratoCenario(), arquivo = ARQUIVO_NUBANK_NOV) =>
  aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura: lerNubank(arquivo, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'nov.csv', hoje: HOJE }).mudanca);

describe('remover uma importação', () => {
  it('deixa a fatura como estava antes de importar', () => {
    const antes = retratoCenario();
    let r = importar(antes);
    const c = r.compra.find(x => x.origem === 'importacao' && !x.pagador)!;
    r = aplicar(r, marcar(r, [c.id], { pagador: IDS.alvos[Object.keys(IDS.alvos)[0]].pagador, escopo: null, categoria: null }));
    r = aplicar(r, excluirImportacao(r, r.importacao[0].id));
    const f = faturaDe(r, IDS.nubank, '2026-11')!;
    expect(r.importacao).toHaveLength(0);
    expect(r.linha_importada).toHaveLength(0);
    expect(f.status).toBe('aberta');
    // As compras lançadas à mão continuam, com as parcelas de volta a previstas
    expect(r.compra.map(x => x.id).sort()).toEqual(antes.compra.map(x => x.id).sort());
    expect(linhasDaFatura(r, f.id).map(l => l.valor).sort()).toEqual(linhasDaFatura(antes, faturaDe(antes, IDS.nubank, '2026-11')!.id).map(l => l.valor).sort());
    expect(r.parcela_cartao.every(x => !x.linhaImportada)).toBe(true);
  });
  it('depois de remover, o mesmo arquivo pode ser importado de novo', () => {
    let r = importar();
    r = aplicar(r, excluirImportacao(r, r.importacao[0].id));
    r = importar(r);
    expect(linhasDaFatura(r, faturaDe(r, IDS.nubank, '2026-11')!.id)).toHaveLength(47);
  });
  it('Desfazer traz tudo de volta', () => {
    const r = importar();
    const m = excluirImportacao(r, r.importacao[0].id);
    const volta = aplicar(aplicar(r, m), inverter(r, m));
    expect(volta.compra.length).toBe(r.compra.length);
    expect(volta.parcela_cartao.length).toBe(r.parcela_cartao.length);
    expect(volta.linha_importada.length).toBe(r.linha_importada.length);
  });
});

describe('excluir um lançamento', () => {
  it('compra vinda da fatura sai com todas as parcelas e não volta ao reimportar', () => {
    let r = importar();
    const c = r.compra.find(x => x.origem === 'importacao' && x.parcelas > 1)!;
    r = aplicar(r, excluirCompra(r, c.id));
    expect(r.compra.some(x => x.id === c.id)).toBe(false);
    expect(r.parcela_cartao.some(x => x.compra === c.id)).toBe(false);
    r = importar(r);
    expect(r.compra.some(x => x.descricao === c.descricao && x.parcelas === c.parcelas)).toBe(false);
  });
});
