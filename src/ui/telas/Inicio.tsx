'use client';
// Início (T2, Etapa 1: cartões e pendências) e Cartões (T3).
import { Check, FileUp, Copy, User, MessageCircle, Plus } from 'lucide-react';
import { useApp } from '../estado';
import { Divisao, Esqueleto, LogoBanco, Selo, Topo, Valor, ddmm, mesLongo, reais } from '../comum';
import { aReceberAntesDe, faturaDe, fechamentosDoMes, linhasDaFatura, parcelasNaoEncontradas, situacaoDaFatura, totaisDaFatura } from '@/dados/consultas';
import { mesCurto } from '@/dominio/mensagem';
import { datasDaFatura, somarMeses, type Mes } from '@/dominio/ciclo';
import type { Retrato } from '@/dados/tipos';

/** Os 4 passos do fechamento do mês (só mostram onde a família está; não mudam regra). */
export function passosDoMes(r: Retrato, mes: Mes, titular: string, hoje: string) {
  const cartoes = r.cartao.filter(c => c.ativo && c.titular === titular);
  const faturas = cartoes.map(c => ({ c, f: faturaDe(r, c.id, mes), d: datasDaFatura(c, mes) }));
  const paraImportar = faturas.filter(x => hoje >= x.d.fechamento && x.f?.status !== 'importada' && x.f?.status !== 'encerrada');
  const linhas = faturas.flatMap(x => (x.f ? linhasDaFatura(r, x.f.id) : []));
  const conferir = linhas.filter(l => l.pendente).length + faturas.reduce((s, x) => s + (x.f ? parcelasNaoEncontradas(r, x.f.id).length : 0), 0);
  const semDono = linhas.filter(l => !l.pendente && !l.compra.pagador).length;
  const fech = fechamentosDoMes(r, mes, titular).filter(f => f.total > 0);
  const avisados = fech.filter(f => f.enviadoEm).length;
  const abertas = faturas.filter(x => hoje < x.d.fechamento);
  // Nenhuma fatura do mês fechou ainda: o primeiro passo é esperar, lançando as compras no app
  const esperando = !paraImportar.length && faturas.length > 0 && faturas.every(x => hoje < x.d.fechamento);
  const proxima = [...faturas].sort((a, b) => a.d.fechamento.localeCompare(b.d.fechamento))[0];
  const passos = [
    esperando
      ? { nome: 'Importar as faturas', feito: false, dica: `A primeira fatura (${proxima.c.apelido}) fecha em ${ddmm(proxima.d.fechamento)}. Até lá, lance as compras no app.`, botao: 'Lançar uma compra', rota: { tela: 'lancar' as const }, icone: Plus }
      : { nome: 'Importar as faturas', feito: !paraImportar.length, dica: paraImportar.length ? `${paraImportar.map(x => x.c.apelido).join(' e ')} já ${paraImportar.length > 1 ? 'fecharam' : 'fechou'}. Traga o arquivo.` : '', botao: paraImportar.length ? `Importar fatura do ${paraImportar[0].c.banco === 'nubank' ? 'Nubank' : paraImportar[0].c.banco === 'bb' ? 'BB' : paraImportar[0].c.apelido}` : '', rota: { tela: 'importar' as const, cartao: paraImportar[0]?.c.id }, icone: FileUp },
    { nome: 'Conferir o que o app encontrou', feito: !conferir, dica: `${conferir} ${conferir === 1 ? 'item' : 'itens'}: duplicidades e parcelas.`, botao: `Conferir ${conferir} ${conferir === 1 ? 'item' : 'itens'}`, rota: { tela: 'conciliacao' as const }, icone: Copy },
    { nome: 'Dizer de quem é cada linha', feito: !semDono, dica: `${semDono} linhas sem dono.`, botao: `Marcar ${semDono} linhas`, rota: { tela: 'fatura' as const, cartao: faturas.find(x => x.f && linhasDaFatura(r, x.f.id).some(l => !l.compra.pagador && !l.pendente))?.c.id, mes, filtro: 'sem' }, icone: User },
    { nome: 'Mandar os resumos no WhatsApp', feito: avisados === fech.length && !paraImportar.length && !semDono, dica: fech.length ? `${fech.length - avisados} de ${fech.length} ainda sem aviso.` : 'Ninguém além da titular tem compras neste mês.', botao: 'Mandar os resumos', rota: { tela: 'fechamentos' as const, mes }, icone: MessageCircle },
  ];
  // Um passo só conta como feito quando os anteriores também estão
  passos.forEach((p, i) => { if (i && !passos[i - 1].feito) p.feito = false; });
  return { passos, abertas, semDono, conferir };
}

export function Inicio() {
  const { r, hoje, titular, usuario, mesDeTrabalho: m, ir } = useApp();
  const nome = usuario?.nome ?? 'você';
  if (!r.cartao.length) return (<>
    <Topo titulo="Boas-vindas" sub={`Olá, ${nome}`} />
    <main className="conteudo"><div className="vazio"><h2>Vamos começar pelos cartões</h2><p>Cadastre o Nubank e o BB da Bruna com o dia de fechamento e de vencimento. Depois é só lançar compras ou importar a fatura.</p>
      <button className="bt principal" onClick={() => ir({ tela: 'cfg-cartoes' })}>Cadastrar cartões</button></div></main>
  </>);
  const { passos, abertas } = passosDoMes(r, m, titular, hoje);
  const atual = passos.find(p => !p.feito);
  const faltam = passos.filter(p => !p.feito).length;
  const todas = r.cartao.flatMap(c => { const f = faturaDe(r, c.id, m); return f ? linhasDaFatura(r, f.id) : []; });
  const t = totaisDaFatura(todas);
  const rec = aReceberAntesDe(r, m, titular);
  const pessoas = r.pessoa;
  const datas = r.cartao.filter(c => c.ativo).map(c => datasDaFatura(c, m).vencimento).sort();
  const vencimentos = `${datas.length > 1 ? `Em ${datas.length} faturas, que vencem em` : 'Na fatura que vence em'} ${datas.map(ddmm).join(' e ')}`;
  return (<>
    <Topo titulo={mesLongo(m)} sub={atual ? `Olá, ${nome}. ${faltam === 1 ? 'Falta 1 passo' : `Faltam ${faltam} passos`} para fechar o mês.` : `Olá, ${nome}. Os resumos de ${mesLongo(m).toLowerCase()} já foram enviados.`} />
    <main className="conteudo">
      <div className="duas">
      <div className="col-a">
      <Divisao total={t.total}
        sub={<span>{vencimentos}</span>}
        fatias={[...pessoas.map(p => ({ pessoa: p, valor: t.porPessoa.get(p.id) ?? 0 })),
          ...(t.semDono + t.pendentes ? [{ pessoa: null, valor: t.valorSemDono + t.valorPendente, rotulo: `${t.semDono + t.pendentes} sem dono` }] : [])]} />
      </div>
      <div className="col-b">
      <section className="cartao" aria-labelledby="h-passos">
        <div className="linha-topo"><h3 id="h-passos">Fechamento de {mesLongo(m).toLowerCase()}</h3><span className="mini num">{passos.filter(p => p.feito).length} de 4</span></div>
        <ol className="passos">{passos.map((p, i) => (
          <li key={p.nome} className={p.feito ? 'feito' : p === atual ? 'atual' : ''}>
            <span className="bola" aria-hidden="true">{p.feito ? <Check size={16} strokeWidth={2.25} /> : i + 1}</span>
            <span><b>{p.nome}</b>{p === atual ? <small>{p.dica}</small> : null}</span>
            <span className="sr">{p.feito ? 'feito' : p === atual ? 'próximo passo' : 'depois'}</span>
          </li>))}
        </ol>
        {atual ? <button className="bt principal cheio" onClick={() => ir(atual.rota)}><atual.icone size={20} strokeWidth={1.75} aria-hidden="true" />{atual.botao}</button>
          : <div className="aviso ok" role="status"><Check size={20} aria-hidden="true" /><p>Tudo marcado e todos avisados. Agora é registrar os Pix quando chegarem.</p></div>}
        {abertas.length && atual?.rota.tela !== 'lancar' ? <p className="mini">{abertas.map(a => `${a.c.apelido} fecha em ${ddmm(a.d.fechamento)}`).join(' · ')}; até lá os totais são parciais.</p> : null}
      </section>
      {rec.length ? (
        <section className="cartao" aria-labelledby="h-rec"><h3 id="h-rec">A receber de meses anteriores</h3>
          <div className="quem num">{rec.map(x => <button key={x.pessoa.id + x.mes} onClick={() => ir({ tela: 'fechamentos', mes: x.mes })}><Selo pessoa={x.pessoa} extra={<span className="mini"> · {mesCurto(x.mes)}</span>} /><span className="v">{reais(x.emAberto)}</span></button>)}</div>
        </section>) : null}
      <section className="cartao" aria-labelledby="h-fat"><h3 id="h-fat">Faturas que vencem em {mesLongo(m).toLowerCase()}</h3>
        <div className="quem num">{r.cartao.filter(c => c.ativo).map(c => {
          const f = faturaDe(r, c.id, m), d = datasDaFatura(c, m), v = f ? totaisDaFatura(linhasDaFatura(r, f.id)).total : 0;
          const s = f ? situacaoDaFatura(f, hoje) : hoje >= d.fechamento ? 'fechada' : 'aberta';
          return <button key={c.id} onClick={() => ir({ tela: 'fatura', cartao: c.id, mes: m })}><span className="banco"><LogoBanco banco={c.banco} /><span>{c.apelido}<small>{s === 'aberta' ? `Parcial · fecha ${ddmm(d.fechamento)}` : `${s[0].toUpperCase() + s.slice(1)} · vence ${ddmm(d.vencimento)}`}</small></span></span><span className="v">{reais(v)}</span></button>;
        })}</div>
      </section>
      </div></div>
    </main>
  </>);
}

export function Cartoes() {
  const { r, hoje, mesDeTrabalho: m, ir } = useApp();
  if (!r) return <Esqueleto />;
  if (!r.cartao.length) return (<><Topo titulo="Cartões" /><main className="conteudo"><div className="vazio"><h2>Nenhum cartão cadastrado</h2><p>Cadastre o cartão com o apelido, o banco e os dias de fechamento e vencimento.</p><button className="bt principal" onClick={() => ir({ tela: 'cfg-cartoes' })}>Cadastrar cartão</button></div></main></>);
  return (<>
    <Topo titulo="Cartões" sub={`Faturas que vencem em ${mesLongo(m).toLowerCase()}`} />
    <main className="conteudo"><div className="grade-cartoes">{r.cartao.filter(c => c.ativo).map(c => {
      const f = faturaDe(r, c.id, m), d = datasDaFatura(c, m), v = f ? totaisDaFatura(linhasDaFatura(r, f.id)).total : 0;
      const prox = faturaDe(r, c.id, somarMeses(m, 1)); const vp = prox ? totaisDaFatura(linhasDaFatura(r, prox.id)).total : 0;
      const s = f ? situacaoDaFatura(f, hoje) : hoje >= d.fechamento ? 'fechada' : 'aberta';
      return (
        <div key={c.id} className="cartao-banco">
          <button className={`plastico ${c.banco}`} onClick={() => ir({ tela: 'fatura', cartao: c.id, mes: m })} aria-label={`${c.apelido}, fatura ${mesCurto(m)}, ${reais(v)}, ${s}`}>
            <span className="t"><span className="nome"><LogoBanco banco={c.banco} />{c.apelido}</span><span className="pil sobre-plastico">{s[0].toUpperCase() + s.slice(1)}</span></span>
            <Valor c={v} tamanho="g" />
            <span className="s">{s === 'aberta' ? 'Parcial · fecha ' + ddmm(d.fechamento) : 'Fechou ' + ddmm(d.fechamento)} · vence {ddmm(d.vencimento)}</span>
          </button>
          <p className="proxima num"><span>Próxima fatura, {mesCurto(somarMeses(m, 1))}, já prevista</span><b>{reais(vp)}</b></p>
        </div>);
    })}</div></main>
  </>);
}
