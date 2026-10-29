import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

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
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f2f3f6' }, { media: '(prefers-color-scheme: dark)', color: '#0d0f15' }],
};

// Aplica o tema escolhido antes de desenhar, para a tela não piscar
const TEMA = "try{var t=localStorage.getItem('bp-tema');if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t)}catch(e){}";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: TEMA }} /></head>
      <body>{children}</body>
    </html>
  );
}
