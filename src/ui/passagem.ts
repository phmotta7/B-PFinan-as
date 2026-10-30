// Passagem da entrada para o app: o painel escuro do login encolhe até virar o cofre da primeira tela.
// A volta do Google recarrega a página, então um aviso no sessionStorage diz que a pessoa estava entrando.

const CHAVE = 'bp-entrando';
let painel: { caixa: DOMRect; raio: string } | null = null;

export function guardarPainel(el: HTMLElement) { painel = { caixa: el.getBoundingClientRect(), raio: getComputedStyle(el).borderRadius }; }
export function marcarEntrada() { try { sessionStorage.setItem(CHAVE, '1'); } catch {} }
export function esquecerEntrada() { try { sessionStorage.removeItem(CHAVE); } catch {} }
export function voltandoDaEntrada() { try { return sessionStorage.getItem(CHAVE) === '1'; } catch { return false; } }

const SAIDA = 'cubic-bezier(.22,1,.36,1)';

/** Chamada quando a primeira tela do app aparece. Sem painel guardado (app aberto já logado), não faz nada. */
export function fazerPassagem(tela: HTMLElement) {
  const de = painel; painel = null; esquecerEntrada();
  if (!de) return;
  const alvo = tela.querySelector<HTMLElement>('.heroi');
  // Menos movimento, ou primeira tela sem cofre: só acende
  if (!alvo || matchMedia('(prefers-reduced-motion: reduce)').matches) { tela.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); return; }
  const para = alvo.getBoundingClientRect(), raio = getComputedStyle(alvo).borderRadius;
  const ponte = document.createElement('div');
  ponte.className = 'ponte-cofre'; ponte.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ponte);
  alvo.style.visibility = 'hidden';
  const caixa = (r: DOMRect, borda: string) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: borda });
  const mov = ponte.animate([caixa(de.caixa, de.raio), caixa(para, raio)], { duration: 420, easing: SAIDA, fill: 'forwards' });
  // O resto da tela acende enquanto o painel chega; os valores do cofre aparecem prontos quando ele encaixa
  tela.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 200, easing: SAIDA, fill: 'backwards' });
  const fim = () => { alvo.style.visibility = ''; ponte.remove(); };
  mov.onfinish = fim; mov.oncancel = fim;
}
