// Lembrete de fechamento no calendário do celular (pedido de 02/11/2026). Um arquivo .ics com o dia seguinte ao fechamento
// de cada cartão nos próximos meses; o app continua sem rotinas agendadas (o calendário do celular é quem avisa).
import { datasDaFatura, somarMeses, type DiasDoCartao, type Mes } from './ciclo';

type CartaoDoLembrete = DiasDoCartao & { id: string; apelido: string };
const diaSeguinte = (d: string) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
const ics = (d: string) => d.replace(/-/g, '');
// Texto do .ics: vírgula, ponto e vírgula e barra precisam de escape
const texto = (s: string) => s.replace(/[\\,;]/g, c => '\\' + c);

/** Dias para importar: do mês `de` em diante, `meses` faturas de cada cartão. */
export function diasDeImportar(cartoes: CartaoDoLembrete[], de: Mes, meses = 12) {
  return cartoes.flatMap(c => Array.from({ length: meses }, (_, i) => {
    const mes = somarMeses(de, i);
    return { cartao: c, mes, dia: diaSeguinte(datasDaFatura(c, mes).fechamento) };
  })).sort((a, b) => a.dia.localeCompare(b.dia));
}

export function calendarioDeFechamentos(cartoes: CartaoDoLembrete[], de: Mes, meses = 12): string {
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//B&P Financas//Lembretes//PT', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:B&P · faturas'];
  for (const { cartao, mes, dia } of diasDeImportar(cartoes, de, meses)) {
    linhas.push('BEGIN:VEVENT', `UID:bp-${cartao.id}-${mes}@bpfinancas`, `DTSTAMP:${ics(dia)}T000000Z`,
      `DTSTART;VALUE=DATE:${ics(dia)}`, `DTEND;VALUE=DATE:${ics(diaSeguinte(dia))}`,
      `SUMMARY:${texto(`Importar a fatura do ${cartao.apelido}`)}`,
      `DESCRIPTION:${texto('A fatura fechou. Baixe o arquivo no app do banco e traga para o B&P.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT9H', `DESCRIPTION:${texto(`Importar a fatura do ${cartao.apelido}`)}`, 'END:VALARM', 'END:VEVENT');
  }
  linhas.push('END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}
