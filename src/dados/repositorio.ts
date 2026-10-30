// Onde os dados moram: neste aparelho (modo demonstração) ou no Supabase. As duas formas recebem o mesmo pacote de mudança.
import { ORDEM_TABELAS, type Mudanca, type Retrato, type Tabela } from './tipos';
import { aplicar } from './mudanca';
import { retratoCenario, IDS, ARQUIVO_NUBANK_NOV } from './cenario';
import { importarFatura, confirmarDuplicidade, escolherCandidata, marcar } from './operacoes';
import { lerNubank } from '@/dominio/leitores';
import { supabaseNavegador } from '@/lib/supabase';

export interface Repositorio {
  modo: 'demo' | 'supabase';
  carregar(): Promise<Retrato>;
  gravar(m: Mudanca): Promise<void>;
  guardarArquivo(importacao: string, nome: string, conteudo: string | Blob): Promise<void>;
}

// ---------- Modo demonstração ----------
const CHAVE = 'bp-demo-v1';
export class RepoDemo implements Repositorio {
  modo = 'demo' as const;
  private r: Retrato | null = null;
  async carregar() {
    try { const s = localStorage.getItem(CHAVE); if (s) return (this.r = JSON.parse(s) as Retrato); } catch { /* sem armazenamento: segue com o cenário */ }
    return (this.r = RepoDemo.inicio());
  }
  /** Começo da demonstração; ?cenario=importado ou ?cenario=marcado pula para depois da importação (capturas e testes visuais). */
  static inicio(): Retrato {
    let r = retratoCenario();
    const etapa = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('cenario') : null;
    if (etapa === 'importado' || etapa === 'marcado' || etapa === 'grande') {
      r = aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura: lerNubank(ARQUIVO_NUBANK_NOV, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'Nubank_2026-11-03.csv', hoje: '2026-11-03' }).mudanca);
      if (etapa === 'grande') { // teste de volume: mais 200 linhas sem dono na mesma fatura
        const lojas = ['Pão de Açúcar', 'Drogasil', 'Uber *Trip', 'iFood', 'Shopee', 'Amazon', 'Padaria Real', 'Renner', 'Posto Ipiranga', 'Magazine Luiza'];
        const csv = ['date,title,amount', ...Array.from({ length: 200 }, (_, i) => `2026-10-${String(3 + (i % 28)).padStart(2, '0')},${lojas[i % lojas.length]} ${i + 1},${((900 + (i * 7919) % 15000) / 100).toFixed(2)}`)].join(String.fromCharCode(10));
        r = aplicar(r, importarFatura(r, { cartao: IDS.nubank, mes: '2026-11', leitura: lerNubank(csv, IDS.nubank), formato: 'nubank_csv', arquivoNome: 'volume.csv', hoje: '2026-11-03' }).mudanca);
      }
      if (etapa === 'marcado') {
        for (const c of r.compra.filter(x => x.pendencia?.tipo === 'duplicidade')) r = aplicar(r, confirmarDuplicidade(r, c.id));
        for (const c of r.compra.filter(x => x.pendencia?.tipo === 'ambigua')) r = aplicar(r, escolherCandidata(r, c.id, IDS.ifoodPedro));
        for (const c of r.compra.filter(x => !x.pagador && !x.pendencia)) {
          const valor = r.parcela_cartao.find(p => p.compra === c.id)?.valor ?? c.valorTotal;
          const alvo = IDS.alvos[`${c.descricao}|${valor}`];
          if (alvo) r = aplicar(r, marcar(r, [c.id], { pagador: alvo.pagador, escopo: alvo.escopo ?? null, categoria: alvo.categoria ?? null }));
        }
      }
    }
    return r;
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
  async guardarArquivo(importacao: string, nome: string, conteudo: string | Blob) {
    const { data: casa } = await this.sb.rpc('minha_casa');
    if (!casa) return;
    await this.sb.storage.from('importacoes').upload(`${casa}/${importacao}-${nome}`, typeof conteudo === 'string' ? new Blob([conteudo], { type: 'text/csv' }) : conteudo, { upsert: true });
  }
}
