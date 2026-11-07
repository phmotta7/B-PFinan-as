'use client';
// Orçamento (T13, §9) e Metas (T14, §10) da Etapa 3. Carteira Casal: os dois veem e mexem; carteira pessoal: só o dono (regra no banco).
// Aviso de orçamento em âmbar nos dois níveis (80% e 100%): o sistema de design não usa vermelho para dinheiro (DESIGN.md).
import { useState } from 'react';
import { CircleAlert, PiggyBank, Plus, Target } from 'lucide-react';
import { useApp } from '../estado';
import { Folha, IconeVazio, SeletorMes, Topo, Valor, mesLongo, reais } from '../comum';
import { custoFixo, emObservacao, fimDaObservacao, limiteVigente, orcamentoDoMes, progressoDaMeta, type LinhaOrcamento } from '@/dados/etapa3';
import { novoId, salvar } from '@/dados/operacoes';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { mesCurto } from '@/dominio/mensagem';
import { somarMeses, type Mes } from '@/dominio/ciclo';
import { mudancaVazia, type Meta, type Retrato } from '@/dados/tipos';

const texto = (c?: number | null) => (c ? (c / 100).toFixed(2).replace('.', ',') : '');
const MESES_RESERVA = 3; // decidido com o Pedro em 07/11/2026
/** Carteiras que quem está usando pode ver: Casal e a própria. */
export const minhasCarteiras = (r: Retrato, eu?: string): [string, string][] => [['casal', 'Casal'], ...(eu ? [[eu, r.pessoa.find(p => p.id === eu)?.nome ?? 'Eu'] as [string, string]] : [])];

// ---------- Orçamento ----------
function FolhaLimite({ l, carteira, mes, aoFechar }: { l: LinhaOrcamento | null; carteira: string; mes: Mes; aoFechar: () => void }) {
  const { r, executar } = useApp();
  const [ultima, setUltima] = useState<LinhaOrcamento | null>(null);
  if (l && l !== ultima) setUltima(l);
  const x = l ?? ultima;
  const [valor, setValor] = useState('');
  const [de, setDe] = useState('');
  if (x && de !== x.categoria + carteira) { setDe(x.categoria + carteira); setValor(texto(x.limite ?? x.sugestao)); }
  if (!x) return null;
  const v = lerValorDigitado(valor);
  const vigente = limiteVigente(r, carteira, x.categoria, mes);
  const definir = async () => {
    aoFechar();
    const reg = vigente && vigente.desde === mes ? { ...vigente, limite: v } : { id: novoId(), carteira, categoria: x.categoria, limite: v, desde: mes };
    await executar(salvar(r, 'orcamento', reg), `${x.nome}: limite de ${reais(v)} a partir de ${mesLongo(mes).toLowerCase()}.`);
  };
  const tirar = async () => {
    aoFechar();
    const m = mudancaVazia(); m.apagar.orcamento = r.orcamento.filter(o => o.carteira === carteira && o.categoria === x.categoria).map(o => o.id);
    await executar(m, `${x.nome}: sem limite.`);
  };
  return (
    <Folha aberta={!!l} aoFechar={aoFechar} titulo={x.nome} sub={`${reais(x.gasto + x.previsto)} em ${mesLongo(mes).toLowerCase()}${x.limite ? ` de ${reais(x.limite)}` : ''}`}>
      <div className="campo"><label htmlFor="f-lim">Limite por mês</label><div className="entrada valor"><span>R$</span><input id="f-lim" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
      {x.sugestao ? <button className="chip" onClick={() => setValor(texto(x.sugestao))}>Usar a média: {reais(x.sugestao)}</button> : null}
      <p className="mini">Vale a partir de {mesLongo(mes).toLowerCase()} e continua nos meses seguintes até você mudar.</p>
      <button className="bt principal cheio" disabled={!v} onClick={definir}>Definir limite</button>
      {vigente ? <button className="bt secundario cheio" onClick={tirar}>Tirar o limite</button> : null}
    </Folha>
  );
}

export function Orcamento() {
  const { r, rota, usuario, mesDeTrabalho, ir, voltar, podeVoltar } = useApp();
  const mes = rota.mes ?? mesDeTrabalho;
  const carteiras = minhasCarteiras(r, usuario?.id);
  const carteira = carteiras.some(([k]) => k === rota.filtro) ? rota.filtro! : 'casal';
  const [aberta, setAberta] = useState<LinhaOrcamento | null>(null);
  const linhas = orcamentoDoMes(r, mes, carteira);
  const comLimite = linhas.filter(l => l.limite), semLimite = linhas.filter(l => !l.limite && l.gasto + l.previsto > 0);
  const trocar = (m: Mes, c: string) => ir({ tela: 'orcamento', mes: m, filtro: c === 'casal' ? undefined : c });
  const linha = (l: LinhaOrcamento) => {
    const usado = l.gasto + l.previsto, pct = l.limite ? Math.min(1, usado / l.limite) : 0, pctPrev = l.limite ? Math.min(1, l.gasto / l.limite) : 0;
    return (
      <li key={l.categoria}><button className="cats-item" onClick={() => setAberta(l)} aria-label={`${l.nome}, ${reais(usado)}${l.limite ? ` de ${reais(l.limite)}` : ''}. Definir limite`}>
        <span className="cats-nome">{l.nome}<small>{l.limite ? (l.estado === 'passou' ? `passou ${reais(usado - l.limite)}` : `sobram ${reais(l.limite - usado)}`) : l.sugestao ? `média ${reais(l.sugestao)}` : 'sem limite'}{l.previsto ? ` · ${reais(l.previsto)} previsto no cartão` : ''}</small></span>
        <span className="cats-v">{reais(usado)}{l.limite ? <small className="mini"> / {reais(l.limite)}</small> : null}</span>
        {l.limite ? <span className={`cats-barra orc ${l.estado}`} aria-hidden="true"><i className="prev" style={{ width: `${pct * 100}%` }} /><i style={{ width: `${pctPrev * 100}%` }} /></span> : null}
      </button></li>);
  };
  return (<>
    <Topo titulo="Orçamento" voltar={podeVoltar ? voltar : () => ir({ tela: 'mais' })} abaixo={<SeletorMes mes={mes} mudar={k => trocar(somarMeses(mes, k), carteira)} rotulo="Mês" />} />
    <main className="conteudo">
      <div className="filtros" role="group" aria-label="Carteira">{carteiras.map(([k, n]) => <button key={k} className="chip" aria-pressed={carteira === k} onClick={() => trocar(mes, k)}>{n}</button>)}</div>
      {emObservacao(mes) ? <div className="aviso info" role="status"><CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" /><div><p>Observando os gastos até {mesLongo(somarMeses(fimDaObservacao, -1)).toLowerCase()}. A partir de {mesLongo(fimDaObservacao).toLowerCase()} o app sugere um limite por categoria, pela média. Se quiser, já pode definir os seus.</p></div></div> : null}
      <div className="duas"><div className="col-a">
        <section className="cartao" aria-labelledby="h-lim"><h2 id="h-lim">Com limite</h2>
          {comLimite.length ? <ul className="barras-cat num">{comLimite.map(linha)}</ul> : <p className="mini">Nenhum limite em {mesLongo(mes).toLowerCase()}. Toque numa categoria para definir.</p>}
          {comLimite.length ? <p className="mini">A barra mais clara é o que já está previsto no cartão (parcelas e compras lançadas). Aviso em 80% e quando passa do limite.</p> : null}
        </section>
      </div><div className="col-b">
        <section className="cartao" aria-labelledby="h-sem"><h2 id="h-sem">Sem limite</h2>
          {semLimite.length ? <ul className="barras-cat num">{semLimite.map(linha)}</ul> : <p className="mini">Nenhum gasto sem limite neste mês.</p>}
        </section>
      </div></div>
    </main>
    <FolhaLimite l={aberta} carteira={carteira} mes={mes} aoFechar={() => setAberta(null)} />
  </>);
}

/** Avisos de orçamento para o Início: categorias em 80% ou mais, nas carteiras que a pessoa vê. */
export function avisosDeOrcamento(r: Retrato, mes: Mes, eu?: string) {
  return minhasCarteiras(r, eu).flatMap(([c, nome]) => orcamentoDoMes(r, mes, c).filter(l => l.estado === 'perto' || l.estado === 'passou').map(l => ({ ...l, carteira: c, nomeCarteira: nome })));
}

// ---------- Metas ----------
function FolhaMeta({ m, aoFechar }: { m: Meta | null; aoFechar: () => void }) {
  const { r, hoje, usuario, executar, mesDeTrabalho } = useApp();
  const [x, setX] = useState<Meta | null>(null);
  const [alvo, setAlvo] = useState(''); const [aporte, setAporte] = useState(''); const [mov, setMov] = useState(''); const [erro, setErro] = useState('');
  const [de, setDe] = useState<Meta | null>(null);
  if (m && de !== m) { setDe(m); setX(m); setAlvo(texto(m.alvo)); setAporte(texto(m.aportePlanejado)); setMov(''); setErro(''); }
  if (!x || !usuario) return <Folha aberta={false} aoFechar={aoFechar} titulo="">{null}</Folha>;
  const existe = r.meta.some(y => y.id === x.id);
  const p = existe ? progressoDaMeta(r, x, hoje) : null;
  const custo = x.reserva ? custoFixo(r, mesDeTrabalho, x.carteira) : null;
  const sugerido = custo ? custo.total * (x.mesesReserva ?? MESES_RESERVA) : 0;
  const gravar = async () => {
    const a = lerValorDigitado(alvo);
    if (!x.nome.trim()) return setErro('Dê um nome para a meta.');
    if (!a) return setErro('Digite o valor que quer juntar.');
    aoFechar();
    await executar(salvar(r, 'meta', { ...x, nome: x.nome.trim(), alvo: a, aportePlanejado: lerValorDigitado(aporte) || null }), `${x.nome.trim()} salva.`);
  };
  const movimentar = async (tipo: 'aporte' | 'resgate') => {
    const v = lerValorDigitado(mov); if (!v) return setErro('Digite o valor.');
    const mu = mudancaVazia(); mu.inserir.movimento_meta = [{ id: novoId(), meta: x.id, pessoa: usuario.id, tipo, valor: v, data: hoje }];
    setMov(''); setErro('');
    await executar(mu, `${tipo === 'aporte' ? 'Guardado' : 'Retirado'}: ${reais(v)} em ${x.nome}.`);
  };
  return (
    <Folha aberta={!!m} aoFechar={aoFechar} titulo={existe ? x.nome : x.reserva ? 'Reserva de emergência' : 'Nova meta'} sub={p ? `${reais(p.guardado)} de ${reais(x.alvo)}` : 'Guardar dinheiro para um objetivo'}>
      {p ? (<>
        <div className="campo"><label htmlFor="mt-mov">Guardar ou retirar</label><div className="entrada valor"><span>R$</span><input id="mt-mov" inputMode="decimal" placeholder="0,00" value={mov} onChange={e => setMov(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
        <div className="acoes"><button className="bt principal" onClick={() => movimentar('aporte')}>Guardei</button><button className="bt secundario" onClick={() => movimentar('resgate')}>Retirei</button></div>
        <p className="mini">Guardar não é gasto: o dinheiro só muda de lugar. No extrato, marque a transferência como Investimento.</p>
      </>) : null}
      <div className="campo"><label htmlFor="mt-nome">Nome</label><div className="entrada"><input id="mt-nome" value={x.nome} placeholder="Ex.: Viagem" onChange={e => setX({ ...x, nome: e.target.value })} /></div></div>
      <div className="chips" role="group" aria-label="De quem">{minhasCarteiras(r, usuario.id).map(([k, n]) => <button key={k} className="chip" aria-pressed={x.carteira === k} disabled={existe && x.carteira !== k} onClick={() => setX({ ...x, carteira: k })}>{n}</button>)}</div>
      <div className="duas-campos">
        <div className="campo"><label htmlFor="mt-alvo">Quanto juntar</label><div className="entrada valor"><span>R$</span><input id="mt-alvo" inputMode="decimal" value={alvo} onChange={e => setAlvo(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
        <div className="campo"><label htmlFor="mt-ap">Por mês</label><div className="entrada valor"><span>R$</span><input id="mt-ap" inputMode="decimal" placeholder="opcional" value={aporte} onChange={e => setAporte(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
      </div>
      {custo ? <div className="aviso info"><PiggyBank size={20} strokeWidth={1.75} aria-hidden="true" /><div>
        <p>Sugestão: {x.mesesReserva ?? MESES_RESERVA} meses de custo fixo = <b>{reais(sugerido)}</b> ({reais(custo.total)} por mês{custo.itens.length ? `: ${custo.itens.map(i => `${i.nome} ${reais(i.valor)}`).join(', ')}` : ''}).</p>
        {sugerido ? <button className="chip" onClick={() => setAlvo(texto(sugerido))}>Usar {reais(sugerido)}</button> : <p className="mini">Cadastre as contas fixas para o app calcular.</p>}</div></div> : null}
      <div className="campo"><label htmlFor="mt-onde">Onde está guardado</label><div className="entrada"><input id="mt-onde" placeholder="Ex.: caixinha do Nubank" value={x.onde ?? ''} onChange={e => setX({ ...x, onde: e.target.value })} /></div></div>
      {erro ? <p className="ajuda erro">{erro}</p> : null}
      <button className={`bt ${existe ? 'secundario' : 'principal'} cheio`} onClick={gravar}>{existe ? 'Salvar mudanças' : 'Criar meta'}</button>
      {existe ? <button className="bt secundario cheio" onClick={async () => { aoFechar(); await executar(salvar(r, 'meta', { ...x, encerrada: !x.encerrada }), x.encerrada ? 'Meta reaberta.' : 'Meta encerrada.'); }}>{x.encerrada ? 'Reabrir' : 'Encerrar meta'}</button> : null}
    </Folha>
  );
}

export function Metas() {
  const { r, hoje, usuario, ir, voltar, podeVoltar } = useApp();
  const [aberta, setAberta] = useState<Meta | null>(null);
  if (!usuario) return null;
  const nova = (reserva: boolean): Meta => ({ id: novoId(), carteira: 'casal', nome: reserva ? 'Reserva de emergência' : '', alvo: 0, aportePlanejado: null, onde: null, dataAlvo: null, reserva, mesesReserva: reserva ? MESES_RESERVA : null, encerrada: false });
  const metas = [...r.meta].sort((a, b) => Number(a.encerrada) - Number(b.encerrada) || Number(b.reserva) - Number(a.reserva) || a.nome.localeCompare(b.nome));
  const temReserva = r.meta.some(m => m.reserva && !m.encerrada);
  const dono = (c: string) => (c === 'casal' ? 'Casal' : r.pessoa.find(p => p.id === c)?.nome ?? '');
  return (<>
    <Topo titulo="Metas" sub="Reserva de emergência e objetivos" voltar={podeVoltar ? voltar : () => ir({ tela: 'mais' })}
      direita={<button className="chip" onClick={() => setAberta(nova(false))}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Nova</button>} />
    <main className="conteudo">
      {!temReserva ? <div className="vazio"><IconeVazio icone={PiggyBank} /><h2>Comece pela reserva de emergência</h2>
        <p>Dinheiro guardado para {MESES_RESERVA} meses de custo fixo (contas fixas e parcelas de dívida), para um imprevisto não virar dívida. O app calcula o valor com o que está cadastrado.</p>
        <button className="bt principal" onClick={() => setAberta(nova(true))}><Plus size={20} aria-hidden="true" />Criar a reserva</button></div> : null}
      <div className="grade-metas">{metas.map(m => {
        const p = progressoDaMeta(r, m, hoje);
        return (
          <button key={m.id} className="cartao toque" onClick={() => setAberta(m)} aria-label={`${m.nome}, ${reais(p.guardado)} de ${reais(m.alvo)}. Abrir`}>
            <div className="linha-topo"><b style={{ font: 'var(--t-forte)' }}>{m.nome}</b><span className={`pil ${m.encerrada ? 'neutra' : p.falta === 0 ? 'ok' : 'acao'}`}>{m.encerrada ? 'Encerrada' : p.falta === 0 ? 'Chegou' : dono(m.carteira)}</span></div>
            <Valor c={p.guardado} tamanho="m" />
            <span className="cats-barra" aria-hidden="true" style={{ display: 'block' }}><i style={{ width: `${p.pct * 100}%` }} /></span>
            <p className="mini num">{Math.round(p.pct * 100)}% de {reais(m.alvo)}{p.falta && p.chegaEm ? ` · no ritmo de ${reais(p.ritmo)} por mês, chega em ${mesCurto(p.chegaEm)}` : p.falta ? ' · defina quanto guardar por mês para ver a previsão' : ''}{m.onde ? ` · ${m.onde}` : ''}</p>
          </button>);
      })}</div>
      {temReserva && metas.length === 1 ? <div className="vazio"><IconeVazio icone={Target} /><p>Viagem, carro, casa: crie outra meta e registre o que for guardando.</p></div> : null}
      <p className="mini">O app não indica onde investir; só acompanha o que vocês guardam.</p>
    </main>
    <FolhaMeta m={aberta} aoFechar={() => setAberta(null)} />
  </>);
}
