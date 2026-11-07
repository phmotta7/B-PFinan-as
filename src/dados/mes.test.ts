// Meu mês (2C): contas fixas, lançamento à mão e sobra. O critério de aceite da Etapa 2 (PLANEJAMENTO §16):
// a sobra do Pedro calculada por gastos é igual à calculada por fluxo de caixa (sem dupla contagem).
import { describe, expect, it } from 'vitest';
import { aplicar } from './mudanca';
import { fechamentosDoMes } from './consultas';
import { gravarExtrato, prepararExtrato, sugerir } from './extrato';
import { contaFixaDaLinha, custoDoCasal, fixasDoMes, lancarManual, pagarFixa, sobraDoMes } from './mes';
import { retratoCenario, IDS, cat } from './cenario';
import type { Recorrente, Retrato } from './tipos';
import type { LinhaDoExtrato } from '@/dominio/ofx';

const HOJE = '2026-11-20';
const fixa = (x: Partial<Recorrente>): Recorrente => ({ id: 'rc-luz', pessoa: IDS.pedro, descricao: 'Luz', tipo: 'despesa', valor: 18000, dia: 15, escopo: 'casal', categoria: cat('Contas da casa'), inicio: '2026-11', fim: null, ativo: true, ...x });
const com = (r: Retrato, ...recs: Recorrente[]): Retrato => ({ ...r, recorrente: [...r.recorrente, ...recs] });
const linha = (x: Partial<LinhaDoExtrato>): LinhaDoExtrato => ({ fitid: 'f' + Math.random(), data: '2026-11-15', valor: -18000, descricao: 'Pagamento de conta', tipoBanco: 'DEBIT', ...x });
const importar = (r: Retrato, linhas: LinhaDoExtrato[], conta = '1') => aplicar(r, gravarExtrato(r, prepararExtrato(r, IDS.pedro, { banco: '077', nomeBanco: 'Inter', conta, linhas }), new Map()));

describe('contas fixas do mês', () => {
  it('aparecem como previstas, ficam atrasadas depois do dia e pagas quando um lançamento é ligado', () => {
    let r = com(retratoCenario(), fixa({}));
    expect(fixasDoMes(r, '2026-11', '2026-11-10')[0]).toMatchObject({ data: '2026-11-15', situacao: 'prevista' });
    expect(fixasDoMes(r, '2026-11', HOJE)[0].situacao).toBe('atrasada');
    r = aplicar(r, pagarFixa(r.recorrente[0], 17550, '2026-11-16'));
    expect(fixasDoMes(r, '2026-11', HOJE)[0]).toMatchObject({ situacao: 'paga', pago: expect.objectContaining({ valor: -17550, tipo: 'despesa', escopo: 'casal' }) });
    expect(fixasDoMes(r, '2026-12', HOJE)[0].situacao).toBe('prevista');
  });
  it('dia 31 em mês de 30 dias cai no último dia; fora do início e do fim não aparece', () => {
    const r = com(retratoCenario(), fixa({ dia: 31, fim: '2026-11' }));
    expect(fixasDoMes(r, '2026-11', HOJE)[0].data).toBe('2026-11-30');
    expect(fixasDoMes(r, '2026-12', HOJE)).toEqual([]);
    expect(fixasDoMes(r, '2026-10', HOJE)).toEqual([]);
  });
  it('a linha do extrato que paga a conta fixa é reconhecida (valor ±10%, data ±5 dias; RN-RE-03)', () => {
    const r = com(retratoCenario(), fixa({}));
    expect(contaFixaDaLinha(r, IDS.pedro, { valor: -19000, data: '2026-11-18' })?.id).toBe('rc-luz');
    expect(contaFixaDaLinha(r, IDS.pedro, { valor: -25000, data: '2026-11-15' })).toBeNull();
    expect(contaFixaDaLinha(r, IDS.pedro, { valor: -18000, data: '2026-11-25' })).toBeNull();
    expect(contaFixaDaLinha(r, IDS.bruna, { valor: -18000, data: '2026-11-15' })).toBeNull();
    expect(sugerir(r, IDS.pedro, linha({}))).toMatchObject({ tipo: 'despesa', recorrente: 'rc-luz', categoria: cat('Contas da casa'), escopo: 'casal', motivo: 'Conta fixa: Luz' });
  });
  it('gravar o extrato liga a conta fixa; uma segunda linha no mesmo mês não paga de novo', () => {
    let r = importar(com(retratoCenario(), fixa({})), [linha({})]);
    expect(fixasDoMes(r, '2026-11', HOJE)[0].situacao).toBe('paga');
    expect(contaFixaDaLinha(r, IDS.pedro, { valor: -18000, data: '2026-11-16' })).toBeNull();
    r = aplicar(r, lancarManual({ pessoa: IDS.pedro, tipo: 'despesa', valor: 100, data: '2026-11-16', descricao: 'x', escopo: 'pessoal', categoria: null }));
    expect(r.lancamento.at(-1)).toMatchObject({ valor: -100, origem: 'manual', conta: null });
  });
});

describe('sobra do mês', () => {
  it('soma cartão, extrato e dívida paga pelo fechamento; contas fixas abertas só na previsão', () => {
    let r = com(retratoCenario(), fixa({}), fixa({ id: 'rc-sal', descricao: 'Salário', tipo: 'receita', valor: 500000, dia: 5, escopo: 'pessoal', categoria: 'rec-0' }));
    r = aplicar(r, lancarManual({ pessoa: IDS.pedro, tipo: 'despesa', valor: 5000, data: '2026-11-08', descricao: 'Feira', escopo: 'pessoal', categoria: cat('Mercado') }));
    const s = sobraDoMes(r, '2026-11', IDS.pedro, HOJE);
    expect(s.extrato).toBe(5000);
    expect(s.dividas).toBe(35000 + 7490); // empréstimo e Shopee, no cartão da Bruna, pagos pelo Pedro no fechamento
    expect(s.cartao).toBeGreaterThan(0);
    expect(s.receitas).toBe(0);
    expect(s.receitasPrevistas).toBe(500000);
    expect(s.fixasPrevistas).toBe(18000);
    expect(s.sobraAteAgora).toBe(-s.gastos);
    expect(s.sobraPrevista).toBe(500000 - s.gastos - 18000);
    expect(s.paraOCasal).toBeGreaterThanOrEqual(18000);
  });
  it('a Bruna, titular, não conta como gasto dela a dívida que o Pedro paga', () => {
    expect(sobraDoMes(retratoCenario(), '2026-11', IDS.bruna, HOJE).dividas).toBe(0);
  });
  it('critério de aceite: sobra por gastos = sobra por fluxo de caixa (sem dupla contagem)', () => {
    let r = retratoCenario();
    const fechamento = fechamentosDoMes(r, '2026-11', IDS.bruna).find(f => f.pessoa.id === IDS.pedro)!.total;
    // Inter: salário entra, metade vai para o Nubank. Nubank: mercado no débito e o Pix do fechamento para a Bruna.
    r = importar(r, [
      linha({ fitid: 'i1', data: '2026-11-05', valor: 500000, descricao: 'Pix recebido: "EMPRESA LTDA"', contraparte: 'Empresa Ltda' }),
      linha({ fitid: 'i2', data: '2026-11-06', valor: -250000, descricao: 'Pix enviado', contraparte: 'Pedro Henrique' }),
    ], 'inter');
    r = importar(r, [
      linha({ fitid: 'n1', data: '2026-11-06', valor: 250000, descricao: 'Transferência recebida pelo Pix - PEDRO HENRIQUE - BANCO INTER', contraparte: 'PEDRO HENRIQUE' }),
      linha({ fitid: 'n2', data: '2026-11-07', valor: -9758, descricao: 'Compra no débito - FORT ATACADISTA' }),
      linha({ fitid: 'n3', data: '2026-11-08', valor: -fechamento, descricao: 'Transferência enviada pelo Pix - Bruna Exemplo', contraparte: 'Bruna Exemplo' }),
    ], 'nubank');
    expect(r.lancamento.map(l => l.tipo)).toEqual(['receita', 'transferencia_propria', 'transferencia_propria', 'despesa', 'pagamento_fechamento']);
    const caixa = r.lancamento.filter(l => l.pessoa === IDS.pedro && l.tipo !== 'transferencia_propria').reduce((s, l) => s + l.valor, 0);
    const s = sobraDoMes(r, '2026-11', IDS.pedro, HOJE);
    expect(s.sobraAteAgora).toBe(caixa);
    expect(fechamentosDoMes(r, '2026-11', IDS.bruna).find(f => f.pessoa.id === IDS.pedro)!.emAberto).toBe(0);
  });
  it('custo do Casal mostra quanto cada um pôs', () => {
    const c = custoDoCasal(retratoCenario(), '2026-11', HOJE);
    expect(c.total).toBe([...c.porPessoa.values()].reduce((s, v) => s + v, 0));
    expect(c.porPessoa.get(IDS.bruna)).toBeGreaterThan(0);
  });
});
