'use client';
// Peças comuns da interface (DESIGN.md): selos, logos, cabeçalho, pílulas, esqueleto, folha com mola e diálogo.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, CircleAlert, Copy, type LucideIcon } from 'lucide-react';
import { formatarReais } from '@/dominio/dinheiro';
import type { Pessoa } from '@/dados/tipos';

export const ICONE = { size: 24, strokeWidth: 1.75 } as const;
export const reais = (c: number) => formatarReais(c).replace('R$ ', 'R$ ');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
export const mesLongo = (m: string) => { const s = MESES[Number(m.slice(5, 7)) - 1]; return s[0].toUpperCase() + s.slice(1); };
export const diaLongo = (d: string) => { const x = new Date(d + 'T12:00:00'); return `${DIAS[x.getDay()]}, ${x.getDate()} de ${MESES[x.getMonth()]}`; };
export const prefereMenosMovimento = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const CLASSE: Record<string, string> = { Pedro: 'p', Bruna: 'b', Eliete: 'e', Lucimar: 'l' };
/** Preto ou branco, o que tiver mais contraste com a cor de fundo. */
const letraSobre = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16), lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255) > 0.179 ? '#11141c' : '#fff';
};
/** Selo de pessoa: cor fixa + inicial + nome; nunca só a cor. */
export function Selo({ pessoa, grande, extra, semDono }: { pessoa?: Pessoa | null; grande?: boolean; extra?: ReactNode; semDono?: string }) {
  if (!pessoa) return <span className={`selo x${grande ? ' g' : ''}`}><b aria-hidden="true">?</b><span className="selo-nome">{semDono ?? 'Sem dono'}</span>{extra}</span>;
  const cl = CLASSE[pessoa.nome];
  return (
    <span className={`selo ${cl ?? ''}${grande ? ' g' : ''}`}>
      <b aria-hidden="true" style={cl ? undefined : { background: pessoa.cor, color: letraSobre(pessoa.cor) }}>{pessoa.nome[0]}</b><span className="selo-nome" title={pessoa.nome}>{pessoa.nome}</span>{extra}
    </span>
  );
}

const LOGOS: [string, string][] = [['nubank', 'nubank'], ['uber', 'uber'], ['drogasil', 'drogasil'], ['magazine luiza', 'magalu'], ['magalu', 'magalu'],
  ['centauro', 'centauro'], ['ifood', 'ifood'], ['amazon', 'amazon'], ['renner', 'renner'], ['shopee', 'shopee']];
/** Logo real da loja (D9), guardado no app; loja desconhecida mostra a inicial. */
export function Logo({ loja, vazio }: { loja: string; vazio?: boolean }) {
  if (vazio) return <span className="logo vazio" aria-hidden="true" />;
  const k = LOGOS.find(([p]) => loja.toLowerCase().includes(p));
  if (k) return <span className="logo" aria-hidden="true"><img src={`/logos/${k[1]}.svg`} alt="" /></span>;
  const palavras = loja.replace(/[^A-Za-zÀ-ú ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const mono = (palavras.length > 1 ? palavras[0][0] + palavras[1][0] : (palavras[0] ?? '?').slice(0, 2)).toUpperCase();
  return <span className="logo mono" aria-hidden="true">{mono}</span>;
}
export const LogoBanco = ({ banco }: { banco: string }) =>
  banco === 'nubank' || banco === 'bb' ? <span className="logo" aria-hidden="true"><img src={`/logos/${banco}.svg`} alt="" /></span> : <Logo loja={banco} />;

export function Topo({ titulo, sub, voltar, direita, abaixo }: { titulo: string; sub?: ReactNode; voltar?: () => void; direita?: ReactNode; abaixo?: ReactNode }) {
  return (
    <header className="topo">
      {voltar || direita ? (
        <div className="nav">
          {voltar ? <button className="redondo" onClick={voltar} aria-label="Voltar"><span><ChevronLeft size={20} strokeWidth={1.75} /></span></button> : <span />}
          {direita}
        </div>
      ) : null}
      <h1>{titulo}</h1>
      {sub ? <p className="sub">{sub}</p> : null}
      {abaixo}
    </header>
  );
}

const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** Troca de mês num controle só: anterior, nome do mês, próximo. */
let ladoDoFoco = 0; // a tela é recriada a cada mês; guarda qual botão estava com o foco para devolvê-lo
export function SeletorMes({ mes, mudar, rotulo = 'Mês' }: { mes: string; mudar: (k: number) => void; rotulo?: string }) {
  const nome = MESES_LONGOS[Number(mes.slice(5, 7)) - 1];
  const ant = useRef<HTMLButtonElement>(null), prox = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (ladoDoFoco) (ladoDoFoco < 0 ? ant : prox).current?.focus({ preventScroll: true }); ladoDoFoco = 0; }, []);
  const trocar = (k: number) => { ladoDoFoco = document.activeElement === (k < 0 ? ant : prox).current ? k : 0; mudar(k); };
  return (
    <div className="seletor-mes" role="group" aria-label={rotulo}>
      <button ref={ant} onClick={() => trocar(-1)} aria-label="Mês anterior" aria-describedby="mes-atual"><ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /></button>
      <b id="mes-atual">{nome[0].toUpperCase() + nome.slice(1)} de {mes.slice(0, 4)}</b>
      <button ref={prox} onClick={() => trocar(1)} aria-label="Próximo mês" aria-describedby="mes-atual"><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></button>
    </div>
  );
}

export function Esqueleto({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="esq" aria-busy="true" aria-label="Carregando">
      <i className="g" />
      {Array.from({ length: linhas }, (_, i) => <div key={i}><i className="c" /><i style={{ width: `${40 + (i * 13) % 30}%` }} /><i style={{ width: '18%', marginLeft: 'auto' }} /></div>)}
    </div>
  );
}

export function Aviso({ tipo = 'at', children, papel = 'status' }: { tipo?: 'at' | 'er' | 'ok' | 'info'; children: ReactNode; papel?: 'status' | 'alert' }) {
  return <div className={`aviso ${tipo === 'at' ? '' : tipo}`} role={papel}><CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" /><div>{children}</div></div>;
}

// ---------- Folha de baixo com mola criticamente amortecida, que segue o dedo ----------
export function Folha({ aberta, aoFechar, titulo, sub, children }: { aberta: boolean; aoFechar: () => void; titulo: string; sub?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const est = useRef({ y: 0, v: 0, alvo: 0, raf: 0, t0: 0, arrastando: false, inicio: 0, base: 0, hist: [] as { y: number; t: number }[] });
  const [visivel, setVisivel] = useState(aberta);
  const fecharRef = useRef(aoFechar); fecharRef.current = aoFechar;
  const abridor = useRef<HTMLElement | null>(null), fundo = useRef<Element[]>([]);

  const altura = () => (ref.current?.getBoundingClientRect().height ?? 600) + 24;
  const pinta = () => { if (ref.current) ref.current.style.transform = `translateY(${est.current.y}px)`; };
  const passo = (t: number) => {
    const e = est.current, w = (2 * Math.PI) / 0.34, dt = Math.min(0.032, e.t0 ? (t - e.t0) / 1000 : 0.016); e.t0 = t;
    e.v += (-w * w * (e.y - e.alvo) - 2 * w * e.v) * dt; e.y += e.v * dt; pinta();
    if (Math.abs(e.y - e.alvo) < 0.5 && Math.abs(e.v) < 5) { e.y = e.alvo; e.v = 0; e.t0 = 0; e.raf = 0; pinta(); if (e.alvo > 0) setVisivel(false); return; }
    e.raf = requestAnimationFrame(passo);
  };
  const molaPara = (destino: number, vel = est.current.v) => {
    const e = est.current; e.alvo = destino; e.v = vel;
    if (prefereMenosMovimento()) { e.y = destino; pinta(); if (destino > 0) setVisivel(false); return; }
    if (!e.raf) e.raf = requestAnimationFrame(passo);
  };

  useEffect(() => {
    // Com a folha aberta o fundo fica fora do alcance; ao fechar, o foco volta para quem abriu
    if (aberta) {
      abridor.current = document.activeElement as HTMLElement | null;
      const irmaos = ref.current?.parentElement ? [...ref.current.parentElement.children].filter(c => c !== ref.current && !c.classList.contains('veu')) : [];
      fundo.current = [...irmaos, ...document.querySelectorAll('.lateral')]; fundo.current.forEach(el => el.setAttribute('inert', ''));
    } else { fundo.current.forEach(el => el.removeAttribute('inert')); fundo.current = []; if (abridor.current?.isConnected) abridor.current.focus({ preventScroll: true }); abridor.current = null; }
    if (aberta) { setVisivel(true); requestAnimationFrame(() => { const e = est.current; if (!e.raf && e.y === 0) { e.y = altura(); pinta(); } molaPara(0); ref.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus({ preventScroll: true }); }); }
    else if (visivel) molaPara(altura());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);
  useEffect(() => () => cancelAnimationFrame(est.current.raf), []);
  useEffect(() => {
    if (!aberta) return;
    const esc = (ev: KeyboardEvent) => {
      if (document.querySelector('.dialogo.on')) return; // o diálogo por cima responde primeiro
      if (ev.key === 'Escape') fecharRef.current();
      if (ev.key === 'Tab' && ref.current) { // o foco não sai da folha
        const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea')];
        if (!f.length) return;
        const p = f[0], u = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === p) { ev.preventDefault(); u.focus(); } else if (!ev.shiftKey && document.activeElement === u) { ev.preventDefault(); p.focus(); }
      }
    };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [aberta]);

  const baixo = (ev: React.PointerEvent) => {
    if (!(ev.target as HTMLElement).closest('.pega, .cab')) return;
    const e = est.current; e.arrastando = true; ref.current!.setPointerCapture(ev.pointerId); cancelAnimationFrame(e.raf); e.raf = 0; e.t0 = 0;
    e.inicio = ev.clientY; e.base = e.y; e.hist = [{ y: ev.clientY, t: ev.timeStamp }];
  };
  const move = (ev: React.PointerEvent) => {
    const e = est.current; if (!e.arrastando) return;
    let d = e.base + ev.clientY - e.inicio;
    if (d < 0) d = -(-d * 120 * 0.55) / (120 + 0.55 * -d); // resistência ao puxar para cima
    e.y = d; pinta(); e.hist.push({ y: ev.clientY, t: ev.timeStamp }); if (e.hist.length > 5) e.hist.shift();
  };
  const solta = () => {
    const e = est.current; if (!e.arrastando) return; e.arrastando = false;
    const a = e.hist[0], b = e.hist[e.hist.length - 1]; const v = b.t > a.t ? (b.y - a.y) / ((b.t - a.t) / 1000) : 0;
    if (e.y + (v / 1000) * 0.998 / 0.002 > altura() * 0.5) { molaPara(altura(), v); fecharRef.current(); } else molaPara(0, v);
  };

  if (!visivel && !aberta) return null;
  return (
    <>
      <div className={`veu ${aberta ? 'on' : ''}`} onClick={aoFechar} />
      <div ref={ref} className="folha" role="dialog" aria-modal="true" aria-label={titulo} style={{ visibility: 'visible' }}
        onPointerDown={baixo} onPointerMove={move} onPointerUp={solta} onPointerCancel={solta}>
        <div className="pega" aria-hidden="true"><i /></div>
        <div className="cab"><h2>{titulo}</h2>{sub ? <p className="num">{sub}</p> : null}</div>
        <div className="corpo">{children}</div>
      </div>
    </>
  );
}

// ---------- Diálogo de confirmação para ações destrutivas ----------
export type Confirmacao = { titulo: string; texto: string; rotulo: string; aoConfirmar: () => void } | null;
export function Dialogo({ pedido, aoFechar }: { pedido: Confirmacao; aoFechar: () => void }) {
  const manter = useRef<HTMLButtonElement>(null);
  const [ultimo, setUltimo] = useState(pedido);
  const caixa = useRef<HTMLDivElement>(null), abridor = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (pedido) { abridor.current = document.activeElement as HTMLElement | null; setUltimo(pedido); setTimeout(() => manter.current?.focus(), 0); }
    else if (abridor.current) { if (abridor.current.isConnected) abridor.current.focus({ preventScroll: true }); abridor.current = null; }
  }, [pedido]);
  useEffect(() => {
    if (!pedido) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
      if (e.key === 'Tab') { // o foco fica entre os dois botões
        const f = [...(caixa.current?.querySelectorAll<HTMLElement>('button') ?? [])], i = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [pedido, aoFechar]);
  const p = pedido ?? ultimo;
  return (
    <>
      {pedido ? <div className="veu on" onClick={aoFechar} /> : null}
      <div ref={caixa} className={`dialogo ${pedido ? 'on' : ''}`} role="alertdialog" aria-modal="true" aria-hidden={!pedido} inert={!pedido} aria-labelledby="dlg-t" aria-describedby="dlg-p">
        <h2 id="dlg-t">{p?.titulo}</h2><p id="dlg-p">{p?.texto}</p>
        <div className="acoes" style={{ marginTop: 6 }}>
          <button ref={manter} className="bt secundario" onClick={aoFechar}>Manter</button>
          <button className="bt perigo" onClick={() => { const f = p?.aoConfirmar; aoFechar(); f?.(); }}>{p?.rotulo}</button>
        </div>
      </div>
    </>
  );
}

// ---------- Valor: o número como protagonista (R$ e centavos discretos) ----------
export function Valor({ c, tamanho = 'g', className = '' }: { c: number; tamanho?: 'gg' | 'g' | 'm'; className?: string }) {
  const txt = reais(c).replace(' ', ' ');
  const neg = txt.startsWith('-');
  const [inteiro, cent] = txt.replace(/^-?R\$ /, '').split(',');
  return (
    <span className={`valor valor-${tamanho} num ${neg ? 'neg ' : ''}${className}`}>
      <span className="sr">{txt}</span>
      <span className="valor-moeda" aria-hidden="true">R$</span>
      <span className="valor-inteiro" aria-hidden="true">{neg ? '\u2212' : ''}{inteiro}</span>
      <span className="valor-cent" aria-hidden="true">,{cent}</span>
    </span>
  );
}

// ---------- Divisão do total por pessoa: o único gráfico, com a pergunta "de quem é esse dinheiro?" ----------
export type FatiaDivisao = { pessoa: Pessoa | null; valor: number; rotulo?: string; conferir?: boolean; acao?: () => void };
export function Divisao({ total, fatias, sub, children }: { total: number; fatias: FatiaDivisao[]; sub?: ReactNode; children?: ReactNode }) {
  const visiveis = fatias.filter(f => f.valor > 0);
  const descricao = fatias.map(f => `${f.rotulo ?? f.pessoa?.nome ?? 'Sem dono'} ${reais(f.valor)}`).join(', ');
  return (
    <section className="heroi" aria-label="Total do mês e quem paga quanto">
      <Valor c={total} tamanho="gg" />
      {sub ? <p className="heroi-sub">{sub}</p> : null}
      <div className="regua" role="img" aria-label={`Divisão: ${descricao}`}>
        {visiveis.map((f, i) => {
          const cl = f.pessoa ? classePessoa(f.pessoa) : f.conferir ? 'c' : 'x';
          return <span key={i} className={`regua-fatia ${cl}`} style={{ flexGrow: f.valor, ...(cl === 'outro' ? { background: f.pessoa!.cor } : null) }} />;
        })}
      </div>
      <ul className="legenda num">
        {fatias.map((f, i) => {
          const conteudo = <>{f.conferir ? <span className="selo c"><b aria-hidden="true"><Copy size={12} strokeWidth={2.25} /></b>{f.rotulo}</span> : <Selo pessoa={f.pessoa} semDono={f.rotulo} />}<Valor c={f.valor} tamanho="m" /></>;
          return <li key={i}>{f.acao ? <button onClick={f.acao}>{conteudo}</button> : <div>{conteudo}</div>}</li>;
        })}
      </ul>
      {children}
    </section>
  );
}
export const classePessoa = (p: Pessoa) => ({ Pedro: 'p', Bruna: 'b', Eliete: 'e', Lucimar: 'l' } as Record<string, string>)[p.nome] ?? 'outro';

/** Ícone de estado vazio: um por situação, num círculo suave. */
export const IconeVazio = ({ icone: I }: { icone: LucideIcon }) => <span className="vazio-icone" aria-hidden="true"><I size={22} strokeWidth={1.75} /></span>;
