// O que o app já sabe pelo histórico (pedido de 02/11/2026). Nada aqui marca compra sozinho (Q12, RN-OF-05):
// são sugestões que a pessoa aceita, e lembranças (categorias recentes, Pessoal/Casal) que valem igual nos dois celulares.
import { somarMeses, type Mes } from '@/dominio/ciclo';
import type { Parte } from '@/dominio/divisao';
import type { Compra, Escopo, Retrato } from './tipos';

/** Nome da loja para comparar: sem acento, sem maiúscula, sem pontuação ("IFD*iFood Club" = "ifd ifood club"). */
export const chaveLoja = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Nome que o banco deu à compra (antes de a pessoa renomear), quando ela veio de um arquivo. */
function lojasDoBanco(r: Retrato) {
  const loja = new Map(r.linha_importada.map(l => [l.id, typeof l.dados.loja === 'string' ? l.dados.loja : '']));
  const porCompra = new Map<string, string>();
  for (const x of r.parcela_cartao) if (x.linhaImportada && !porCompra.has(x.compra)) porCompra.set(x.compra, loja.get(x.linhaImportada) ?? '');
  return porCompra;
}
const chavesDe = (c: Compra, banco: Map<string, string>) => [...new Set([chaveLoja(c.descricao), chaveLoja(banco.get(c.id) ?? '')].filter(Boolean))];

export type Sugestao = { pagador: string; escopo: Escopo | null; categoria: string | null; divisao: Parte[] | null; vezes: number };

/** Compras já marcadas, por loja, da mais recente para a mais antiga. */
function marcadasPorLoja(r: Retrato) {
  const banco = lojasDoBanco(r);
  const mapa = new Map<string, Compra[]>();
  const marcadas = r.compra.filter(c => c.pagador && !c.pendencia && (c.tipo === 'compra' || c.tipo === 'parcela'))
    .sort((a, b) => b.data.localeCompare(a.data));
  for (const c of marcadas) for (const k of chavesDe(c, banco)) mapa.set(k, [...(mapa.get(k) ?? []), c]);
  return { mapa, banco };
}

/** Sugestão para uma compra sem dono: a loja já foi marcada e as duas últimas vezes foram da mesma pessoa.
 *  Loja que muda de dono (Uber de cada um) não ganha sugestão. */
function sugerir(c: Compra, base: ReturnType<typeof marcadasPorLoja>): Sugestao | null {
  const antes = chavesDe(c, base.banco).flatMap(k => base.mapa.get(k) ?? []).filter(x => x.id !== c.id);
  if (!antes.length) return null;
  const [ultima, penultima] = [...new Map(antes.map(x => [x.id, x])).values()].sort((a, b) => b.data.localeCompare(a.data));
  const dono = (x: Compra) => (x.divisao?.length ?? 0) > 1 ? x.divisao!.map(p => p.pessoa).sort().join('+') : x.pagador;
  if (penultima && dono(penultima) !== dono(ultima)) return null;
  const vezes = antes.filter(x => dono(x) === dono(ultima)).length;
  return { pagador: ultima.pagador!, escopo: ultima.escopo ?? null, categoria: ultima.categoria ?? null, divisao: (ultima.divisao?.length ?? 0) > 1 ? ultima.divisao! : null, vezes };
}

/** Sugestões para as linhas sem dono de uma fatura (compra → sugestão). */
export function sugestoesDaFatura(r: Retrato, faturaId: string): Map<string, Sugestao> {
  const ids = new Set(r.parcela_cartao.filter(x => x.fatura === faturaId).map(x => x.compra));
  const base = marcadasPorLoja(r);
  const res = new Map<string, Sugestao>();
  for (const c of r.compra) {
    if (!ids.has(c.id) || c.pagador || c.pendencia || (c.tipo !== 'compra' && c.tipo !== 'parcela')) continue;
    const s = sugerir(c, base);
    if (s) res.set(c.id, s);
  }
  return res;
}
export function sugestaoPara(r: Retrato, compraId: string): Sugestao | null {
  const c = r.compra.find(x => x.id === compraId);
  return c && !c.pagador ? sugerir(c, marcadasPorLoja(r)) : null;
}

/** Categoria usada da última vez nesta loja (por qualquer pessoa): vem primeiro na folha "De quem é?". */
export function categoriaDaLoja(r: Retrato, compraId: string): string | null {
  const c = r.compra.find(x => x.id === compraId); if (!c) return null;
  const base = marcadasPorLoja(r);
  return chavesDe(c, base.banco).flatMap(k => base.mapa.get(k) ?? []).find(x => x.id !== c.id && x.categoria)?.categoria ?? null;
}

// ---------- Lembranças tiradas do histórico (antes ficavam só no aparelho) ----------
const porData = (r: Retrato, pessoa: string) => r.compra.filter(c => c.pagador === pessoa || c.divisao?.some(p => p.pessoa === pessoa)).sort((a, b) => b.data.localeCompare(a.data));

/** Últimas categorias que a pessoa usou, da mais recente para a mais antiga (nomes, sem repetir). */
export function categoriasRecentes(r: Retrato, pessoa: string, quantas = 5): string[] {
  const nome = new Map(r.categoria.map(c => [c.id, c.nome]));
  return [...new Set(porData(r, pessoa).map(c => c.categoria && nome.get(c.categoria)).filter(Boolean) as string[])].slice(0, quantas);
}
/** Pessoal ou Casal da última compra marcada da pessoa (D6). */
export const escopoRecente = (r: Retrato, pessoa: string): Escopo => porData(r, pessoa).find(c => c.pagador === pessoa && c.escopo)?.escopo ?? 'pessoal';
/** Cartão da última compra lançada à mão pela pessoa. */
export const cartaoRecente = (r: Retrato, pessoa: string | undefined): string | undefined =>
  r.compra.filter(c => c.origem === 'manual' && (!pessoa || c.pagador === pessoa) && r.cartao.find(x => x.id === c.cartao)?.ativo).sort((a, b) => b.data.localeCompare(a.data))[0]?.cartao;

// ---------- Devem vir na fatura (prévia das assinaturas, antes do módulo de Recorrentes da Etapa 2) ----------
export type DeveVir = { descricao: string; valor: number; pagador: string | null; meses: Mes[] };
/** Compra à vista que veio com o mesmo valor nas duas faturas anteriores do cartão e ainda não está nesta. Só mostra; não grava nada. */
export function devemVir(r: Retrato, cartao: string, mes: Mes): DeveVir[] {
  const banco = lojasDoBanco(r);
  const fatura = (m: Mes) => r.fatura.find(f => f.cartao === cartao && f.mes === m);
  const avistas = (m: Mes) => {
    const f = fatura(m); if (!f) return [];
    const ids = new Set(r.parcela_cartao.filter(x => x.fatura === f.id && x.status === 'confirmada').map(x => x.compra));
    return r.compra.filter(c => ids.has(c.id) && c.tipo === 'compra' && c.parcelas === 1);
  };
  const [m1, m2] = [somarMeses(mes, -1), somarMeses(mes, -2)];
  const anteriores = avistas(m2);
  const agora = fatura(mes);
  const nesta = new Set(agora ? r.parcela_cartao.filter(x => x.fatura === agora.id).flatMap(x => { const c = r.compra.find(y => y.id === x.compra); return c ? chavesDe(c, banco) : []; }) : []);
  const vistos = new Set<string>();
  return avistas(m1).flatMap(c => {
    const ks = chavesDe(c, banco);
    if (ks.some(k => nesta.has(k) || vistos.has(k))) return [];
    if (!anteriores.some(a => a.valorTotal === c.valorTotal && chavesDe(a, banco).some(k => ks.includes(k)))) return [];
    ks.forEach(k => vistos.add(k));
    return [{ descricao: c.descricao, valor: c.valorTotal, pagador: c.pagador ?? null, meses: [m2, m1] }];
  });
}
