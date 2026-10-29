// Aplicar e desfazer pacotes de mudança sobre o retrato dos dados.
import { ORDEM_TABELAS, mudancaVazia, type Mudanca, type Retrato, type Tabela } from './tipos';

type ComId = { id: string };
const lista = <T extends Tabela>(r: Retrato, t: T) => r[t] as unknown as ComId[];

export function aplicar(r: Retrato, m: Mudanca): Retrato {
  const novo = { ...r } as Retrato;
  for (const t of ORDEM_TABELAS) {
    let linhas = lista(r, t);
    const apagar = new Set(m.apagar[t] ?? []);
    const atualizar = new Map(((m.atualizar[t] ?? []) as ComId[]).map(x => [x.id, x]));
    const inserir = (m.inserir[t] ?? []) as ComId[];
    if (!apagar.size && !atualizar.size && !inserir.length) continue;
    linhas = linhas.filter(x => !apagar.has(x.id)).map(x => atualizar.get(x.id) ?? x).concat(inserir);
    (novo as unknown as Record<string, ComId[]>)[t] = linhas;
  }
  return novo;
}

/** O pacote que desfaz `m`, calculado a partir do retrato de antes. */
export function inverter(antes: Retrato, m: Mudanca): Mudanca {
  const inv = mudancaVazia();
  const set = (k: keyof Mudanca, t: Tabela, v: unknown[]) => { if (v.length) (inv[k] as Record<string, unknown[]>)[t] = v; };
  for (const t of ORDEM_TABELAS) {
    const porId = new Map(lista(antes, t).map(x => [x.id, x]));
    set('apagar', t, ((m.inserir[t] ?? []) as ComId[]).map(x => x.id));
    set('atualizar', t, ((m.atualizar[t] ?? []) as ComId[]).map(x => porId.get(x.id)).filter(Boolean) as ComId[]);
    set('inserir', t, (m.apagar[t] ?? []).map(id => porId.get(id)).filter(Boolean) as ComId[]);
  }
  return inv;
}

export const vazia = (m: Mudanca) => ORDEM_TABELAS.every(t => !m.inserir[t]?.length && !m.atualizar[t]?.length && !m.apagar[t]?.length);
