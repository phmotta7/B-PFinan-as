'use client';
// Casca do app: faixa do modo demonstração, tela atual, barra de baixo (D10) e avisos com Desfazer.
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { House, CreditCard, Plus, ReceiptText, Ellipsis } from 'lucide-react';
import { ProvedorApp, RAIZ, useApp, type NomeTela } from './estado';
import { Dialogo } from './comum';
import { Inicio, Cartoes } from './telas/Inicio';
import { Fatura } from './telas/Fatura';
import { Importar } from './telas/Importar';
import { Conciliacao } from './telas/Conciliacao';
import { Lancar } from './telas/Lancar';
import { Fechamentos } from './telas/Fechamentos';
import { Mais, Dividas, Pessoas, CfgCartoes, Categorias, Emails, Exportar } from './telas/Mais';

const TELAS: Record<NomeTela, () => React.ReactElement | null> = {
  inicio: Inicio, cartoes: Cartoes, fatura: Fatura, importar: Importar, conciliacao: Conciliacao, lancar: Lancar, fechamentos: Fechamentos,
  mais: Mais, dividas: Dividas, pessoas: Pessoas, 'cfg-cartoes': CfgCartoes, categorias: Categorias, emails: Emails, exportar: Exportar,
};
const ABAS = [['inicio', 'Início', House], ['cartoes', 'Cartões', CreditCard], ['lancar', 'Lançar', Plus], ['fechamentos', 'Fechamentos', ReceiptText], ['mais', 'Mais', Ellipsis]] as const;
const SEM_BARRA: NomeTela[] = ['importar', 'lancar'];
const DE_MAIS: NomeTela[] = ['dividas', 'pessoas', 'cfg-cartoes', 'categorias', 'emails', 'exportar', 'conciliacao'];

function Casca() {
  const { rota, ir, modo, hoje, confirmacao, fecharConfirmacao, recomecarDemo, confirmar } = useApp();
  const Tela = TELAS[rota.tela] ?? Inicio;
  const comBarra = !SEM_BARRA.includes(rota.tela);
  // Transição com propósito: entrar numa tela mais funda desliza da direita; trocar de aba ou de mês só acende
  const anterior = useRef(rota.tela);
  const entrada = rota.tela === anterior.current ? 'acende' : RAIZ.includes(rota.tela) ? 'acende' : RAIZ.includes(anterior.current) ? 'lado' : 'acende';
  useEffect(() => { anterior.current = rota.tela; }, [rota.tela]);
  const aba = RAIZ.includes(rota.tela) ? rota.tela : rota.tela === 'fatura' ? 'cartoes' : DE_MAIS.includes(rota.tela) ? 'mais' : 'inicio';
  return (
    <div className="tela">
      <nav className="lateral" aria-label="Navegação principal">
        <div className="lateral-marca"><img src="/marca.svg" alt="" width={36} height={36} /><b>B&amp;P Finanças</b></div>
        <button className="bt principal lateral-lancar" onClick={() => ir({ tela: 'lancar' })}><Plus size={20} strokeWidth={1.75} aria-hidden="true" />Lançar compra</button>
        {ABAS.filter(([k]) => k !== 'lancar').map(([k, nome, Icone]) => (
          <button key={k} className="lateral-item" aria-current={aba === k ? 'page' : undefined} onClick={() => ir({ tela: k })}><Icone size={22} strokeWidth={1.75} aria-hidden="true" />{nome}</button>))}
      </nav>
      <div className="coluna" data-entrada={entrada}>
      {modo === 'demo' ? (
        <div className="faixa-demo" role="note"><span>Modo demonstração · dados fictícios · hoje é {hoje.split('-').reverse().join('/')}</span>
          <button onClick={() => confirmar({ titulo: 'Recomeçar a demonstração?', texto: 'Os dados fictícios voltam ao começo do cenário (03/11, antes de importar).', rotulo: 'Recomeçar', aoConfirmar: recomecarDemo })}>Recomeçar</button></div>
      ) : null}
      <Tela key={rota.tela + (rota.cartao ?? '') + (rota.mes ?? '') + (rota.filtro ?? '')} />
      {comBarra ? (
        <nav className="barra" aria-label="Navegação">{ABAS.map(([k, nome, Icone]) => k === 'lancar'
          ? <button key={k} className="lancar" onClick={() => ir({ tela: 'lancar' })}><span><Icone size={24} strokeWidth={1.75} aria-hidden="true" /></span>{nome}</button>
          : <button key={k} aria-current={aba === k ? 'page' : undefined} onClick={() => ir({ tela: k })}><Icone size={24} strokeWidth={1.75} aria-hidden="true" />{nome}</button>)}
        </nav>
      ) : null}
      </div>
      <Dialogo pedido={confirmacao} aoFechar={fecharConfirmacao} />
      <Toaster position="bottom-center" offset={comBarra ? 100 : 24} mobileOffset={comBarra ? 100 : 24} duration={5000} visibleToasts={1}
        toastOptions={{ unstyled: true, classNames: { toast: 'toast on', title: 'toast-titulo', actionButton: 'toast-acao', error: 'toast-erro' } }} />
    </div>
  );
}

export default function App() {
  return <ProvedorApp><Casca /></ProvedorApp>;
}
