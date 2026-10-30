// Renomear uma compra ("CleberSalvado" vira "iPad") não pode atrapalhar a próxima importação.
import { describe, expect, it } from 'vitest';
import { lerNubank } from '@/dominio/leitores';
import { aplicar, inverter } from './mudanca';
import { importarFatura, salvar } from './operacoes';
import { retratoCenario, IDS } from './cenario';

const NOV = `date,title,amount
2026-10-08,CleberSalvado - Parcela 8/10,228.35
`;
const DEZ = `date,title,amount
2026-11-08,CleberSalvado - Parcela 9/10,228.35
`;

describe('renomear uma compra parcelada', () => {
  it('a parcela do mês seguinte, com o nome do banco, ainda cai na mesma compra', () => {
    let r = retratoCenario();
    r = aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura: lerNubank(NOV, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'nov.csv', hoje: '2026-11-03' }).mudanca);
    const compra = r.compra.find(c => c.descricao === 'CleberSalvado')!;
    expect(r.parcela_cartao.filter(p => p.compra === compra.id && p.status === 'prevista').map(p => p.numero)).toEqual([9, 10]);

    r = aplicar(r, salvar(r, 'compra', { ...compra, descricao: 'iPad' }));
    const antes = r.compra.length;
    r = aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-12', leitura: lerNubank(DEZ, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'dez.csv', hoje: '2026-12-03' }).mudanca);

    expect(r.compra.length).toBe(antes); // nenhuma compra nova: a parcela 9 deu baixa na prevista
    expect(r.parcela_cartao.find(p => p.compra === compra.id && p.numero === 9)?.status).toBe('confirmada');
    expect(r.compra.find(c => c.id === compra.id)!.descricao).toBe('iPad');
  });
  it('Desfazer devolve o nome de antes', () => {
    const r = retratoCenario();
    const compra = r.compra[0];
    const m = salvar(r, 'compra', { ...compra, descricao: 'Nome novo' });
    const depois = aplicar(r, m);
    expect(depois.compra.find(c => c.id === compra.id)!.descricao).toBe('Nome novo');
    expect(aplicar(depois, inverter(r, m)).compra.find(c => c.id === compra.id)!.descricao).toBe(compra.descricao);
  });
});
