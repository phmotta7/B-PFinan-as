'use client';
import { useState } from 'react';

export function Login({ negado, entrar }: { negado?: string; entrar: () => Promise<void> }) {
  const [entrando, setEntrando] = useState(false);
  return (
    <div className="login">
      <div className="login-cofre">
        <img src="/marca.svg" alt="" width={64} height={64} />
        <h1>B&amp;P Finanças</h1>
        <p>A fatura do mês dividida por pessoa, pronta para mandar no WhatsApp.</p>
        <div className="login-regua" aria-hidden="true"><i className="p" /><i className="b" /><i className="e" /><i className="l" /></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {negado ? (
          <div className="aviso er" role="alert"><div><p>O e-mail {negado} não está na lista da casa. Peça para o Pedro ou a Bruna incluir você em Mais → Quem pode entrar.</p></div></div>
        ) : null}
        <button className="bt google cheio" disabled={entrando} aria-busy={entrando} onClick={async () => { setEntrando(true); try { await entrar(); } catch { setEntrando(false); } }}>
          {entrando ? <><span className="giro" aria-hidden="true" />Entrando</> : <><GoogleG />Entrar com Google</>}
        </button>
        <p className="mini" style={{ textAlign: 'center' }}>Só Pedro e Bruna têm acesso.</p>
      </div>
    </div>
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
