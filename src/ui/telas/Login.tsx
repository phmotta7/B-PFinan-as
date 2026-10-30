'use client';
// Entrada: o painel da marca é o cofre. No alto, uma fatura de exemplo em que cada compra ganha o selo de uma pessoa;
// embaixo, logo, nome, frase e a régua que soma tudo nas quatro cores. No computador, o painel ocupa a esquerda e o botão fica à direita.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { CircleAlert } from 'lucide-react';
import { esquecerEntrada, guardarPainel, marcarEntrada } from '../passagem';

// Na ordem da régua (Pedro, Bruna, Eliete, Lucimar)
const COMPRAS = [
  { placa: 'IF', loja: 'iFood', cl: 'p', nome: 'Pedro', valor: 'R$ 58,90', peso: 58.9 },
  { placa: 'MC', loja: 'Mercado Central', cl: 'b', nome: 'Bruna', valor: 'R$ 312,40', peso: 312.4 },
  { placa: 'RN', loja: 'Renner', cl: 'e', nome: 'Eliete', valor: 'R$ 189,99', peso: 189.99 },
  { placa: 'DR', loja: 'Drogasil', cl: 'l', nome: 'Lucimar', valor: 'R$ 96,15', peso: 96.15 },
];
// Atraso de cada peça na entrada em sequência (tudo termina antes de 0,8 s)
const em = (ms: number) => ({ '--a': `${ms}ms` }) as CSSProperties;
const Selo = ({ c, style }: { c: (typeof COMPRAS)[number]; style?: CSSProperties }) => (
  <span className={`selo ${c.cl}`} data-ent={style ? 'carimbo' : undefined} style={style}><b aria-hidden="true">{c.nome[0]}</b>{c.nome}</span>
);

export function Login({ negado, falhou, entrando: voltando, entrar }: { negado?: string; falhou?: boolean; entrando?: boolean; entrar: () => Promise<void> }) {
  const [entrando, setEntrando] = useState(!!voltando);
  const [erro, setErro] = useState(!!falhou);
  const painel = useRef<HTMLElement>(null);
  // Enquanto entra, guarda onde está o painel: a primeira tela do app parte dele
  useLayoutEffect(() => { if (entrando && painel.current) guardarPainel(painel.current); });
  useEffect(() => { if (negado || falhou) esquecerEntrada(); }, [negado, falhou]);
  const clicar = async () => {
    setErro(false); setEntrando(true); marcarEntrada();
    try { await entrar(); } catch { esquecerEntrada(); setEntrando(false); setErro(true); }
  };
  return (
    <main className={`login${voltando ? ' sem-entrada' : ''}${negado || erro ? ' com-aviso' : ''}`}>
      <section className="login-painel" ref={painel}>
        <div className="login-ilus" aria-hidden="true">
          <div className="login-fatura" data-ent="acende" style={em(0)}>
            <div className="login-fatura-cab"><span>Fatura Nubank · novembro</span><span>4 compras</span></div>
            {COMPRAS.map((c, i) => (
              <div key={c.loja} className="login-compra" data-ent="surge" style={em(40 + i * 50)}>
                <span className="login-placa">{c.placa}</span>
                <span><span className="login-loja">{c.loja}</span><Selo c={c} style={em(200 + i * 60)} /></span>
                <span className="login-valor">{c.valor}</span>
              </div>))}
          </div>
        </div>
        <div className="login-marca">
          <img src="/marca.svg" alt="" width={52} height={52} data-ent="surge" style={em(80)} />
          <h1 data-ent="surge" style={em(140)}>B&amp;P Finanças</h1>
          <p data-ent="surge" style={em(200)}>A fatura do mês dividida por pessoa, pronta para mandar no WhatsApp.</p>
          <div className="login-regua" role="img" aria-label="As quatro pessoas da casa: Pedro, Bruna, Eliete e Lucimar" data-ent="acende" style={em(300)}>
            {COMPRAS.map((c, i) => <i key={c.cl} className={c.cl} data-ent="enche" style={{ flexGrow: c.peso, ...em(340 + i * 70) }} />)}
          </div>
          <div className="login-legenda" aria-hidden="true" data-ent="acende" style={em(560)}>{COMPRAS.map(c => <Selo key={c.cl} c={c} />)}</div>
        </div>
      </section>
      <section className="login-acesso"><div>
        <div className="login-cab" data-ent="surge" style={em(200)}><h2>Entrar</h2><p>Use a conta Google cadastrada na casa.</p></div>
        {negado ? (
          <div className="aviso er" role="alert"><CircleAlert className="ic" aria-hidden="true" /><p>O e-mail {negado} não está na lista da casa. Peça para o Pedro ou a Bruna incluir você em Mais → Quem pode entrar.</p></div>
        ) : erro ? (
          <div className="aviso er" role="alert"><CircleAlert className="ic" aria-hidden="true" /><p>Não consegui concluir a entrada com o Google. Confira a internet e toque para tentar de novo.</p></div>
        ) : null}
        <div data-ent="surge" style={em(480)}>
          <button className="bt google cheio" disabled={entrando} aria-busy={entrando} onClick={clicar}>
            {entrando ? <><span className="giro" aria-hidden="true" />Entrando</>
              : <><GoogleG />{negado ? 'Entrar com outra conta' : erro ? 'Tentar de novo' : 'Entrar com Google'}</>}
          </button>
        </div>
      </div></section>
    </main>
  );
}

const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8a10.1 10.1 0 0 1-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7A22 22 0 0 0 24 46z" />
    <path fill="#FBBC05" d="M11.8 28.2a13.2 13.2 0 0 1 0-8.4v-5.7H4.5a22 22 0 0 0 0 19.8z" />
    <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3A22 22 0 0 0 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
  </svg>
);
