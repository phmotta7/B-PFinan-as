'use client';
// Dívidas (T12, Etapa 3, §8): lista com parcela, restantes, saldo e término; comprometido em cartões; quando ficamos livres; ordem de quitação.
// Dívida Pessoal só aparece para quem paga e para o titular; as de Casal, para os dois (regra no banco, 07/11/2026).
import { useState } from 'react';
import { Check, Landmark, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../estado';
import { Folha, IconeVazio, Selo, Topo, mesLongo, reais } from '../comum';
import { comprometidoEmCartoes, ordemDeQuitacao, quandoFicamosLivres, quitar, situacaoDivida } from '@/dados/etapa3';
import { novoId, remover, salvar } from '@/dados/operacoes';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { mesCurto } from '@/dominio/mensagem';
import type { Divida, Escopo } from '@/dados/tipos';

const TIPOS: [Divida['tipo'], string][] = [['emprestimo', 'Empréstimo'], ['parcelamento_externo', 'Parcelamento'], ['outro', 'Outro']];
const mesAno = (m: string) => `${mesLongo(m).toLowerCase()} de ${m.slice(0, 4)}`;
const texto = (c?: number | null) => (c ? (c / 100).toFixed(2).replace('.', ',') : '');

function FormDivida({ d, aoFechar }: { d: Divida | null; aoFechar: () => void }) {
  const { r, executar, confirmar, usuario } = useApp();
  const [f, setF] = useState<Divida | null>(null);
  const [valor, setValor] = useState(''); const [saldo, setSaldo] = useState(''); const [juros, setJuros] = useState(''); const [erro, setErro] = useState('');
  const [de, setDe] = useState<Divida | null>(null);
  if (d && de !== d) { setDe(d); setF(d); setValor(texto(d.valorParcela)); setSaldo(texto(d.saldoInformado)); setJuros(d.jurosMensal != null ? String(d.jurosMensal).replace('.', ',') : ''); setErro(''); }
  if (!f) return <Folha aberta={false} aoFechar={aoFechar} titulo="">{null}</Folha>;
  const existe = r.divida.some(x => x.id === f.id);
  const num = (k: 'parcelaAtual' | 'totalParcelas' | 'diaVencimento', rot: string) => <div className="campo"><label htmlFor={'dv-' + k}>{rot}</label><div className="entrada"><input id={'dv-' + k} inputMode="numeric" value={String(f[k] || '')} onChange={e => setF({ ...f, [k]: Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 0 })} /></div></div>;
  const pessoas = r.pessoa;
  const gravar = async () => {
    const v = lerValorDigitado(valor), j = juros.trim() ? Number(juros.replace(',', '.')) : null;
    if (!f.nome.trim()) return setErro('Dê um nome para a dívida.');
    if (!v) return setErro('Digite o valor da parcela.');
    if (f.parcelaAtual < 1 || f.totalParcelas < f.parcelaAtual) return setErro('A parcela atual precisa estar entre 1 e o total de parcelas.');
    if (f.diaVencimento < 1 || f.diaVencimento > 31) return setErro('O dia de vencimento vai de 1 a 31.');
    if (j !== null && !(j >= 0 && j < 100)) return setErro('Juros ao mês: um número como 2,5.');
    // Pessoal de alguém de fora (Eliete, Lucimar) é visível para o titular; sem escopo só para quem não é Pedro nem Bruna
    const ehUsuario = r.pessoa.find(p => p.id === f.responsavel)?.tipo === 'usuario';
    aoFechar();
    await executar(salvar(r, 'divida', { ...f, nome: f.nome.trim(), valorParcela: v, jurosMensal: j, saldoInformado: lerValorDigitado(saldo) || null, escopo: ehUsuario ? f.escopo ?? 'pessoal' : null }), `${f.nome.trim()} salva.`);
  };
  return (
    <Folha aberta={!!d} aoFechar={aoFechar} titulo={existe ? f.nome || 'Dívida' : 'Nova dívida'} sub={existe ? `Termina em ${mesAno(situacaoDivida(r, f, f.mesParcelaAtual).fim)}` : 'Empréstimo, parcelamento, crediário'}>
      <div className="campo"><label htmlFor="dv-nome">Nome ou credor</label><div className="entrada"><input id="dv-nome" value={f.nome} placeholder="Ex.: Mercado Pago" onChange={e => setF({ ...f, nome: e.target.value })} /></div></div>
      <div className="chips" role="group" aria-label="Tipo">{TIPOS.map(([k, n]) => <button key={k} className="chip" aria-pressed={f.tipo === k} onClick={() => setF({ ...f, tipo: k })}>{n}</button>)}</div>
      <div className="duas-campos">
        <div className="campo"><label htmlFor="dv-v">Valor da parcela</label><div className="entrada valor"><span>R$</span><input id="dv-v" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
        {num('diaVencimento', 'Dia')}
      </div>
      <div className="duas-campos">{num('parcelaAtual', `Parcela de ${mesCurto(f.mesParcelaAtual)}`)}{num('totalParcelas', 'Total de parcelas')}</div>
      <div className="campo"><span className="rot">Em nome de quem</span><div className="pessoas">{pessoas.filter(p => p.tipo === 'usuario').map(p => <button key={p.id} aria-pressed={f.titular === p.id} onClick={() => setF({ ...f, titular: p.id })}><Selo pessoa={p} grande /></button>)}</div></div>
      <div className="campo"><span className="rot">Quem paga</span><div className="pessoas">{pessoas.map(p => <button key={p.id} aria-pressed={f.responsavel === p.id} onClick={() => setF({ ...f, responsavel: p.id })}><Selo pessoa={p} grande /></button>)}</div>
        {f.responsavel !== f.titular ? <p className="ajuda">A parcela entra no fechamento de {r.pessoa.find(p => p.id === f.responsavel)?.nome} com {r.pessoa.find(p => p.id === f.titular)?.nome}.</p> : null}</div>
      {r.pessoa.find(p => p.id === f.responsavel)?.tipo === 'usuario' ? <div className="seg" data-v={f.escopo === 'casal' ? 1 : 0} role="group" aria-label="Para quê"><span className="pino" aria-hidden="true" />
        <button aria-pressed={f.escopo !== 'casal'} onClick={() => setF({ ...f, escopo: 'pessoal' as Escopo })}>Pessoal</button><button aria-pressed={f.escopo === 'casal'} onClick={() => setF({ ...f, escopo: 'casal' })}>Casal</button></div> : null}
      {f.escopo !== 'casal' && f.responsavel === usuario?.id && f.titular === usuario?.id ? <p className="ajuda">Pessoal e em seu nome: só você vê esta dívida.</p> : null}
      <div className="duas-campos">
        <div className="campo"><label htmlFor="dv-j">Juros ao mês (%)</label><div className="entrada"><input id="dv-j" inputMode="decimal" placeholder="opcional" value={juros} onChange={e => setJuros(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
        <div className="campo"><label htmlFor="dv-s">Saldo devedor</label><div className="entrada valor"><span>R$</span><input id="dv-s" inputMode="decimal" placeholder="opcional" value={saldo} onChange={e => setSaldo(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
      </div>
      {erro ? <p className="ajuda erro">{erro}</p> : null}
      <button className="bt principal cheio" onClick={gravar}>Salvar</button>
      {existe && f.situacao === 'ativa' ? <button className="bt secundario cheio" onClick={() => confirmar({ titulo: `Quitar ${f.nome}?`, texto: 'As parcelas que faltam somem dos fechamentos e do comprometido. A dívida continua na lista como quitada.', rotulo: 'Quitar',
        aoConfirmar: async () => { aoFechar(); await executar(salvar(r, 'divida', quitar(f)), `${f.nome} quitada.`); } })}><Check size={20} aria-hidden="true" />Quitei antes do fim</button> : null}
      {existe ? <button className="bt destrutivo cheio" onClick={() => confirmar({ titulo: `Excluir ${f.nome}?`, texto: 'A dívida sai do app e deixa de entrar nos fechamentos. Os fechamentos já pagos não mudam.', rotulo: 'Excluir',
        aoConfirmar: () => { aoFechar(); executar(remover(r, 'divida', f.id), `${f.nome} excluída.`); } })}><Trash2 size={20} aria-hidden="true" />Excluir dívida</button> : null}
    </Folha>
  );
}

export function Dividas() {
  const { r, voltar, podeVoltar, ir, mesDeTrabalho: mes, usuario } = useApp();
  const [editar, setEditar] = useState<Divida | null>(null);
  const pessoa = (id: string) => r.pessoa.find(p => p.id === id);
  const sits = r.divida.map(d => situacaoDivida(r, d, mes)).sort((a, b) => Number(!a.ativa) - Number(!b.ativa) || a.fim.localeCompare(b.fim));
  const livres = quandoFicamosLivres(r, mes, 24);
  const maior = Math.max(1, ...livres.curva.map(c => c.total));
  const cartoes = comprometidoEmCartoes(r, mes, 6).filter(c => c.total > 0);
  const ordem = ordemDeQuitacao(r.divida);
  const nova = (): Divida => ({ id: novoId(), nome: '', tipo: 'emprestimo', titular: usuario?.id ?? r.pessoa[0].id, responsavel: usuario?.id ?? r.pessoa[0].id, escopo: 'pessoal', valorParcela: 0, parcelaAtual: 1, mesParcelaAtual: mes, totalParcelas: 12, diaVencimento: 10, situacao: 'ativa', jurosMensal: null, saldoInformado: null });
  return (<>
    <Topo titulo="Dívidas" sub="Empréstimos, parcelamentos e o que já está comprometido no cartão" voltar={podeVoltar ? voltar : () => ir({ tela: 'mais' })}
      direita={<button className="chip" onClick={() => setEditar(nova())}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Nova</button>} />
    <main className="conteudo"><div className="duas"><div className="col-a">
      {!sits.length ? <div className="vazio"><IconeVazio icone={Landmark} /><h2>Nenhuma dívida cadastrada</h2>
        <p>Cadastre empréstimos e parcelamentos fora do cartão. Quando a dívida está no nome de outra pessoa, a parcela entra no fechamento. Quando é sua e você paga, o app reconhece o pagamento no extrato.</p>
        <button className="bt principal" onClick={() => setEditar(nova())}><Plus size={20} aria-hidden="true" />Cadastrar a primeira</button></div>
        : sits.map(s => (
          <button key={s.d.id} className="cartao toque" onClick={() => setEditar(s.d)} aria-label={`${s.d.nome}, ${s.ativa ? `${s.restantes} parcelas restantes, termina em ${mesAno(s.fim)}` : 'quitada'}. Editar`}>
            <div className="linha-topo"><b style={{ font: 'var(--t-forte)' }}>{s.d.nome}</b>
              {!s.ativa ? <span className="pil ok">Quitada</span> : s.parcelaNoMes ? <span className={`pil ${s.paga ? 'ok' : 'neutra'}`}>{s.parcelaNoMes}/{s.d.totalParcelas} · {s.paga ? 'paga' : `vence dia ${s.d.diaVencimento}`}</span> : <span className="pil neutra">começa em {mesCurto(s.d.mesParcelaAtual)}</span>}</div>
            {s.ativa ? <div className="quem num">
              <div><span className="mini">Parcela</span><span className="v">{reais(s.d.valorParcela)}</span></div>
              <div><span className="mini">Faltam {s.restantes} {s.restantes === 1 ? 'parcela' : 'parcelas'}{s.saldoInformado ? ' · saldo informado' : ''}</span><span className="v">{reais(s.saldo)}</span></div>
              <div><span className="mini">Termina em</span><span className="v">{mesAno(s.fim)}</span></div>
              <div><span className="mini">Quem paga{s.d.titular !== s.d.responsavel ? ` (em nome de ${pessoa(s.d.titular)?.nome})` : ''}</span><Selo pessoa={pessoa(s.d.responsavel)} /></div>
            </div> : null}
          </button>))}
      {ordem.length > 1 ? <section className="cartao" aria-labelledby="h-ordem"><h2 id="h-ordem">Ordem para quitar</h2>
        <ol className="ordem">{ordem.map(d => <li key={d.id}><span>{d.nome}</span><span className="mini num">{d.jurosMensal != null ? `${String(d.jurosMensal).replace('.', ',')}% ao mês` : 'informe a taxa para priorizar'}</span></li>)}</ol>
        <p className="mini">Maior juros primeiro: cada real adiantado ali economiza mais. É só uma referência.</p></section> : null}
    </div><div className="col-b">
      <section className="cartao" aria-labelledby="h-livres"><h2 id="h-livres">Quando ficamos livres</h2>
        <p className="mini">Quanto já está comprometido por mês, entre dívidas e parcelas no cartão (de todos que você vê).{livres.ultimoMesComprometido ? ` Último mês com parcela: ${mesAno(livres.ultimoMesComprometido)}.` : ''}</p>
        <ul className="barras-cat num">{livres.curva.filter((c, i) => c.total > 0 || i < 3).slice(0, 12).map(c => (
          <li key={c.mes}><span className="cats-nome">{mesCurto(c.mes)}<small>{[c.dividas ? `dívidas ${reais(c.dividas)}` : '', c.cartao ? `cartão ${reais(c.cartao)}` : ''].filter(Boolean).join(' · ')}</small></span>
            <span className="cats-v">{reais(c.total)}</span><span className="cats-barra" aria-hidden="true"><i style={{ width: `${(c.total / maior) * 100}%` }} /></span></li>))}</ul>
        {livres.fins.length ? <div className="quem num">{livres.fins.slice(0, 8).map((f, i) => <div key={f.nome + f.fim + i}><span>{f.nome}<small className="mini"> · {f.tipo === 'divida' ? 'dívida' : 'cartão'}</small></span><span className="mini">termina {mesCurto(f.fim)}</span></div>)}</div> : null}
      </section>
      {cartoes.length ? <section className="cartao" aria-labelledby="h-cart"><h2 id="h-cart">Comprometido em cartões</h2>
        <div className="quem num">{cartoes.map(c => <div key={c.mes}><span>{mesCurto(c.mes)}<small className="mini"> · {[...c.porPessoa.entries()].map(([id, v]) => `${pessoa(id)?.nome ?? 'sem dono'} ${reais(v)}`).join(' · ')}</small></span><span className="v">{reais(c.total)}</span></div>)}</div>
        <p className="mini">Parcelas de compras já feitas, nas faturas dos próximos meses.</p></section> : null}
    </div></div></main>
    <FormDivida d={editar} aoFechar={() => setEditar(null)} />
  </>);
}
