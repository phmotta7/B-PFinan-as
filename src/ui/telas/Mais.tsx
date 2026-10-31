'use client';
// Mais (D10/D11): Dívidas, conferência, importação e Configurações (T15): pessoas, cartões, categorias, e-mails, exportar.
import { useState, type ReactNode } from 'react';
import { ChevronRight, Layers, Copy, FileUp, User, CreditCard, SlidersHorizontal, Mail, Download, Plus, Trash2, Landmark } from 'lucide-react';
import { useApp } from '../estado';
import { IconeVazio, Folha, LogoBanco, Selo, Topo, reais } from '../comum';
import { novoId, remover, salvar } from '@/dados/operacoes';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { mesCurto } from '@/dominio/mensagem';
import { parcelasDeDividaNoMes } from '@/dados/consultas';
import type { Cartao, Divida, Pessoa } from '@/dados/tipos';

const Linha = ({ icone, titulo, sub, onClick }: { icone: ReactNode; titulo: string; sub: string; onClick: () => void }) => (
  <button className="pend" onClick={onClick}><span className="ico n">{icone}</span><span className="t"><b>{titulo}</b><small>{sub}</small></span><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></button>);

export function Mais() {
  const { r, ir, sair, confirmar, modo, recomecarDemo } = useApp();
  const [tema, setTema] = useState(() => { try { return localStorage.getItem('bp-tema') ?? 'auto'; } catch { return 'auto'; } });
  const mudarTema = (t: string) => { setTema(t); try { localStorage.setItem('bp-tema', t); } catch { /* sem armazenamento */ } if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); };
  const i = (C: typeof Layers) => <C size={20} strokeWidth={1.75} aria-hidden="true" />;
  return (<>
    <Topo titulo="Mais" />
    <main className="conteudo">
      <div className="cartao"><div>
        <Linha icone={i(Layers)} titulo="Dívidas" sub="Empréstimos e parcelamentos que entram no fechamento" onClick={() => ir({ tela: 'dividas' })} />
        <Linha icone={i(Copy)} titulo="Conferir importação" sub="Duplicidades e parcelas da última fatura" onClick={() => ir({ tela: 'conciliacao' })} />
        <Linha icone={i(FileUp)} titulo="Importar fatura" sub="Nubank ou CSV de outro banco" onClick={() => ir({ tela: 'importar' })} />
      </div></div>
      <p className="secao">Configurações</p>
      <div className="cartao"><div>
        <Linha icone={i(User)} titulo="Pessoas" sub="Telefones e chave Pix" onClick={() => ir({ tela: 'pessoas' })} />
        <Linha icone={i(CreditCard)} titulo="Cartões" sub="Dias de fechamento e vencimento" onClick={() => ir({ tela: 'cfg-cartoes' })} />
        <Linha icone={i(SlidersHorizontal)} titulo="Categorias" sub={`${r.categoria.filter(c => c.ativa).length} categorias`} onClick={() => ir({ tela: 'categorias' })} />
        <Linha icone={i(Mail)} titulo="Quem pode entrar" sub="E-mails do Pedro e da Bruna" onClick={() => ir({ tela: 'emails' })} />
        <Linha icone={i(Download)} titulo="Exportar dados" sub="Cópia de tudo num arquivo" onClick={() => ir({ tela: 'exportar' })} />
      </div></div>
      <p className="secao">Aparência</p>
      <div className="chips" role="group" aria-label="Tema">{[['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Do celular']].map(([v, n]) => <button key={v} className="chip" aria-pressed={tema === v} onClick={() => mudarTema(v)}>{n}</button>)}</div>
      {modo === 'demo' ? <button className="bt secundario cheio" style={{ marginTop: 12 }} onClick={() => confirmar({ titulo: 'Recomeçar a demonstração?', texto: 'Os dados fictícios voltam ao começo do cenário (03/11, antes de importar). Nada real é apagado.', rotulo: 'Recomeçar', aoConfirmar: recomecarDemo })}>Recomeçar a demonstração</button>
        : <button className="bt secundario cheio" style={{ marginTop: 12 }} onClick={() => confirmar({ titulo: 'Sair do B&P?', texto: 'Você volta para a tela de entrada. Nada do que foi marcado se perde.', rotulo: 'Sair', aoConfirmar: sair })}>Sair</button>}
    </main>
  </>);
}

// ---------- Dívidas (T12, só cadastro na Etapa 1) ----------
export function Dividas() {
  const { r, voltar, executar, mesDeTrabalho, confirmar } = useApp();
  const [editar, setEditar] = useState<Divida | null>(null);
  const pessoa = (id: string) => r.pessoa.find(p => p.id === id);
  const noMes = parcelasDeDividaNoMes(r, mesDeTrabalho);
  const titular = r.cartao[0]?.titular ?? r.pessoa[0]?.id;
  return (<>
    <Topo titulo="Dívidas" sub="Pagas pela titular e repassadas no fechamento" voltar={voltar} />
    <main className="conteudo">
      {!r.divida.length ? <div className="vazio"><IconeVazio icone={Landmark} /><h2>Nenhuma dívida cadastrada</h2><p>Cadastre o empréstimo ou parcelamento que alguém paga por meio da Bruna. A parcela do mês entra no fechamento dessa pessoa, no bloco &ldquo;Outros&rdquo;.</p></div> : null}
      {r.divida.map(d => { const n = noMes.find(x => x.id === d.id); return (
        <button key={d.id} className="cartao toque" onClick={() => setEditar(d)} aria-label={`Editar ${d.nome}`}>
          <div className="linha-topo"><b style={{ font: 'var(--t-forte)' }}>{d.nome}</b>{n ? <span className="parc num">{n.atual}/{n.total} em {mesCurto(mesDeTrabalho)}</span> : <span className="pil neutra">{d.situacao === 'quitada' ? 'Quitada' : 'Fora do mês'}</span>}</div>
          <div className="quem num">
            <div><span className="mini">Parcela</span><span className="v">{reais(d.valorParcela)}</span></div>
            {n ? <div><span className="mini">Falta pagar depois desta</span><span className="v">{reais(d.valorParcela * (n.total - n.atual))}</span></div> : null}
            <div><span className="mini">Quem paga</span><Selo pessoa={pessoa(d.responsavel)} /></div>
          </div></button>); })}
      <button className="bt secundario cheio" onClick={() => setEditar({ id: novoId(), nome: '', tipo: 'emprestimo', titular, responsavel: r.pessoa.find(p => p.id !== titular)?.id ?? titular, escopo: 'pessoal', valorParcela: 0, parcelaAtual: 1, mesParcelaAtual: mesDeTrabalho, totalParcelas: 12, diaVencimento: 10, situacao: 'ativa' })}><Plus size={20} aria-hidden="true" />Nova dívida</button>
    </main>
    <FormDivida d={editar} aoFechar={() => setEditar(null)} aoSalvar={async d => { setEditar(null); await executar(salvar(r, 'divida', d), `${d.nome} salva.`); }}
      aoExcluir={d => confirmar({ titulo: `Excluir ${d.nome}?`, texto: 'A dívida sai do app e deixa de entrar nos fechamentos. Os fechamentos já pagos não mudam de valor registrado.', rotulo: 'Excluir', aoConfirmar: () => { setEditar(null); executar(remover(r, 'divida', d.id), `${d.nome} excluída.`); } })} />
  </>);
}
function FormDivida({ d, aoFechar, aoSalvar, aoExcluir }: { d: Divida | null; aoFechar: () => void; aoSalvar: (d: Divida) => void; aoExcluir: (d: Divida) => void }) {
  const { r } = useApp();
  const [f, setF] = useState<Divida | null>(d); const [valor, setValor] = useState(''); const [erro, setErro] = useState('');
  const [ultimo, setUltimo] = useState(d);
  if (d !== ultimo) { setUltimo(d); setF(d); setValor(d && d.valorParcela ? reais(d.valorParcela).slice(3) : ''); setErro(''); }
  if (!f) return <Folha aberta={false} aoFechar={aoFechar} titulo=""><span /></Folha>;
  const existe = r.divida.some(x => x.id === f.id);
  const num = (k: keyof Divida, rot: string) => <div className="campo"><label htmlFor={'dv-' + k}>{rot}</label><div className="entrada"><input id={'dv-' + k} inputMode="numeric" value={String(f[k] ?? '')} onChange={e => setF({ ...f, [k]: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></div></div>;
  return (
    <Folha aberta={!!d} aoFechar={aoFechar} titulo={existe ? 'Editar dívida' : 'Nova dívida'}>
      <div className="campo"><label htmlFor="dv-nome">Nome ou credor</label><div className="entrada"><input id="dv-nome" value={f.nome} placeholder="Ex.: Empréstimo Banco X" onChange={e => setF({ ...f, nome: e.target.value })} /></div></div>
      <div className="campo"><label htmlFor="dv-v">Valor da parcela</label><div className="entrada valor"><span>R$</span><input id="dv-v" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} /></div></div>
      {num('parcelaAtual', `Parcela que vence em ${mesCurto(f.mesParcelaAtual)}`)}{num('totalParcelas', 'Total de parcelas')}{num('diaVencimento', 'Dia de vencimento')}
      <div className="campo"><span className="rot">Quem paga</span><div className="pessoas">{r.pessoa.filter(p => p.id !== f.titular).map(p => <button key={p.id} aria-pressed={f.responsavel === p.id} onClick={() => setF({ ...f, responsavel: p.id })}><Selo pessoa={p} grande /></button>)}</div></div>
      {erro ? <p className="ajuda erro">{erro}</p> : null}
      <button className="bt principal cheio" onClick={() => {
        const v = lerValorDigitado(valor);
        if (!f.nome.trim()) return setErro('Dê um nome para a dívida.');
        if (!v) return setErro('Digite o valor da parcela.');
        if (f.parcelaAtual < 1 || f.totalParcelas < f.parcelaAtual) return setErro('A parcela atual precisa estar entre 1 e o total de parcelas.');
        aoSalvar({ ...f, nome: f.nome.trim(), valorParcela: v });
      }}>Salvar</button>
      {existe ? <button className="bt destrutivo cheio" onClick={() => aoExcluir(f)}><Trash2 size={20} aria-hidden="true" />Excluir dívida</button> : null}
    </Folha>
  );
}

// ---------- Pessoas ----------
export function Pessoas() {
  const { r, voltar, executar } = useApp();
  const [p, setP] = useState<Pessoa | null>(null);
  return (<>
    <Topo titulo="Pessoas" voltar={voltar} />
    <main className="conteudo"><div className="cartao"><div className="quem">{r.pessoa.map(x => (
      <button key={x.id} onClick={() => setP(x)} style={{ padding: '10px 0', alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}><Selo pessoa={x} />
        <span className="mini">{x.telefoneWhatsapp ? `WhatsApp ${x.telefoneWhatsapp}` : 'Sem telefone'}{x.chavePix ? ` · Pix ${x.chavePix}` : ''} · {x.tipo === 'usuario' ? 'tem login' : 'sem login, recebe o resumo'}</span></button>))}</div></div>
      <p className="mini">Toque numa pessoa para editar o telefone do WhatsApp e a chave Pix.</p></main>
    <FormPessoa p={p} aoFechar={() => setP(null)} aoSalvar={async x => { setP(null); await executar(salvar(r, 'pessoa', x), `${x.nome} salva.`); }} />
  </>);
}
function FormPessoa({ p, aoFechar, aoSalvar }: { p: Pessoa | null; aoFechar: () => void; aoSalvar: (p: Pessoa) => void }) {
  const [f, setF] = useState(p); const [ultimo, setUltimo] = useState(p);
  if (p !== ultimo) { setUltimo(p); setF(p); }
  return (
    <Folha aberta={!!p} aoFechar={aoFechar} titulo={f ? `Editar ${f.nome}` : ''}>
      {f ? <>
        <div className="campo"><label htmlFor="ps-t">Telefone do WhatsApp</label><div className="entrada"><input id="ps-t" type="tel" inputMode="tel" autoComplete="off" placeholder="(11) 90000-0000" value={f.telefoneWhatsapp ?? ''} onChange={e => setF({ ...f, telefoneWhatsapp: e.target.value })} /></div></div>
        <div className="campo"><label htmlFor="ps-p">Chave Pix (de quem recebe)</label><div className="entrada"><input id="ps-p" autoComplete="off" value={f.chavePix ?? ''} onChange={e => setF({ ...f, chavePix: e.target.value })} /></div><p className="ajuda">Vai no fim de cada resumo do WhatsApp.</p></div>
        <button className="bt principal cheio" onClick={() => aoSalvar({ ...f, telefoneWhatsapp: f.telefoneWhatsapp?.trim() || null, chavePix: f.chavePix?.trim() || null })}>Salvar</button>
      </> : null}
    </Folha>
  );
}

// ---------- Cartões ----------
export function CfgCartoes() {
  const { r, voltar, executar } = useApp();
  const [c, setC] = useState<Cartao | null>(null);
  const titular = r.pessoa.find(p => p.nome === 'Bruna')?.id ?? r.pessoa[0]?.id ?? '';
  return (<>
    <Topo titulo="Cartões" voltar={voltar} />
    <main className="conteudo">
      {r.cartao.length ? <div className="cartao"><div className="quem">{r.cartao.map(x => (
        <button key={x.id} onClick={() => setC(x)} style={{ padding: '10px 0' }}><span className="banco"><LogoBanco banco={x.banco} /><span>{x.apelido}<small>Fecha dia {x.diaFechamento} · vence dia {x.diaVencimento}{x.ativo ? '' : ' · inativo'}</small></span></span><ChevronRight size={20} aria-hidden="true" /></button>))}</div></div> : null}
      <button className="bt secundario cheio" onClick={() => setC({ id: novoId(), apelido: '', banco: 'nubank', titular, diaFechamento: 1, diaVencimento: 10, ativo: true })}><Plus size={20} aria-hidden="true" />Novo cartão</button>
    </main>
    <FormCartao c={c} aoFechar={() => setC(null)} aoSalvar={async x => { setC(null); await executar(salvar(r, 'cartao', x), `${x.apelido} salvo.`); }} />
  </>);
}
function FormCartao({ c, aoFechar, aoSalvar }: { c: Cartao | null; aoFechar: () => void; aoSalvar: (c: Cartao) => void }) {
  const { r } = useApp();
  const [f, setF] = useState(c); const [ultimo, setUltimo] = useState(c); const [erro, setErro] = useState('');
  if (c !== ultimo) { setUltimo(c); setF(c); setErro(''); }
  return (
    <Folha aberta={!!c} aoFechar={aoFechar} titulo={f?.apelido ? `Editar ${f.apelido}` : 'Novo cartão'}>
      {f ? <>
        <div className="campo"><label htmlFor="ct-a">Apelido</label><div className="entrada"><input id="ct-a" value={f.apelido} placeholder="Ex.: Nubank da Bruna" onChange={e => setF({ ...f, apelido: e.target.value })} /></div></div>
        <div className="campo"><span className="rot">Banco</span><div className="chips">{[['nubank', 'Nubank'], ['bb', 'Banco do Brasil'], ['outro', 'Outro']].map(([v, n]) => <button key={v} className="chip" aria-pressed={f.banco === v} onClick={() => setF({ ...f, banco: v as Cartao['banco'] })}>{n}</button>)}</div></div>
        <div className="campo"><span className="rot">Titular</span><div className="pessoas">{r.pessoa.filter(p => p.tipo === 'usuario').map(p => <button key={p.id} aria-pressed={f.titular === p.id} onClick={() => setF({ ...f, titular: p.id })}><Selo pessoa={p} grande /></button>)}</div></div>
        {(['diaFechamento', 'diaVencimento'] as const).map(k => <div className="campo" key={k}><label htmlFor={'ct-' + k}>{k === 'diaFechamento' ? 'Dia de fechamento' : 'Dia de vencimento'}</label><div className="entrada"><input id={'ct-' + k} inputMode="numeric" value={String(f[k])} onChange={e => setF({ ...f, [k]: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></div></div>)}
        <div className="campo"><span className="rot">Situação</span><div className="chips"><button className="chip" aria-pressed={f.ativo} onClick={() => setF({ ...f, ativo: true })}>Ativo</button><button className="chip" aria-pressed={!f.ativo} onClick={() => setF({ ...f, ativo: false })}>Inativo</button></div></div>
        {erro ? <p className="ajuda erro">{erro}</p> : null}
        <button className="bt principal cheio" onClick={() => {
          if (!f.apelido.trim()) return setErro('Dê um apelido ao cartão.');
          if (f.diaFechamento < 1 || f.diaFechamento > 31 || f.diaVencimento < 1 || f.diaVencimento > 31) return setErro('Os dias precisam estar entre 1 e 31.');
          aoSalvar({ ...f, apelido: f.apelido.trim() });
        }}>Salvar</button>
      </> : null}
    </Folha>
  );
}

// ---------- Categorias ----------
export function Categorias() {
  const { r, voltar, executar } = useApp();
  const [nova, setNova] = useState('');
  const usadas = new Set(r.compra.map(c => c.categoria).filter(Boolean));
  const lista = r.categoria.filter(c => c.tipo === 'despesa').sort((a, b) => a.ordem - b.ordem);
  return (<>
    <Topo titulo="Categorias" voltar={voltar} />
    <main className="conteudo">
      <div className="cartao"><div className="quem">{lista.map(c => (
        <div key={c.id}><span style={{ color: c.ativa ? undefined : 'var(--apagado)' }}>{c.nome}{c.ativa ? '' : ' (desativada)'}</span>
          {usadas.has(c.id) ? <button className="bt discreto" style={{ width: 'auto' }} onClick={() => executar(salvar(r, 'categoria', { ...c, ativa: !c.ativa }), `${c.nome} ${c.ativa ? 'desativada' : 'ativada'}.`)}>{c.ativa ? 'Desativar' : 'Ativar'}</button>
            : <button className="bt discreto" style={{ width: 'auto' }} onClick={() => executar(remover(r, 'categoria', c.id), `${c.nome} excluída.`)}>Excluir</button>}</div>))}</div></div>
      <p className="mini">Categorias com lançamentos não podem ser excluídas; dá para desativar.</p>
      <div className="campo"><label htmlFor="cat-n">Nova categoria</label><div className="entrada"><input id="cat-n" value={nova} onChange={e => setNova(e.target.value)} placeholder="Ex.: Pets" /></div></div>
      <button className="bt secundario cheio" disabled={!nova.trim()} onClick={async () => { const n = nova.trim(); setNova(''); await executar(salvar(r, 'categoria', { id: novoId(), nome: n, tipo: 'despesa', ordem: lista.length + 1, ativa: true }), `${n} criada.`); }}><Plus size={20} aria-hidden="true" />Criar</button>
    </main>
  </>);
}

// ---------- Quem pode entrar ----------
export function Emails() {
  const { r, voltar, executar, confirmar } = useApp();
  const [email, setEmail] = useState(''); const [pessoa, setPessoa] = useState(r.pessoa.find(p => p.tipo === 'usuario')?.id ?? '');
  const valido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  return (<>
    <Topo titulo="Quem pode entrar" voltar={voltar} />
    <main className="conteudo">
      <div className="cartao"><div className="quem">{r.usuario_autorizado.map(u => (
        <div key={u.id}><span>{u.email}{u.pessoa ? <span className="mini"> · {r.pessoa.find(p => p.id === u.pessoa)?.nome}</span> : null}</span>
          <button className="bt discreto" disabled={r.usuario_autorizado.length <= 1} onClick={() => confirmar({ titulo: `Tirar ${u.email}?`, texto: 'Esta pessoa não consegue mais entrar no app. Os dados continuam.', rotulo: 'Tirar acesso', aoConfirmar: () => executar(remover(r, 'usuario_autorizado', u.id), 'Acesso retirado.') })}>Tirar</button></div>))}</div></div>
      <p className="mini">Só estes e-mails conseguem entrar com Google.</p>
      <div className="campo"><label htmlFor="em-n">Novo e-mail</label><div className="entrada"><input id="em-n" type="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></div></div>
      <div className="campo"><span className="rot">É de quem</span><div className="pessoas">{r.pessoa.filter(p => p.tipo === 'usuario').map(p => <button key={p.id} aria-pressed={pessoa === p.id} onClick={() => setPessoa(p.id)}><Selo pessoa={p} grande /></button>)}</div></div>
      <button className="bt secundario cheio" disabled={!valido} onClick={async () => { const e = email.trim().toLowerCase(); setEmail(''); await executar(salvar(r, 'usuario_autorizado', { id: novoId(), email: e, pessoa }), `${e} incluído.`); }}><Plus size={20} aria-hidden="true" />Incluir</button>
    </main>
  </>);
}

// ---------- Exportar (backup, §14) ----------
export function Exportar() {
  const { r, voltar, hoje } = useApp();
  const baixar = (nome: string, conteudo: string, tipo: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const csv = () => {
    const linhas = [['cartao', 'fatura', 'data', 'descricao', 'parcela', 'valor', 'pagador', 'escopo', 'categoria', 'situacao']];
    for (const p of r.parcela_cartao) {
      const c = r.compra.find(x => x.id === p.compra)!, f = r.fatura.find(x => x.id === p.fatura)!;
      linhas.push([r.cartao.find(x => x.id === c.cartao)?.apelido ?? '', f.mes, c.data, c.descricao, c.parcelas > 1 ? `${p.numero}/${c.parcelas}` : '', (p.valor / 100).toFixed(2).replace('.', ','),
        // Compra dividida: "Pedro 50% + Bruna 50%" na coluna de quem paga
        c.divisao && c.divisao.length > 1 ? c.divisao.map(d => `${r.pessoa.find(x => x.id === d.pessoa)?.nome ?? '?'} ${Math.round((d.valor * 100) / (c.valorTotal || 1))}%`).join(' + ')
          : r.pessoa.find(x => x.id === c.pagador)?.nome ?? 'sem dono', c.escopo ?? '', r.categoria.find(x => x.id === c.categoria)?.nome ?? '', p.status]);
    }
    return linhas.map(l => l.map(v => /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(';')).join('\n');
  };
  return (<>
    <Topo titulo="Exportar dados" voltar={voltar} />
    <main className="conteudo"><div className="vazio"><IconeVazio icone={Download} /><h2>Cópia de tudo</h2>
      <p>Gera arquivos com cartões, faturas, marcações, dívidas, fechamentos e pagamentos, para guardar onde você quiser. Vale fazer uma vez por mês.</p>
      <div className="acoes"><button className="bt principal medio" onClick={() => baixar(`bp-financas-${hoje}.json`, JSON.stringify(r, null, 2), 'application/json')}><Download size={20} aria-hidden="true" />Tudo (JSON)</button>
        <button className="bt secundario medio" onClick={() => baixar(`bp-financas-linhas-${hoje}.csv`, '﻿' + csv(), 'text/csv')}>Linhas (CSV)</button></div></div></main>
  </>);
}
