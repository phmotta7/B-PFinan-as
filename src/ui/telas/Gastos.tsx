'use client';
// Para onde vai o dinheiro (entrega 2A): gastos do cartão por carteira, por categoria e mês a mês, com sugestões por regras simples (D18).
// Cada gráfico responde a uma pergunta: "onde foi?" (categorias) e "estamos gastando mais ou menos?" (mês a mês).
import { useMemo, useState } from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../estado';
import { Aviso, Folha, Logo, SeletorMes, Selo, Topo, Valor, ddmm, mesLongo, reais } from '../comum';
import { comprasDaCategoria, painelDoMes, SEM_CATEGORIA, type Carteira, type Painel, type Sugestao } from '@/dados/painel';
import { ChevronRight } from 'lucide-react';
import { mesCurto } from '@/dominio/mensagem';
import { somarMeses } from '@/dominio/ciclo';
import type { Retrato } from '@/dados/tipos';

export const carteirasDoPainel = (r: Retrato): [Carteira, string][] =>
  [['todos', 'Todos'], ...r.pessoa.filter(p => p.tipo === 'usuario').map(p => [p.id, p.nome] as [string, string]), ['casal', 'Casal']];

const ICONE_TOM = { menos: TrendingDown, mais: TrendingUp, nota: Info } as const;
export function Sugestoes({ lista }: { lista: Sugestao[] }) {
  return (
    <ul className="sugestoes">{lista.map(s => { const I = ICONE_TOM[s.tom];
      return <li key={s.id} className={s.tom}><span className="ic" aria-hidden="true"><I size={18} strokeWidth={1.75} /></span><span>{s.texto}</span></li>; })}
    </ul>
  );
}

/** Barras deitadas, uma por categoria; o risco fino marca a média dos meses anteriores. */
export function Categorias({ p, limite, abrir }: { p: Painel; limite?: number; abrir?: (categoria: string) => void }) {
  const lista = limite ? p.categorias.filter(c => c.valor > 0).slice(0, limite) : p.categorias;
  const maior = Math.max(1, ...lista.map(c => Math.max(c.valor, c.media ?? 0)));
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / maior) * 100))}%`;
  return (
    <ul className="barras-cat num">{lista.map(c => (
      <li key={c.id} className={c.id === 'sem-categoria' ? 'sem' : undefined}>{(() => { const conteudo = <>
        <span className="cats-nome">{c.nome}{!limite && c.compras ? <small>{c.compras} {c.compras === 1 ? 'linha' : 'linhas'}{p.total > 0 ? ` · ${Math.round((c.valor / p.total) * 100)}%` : ''}</small> : null}</span>
        <span className="cats-v">{reais(c.valor)}</span>
        <span className="cats-barra" aria-hidden="true"><i style={{ width: pct(c.valor) }} />{c.media !== null && c.media > 0 ? <b style={{ left: pct(c.media) }} /> : null}</span>
        {c.media !== null && !limite ? <span className="sr">Média {reais(c.media)}</span> : null}</>;
        return abrir && c.compras ? <button className="cats-item" onClick={() => abrir(c.id)} aria-label={`${c.nome}, ${reais(c.valor)}, ${c.compras === 1 ? 'ver a compra' : `ver as ${c.compras} compras`}`}>{conteudo}</button> : <div className="cats-item">{conteudo}</div>; })()}
      </li>))}
    </ul>
  );
}

/** Folha com as compras de uma categoria; tocar numa leva à fatura daquele cartão, já filtrada pela categoria. */
function ComprasDaCategoria({ p, categoria, aoFechar }: { p: Painel; categoria: string | null; aoFechar: () => void }) {
  const { r, ir } = useApp();
  // Guarda a última categoria aberta, para a folha não esvaziar enquanto desce ao fechar
  const [mostrada, setMostrada] = useState<string | null>(null);
  if (categoria && categoria !== mostrada) setMostrada(categoria);
  const id = categoria ?? mostrada;
  const cat = p.categorias.find(c => c.id === id);
  const lista = id ? comprasDaCategoria(p, id) : [];
  const pessoa = (pid: string) => r.pessoa.find(x => x.id === pid);
  const cartao = (cid: string) => r.cartao.find(c => c.id === cid);
  const banco = (cid: string) => { const c = cartao(cid); return c?.banco === 'nubank' ? 'Nubank' : c?.banco === 'bb' ? 'BB' : c?.apelido ?? ''; };
  return (
    <Folha aberta={!!categoria} aoFechar={aoFechar} titulo={cat?.nome ?? 'Compras'}
      sub={cat ? `${lista.length} ${lista.length === 1 ? 'linha' : 'linhas'} · ${reais(cat.valor)}${cat.media !== null ? ` · média ${reais(cat.media)}` : ''}` : undefined}>
      <div className="compras-cat">{lista.map(x => {
        const dono = x.carteira === 'casal' ? null : pessoa(x.carteira);
        const dividida = x.valorInteiro !== x.valor;
        const onde = x.origem === 'cartao' ? banco(x.onde) : r.conta.find(c => c.id === x.onde)?.apelido.split(' · ')[0] ?? 'Conta';
        const abrir = () => { aoFechar(); if (x.origem === 'cartao') ir({ tela: 'fatura', cartao: x.onde, mes: p.mes, filtro: id === SEM_CATEGORIA ? 'semcat' : 'cat:' + id }); else ir({ tela: 'extratos', mes: x.data.slice(0, 7) }); };
        return (
          <button key={x.chave + x.carteira} className="lin" onClick={abrir}
            aria-label={`${x.descricao}, ${reais(x.valor)}, ${ddmm(x.data)}, ${onde}, ${dono ? dono.nome : 'Casal'}${dividida ? `, parte de ${reais(x.valorInteiro)}` : ''}. Abrir ${x.origem === 'cartao' ? 'na fatura' : 'no extrato'}`}>
            <Logo loja={x.descricao} vazio={false} />
            <span className="d"><b>{x.descricao}</b>
              <small>{x.parcela ? <span className="parc num">{x.parcela.numero}/{x.parcela.total}</span> : null}<span className="num">{ddmm(x.data)} · {onde}{x.origem === 'conta' ? ' (débito/Pix)' : ''}</span>
                {dono ? <Selo pessoa={dono} /> : <span className="mini">Casal</span>}{x.prevista ? <span className="mini">prevista</span> : null}</small></span>
            <span className="r"><span className="v num">{reais(x.valor)}</span>{dividida ? <span className="mini num">de {reais(x.valorInteiro)}</span> : null}</span>
          </button>);
      })}</div>
      {lista.length ? <p className="mini compras-cat-dica"><ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />Toque numa compra para abrir a fatura ou o extrato.</p> : null}
    </Folha>
  );
}

function MesAMes({ p }: { p: Painel }) {
  const maior = Math.max(1, ...p.meses.map(m => m.valor), p.media ?? 0);
  const alt = (v: number) => `${Math.max(0, (v / maior) * 100)}%`;
  return (
    <figure className="meses" aria-label={`Gastos por mês: ${p.meses.map(m => `${mesLongo(m.mes)} ${reais(m.valor)}`).join(', ')}${p.media !== null ? `; média ${reais(p.media)}` : ''}`}>
      <div className="meses-area" aria-hidden="true">
        {p.media !== null ? <span className="meses-media" style={{ bottom: `calc((100% - 22px) * ${Math.min(1, p.media / maior)})` }}><small>média</small></span> : null}
        {p.meses.map(m => (
          <span key={m.mes} className={`meses-col${m.atual ? ' atual' : ''}`} title={`${mesLongo(m.mes)}: ${reais(m.valor)}`}>
            {m.atual ? <small className="num">{reais(m.valor)}</small> : null}<i style={{ height: alt(m.valor) }} />
          </span>))}
      </div>
      <div className="meses-rotulos" aria-hidden="true">{p.meses.map(m => <span key={m.mes} className={m.atual ? 'atual' : undefined}>{mesCurto(m.mes)}</span>)}</div>
    </figure>
  );
}

export function Gastos() {
  const { r, rota, hoje, mesDeTrabalho, ir, voltar, podeVoltar } = useApp();
  const mes = rota.mes ?? mesDeTrabalho;
  const carteiras = carteirasDoPainel(r);
  const carteira = carteiras.some(([k]) => k === rota.filtro) ? rota.filtro! : 'todos';
  const p = useMemo(() => painelDoMes(r, mes, carteira, hoje), [r, mes, carteira, hoje]);
  const trocar = (m: string, c: string) => ir({ tela: 'gastos', mes: m, filtro: c === 'todos' ? undefined : c });
  const deQuem = carteira === 'todos' ? 'do Pedro, da Bruna e do Casal' : carteira === 'casal' ? 'do Casal' : `pessoais ${r.pessoa.find(x => x.id === carteira)?.nome === 'Bruna' ? 'da Bruna' : 'do ' + (r.pessoa.find(x => x.id === carteira)?.nome ?? '')}`;
  const diferenca = p.media !== null ? p.total - p.media : null;
  const [aberta, setAberta] = useState<string | null>(null);
  return (<>
    <Topo titulo="Para onde vai o dinheiro" voltar={podeVoltar ? voltar : () => ir({ tela: 'inicio' })}
      abaixo={<SeletorMes mes={mes} mudar={k => trocar(somarMeses(mes, k), carteira)} rotulo="Mês" />} />
    <main className="conteudo">
      <div className="filtros" role="group" aria-label="De quem são os gastos">{carteiras.map(([k, nome]) =>
        <button key={k} className="chip" aria-pressed={carteira === k} onClick={() => trocar(mes, k)}>{nome}</button>)}</div>
      <div className="duas">
      <div className="col-a">
        <section className="cartao" aria-labelledby="h-total">
          <h2 id="h-total">Total do mês</h2><p className="mini">Gastos {deQuem} no cartão, nas faturas que vencem em {mesLongo(mes).toLowerCase()}.</p>
          <Valor c={p.total} tamanho="g" />
          {diferenca !== null && p.media ? <p className="mini num">{p.aberto ? 'Parcial, até agora · m' : 'M'}{p.mesesNaMedia === 1 ? 'ês passado' : `édia dos últimos ${p.mesesNaMedia} meses`}: {reais(p.media)}
            {p.aberto ? null : Math.abs(diferenca) >= 100 ? <span className={`pil ${diferenca < 0 ? 'ok' : 'neutra'}`} style={{ marginLeft: 8 }}>{diferenca < 0 ? `${reais(-diferenca)} a menos` : `${reais(diferenca)} a mais`}</span> : null}</p>
            : <p className="mini">A comparação com a média começa no segundo mês de uso.</p>}
        </section>
        {p.semDono ? <Aviso><p>{p.semDono === 1 ? '1 linha sem dono' : `${p.semDono} linhas sem dono`} ({reais(p.valorSemDono)}) ainda não {p.semDono === 1 ? 'entra' : 'entram'} nesta conta.</p></Aviso> : null}
        {p.aberto ? <p className="mini">Alguma fatura deste mês ainda não fechou: o total vai crescer e a comparação espera o fechamento.</p> : null}
        {p.previstas ? <p className="mini">Inclui {reais(p.previstas)} lançados no app ou de parcelas que a fatura ainda vai confirmar.</p> : null}
        {p.sugestoes.length ? (
          <section className="cartao" aria-labelledby="h-sug"><h2 id="h-sug">O que dá para notar</h2><Sugestoes lista={p.sugestoes} /></section>) : null}
        <section className="cartao" aria-labelledby="h-meses"><h2 id="h-meses">Mês a mês</h2>
          {p.meses.length > 1 ? <MesAMes p={p} /> : <p className="mini">O gráfico de cada mês começa a aparecer quando houver dois meses. Os dados começam em novembro de 2026.</p>}
        </section>
      </div>
      <div className="col-b">
        <section className="cartao" aria-labelledby="h-cats">
          <div className="linha-topo"><h2 id="h-cats">Por categoria</h2>{p.media !== null ? <span className="mini cats-leg"><b aria-hidden="true" />média</span> : null}</div>
          {p.categorias.length ? <Categorias p={p} abrir={setAberta} /> : <p className="mini">Nenhum gasto {deQuem} nas faturas de {mesLongo(mes).toLowerCase()}.</p>}
        </section>
      </div></div>
    </main>
    <ComprasDaCategoria p={p} categoria={aberta} aoFechar={() => setAberta(null)} />
  </>);
}
