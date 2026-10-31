'use client';
// Peças da divisão de compras (PLANEJAMENTO §4.6.1), usadas na folha "De quem é?" e na tela Lançar.
import { Check, CircleAlert } from 'lucide-react';
import { Selo, reais } from './comum';
import { faltaDividir, partesIguais, type Parte } from '@/dominio/divisao';
import { lerValorDigitado } from '@/dominio/dinheiro';
import type { Pessoa } from '@/dados/tipos';

export const emTexto = (c: number) => (c / 100).toFixed(2).replace('.', ',');
/** "Pedro", "Pedro e Bruna", "Pedro, Bruna e Eliete" */
export const juntar = (nomes: string[]) => nomes.length < 2 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
/** Valores em texto (como no campo) para partes iguais de um total */
export const valoresIguais = (total: number, quem: string[]) => Object.fromEntries(partesIguais(total, quem).map(p => [p.pessoa, emTexto(p.valor)]));
export const lerPartes = (quem: string[], valores: Record<string, string>): Parte[] => quem.map(p => ({ pessoa: p, valor: lerValorDigitado(valores[p] ?? '') }));

/** "Quanto cada um paga": um campo por pessoa, e embaixo se a soma fecha com o total. */
export function QuantoCadaUm({ pessoas, quem, valores, mudar, iguais, total, parcelas }: {
  pessoas: Pessoa[]; quem: string[]; valores: Record<string, string>; mudar: (v: Record<string, string>) => void; iguais: () => void; total: number; parcelas: number;
}) {
  const falta = faltaDividir(total, lerPartes(quem, valores));
  const nome = (id: string) => pessoas.find(p => p.id === id);
  return (
    <div className="campo"><span className="rot">Quanto cada um paga</span>
      <div className="divisao">{quem.map(id => (
        <div key={id} className="divisao-linha"><Selo pessoa={nome(id)} />
          <div className="entrada"><span aria-hidden="true">R$</span><input inputMode="decimal" autoComplete="off" aria-label={`Parte de ${nome(id)?.nome ?? ''}`} value={valores[id] ?? ''}
            onChange={ev => mudar({ ...valores, [id]: ev.target.value.replace(/[^\d,.]/g, '') })} /></div></div>))}</div>
      <div className="divisao-pe" aria-live="polite">
        {falta === 0 ? <span className="pil ok"><Check size={14} strokeWidth={2.25} aria-hidden="true" />Fecha com {reais(total)}</span>
          : <span className="pil at"><CircleAlert size={14} strokeWidth={2.25} aria-hidden="true" />{falta > 0 ? `Faltam ${reais(falta)}` : `Passou ${reais(-falta)}`}</span>}
        <button className="bt discreto" onClick={iguais}>Partes iguais</button></div>
      {parcelas > 1 ? <p className="ajuda">Valores da compra inteira, {reais(total)} em {parcelas}x. Cada parcela é dividida na mesma proporção.</p> : null}
    </div>
  );
}
