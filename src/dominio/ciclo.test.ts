import { describe, expect, it } from 'vitest';
import { datasDaFatura, faturaDaCompra, somarMeses, sugerirFatura } from './ciclo';

const nubank = { diaFechamento: 3, diaVencimento: 10 };
const fecha28 = { diaFechamento: 28, diaVencimento: 5 };

describe('datasDaFatura (RN-CA-01, D7)', () => {
  it('fecha e vence no mesmo mês quando o fechamento vem antes do vencimento', () => {
    expect(datasDaFatura(nubank, '2026-11')).toEqual({ fechamento: '2026-11-03', vencimento: '2026-11-10' });
  });
  it('D7: fecha 28 e vence 5 → a fatura Nov/26 fecha em 28/10', () => {
    expect(datasDaFatura(fecha28, '2026-11')).toEqual({ fechamento: '2026-10-28', vencimento: '2026-11-05' });
  });
  it('dia que não existe no mês usa o último dia do mês', () => {
    expect(datasDaFatura({ diaFechamento: 31, diaVencimento: 10 }, '2027-03')).toEqual({ fechamento: '2027-02-28', vencimento: '2027-03-10' });
  });
});

describe('faturaDaCompra (RN-CA-02)', () => {
  it('compra antes do fechamento entra na fatura que fecha naquela data', () => {
    expect(faturaDaCompra(nubank, '2026-11-02')).toBe('2026-11');
  });
  it('compra no dia do fechamento vai para a fatura seguinte', () => {
    expect(faturaDaCompra(nubank, '2026-11-03')).toBe('2026-12');
  });
  it('funciona quando o fechamento cai no mês anterior ao vencimento', () => {
    expect(faturaDaCompra(fecha28, '2026-10-27')).toBe('2026-11');
    expect(faturaDaCompra(fecha28, '2026-10-28')).toBe('2026-12');
  });
});

describe('somarMeses', () => {
  it('a parcela k vai para a fatura da parcela 1 + k−1 meses (RN-CA-10), virando o ano', () => {
    expect(somarMeses('2026-11', 2)).toBe('2027-01');
  });
});

describe('sugerirFatura (D1)', () => {
  it('sugere a fatura onde cai a maior parte das datas do arquivo', () => {
    const datas = ['2026-10-03', '2026-10-15', '2026-10-30', '2026-11-02', '2026-11-03'];
    expect(sugerirFatura(nubank, datas)).toBe('2026-11');
  });
});
