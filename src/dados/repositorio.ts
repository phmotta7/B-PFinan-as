// Onde os dados moram: neste aparelho (modo demonstração) ou no Supabase. As duas formas recebem o mesmo pacote de mudança.
import { ORDEM_TABELAS, type Mudanca, type Retrato, type Tabela } from './tipos';
import { aplicar } from './mudanca';
import { retratoCenario } from './cenario';
import { supabaseNavegador } from '@/lib/supabase';

export interface Repositorio {
  modo: 'demo' | 'supabase';
  carregar(): Promise<Retrato>;
  gravar(m: Mudanca): Promise<void>;
  guardarArquivo(importacao: string, nome: string, conteudo: string): Promise<void>;
}

// ---------- Modo demonstração ----------
const CHAVE = 'bp-demo-v1';
export class RepoDemo implements Repositorio {
  modo = 'demo' as const;
  private r: Retrato | null = null;
  async carregar() {
    try { const s = localStorage.getItem(CHAVE); if (s) return (this.r = JSON.parse(s) as Retrato); } catch { /* sem armazenamento: segue com o cenário */ }
    return (this.r = retratoCenario());
  }
  async gravar(m: Mudanca) {
    this.r = aplicar(this.r ?? (await this.carregar()), m);
    try { localStorage.setItem(CHAVE, JSON.stringify(this.r)); } catch { /* aparelho sem armazenamento: fica só na memória */ }
  }
  async guardarArquivo() { /* no modo demonstração o arquivo não é guardado */ }
  static recomecar() { try { localStorage.removeItem(CHAVE); } catch { /* nada a fazer */ } }
}

// ---------- Supabase ----------
const snake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const AUDITORIA = new Set(['casa', 'criado_por', 'atualizado_em', 'atualizado_por']);
const paraBanco = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [snake(k), v]));
const doBanco = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k]) => !AUDITORIA.has(k)).map(([k, v]) => [camel(k), v]));

export class RepoSupabase implements Repositorio {
  modo = 'supabase' as const;
  private sb = supabaseNavegador();
  async carregar() {
    const r = {} as Record<Tabela, unknown[]>;
    await Promise.all(ORDEM_TABELAS.map(async t => {
      const { data, error } = await this.sb.from(t).select('*');
      if (error) throw new Error(`Não consegui ler ${t}: ${error.message}`);
      r[t] = (data ?? []).map(doBanco);
    }));
    // criado_em da importação é a data em que ela foi feita
    return r as unknown as Retrato;
  }
  async gravar(m: Mudanca) {
    for (const t of ORDEM_TABELAS) {
      const linhas = [...(m.inserir[t] ?? []), ...(m.atualizar[t] ?? [])].map(paraBanco);
      if (linhas.length) { const { error } = await this.sb.from(t).upsert(linhas); if (error) throw new Error(error.message); }
    }
    for (const t of [...ORDEM_TABELAS].reverse()) {
      const ids = m.apagar[t] ?? [];
      if (ids.length) { const { error } = await this.sb.from(t).delete().in('id', ids); if (error) throw new Error(error.message); }
    }
  }
  async guardarArquivo(importacao: string, nome: string, conteudo: string) {
    const { data: casa } = await this.sb.rpc('minha_casa');
    if (!casa) return;
    await this.sb.storage.from('importacoes').upload(`${casa}/${importacao}-${nome}`, new Blob([conteudo], { type: 'text/csv' }), { upsert: true });
  }
}
