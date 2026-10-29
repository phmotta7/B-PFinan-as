// Mensagem de WhatsApp do fechamento (PLANEJAMENTO §5.3, RN-WA-01..08, D2, D12).
import { formatarReais, type Centavos } from './dinheiro';
import type { Mes } from './ciclo';
import type { ItemFatura, ParcelaDivida } from './fechamento';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const mesCurto = (m: Mes) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function serie(atual: number, total: number, valor: Centavos) {
  return atual >= total ? ' – última parcela' : ` – faltam ${total - atual}x – restante ${formatarReais(valor * (total - atual))}`;
}
function linha(i: ItemFatura): string {
  if (i.tipo === 'estorno') return `• Estorno ${i.loja} – ${formatarReais(i.valor)} (${ddmm(i.data)})`;
  if (i.parcela) return `• ${i.loja} – ${i.parcela.atual}/${i.parcela.total} – ${formatarReais(i.valor)}${serie(i.parcela.atual, i.parcela.total, i.valor)} (${ddmm(i.dataCompra ?? i.data)})`;
  return `• ${i.loja} – ${formatarReais(i.valor)} (${ddmm(i.data)})`;
}

export type DadosMensagem = {
  pessoa: string; mes: Mes;
  cartoes: { id: string; nome: string; vencimento: string }[];
  itens: ItemFatura[]; dividas: ParcelaDivida[];
  pago: Centavos; chavePix: string;
};

export function montarMensagem(d: DadosMensagem): string {
  const out = [`Resumo Fatura ${mesCurto(d.mes)} – ${d.pessoa}`, ''];
  let total = 0;
  for (const c of d.cartoes) {
    const doCartao = d.itens.filter(i => i.cartao === c.id);
    if (!doCartao.length) continue;
    const quando = (i: ItemFatura) => i.dataCompra ?? i.data;
    const compras = doCartao.filter(i => i.tipo !== 'iof').sort((a, b) => quando(a).localeCompare(quando(b)));
    const iofs = doCartao.filter(i => i.tipo === 'iof');
    out.push(`💳 ${c.nome} (vence ${ddmm(c.vencimento)})`);
    for (const compra of compras) {
      out.push(linha(compra));
      iofs.filter(f => f.iofDe === compra.loja).forEach(f => out.push(linha(f)));
    }
    iofs.filter(f => !compras.some(c2 => c2.loja === f.iofDe)).forEach(f => out.push(linha(f)));
    const sub = doCartao.reduce((s, i) => s + i.valor, 0); total += sub;
    out.push(`Subtotal ${c.nome}: ${formatarReais(sub)}`, '');
  }
  if (d.dividas.length) {
    out.push('📄 Outros');
    d.dividas.forEach(v => out.push(`• ${v.nome} – ${v.atual}/${v.total} – ${formatarReais(v.valor)}${serie(v.atual, v.total, v.valor)}`));
    const sub = d.dividas.reduce((s, v) => s + v.valor, 0); total += sub;
    out.push(`Subtotal Outros: ${formatarReais(sub)}`, '');
  }
  if (d.pago > 0 && d.pago < total) out.push(`Já pago: -${formatarReais(d.pago)}`, `Falta pagar: ${formatarReais(total - d.pago)}`);
  out.push(`TOTAL: ${formatarReais(total)}`, `Pix: ${d.chavePix}`);
  return out.join('\n');
}

/** Link do WhatsApp com o texto pronto (só dígitos no telefone, com DDI 55). */
export function linkWhatsApp(telefone: string, texto: string): string {
  let n = telefone.replace(/\D/g, '');
  if (n.length <= 11) n = '55' + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
