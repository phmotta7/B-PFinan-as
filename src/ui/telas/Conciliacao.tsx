'use client';
// Conciliação (T6): duplicidades, ambíguas, parcelas reconhecidas e esperadas não encontradas (§4.5).
import { Check, ChevronRight, Trash2, User } from 'lucide-react';
import { useApp } from '../estado';
import { Aviso, Logo, Selo, Topo, ddmm, reais } from '../comum';
import { confirmarDuplicidade, escolherCandidata, excluirParcelaPrevista, moverParaProximaFatura, negarDuplicidade } from '@/dados/operacoes';
import { aplicar } from '@/dados/mudanca';
import { linhasDaFatura, parcelasNaoEncontradas } from '@/dados/consultas';
import { mesCurto } from '@/dominio/mensagem';
import { somarMeses } from '@/dominio/ciclo';
import type { Compra } from '@/dados/tipos';

export function Conciliacao() {
  const { r, voltar, ir, executar, confirmar } = useApp();
  const pessoa = (id?: string | null) => r.pessoa.find(p => p.id === id);
  const cat = (id?: string | null) => r.categoria.find(c => c.id === id)?.nome;
  const ultima = [...r.importacao].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0];
  const fatura = ultima ? r.fatura.find(f => f.id === ultima.fatura) : undefined;
  const cartao = fatura ? r.cartao.find(c => c.id === fatura.cartao) : undefined;
  const titulo = cartao && fatura ? `Fatura ${cartao.banco === 'nubank' ? 'Nubank' : cartao.banco === 'bb' ? 'BB' : cartao.apelido} ${mesCurto(fatura.mes)}` : '';

  if (!fatura || !cartao) return (<>
    <Topo titulo="Conferir importação" voltar={voltar} />
    <main className="conteudo"><div className="vazio"><h2>Nada para conferir</h2><p>Depois de importar uma fatura, aparecem aqui as compras que você já tinha lançado e as parcelas que o app reconheceu.</p>
      <button className="bt principal" onClick={() => ir({ tela: 'importar' })}>Importar fatura</button></div></main>
  </>);

  const pend = r.compra.filter(c => c.pendencia && r.parcela_cartao.some(p => p.compra === c.id && p.fatura === fatura.id));
  const dups = pend.filter(c => c.pendencia?.tipo === 'duplicidade');
  const ambs = pend.filter(c => c.pendencia?.tipo === 'ambigua');
  const nao = parcelasNaoEncontradas(r, fatura.id);
  const series = r.parcela_cartao.filter(p => p.fatura === fatura.id && p.status === 'confirmada' && p.linhaImportada && r.linha_importada.find(l => l.id === p.linhaImportada)?.situacao === 'conciliada');
  const semDono = linhasDaFatura(r, fatura.id).filter(l => !l.compra.pagador && !l.pendente).length;
  const desc = (c: Compra, onde: string) => <><b>{c.descricao} {reais(c.valorTotal)}</b> <span style={{ color: 'var(--suave)' }}>({onde}, {ddmm(c.data)})</span></>;

  const confirmarObvias = async () => {
    let atual = r; const pacotes = dups.map(c => { const m = confirmarDuplicidade(atual, c.id); atual = aplicar(atual, m); return m; });
    for (const m of pacotes) await executar(m);
    await executar({ inserir: {}, atualizar: {}, apagar: {} }, `${dups.length} duplicidades confirmadas.`, { semDesfazer: true });
  };

  return (<>
    <Topo titulo="Conferir importação" sub={titulo} voltar={voltar} />
    <main className="conteudo">
      {dups.length > 1 ? <button className="bt secundario cheio" onClick={confirmarObvias}><Check size={20} aria-hidden="true" />Confirmar todas as óbvias ({dups.length})</button> : null}
      {dups.length ? <p className="secao">Lançadas no app e também na fatura</p> : null}
      {dups.map(c => {
        const m = r.compra.find(x => c.pendencia?.tipo === 'duplicidade' && x.id === c.pendencia.manual);
        if (!m) return null;
        return (
          <div className="cartao" key={c.id}>
            <p>Encontrei 1 duplicidade: {desc(m, 'manual')} e {desc(c, 'fatura')} parecem a mesma compra.</p>
            <p className="mini">Manter a da fatura e copiar <Selo pessoa={pessoa(m.pagador)} />{m.escopo ? `, ${m.escopo === 'casal' ? 'Casal' : 'Pessoal'}` : ''}{cat(m.categoria) ? `, ${cat(m.categoria)}` : ''}?</p>
            <div className="acoes"><button className="bt secundario medio" onClick={() => executar(negarDuplicidade(r, c.id), 'Mantive as duas. A linha da fatura ficou sem dono.')}>Não é a mesma</button>
              <button className="bt principal medio" onClick={() => executar(confirmarDuplicidade(r, c.id), `Duplicidade resolvida: ficou a linha da fatura, com os dados de ${pessoa(m.pagador)?.nome ?? 'quem lançou'}.`)}>Confirmar</button></div>
          </div>);
      })}
      {ambs.length ? <p className="secao">Mais de uma possibilidade</p> : null}
      {ambs.map(c => c.pendencia?.tipo === 'ambigua' ? (
        <div className="cartao" key={c.id}>
          <p>{desc(c, 'fatura')} pode ser uma destas compras lançadas no app. Qual é?</p>
          <div className="quem num">
            {c.pendencia.candidatos.map(id => r.compra.find(x => x.id === id)).filter(Boolean).map(x => (
              <button key={x!.id} onClick={() => executar(escolherCandidata(r, c.id, x!.id), `${c.descricao} ficou com ${pessoa(x!.pagador)?.nome ?? 'sem dono'}.`)}>
                <span>{x!.descricao} · {ddmm(x!.data)} <Selo pessoa={pessoa(x!.pagador)} extra={x!.escopo === 'casal' ? ' · Casal' : ''} /></span><span className="v">{reais(x!.valorTotal)}</span></button>))}
            <button onClick={() => executar(escolherCandidata(r, c.id, null), `${c.descricao} ficou sem dono.`)}><span>Nenhuma delas, deixar sem dono</span><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
        </div>) : null)}
      {nao.length ? <p className="secao">Esperadas e não encontradas</p> : null}
      {nao.map(l => (
        <div className="cartao" key={l.parcela.id}>
          <div className="linha-topo"><span className="banco"><Logo loja={l.compra.descricao} /><span>{l.compra.descricao}<small>{l.total > 1 ? <span className="parc num">{l.numero}/{l.total}</span> : ddmm(l.data)} <Selo pessoa={pessoa(l.compra.pagador)} /></small></span></span><b className="num">{reais(l.valor)}</b></div>
          <p className="mini">Esta parcela estava prevista para {mesCurto(fatura.mes)}, mas não veio no arquivo. O banco pode ter jogado para a próxima fatura.</p>
          <div className="acoes">
            <button className="bt destrutivo medio" onClick={() => confirmar({ titulo: `Excluir ${l.compra.descricao}${l.total > 1 ? ` ${l.numero}/${l.total}` : ''}?`, texto: 'Só esta parcela prevista sai do app. As outras parcelas da série continuam.', rotulo: 'Excluir',
              aoConfirmar: () => executar(excluirParcelaPrevista(r, l.parcela.id), `${l.compra.descricao}${l.total > 1 ? ` ${l.numero}/${l.total}` : ''} excluída.`) })}><Trash2 size={20} aria-hidden="true" />Excluir</button>
            <button className="bt secundario medio" onClick={() => executar(moverParaProximaFatura(r, l.parcela.id), `Parcela movida para a fatura ${mesCurto(somarMeses(fatura.mes, 1))}.`)}>Mover para {mesCurto(somarMeses(fatura.mes, 1))}</button>
          </div>
        </div>))}
      {series.length ? <><p className="secao">Reconhecidas automaticamente</p>
        <div className="cartao"><div className="quem num">{series.map(p => { const c = r.compra.find(x => x.id === p.compra)!; return (
          <div key={p.id} style={{ alignItems: 'flex-start', padding: '10px 0', flexDirection: 'column', gap: 4 }}>
            <div className="linha-topo" style={{ width: '100%' }}><span className="banco"><Logo loja={c.descricao} /><span>{c.descricao} <span className="parc num">{p.numero}/{c.parcelas}</span></span></span><b>{reais(p.valor)}</b></div>
            <span className="mini"><Selo pessoa={pessoa(c.pagador)} /> · baixa na parcela que já estava prevista</span></div>); })}</div></div></> : null}
      {!dups.length && !ambs.length && !nao.length ? <Aviso tipo="ok"><p>Tudo conferido.{semDono ? ` Faltam ${semDono} linhas sem dono.` : ''}</p></Aviso> : null}
      {semDono ? <button className="bt principal cheio" onClick={() => ir({ tela: 'fatura', cartao: cartao.id, mes: fatura.mes, filtro: 'sem' })}><User size={20} aria-hidden="true" />Marcar as {semDono} sem dono</button> : null}
    </main>
  </>);
}
