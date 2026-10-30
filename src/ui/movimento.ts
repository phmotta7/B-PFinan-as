// Movimentos que o CSS sozinho não faz: mostrar onde uma linha mudou, recolher um cartão que sai, abrir mais opções.
// Curtos, interrompíveis e sem tocar em números. Com "reduzir movimento", nada se desloca: só troca de opacidade.

export const SAIDA = 'cubic-bezier(.22,1,.36,1)';
export const menosMovimento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Voltar de tela: o "voltar" do app e o do celular avisam aqui, e a casca faz o conteúdo chegar da esquerda
let voltando = false;
export const marcarVolta = () => { voltando = true; };
export const tomarVolta = () => { const v = voltando; voltando = false; return v; };

/** A linha acende em azul-claro e se apaga; o selo novo entra "carimbando". O valor não mexe. */
export function destacar(el: HTMLElement | null) {
  if (!el) return;
  const estilo = getComputedStyle(el), cor = estilo.getPropertyValue('--acao-leve').trim();
  el.animate([{ backgroundColor: cor }, { backgroundColor: cor, offset: 0.25 }, { backgroundColor: estilo.backgroundColor }], { duration: 700, easing: 'ease-out' });
  el.querySelector('.selo')?.animate(menosMovimento() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'none' }],
    { duration: menosMovimento() ? 150 : 200, easing: SAIDA });
}

/** Recolhe um cartão que vai sair da lista: encolhe a altura (e o espaço até o próximo), para quem está embaixo subir no lugar.
 *  Devolve uma função que desfaz o recolhimento, caso a mudança não seja gravada. */
export async function recolher(el: HTMLElement | null): Promise<() => void> {
  if (!el) return () => undefined;
  el.style.pointerEvents = 'none';
  const vao = parseFloat(getComputedStyle(el.parentElement ?? el).rowGap) || 0;
  const anim = menosMovimento()
    ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' })
    : el.animate([
      { height: `${el.offsetHeight}px`, opacity: 1, overflow: 'hidden' },
      { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px', marginBottom: `${-vao}px`, overflow: 'hidden' },
    ], { duration: 220, easing: SAIDA, fill: 'forwards' });
  await anim.finished.catch(() => undefined);
  return () => { anim.cancel(); el.style.pointerEvents = ''; };
}

/** Abre mais opções no mesmo lugar (ex.: "Outras…" nas categorias): a caixa cresce da altura de antes e as opções novas acendem. */
export function crescer(el: HTMLElement | null, antes: { altura: number; textos: Set<string> }) {
  if (!el) return;
  const alturaAntes = antes.altura;
  const novos = Array.from(el.children).filter(n => !antes.textos.has(n.textContent ?? ''));
  novos.forEach(n => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: menosMovimento() ? 150 : 220, easing: SAIDA }));
  if (menosMovimento()) return;
  el.animate([{ height: `${alturaAntes}px`, overflow: 'hidden' }, { height: `${el.offsetHeight}px`, overflow: 'hidden' }], { duration: 220, easing: SAIDA });
}
/** Foto da caixa antes de abrir mais opções, para o crescer() saber de onde partir. */
export const fotografar = (el: HTMLElement | null) => ({ altura: el?.offsetHeight ?? 0, textos: new Set(Array.from(el?.children ?? []).map(n => n.textContent ?? '')) });
