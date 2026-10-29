'use client';
// Estado do app: retrato dos dados, quem está usando, navegação com histórico (o "voltar" do celular funciona) e execução de mudanças com Desfazer.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { aplicar, inverter, vazia } from '@/dados/mudanca';
import { RepoDemo, RepoSupabase, type Repositorio } from '@/dados/repositorio';
import type { Mudanca, Pessoa, Retrato } from '@/dados/tipos';
import { supabaseConfigurado, supabaseNavegador } from '@/lib/supabase';
import { datasDaFatura, faturaDaCompra, somarMeses, type Mes } from '@/dominio/ciclo';
import type { Confirmacao } from './comum';

export type NomeTela = 'inicio' | 'cartoes' | 'fatura' | 'importar' | 'conciliacao' | 'lancar' | 'fechamentos' | 'mais' | 'dividas' | 'pessoas' | 'cfg-cartoes' | 'categorias' | 'emails' | 'exportar';
export type Rota = { tela: NomeTela; cartao?: string; mes?: Mes; filtro?: string };
export const RAIZ: NomeTela[] = ['inicio', 'cartoes', 'fechamentos', 'mais'];

export const HOJE_DEMO = '2026-11-03';
const hojeEmSaoPaulo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

type Sessao = { situacao: 'carregando' } | { situacao: 'fora'; erro?: string } | { situacao: 'negado'; email: string } | { situacao: 'dentro'; email: string };

type Ctx = {
  r: Retrato; hoje: string; modo: 'demo' | 'supabase'; sessao: Sessao; carregando: boolean; erro: string | null;
  usuario: Pessoa | undefined; titular: string; mesDeTrabalho: Mes;
  rota: Rota; ir: (r: Rota) => void; voltar: () => void; podeVoltar: boolean;
  executar: (m: Mudanca, mensagem?: string, opc?: { semDesfazer?: boolean }) => Promise<boolean>;
  confirmar: (c: NonNullable<Confirmacao>) => void; confirmacao: Confirmacao; fecharConfirmacao: () => void;
  repo: Repositorio; recarregar: () => Promise<void>; entrar: () => Promise<void>; sair: () => Promise<void>; recomecarDemo: () => void;
};
const Contexto = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(Contexto); if (!c) throw new Error('fora do app'); return c; };

export function ProvedorApp({ children }: { children: ReactNode }) {
  const repo = useMemo<Repositorio>(() => (supabaseConfigurado() ? new RepoSupabase() : new RepoDemo()), []);
  const [r, setR] = useState<Retrato | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sessao, setSessao] = useState<Sessao>({ situacao: 'carregando' });
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const rRef = useRef<Retrato | null>(null); rRef.current = r;

  const recarregar = useCallback(async () => {
    try { setErro(null); setR(await repo.carregar()); }
    catch (e) { setErro(e instanceof Error ? e.message : String(e)); }
  }, [repo]);

  // Sessão: no modo demonstração entra direto; no Supabase confere o login Google e a lista da casa
  useEffect(() => {
    if (repo.modo === 'demo') { setSessao({ situacao: 'dentro', email: 'bruna@exemplo.com' }); recarregar(); return; }
    const sb = supabaseNavegador();
    const conferir = async () => {
      const { data } = await sb.auth.getUser();
      const email = data.user?.email;
      if (!email) return setSessao({ situacao: 'fora' });
      const { data: casa } = await sb.rpc('minha_casa');
      if (!casa) { await sb.auth.signOut(); return setSessao({ situacao: 'negado', email }); }
      setSessao({ situacao: 'dentro', email }); recarregar();
    };
    conferir();
    const { data: sub } = sb.auth.onAuthStateChange((ev: string) => { if (ev === 'SIGNED_OUT') { setR(null); } if (ev === 'SIGNED_OUT') setSessao(s => (s.situacao === 'negado' ? s : { situacao: 'fora' })); });
    return () => sub.subscription.unsubscribe();
  }, [repo, recarregar]);

  // Navegação pelo roteador do Next: a tela fica no endereço (?tela=fatura&cartao=...), então o "voltar" do celular funciona sem recarregar
  const router = useRouter(), params = useSearchParams();
  const rota: Rota = { tela: (params.get('tela') as NomeTela) || 'inicio', cartao: params.get('cartao') ?? undefined, mes: params.get('mes') ?? undefined, filtro: params.get('filtro') ?? undefined };
  const profundidade = useRef(0);
  useEffect(() => { const volta = () => { profundidade.current = Math.max(0, profundidade.current - 1); }; window.addEventListener('popstate', volta); return () => window.removeEventListener('popstate', volta); }, []);
  const ir = useCallback((r: Rota) => {
    const q = new URLSearchParams(Object.entries(r).filter(([, v]) => v) as [string, string][]);
    const url = r.tela === 'inicio' && q.size === 1 ? '/' : `/?${q}`;
    if (RAIZ.includes(r.tela)) { profundidade.current = 0; router.replace(url, { scroll: false }); }
    else { profundidade.current++; router.push(url, { scroll: false }); }
  }, [router]);
  const voltar = useCallback(() => { if (profundidade.current > 0) router.back(); else ir({ tela: 'inicio' }); }, [router, ir]);

  const executar = useCallback(async (m: Mudanca, mensagem?: string, opc?: { semDesfazer?: boolean }) => {
    const antes = rRef.current; if (!antes || vazia(m)) return true;
    setR(aplicar(antes, m)); // otimista
    try { await repo.gravar(m); }
    catch (e) { setR(antes); toast.error(`Não consegui salvar: ${e instanceof Error ? e.message : e}. Nada foi alterado.`); return false; }
    if (mensagem) {
      const desfazer = inverter(antes, m);
      toast(mensagem, opc?.semDesfazer ? undefined : { action: { label: 'Desfazer', onClick: async () => {
        const atual = rRef.current!; setR(aplicar(atual, desfazer));
        try { await repo.gravar(desfazer); toast('Desfeito.'); } catch { setR(atual); toast.error('Não consegui desfazer.'); }
      } } });
    }
    return true;
  }, [repo]);

  const entrar = useCallback(async () => {
    const sb = supabaseNavegador();
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } });
  }, []);
  const sair = useCallback(async () => {
    if (repo.modo === 'supabase') await supabaseNavegador().auth.signOut();
    setR(null); setSessao({ situacao: 'fora' });
  }, [repo]);
  const recomecarDemo = useCallback(() => { RepoDemo.recomecar(); recarregar(); router.replace('/'); }, [recarregar, router]);

  const hoje = repo.modo === 'demo' ? HOJE_DEMO : hojeEmSaoPaulo();
  const titular = r?.cartao[0]?.titular ?? r?.pessoa.find(p => p.nome === 'Bruna')?.id ?? '';
  const email = sessao.situacao === 'dentro' ? sessao.email : '';
  const usuario = r ? r.pessoa.find(p => p.id === r.usuario_autorizado.find(u => u.email.toLowerCase() === email.toLowerCase())?.pessoa) : undefined;
  // Mês de trabalho: o vencimento mais próximo que ainda não passou, entre os cartões
  const mesDeTrabalho = useMemo(() => {
    const cs = r?.cartao.filter(c => c.ativo) ?? [];
    if (!cs.length) return hoje.slice(0, 7);
    return cs.map(c => { let m = faturaDaCompra(c, hoje); while (datasDaFatura(c, somarMeses(m, -1)).vencimento >= hoje) m = somarMeses(m, -1); return m; }).sort()[0];
  }, [r, hoje]);

  const ctx: Ctx | null = r ? {
    r, hoje, modo: repo.modo, sessao, carregando: false, erro, usuario, titular, mesDeTrabalho,
    rota, ir, voltar, podeVoltar: !RAIZ.includes(rota.tela),
    executar, confirmar: c => setConfirmacao(c), confirmacao, fecharConfirmacao: () => setConfirmacao(null),
    repo, recarregar, entrar, sair, recomecarDemo,
  } : null;

  if (!ctx || sessao.situacao !== 'dentro') return <EstadoInicial sessao={sessao} erro={erro} repo={repo} entrar={entrar} recarregar={recarregar} />;
  return <Contexto.Provider value={ctx}>{children}</Contexto.Provider>;
}

// Antes de ter dados: login, acesso negado, carregando ou erro
import { Login } from './telas/Login';
function EstadoInicial({ sessao, erro, repo, entrar, recarregar }: { sessao: Sessao; erro: string | null; repo: Repositorio; entrar: () => Promise<void>; recarregar: () => Promise<void> }) {
  if (sessao.situacao === 'fora' || sessao.situacao === 'negado') return <Login negado={sessao.situacao === 'negado' ? sessao.email : undefined} entrar={entrar} />;
  if (erro) return (
    <main className="conteudo" style={{ paddingTop: 80 }}>
      <div className="aviso er" role="alert"><div><p>Não consegui carregar os dados agora. {repo.modo === 'supabase' ? 'Se o app ficou mais de 7 dias sem uso, o Supabase pode estar pausado: reative no painel e tente de novo.' : ''} Nada do que você marcou se perdeu.</p>
        <button className="bt link" onClick={recarregar}>Tentar de novo</button></div></div>
    </main>
  );
  // Carregando no formato real da tela: o painel do total, a régua e as linhas
  return (
    <main className="conteudo carregando" aria-busy="true" aria-label="Carregando">
      <div className="esq-titulo"><i /><i /></div>
      <div className="esq-heroi"><i className="t" /><i className="s" /><i className="r" /><div className="l"><i /><i /><i /><i /></div></div>
      <div className="esq">{[52, 40, 64].map(w => <div key={w}><i className="c" /><i style={{ width: `${w}%` }} /><i style={{ width: '18%', marginLeft: 'auto' }} /></div>)}</div>
    </main>
  );
}
