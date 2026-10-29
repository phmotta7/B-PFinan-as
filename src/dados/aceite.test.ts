// Critérios de aceite da Etapa 1 (PLANEJAMENTO §16), testados pelas operações e consultas do app.
import { describe, expect, it } from 'vitest';
import { lerNubank } from '@/dominio/leitores';
import { aplicar } from './mudanca';
import { lancarCompra, importarFatura, confirmarDuplicidade, escolherCandidata, marcar, registrarPagamento } from './operacoes';
import { linhasDaFatura, fechamentosDoMes, faturaDe } from './consultas';
import { retratoCenario, ARQUIVO_NUBANK_NOV, IDS } from './cenario';

const HOJE = '2026-11-03';

function cenarioImportado() {
  let r = retratoCenario();
  const leitura = lerNubank(ARQUIVO_NUBANK_NOV, IDS.nubank);
  r = aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura, formato: 'nubank_csv', arquivoNome: 'Nubank_2026-11-03.csv', hoje: HOJE }).mudanca);
  return r;
}

describe('importar a fatura Nov/26 do Nubank', () => {
  it('grava as 47 linhas e ignora o pagamento', () => {
    const r = cenarioImportado();
    const f = faturaDe(r, IDS.nubank, '2026-11')!;
    expect(linhasDaFatura(r, f.id)).toHaveLength(47);
    expect(linhasDaFatura(r, f.id).reduce((s, l) => s + l.valor, 0)).toBe(218437);
    expect(r.importacao[0]).toMatchObject({ linhasNovas: 47, linhasIgnoradas: 1 });
  });

  it('reimportar o mesmo arquivo não duplica nada', () => {
    let r = cenarioImportado();
    const antes = r.compra.length;
    const res = importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura: lerNubank(ARQUIVO_NUBANK_NOV, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'de novo.csv', hoje: HOJE });
    expect(res.resumo).toMatchObject({ novas: 0, repetidas: 47 });
    r = aplicar(r, res.mudanca);
    expect(r.compra.length).toBe(antes);
    expect(linhasDaFatura(r, faturaDe(r, IDS.nubank, '2026-11')!.id)).toHaveLength(47);
  });

  it('a compra parcelada lançada à mão é baixada, não duplicada', () => {
    const r = cenarioImportado();
    const tenis = r.compra.filter(c => /centauro/i.test(c.descricao) && c.parcelas === 3);
    expect(tenis).toHaveLength(1); // só a compra manual "Tênis Centauro"; a linha do arquivo virou baixa dela
    const p1 = r.parcela_cartao.find(p => p.compra === tenis[0].id && p.numero === 1)!;
    expect(p1.status).toBe('confirmada');
    expect(r.parcela_cartao.filter(p => p.compra === tenis[0].id && p.status === 'prevista')).toHaveLength(2);
  });
});

describe('marcar e fechar novembro', () => {
  function tudoMarcado() {
    let r = cenarioImportado();
    const f = faturaDe(r, IDS.nubank, '2026-11')!;
    // Conciliação: Uber é duplicidade óbvia; iFood é do Pedro (o de 19/10)
    for (const c of r.compra.filter(c => c.pendencia?.tipo === 'duplicidade')) r = aplicar(r, confirmarDuplicidade(r, c.id));
    for (const c of r.compra.filter(c => c.pendencia?.tipo === 'ambigua')) r = aplicar(r, escolherCandidata(r, c.id, IDS.ifoodPedro));
    // Marcação das sem dono como no cenário (§18, passo 4)
    const sem = linhasDaFatura(r, f.id).filter(l => !l.compra.pagador);
    for (const l of sem) {
      const alvo = IDS.alvos[l.compra.descricao + '|' + l.valor];
      expect(alvo, `linha sem alvo: ${l.compra.descricao} ${l.valor}`).toBeTruthy();
      r = aplicar(r, marcar(r, [l.compra.id], { pagador: alvo.pagador, escopo: alvo.escopo ?? null, categoria: alvo.categoria ?? null }));
    }
    return r;
  }

  it('gera os fechamentos de Pedro, Eliete e Lucimar com os totais da soma manual', () => {
    const r = tudoMarcado();
    const f = fechamentosDoMes(r, '2026-11', IDS.bruna);
    const total = (nome: string) => f.find(x => x.pessoa.nome === nome)!.total;
    expect(total('Pedro')).toBe(81240);
    expect(total('Eliete')).toBe(15400);
    expect(total('Lucimar')).toBe(20640);
  });

  it('pagamento parcial deixa saldo em aberto visível', () => {
    let r = tudoMarcado();
    r = aplicar(r, registrarPagamento(r, { devedor: IDS.lucimar, credor: IDS.bruna, mes: '2026-11', valor: 20000, data: '2026-11-05' }));
    const luc = fechamentosDoMes(r, '2026-11', IDS.bruna).find(x => x.pessoa.nome === 'Lucimar')!;
    expect(luc).toMatchObject({ pago: 20000, emAberto: 640, situacao: 'Parcial' });
  });
});

describe('lançar compra parcelada (RN-CA-10, RN-CA-11, RN-CA-12)', () => {
  it('gera todas as parcelas previstas, a 1ª com o resto, cada uma na sua fatura', () => {
    let r = retratoCenario();
    r = aplicar(r, lancarCompra(r, { cartao: IDS.nubank, data: '2026-11-03', descricao: 'Mesa', valorTotal: 10000, parcelas: 3, pagador: IDS.pedro, escopo: 'casal', categoria: null }));
    const c = r.compra.find(x => x.descricao === 'Mesa')!;
    const ps = r.parcela_cartao.filter(p => p.compra === c.id).sort((a, b) => a.numero - b.numero);
    expect(ps.map(p => p.valor)).toEqual([3334, 3333, 3333]);
    expect(ps.every(p => p.status === 'prevista')).toBe(true);
    expect(ps.map(p => r.fatura.find(f => f.id === p.fatura)!.mes)).toEqual(['2026-12', '2027-01', '2027-02']);
  });
});
