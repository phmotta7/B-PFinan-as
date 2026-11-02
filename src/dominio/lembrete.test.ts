import { describe, expect, it } from 'vitest';
import { calendarioDeFechamentos, diasDeImportar } from './lembrete';

const nubank = { id: 'nu', apelido: 'Nubank da Bruna', diaFechamento: 3, diaVencimento: 10 };

describe('lembrete de fechamento no calendário', () => {
  it('um dia depois do fechamento, uma vez por fatura', () => {
    expect(diasDeImportar([nubank], '2026-11', 3).map(d => d.dia)).toEqual(['2026-11-04', '2026-12-04', '2027-01-04']);
  });
  it('gera um .ics com um evento de dia inteiro por fatura e aviso às 9h', () => {
    const ics = calendarioDeFechamentos([nubank], '2026-11', 2);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261104');
    expect(ics).toContain('TRIGGER:PT9H');
    expect(ics).toContain('UID:bp-nu-2026-11@bpfinancas');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
