// Importação de extrato (2B): sugestões, reimportação, transferência entre contas próprias e Pix que paga o fechamento.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodificarOfx, lerOfx, type Extrato, type LinhaDoExtrato } from '@/dominio/ofx';
import { aplicar } from './mudanca';
import { alterarLancamento, apagarLancamentos, gravarExtrato, prepararExtrato, sugerir } from './extrato';
import { fechamentosDoMes } from './consultas';
import { retratoCenario, IDS, cat } from './cenario';
import type { Retrato } from './tipos';

const arquivo = (nome: string) => lerOfx(decodificarOfx(readFileSync(join(process.cwd(), 'design/exemplos', nome))));
const NOV = arquivo('Nubank_conta_2026-11_ficticio.ofx'), INTER = arquivo('Inter_conta_30d_ficticio.ofx');
const importar = (r: Retrato, e: Extrato = NOV, dono = IDS.pedro) => aplicar(r, gravarExtrato(r, prepararExtrato(r, dono, e), new Map()));
const linha = (x: Partial<LinhaDoExtrato>): LinhaDoExtrato => ({ fitid: 'x', data: '2026-11-06', valor: -1000, descricao: '', tipoBanco: 'DEBIT', ...x });
const sug = (e: Extrato, re: RegExp) => sugerir(retratoCenario(), IDS.pedro, e.linhas.find(l => re.test(l.descricao))!);
const emAberto = (r: Retrato) => fechamentosDoMes(r, '2026-11', IDS.bruna).find(f => f.pessoa.id === IDS.pedro)!.emAberto;
const pix = (x: Partial<LinhaDoExtrato>): LinhaDoExtrato => linha({ fitid: 'p1', valor: -10000, descricao: 'Transferência enviada pelo Pix - Bruna Exemplo Teste', contraparte: 'Bruna Exemplo Teste', ...x });
const so = (linhas: LinhaDoExtrato[], banco = '0260', conta = '1'): Extrato => ({ banco, nomeBanco: '', conta, linhas });

describe('sugestão de cada linha (nada é gravado sem a pessoa ver)', () => {
  it('Pix para outra conta da mesma pessoa não é gasto nem receita', () => {
    expect(sug(NOV, /recebida pelo Pix - PEDRO/).tipo).toBe('transferencia_propria');
    expect(sug(INTER, /Pix enviado: "Cp :18236120-Pedro/).tipo).toBe('transferencia_propria');
  });
  it('Pix vindo de conta no Nubank ("NU PAGAMENTOS") não é pagamento de cartão', () =>
    expect(sug(NOV, /Transferência Recebida - Bruna/).tipo).toBe('transferencia'));
  it('compra no débito é gasto pessoal', () => expect(sug(NOV, /BURGER KING/)).toMatchObject({ tipo: 'despesa', escopo: 'pessoal' }));
  it('Pix para o Mercado Pago é parcela de dívida (pedido do Pedro)', () =>
    expect(sug(NOV, /enviada pelo Pix - MERCADO PAGO/)).toMatchObject({ tipo: 'despesa', categoria: cat('Dívidas e encargos') }));
  it('Pix da Eliete para o Pedro é presente: receita em Outras receitas', () =>
    expect(sug(INTER, /ELIETE EXEMPLO TESTE"/)).toMatchObject({ tipo: 'receita', categoria: 'rec-2' }));
  it('entrada de empresa (renda extra) vira receita em Outras receitas', () =>
    expect(sug(INTER, /recebido: "Cp :17028875-CONECTAPAY/)).toMatchObject({ tipo: 'receita', categoria: 'rec-2' }));
  it('pagamento da fatura do cartão e resgate de CDB não são gasto nem receita', () => {
    expect(sug(INTER, /Pagamento fatura cartao/).tipo).toBe('pagamento_cartao');
    expect(sug(INTER, /Resgate/).tipo).toBe('investimento');
  });
  it('Pix do Pedro para a Bruna com fechamento em aberto: pagamento do fechamento (RN-CT-02)', () => {
    expect(sugerir(retratoCenario(), IDS.pedro, pix({}))).toMatchObject({ tipo: 'pagamento_fechamento', fechamento: { devedor: IDS.pedro, credor: IDS.bruna, mes: '2026-11' } });
  });
  it('Pix acima do que está em aberto, ou da Bruna para o Pedro: transferência entre os dois', () => {
    const r = retratoCenario();
    expect(sugerir(r, IDS.pedro, pix({ valor: -99999999 })).tipo).toBe('transferencia');
    expect(sugerir(r, IDS.pedro, pix({ valor: 5000 })).tipo).toBe('transferencia');
  });
  it('lembra a escolha da última vez para o mesmo lado (D21)', () => {
    let r = importar(retratoCenario());
    const burger = r.lancamento.find(l => /BURGER/.test(l.descricao))!;
    r = aplicar(r, alterarLancamento(r, burger.id, { tipo: 'despesa', categoria: cat('Alimentação fora'), escopo: 'casal' }));
    expect(sugerir(r, IDS.pedro, linha({ descricao: 'Compra no débito - BURGER KING' }))).toMatchObject({ categoria: cat('Alimentação fora'), escopo: 'casal', motivo: 'Como da última vez' });
  });
});

describe('gravar o extrato', () => {
  it('cria a conta do arquivo e grava todas as linhas', () => {
    const r = importar(retratoCenario());
    expect(r.conta).toEqual([expect.objectContaining({ pessoa: IDS.pedro, banco: '0260', apelido: 'Nubank · Pedro' })]);
    expect(r.lancamento).toHaveLength(NOV.linhas.length);
    expect(r.lancamento.every(l => l.pessoa === IDS.pedro && l.conta === r.conta[0].id)).toBe(true);
  });
  it('reimportar o mesmo arquivo não duplica (RN-OF-02)', () => {
    const r = importar(retratoCenario());
    const p = prepararExtrato(r, IDS.pedro, NOV);
    expect(p.contaNova).toBe(false);
    expect(p.itens.every(i => i.repetida)).toBe(true);
    expect(importar(r).lancamento).toHaveLength(NOV.linhas.length);
  });
  it('liga as duas pontas da transferência do Inter para o Nubank', () => {
    const r = importar(importar(retratoCenario(), INTER), NOV);
    expect(r.conta).toHaveLength(2);
    const inter = r.conta.find(c => c.banco === '077')!.id;
    const saida = r.lancamento.find(l => l.conta === inter && l.data === '2026-11-06' && l.tipo === 'transferencia_propria' && l.valor < 0)!;
    expect(r.lancamento.find(l => l.id === saida.par)).toMatchObject({ valor: -saida.valor, par: saida.id });
  });
  it('Pix que paga o fechamento baixa o saldo; se a Bruna importa o mesmo Pix, não paga duas vezes (RN-CT-03)', () => {
    let r = retratoCenario();
    const antes = emAberto(r);
    r = importar(r, so([pix({})]));
    expect(emAberto(r)).toBe(antes - 10000);
    r = importar(r, so([pix({ fitid: 'b1', valor: 10000, contraparte: 'Pedro Exemplo Teste' })], '001', '9'), IDS.bruna);
    expect(emAberto(r)).toBe(antes - 10000);
    expect(new Set(r.lancamento.map(l => l.pagamento).filter(Boolean)).size).toBe(1);
    expect(r.lancamento.filter(l => l.tipo === 'pagamento_fechamento')).toHaveLength(2);
  });
  it('trocar o tipo ou apagar tira o pagamento do fechamento junto', () => {
    const r = importar(retratoCenario(), so([pix({})]));
    const id = r.lancamento[0].id, n = r.pagamento_fechamento.length;
    expect(aplicar(r, alterarLancamento(r, id, { tipo: 'transferencia', categoria: null, escopo: null })).pagamento_fechamento).toHaveLength(n - 1);
    expect(aplicar(r, apagarLancamentos(r, [id])).pagamento_fechamento).toHaveLength(n - 1);
  });
});
