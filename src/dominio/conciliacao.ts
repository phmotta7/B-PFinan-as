// Conciliação entre o que foi lançado no app e o que veio na fatura (PLANEJAMENTO §4.5).
import type { Centavos } from './dinheiro';
import type { Parcela } from './leitores';
import { somarMeses, type Mes } from './ciclo';

export type Importada = { id: string; data: string; loja: string; valor: Centavos; parcela?: Parcela };
export type Lancamento = {
  id: string;
  tipo: 'manual' | 'prevista'; // manual = lançado no app e ainda não conciliado; prevista = parcela futura
  data: string; loja: string; valor: Centavos;
  parcela?: Parcela;
  fatura?: Mes; // fatura onde a parcela prevista deveria aparecer
};
export type Resultado =
  | { importada: string; resultado: 'serie' | 'duplicidade'; lancamento: string }
  | { importada: string; resultado: 'ambigua'; candidatos: string[] }
  | { importada: string; resultado: 'sem_par' };

const TOLERANCIA_SERIE = 5; // ±R$ 0,05
const DIAS_DUPLICIDADE = 3;

const palavras = (s: string) => new Set(s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(p => p.length >= 3));
/** "Descrição compatível": as duas descrições têm pelo menos uma palavra de 3+ letras em comum. */
const compativel = (a: string, b: string) => { const pa = palavras(a); return [...palavras(b)].some(p => pa.has(p)); };
const dias = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;

export function conciliar(importadas: Importada[], lancados: Lancamento[], fatura: Mes) {
  const usados = new Set<string>();
  const livres = (f: (l: Lancamento) => boolean) => lancados.filter(l => !usados.has(l.id) && f(l));

  const linhas: Resultado[] = importadas.map(i => {
    // 1. Parcela de série conhecida
    if (i.parcela) {
      const serie = livres(l => l.tipo === 'prevista' && !!l.parcela && l.parcela.atual === i.parcela!.atual && l.parcela.total === i.parcela!.total
        && Math.abs(l.valor - i.valor) <= TOLERANCIA_SERIE && compativel(l.loja, i.loja));
      if (serie.length === 1) { usados.add(serie[0].id); return { importada: i.id, resultado: 'serie', lancamento: serie[0].id }; }
      if (serie.length > 1) return { importada: i.id, resultado: 'ambigua', candidatos: serie.map(s => s.id) };
    }
    // 2. Lançamento manual idêntico (à vista ou 1ª parcela)
    if (!i.parcela || i.parcela.atual === 1) {
      const iguais = livres(l => l.tipo === 'manual' && l.valor === i.valor && dias(l.data, i.data) <= DIAS_DUPLICIDADE);
      if (iguais.length === 1) { usados.add(iguais[0].id); return { importada: i.id, resultado: 'duplicidade', lancamento: iguais[0].id }; }
      // 3. Ambíguo
      if (iguais.length > 1) return { importada: i.id, resultado: 'ambigua', candidatos: iguais.map(s => s.id) };
    }
    // 4. Sem par
    return { importada: i.id, resultado: 'sem_par' };
  });

  // RN-CO-03: previstas para esta fatura que não apareceram
  const naoEncontradas = lancados.filter(l => l.tipo === 'prevista' && l.fatura === fatura && !usados.has(l.id)).map(l => l.id);
  return { linhas, naoEncontradas };
}

/** RN-CO-02: parcelas restantes de uma série, uma por fatura seguinte, com o mesmo valor. */
export function parcelasFuturas(parcela: Parcela, valor: Centavos, fatura: Mes) {
  return Array.from({ length: parcela.total - parcela.atual }, (_, i) => ({
    parcela: { atual: parcela.atual + i + 1, total: parcela.total },
    valor,
    fatura: somarMeses(fatura, i + 1),
  }));
}
