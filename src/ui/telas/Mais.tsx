'use client';
// Mais (D10/D11): Dívidas, conferência, importação e Configurações (T15): pessoas, cartões, categorias, e-mails, exportar.
import { useState, type ReactNode } from 'react';
import { ChevronRight, Layers, Copy, FileUp, User, CreditCard, SlidersHorizontal, Mail, Download, Plus, Landmark, CalendarClock, ChartColumn, Gauge, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { calendarioDeFechamentos } from '@/dominio/lembrete';
import { useApp } from '../estado';
import { IconeVazio, Folha, LogoBanco, Selo, Topo } from '../comum';
import { novoId, remover, salvar } from '@/dados/operacoes';
import type { Cartao, Pessoa } from '@/dados/tipos';

const Linha = ({ icone, titulo, sub, onClick }: { icone: ReactNode; titulo: string; sub: string; onClick: () => void }) => (
  <button className="pend" onClick={onClick}><span className="ico n">{icone}</span><span className="t"><b>{titulo}</b><small>{sub}</small></span><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></button>);

export function Mais() {
  const { r, ir, sair, confirmar, modo, recomecarDemo, mesDeTrabalho } = useApp();
  const [tema, setTema] = useState(() => { try { return localStorage.getItem('bp-tema') ?? 'auto'; } catch { return 'auto'; } });
  const mudarTema = (t: string) => { setTema(t); try { localStorage.setItem('bp-tema', t); } catch { /* sem armazenamento */ } if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); };
  const i = (C: typeof Layers) => <C size={20} strokeWidth={1.75} aria-hidden="true" />;
  // Arquivo de calendário: o celular abre e oferece adicionar os eventos (com aviso às 9h)
  const baixarLembretes = () => {
    const cartoes = r.cartao.filter(c => c.ativo);
    if (!cartoes.length) return toast('Cadastre um cartão primeiro, em Cartões.');
    const url = URL.createObjectURL(new Blob([calendarioDeFechamentos(cartoes, mesDeTrabalho)], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bp-faturas.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Abra o arquivo bp-faturas.ics para pôr no calendário os dias de importar (${cartoes.map(c => c.apelido).join(' e ')}).`);
  };
  return (<>
    <Topo titulo="Mais" />
    <main className="conteudo">
      <div className="cartao"><div>
        <Linha icone={i(ChartColumn)} titulo="Para onde vai o dinheiro" sub="Gastos do cartão por categoria e mês a mês" onClick={() => ir({ tela: 'gastos' })} />
        <Linha icone={i(Landmark)} titulo="Extratos" sub="Importar o OFX da sua conta e ver gastos e receitas" onClick={() => ir({ tela: 'extratos' })} />
        <Linha icone={i(CalendarClock)} titulo="Contas fixas" sub="O que se repete todo mês, inclusive o salário" onClick={() => ir({ tela: 'fixas' })} />
        <Linha icone={i(Gauge)} titulo="Orçamento" sub="Limite por categoria, com aviso perto do fim" onClick={() => ir({ tela: 'orcamento' })} />
        <Linha icone={i(PiggyBank)} titulo="Metas" sub="Reserva de emergência e objetivos" onClick={() => ir({ tela: 'metas' })} />
        <Linha icone={i(Layers)} titulo="Dívidas" sub="Empréstimos, parcelamentos e quando ficamos livres" onClick={() => ir({ tela: 'dividas' })} />
        <Linha icone={i(Copy)} titulo="Conferir importação" sub="Duplicidades e parcelas da última fatura" onClick={() => ir({ tela: 'conciliacao' })} />
        <Linha icone={i(FileUp)} titulo="Importar fatura" sub="Nubank ou CSV de outro banco" onClick={() => ir({ tela: 'importar' })} />
        <Linha icone={i(CalendarClock)} titulo="Lembrete no calendário" sub="Avisa no dia de importar cada fatura, pelos próximos 12 meses" onClick={baixarLembretes} />
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
