'use client';
// Extratos (T11, entrega 2B): importar o OFX da conta, conferir o que o app sugere para cada linha e gravar; depois, ver e corrigir por mês.
// Privacidade (D15): cada um vê só as próprias contas; do outro, só o que foi marcado como Casal (a regra está no banco).
import { useRef, useState } from 'react';
import { Check, FileUp, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../estado';
import { Aviso, Folha, IconeVazio, Logo, SeletorMes, Topo, diaLongo, mesLongo, reais } from '../comum';
import { decodificarOfx, lerOfx } from '@/dominio/ofx';
import { ErroDeLeitura } from '@/dominio/leitores';
import { alterarLancamento, CONTA_NO_MES, fechamentoPara, pessoaDaLinha, gravarExtrato, lojaDaLinha, NOME_DO_TIPO, prepararExtrato, type Escolha, type Previa } from '@/dados/extrato';
import { somarMeses } from '@/dominio/ciclo';
import type { Escopo, Lancamento, Retrato, TipoLancamento } from '@/dados/tipos';

type Linha = { chave: string; data: string; descricao: string; contraparte?: string | null; valor: number; escolha: Escolha; motivo?: string };

/** O nome curto da linha: a loja da compra no débito ou quem está do outro lado do Pix. */
const titulo = (l: { descricao: string; contraparte?: string | null }) => {
  const loja = lojaDaLinha(l);
  return (loja === l.descricao && l.contraparte ? l.contraparte : loja).replace(/\s+-\s+•••.*$/, '');
};
const nomeCategoria = (r: Retrato, id?: string | null) => r.categoria.find(c => c.id === id)?.nome;
function rotulo(r: Retrato, e: Escolha) {
  if (!CONTA_NO_MES(e.tipo)) return NOME_DO_TIPO[e.tipo];
  return [nomeCategoria(r, e.categoria) ?? (e.tipo === 'despesa' ? 'Gasto sem categoria' : 'Receita sem categoria'), e.escopo === 'casal' ? 'Casal' : null].filter(Boolean).join(' · ');
}

/** Folha "O que é esta linha?": o tipo primeiro; gasto e receita pedem categoria e Pessoal/Casal. */
function FolhaLinha({ linha, dono, aoFechar, aoEscolher }: { linha: Linha | null; dono: string; aoFechar: () => void; aoEscolher: (e: Escolha) => void }) {
  const { r } = useApp();
  const [ultima, setUltima] = useState<Linha | null>(null);
  if (linha && linha !== ultima) setUltima(linha);
  const l = linha ?? ultima;
  const [e, setE] = useState<Escolha | null>(null);
  const [de, setDe] = useState<string | null>(null);
  if (l && de !== l.chave) { setDe(l.chave); setE(l.escolha); }
  if (!l || !e) return <Folha aberta={false} aoFechar={aoFechar} titulo="">{null}</Folha>;
  const saida = l.valor < 0;
  const fech = fechamentoPara(r, dono, l);
  const comAlguem = !!pessoaDaLinha(r, l) && pessoaDaLinha(r, l)?.id !== dono;
  const tipos: TipoLancamento[] = (saida ? ['despesa', 'transferencia_propria', 'transferencia', 'pagamento_fechamento', 'pagamento_cartao', 'investimento'] as TipoLancamento[] : ['receita', 'transferencia_propria', 'transferencia', 'pagamento_fechamento', 'investimento'] as TipoLancamento[]).filter(t => comAlguem || (t !== 'pagamento_fechamento' && t !== 'transferencia'));
  const cats = r.categoria.filter(c => c.ativa && c.tipo === (e.tipo === 'receita' ? 'receita' : 'despesa')).sort((a, b) => a.ordem - b.ordem);
  const trocarTipo = (t: TipoLancamento) => setE({ tipo: t, escopo: CONTA_NO_MES(t) ? e.escopo ?? 'pessoal' : null, categoria: CONTA_NO_MES(t) && (t === e.tipo) ? e.categoria : null, fechamento: t === 'pagamento_fechamento' ? fech : null });
  return (
    <Folha aberta={!!linha} aoFechar={aoFechar} titulo={titulo(l)} sub={`${reais(l.valor)} · ${diaLongo(l.data)}`}>
      <p className="mini">{l.descricao}</p>
      <div className="chips" role="group" aria-label="O que é">{tipos.map(t => (
        <button key={t} className="chip" aria-pressed={e.tipo === t} disabled={t === 'pagamento_fechamento' && !fech} onClick={() => trocarTipo(t)}>{NOME_DO_TIPO[t]}</button>))}</div>
      {e.tipo === 'pagamento_fechamento' && e.fechamento ? <p className="mini">Entra como pagamento do fechamento de {mesLongo(e.fechamento.mes).toLowerCase()} de {r.pessoa.find(p => p.id === e.fechamento!.devedor)?.nome}.</p> : null}
      {comAlguem && !fech ? <p className="mini">“Pagamento do fechamento” fica disponível quando há fechamento em aberto com a pessoa deste Pix.</p> : null}
      {CONTA_NO_MES(e.tipo) ? (<>
        <div className="chips" role="group" aria-label="De quem é">{(['pessoal', 'casal'] as Escopo[]).map(x => <button key={x} className="chip" aria-pressed={e.escopo === x} onClick={() => setE({ ...e, escopo: x })}>{x === 'pessoal' ? 'Pessoal' : 'Casal'}</button>)}</div>
        <div className="lista-cat" role="group" aria-label="Categoria">{cats.map(c => (
          <button key={c.id} aria-pressed={e.categoria === c.id} onClick={() => aoEscolher({ ...e, categoria: c.id })}>{c.nome}{e.categoria === c.id ? <Check size={18} strokeWidth={2} aria-hidden="true" /> : null}</button>))}</div>
      </>) : (<>
        <p className="mini">Não entra nos gastos nem nas receitas: é dinheiro mudando de lugar.</p>
        <button className="bt principal cheio" onClick={() => aoEscolher(e)}>Pronto</button>
      </>)}
    </Folha>
  );
}

function LinhaExtrato({ l, onClick, aviso }: { l: Linha; onClick: () => void; aviso?: string }) {
  const { r } = useApp();
  const nome = titulo(l);
  return (
    <button className="lin" onClick={onClick} aria-label={`${nome}, ${reais(l.valor)}, ${rotulo(r, l.escolha)}${aviso ? `, ${aviso}` : ''}. Mudar`}>
      <Logo loja={nome} />
      <span className="d"><b>{nome}</b><small>
        <span className={`pil ${CONTA_NO_MES(l.escolha.tipo) ? (l.escolha.categoria ? 'neutra' : 'at') : 'acao'}`} style={{ padding: '2px 8px' }}>{rotulo(r, l.escolha)}</span>
        {aviso ? <span className="mini">{aviso}</span> : null}</small></span>
      <span className="r"><span className={`v num${l.valor > 0 ? ' v-entra' : ''}`}>{l.valor > 0 ? '+' : ''}{reais(l.valor)}</span></span>
    </button>
  );
}

function agrupar<T extends { data: string }>(xs: T[]) {
  const g = new Map<string, T[]>(); [...xs].sort((a, b) => b.data.localeCompare(a.data)).forEach(x => g.set(x.data, [...(g.get(x.data) ?? []), x])); return [...g.entries()];
}

export function Extratos() {
  const { r, rota, usuario, mesDeTrabalho, ir, voltar, podeVoltar, executar } = useApp();
  const dono = usuario?.id ?? '';
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [escolhas, setEscolhas] = useState<Map<string, Escolha>>(new Map());
  const [aberta, setAberta] = useState<{ linha: Linha; gravado?: Lancamento } | null>(null);
  const [erro, setErro] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const mes = rota.mes ?? mesDeTrabalho;
  const minhas = r.conta.filter(c => c.pessoa === dono);
  const [filtro, setFiltro] = useState('todos');

  const ler = async (f: File) => {
    setErro('');
    try {
      const e = lerOfx(decodificarOfx(new Uint8Array(await f.arrayBuffer())));
      setPrevia(prepararExtrato(r, dono, e)); setEscolhas(new Map());
    } catch (x) { setErro(x instanceof ErroDeLeitura ? x.message : 'Não consegui ler este arquivo. Ele é um extrato OFX?'); }
  };
  const gravar = async () => {
    if (!previa) return;
    const novas = previa.itens.filter(i => !i.repetida).length;
    if (await executar(gravarExtrato(r, previa, escolhas), `${novas} ${novas === 1 ? 'linha gravada' : 'linhas gravadas'} em ${previa.conta.apelido}.`)) setPrevia(null);
  };

  // ---------- Prévia do arquivo ----------
  if (previa) {
    const novas = previa.itens.filter(i => !i.repetida);
    const linhas: (Linha & { aviso?: string })[] = novas.map(i => ({ chave: i.linha.fitid, data: i.linha.data, descricao: i.linha.descricao, contraparte: i.linha.contraparte, valor: i.linha.valor, escolha: escolhas.get(i.linha.fitid) ?? i.sugestao, motivo: i.sugestao.motivo }));
    const semCat = linhas.filter(l => CONTA_NO_MES(l.escolha.tipo) && !l.escolha.categoria).length;
    return (<>
      <Topo titulo="Conferir o extrato" voltar={() => setPrevia(null)} sub={`${previa.contaNova ? 'Conta nova: ' : ''}${previa.conta.apelido} · ${novas.length} ${novas.length === 1 ? 'linha nova' : 'linhas novas'}${previa.itens.length > novas.length ? ` · ${previa.itens.length - novas.length} já importadas` : ''}`} />
      <main className="conteudo">
        {!novas.length ? <Aviso tipo="ok"><p>Tudo deste arquivo já estava no app. Nada a gravar.</p></Aviso> : (<>
          <p className="mini">O app sugeriu o que cada linha é. Toque numa linha para mudar. Só gasto e receita entram nas contas do mês.{semCat ? ` ${semCat} ${semCat === 1 ? 'linha está' : 'linhas estão'} sem categoria; dá para escolher agora ou depois.` : ''}</p>
          <div className="lista">{agrupar(linhas).map(([dia, ls]) => (
            <div key={dia}><h2 className="dia">{diaLongo(dia)}</h2>{ls.map(l => <LinhaExtrato key={l.chave} l={l} aviso={l.motivo === 'Como da última vez' ? 'como da última vez' : undefined} onClick={() => setAberta({ linha: l })} />)}</div>))}
          </div>
        </>)}
        <div className="rodape vidro-normal acoes"><button className="bt secundario" onClick={() => setPrevia(null)}>Cancelar</button>
          {novas.length ? <button className="bt principal" onClick={gravar}>Gravar {novas.length} {novas.length === 1 ? 'linha' : 'linhas'}</button> : null}</div>
      </main>
      <FolhaLinha linha={aberta?.linha ?? null} dono={dono} aoFechar={() => setAberta(null)} aoEscolher={e => { setEscolhas(new Map(escolhas).set(aberta!.linha.chave, e)); setAberta(null); }} />
    </>);
  }

  // ---------- Lançamentos do mês ----------
  const doMes = r.lancamento.filter(l => l.data.slice(0, 7) === mes && (l.pessoa === dono || l.escopo === 'casal'));
  const passa = (l: Lancamento) => filtro === 'todos' || (filtro === 'gastos' ? l.tipo === 'despesa' : filtro === 'receitas' ? l.tipo === 'receita' : filtro === 'semcat' ? CONTA_NO_MES(l.tipo) && !l.categoria : !CONTA_NO_MES(l.tipo));
  const soma = (t: TipoLancamento) => doMes.filter(l => l.tipo === t && l.pessoa === dono).reduce((s, l) => s + l.valor, 0);
  const filtros: [string, string, number][] = [['todos', 'Todos', doMes.length], ['gastos', 'Gastos', doMes.filter(l => l.tipo === 'despesa').length], ['receitas', 'Receitas', doMes.filter(l => l.tipo === 'receita').length],
    ['outros', 'Mudando de lugar', doMes.filter(l => !CONTA_NO_MES(l.tipo)).length], ['semcat', 'Sem categoria', doMes.filter(l => CONTA_NO_MES(l.tipo) && !l.categoria).length]];
  const comoLinha = (l: Lancamento): Linha => ({ chave: l.id, data: l.data, descricao: l.descricao, contraparte: l.contraparte, valor: l.valor, escolha: { tipo: l.tipo, categoria: l.categoria ?? null, escopo: l.escopo ?? null } });
  return (<>
    <Topo titulo="Extratos" voltar={podeVoltar ? voltar : () => ir({ tela: 'mais' })} abaixo={<SeletorMes mes={mes} mudar={k => ir({ tela: 'extratos', mes: somarMeses(mes, k) })} rotulo="Mês" />}
      direita={<button className="chip" onClick={() => input.current?.click()}><FileUp size={16} strokeWidth={1.75} aria-hidden="true" />Importar</button>} />
    <main className="conteudo">
      <input ref={input} type="file" accept=".ofx,application/x-ofx,text/plain" className="escondido" onChange={e => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = ''; }} />
      {erro ? <Aviso tipo="er" papel="alert"><p>{erro}</p></Aviso> : null}
      {!minhas.length ? (
        <div className="vazio"><IconeVazio icone={Landmark} /><h2>Traga o extrato da sua conta</h2>
          <p>No app do banco, exporte o extrato em OFX e escolha o arquivo aqui. O app reconhece a conta e sugere o que cada linha é; você confere antes de gravar. Só você vê o seu extrato; a outra pessoa vê apenas o que for marcado como Casal.</p>
          <button className="bt principal" onClick={() => input.current?.click()}><FileUp size={20} strokeWidth={1.75} aria-hidden="true" />Escolher arquivo OFX</button></div>
      ) : (<>
        <section className="cartao" aria-labelledby="h-mes"><h2 id="h-mes">{mesLongo(mes)}, nas suas contas</h2>
          <div className="quem num">
            <div><span>Gastos</span><span className="v">{reais(-soma('despesa'))}</span></div>
            <div><span>Receitas</span><span className="v">{reais(soma('receita'))}</span></div>
          </div>
          <p className="mini">{minhas.map(c => c.apelido).join(' · ')}. Pix entre suas contas, pagamento de cartão e investimento não entram nessa conta.</p>
        </section>
        <div className="filtros" role="group" aria-label="Filtrar">{filtros.filter(([, , n], i) => n || !i).map(([k, n, q]) => <button key={k} className="chip" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{n} <span className="n">{q}</span></button>)}</div>
        {doMes.length ? <div className="lista">{agrupar(doMes.filter(passa)).map(([dia, ls]) => (
          <div key={dia}><h2 className="dia">{diaLongo(dia)}</h2>{ls.map(l => <LinhaExtrato key={l.id} l={comoLinha(l)} aviso={l.pessoa !== dono ? `de ${r.pessoa.find(p => p.id === l.pessoa)?.nome}` : undefined}
            onClick={() => l.pessoa === dono ? setAberta({ linha: comoLinha(l), gravado: l }) : toast('Este lançamento é da outra pessoa; só ela pode mudar.')} />)}</div>))}
        </div> : <p className="mini">Nada nas suas contas em {mesLongo(mes).toLowerCase()}. Importe o extrato do mês.</p>}
      </>)}
    </main>
    <FolhaLinha linha={aberta?.linha ?? null} dono={dono} aoFechar={() => setAberta(null)}
      aoEscolher={async e => { const g = aberta?.gravado; setAberta(null); if (g) await executar(alterarLancamento(r, g.id, e), 'Lançamento atualizado.'); }} />
  </>);
}

