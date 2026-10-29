import type { Metadata, Viewport } from 'next';
import { Figtree, Geist } from 'next/font/google';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'], weight: ['500', '600', '700', '800'], display: 'swap', variable: '--figtree' });
const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--geist' });

export const metadata: Metadata = {
  title: 'B&P Finanças',
  description: 'A fatura do mês dividida por pessoa, pronta para mandar no WhatsApp.',
  applicationName: 'B&P Finanças',
  appleWebApp: { capable: true, title: 'B&P', statusBarStyle: 'default' },
  icons: { icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/favicon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f1efeb' }, { media: '(prefers-color-scheme: dark)', color: '#141519' }],
};

// Aplica o tema escolhido antes de desenhar, para a tela não piscar
// e o estilo em avaliação (propostas premium): ?estilo=papel ou ?estilo=cofre, lembrado neste aparelho
const TEMA = "try{var t=localStorage.getItem('bp-tema');if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t)}catch(e){}" +
  "try{var q=new URLSearchParams(location.search).get('estilo');if(q)localStorage.setItem('bp-estilo',q);var e=q||localStorage.getItem('bp-estilo')||'papel';if(e!=='antes')document.documentElement.setAttribute('data-estilo',e)}catch(e){document.documentElement.setAttribute('data-estilo','papel')}";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${geist.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: TEMA }} /></head>
      <body>{children}</body>
    </html>
  );
}
