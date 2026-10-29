// Ciclo da fatura (PLANEJAMENTO §4.2 e decisão D7). Datas no formato AAAA-MM-DD; meses como AAAA-MM.

export type DiasDoCartao = { diaFechamento: number; diaVencimento: number };
export type Mes = string; // "2026-11" = mês de vencimento da fatura

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export function somarMeses(mes: Mes, k: number): Mes {
  const [a, m] = mes.split('-').map(Number);
  const total = a * 12 + (m - 1) + k;
  return `${Math.floor(total / 12)}-${doisDigitos((total % 12) + 1)}`;
}

function diaNoMes(mes: Mes, dia: number): string {
  const [a, m] = mes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${mes}-${doisDigitos(Math.min(dia, ultimo))}`;
}

/** RN-CA-01 + D7: vence no dia de vencimento do mês; fecha no dia de fechamento mais recente antes do vencimento. */
export function datasDaFatura(cartao: DiasDoCartao, mes: Mes) {
  const vencimento = diaNoMes(mes, cartao.diaVencimento);
  const noMesmoMes = diaNoMes(mes, cartao.diaFechamento);
  const fechamento = noMesmoMes < vencimento ? noMesmoMes : diaNoMes(somarMeses(mes, -1), cartao.diaFechamento);
  return { fechamento, vencimento };
}

/** RN-CA-02: compra antes do fechamento entra na fatura que fecha naquela data; no dia ou depois, na seguinte. */
export function faturaDaCompra(cartao: DiasDoCartao, data: string): Mes {
  let mes = somarMeses(data.slice(0, 7), -1);
  while (data >= datasDaFatura(cartao, mes).fechamento) mes = somarMeses(mes, 1);
  return mes;
}

/** D1: sugere a fatura onde cai a maior parte das datas do arquivo; quem confirma é o usuário. */
export function sugerirFatura(cartao: DiasDoCartao, datas: string[]): Mes {
  const conta = new Map<Mes, number>();
  for (const d of datas) { const m = faturaDaCompra(cartao, d); conta.set(m, (conta.get(m) ?? 0) + 1); }
  return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}
