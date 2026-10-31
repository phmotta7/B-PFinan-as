'use client';
// Fatura (T4): linhas por dia, filtros, totais por pessoa, marcação individual e em massa (§4.6).
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileUp, X, Check, Copy, Pencil, Users } from 'lucide-react';
import { useApp } from '../estado';
import { IconeVazio, Divisao, Folha, Logo, LogoBanco, SeletorMes, Selo, Topo, ddmm, diaLongo, reais } from '../comum';
import { faturaDe, linhasDaFatura, situacaoDaFatura, totaisDaFatura, type LinhaFatura } from '@/dados/consultas';
import { dividir, marcar, salvar } from '@/dados/operacoes';
import { datasDaFatura, somarMeses } from '@/dominio/ciclo';
import { mesCurto } from '@/dominio/mensagem';
import type { Compra, Escopo, Pessoa, Retrato } from '@/dados/tipos';
import { faltaDividir, partesDaLinha } from '@/dominio/divisao';
import { QuantoCadaUm, juntar, lerPartes, valoresIguais, emTexto } from '../divisao';
import { crescer, destacar, fotografar } from '../movimento';

export function Fatura() {
  const { r, hoje, rota, ir, voltar, podeVoltar, mesDeTrabalho } = useApp();
  const cartao = r.cartao.find(c => c.id === rota.cartao) ?? r.cartao[0];
  const mes = rota.mes ?? mesDeTrabalho;
  const [filtro, setFiltro] = useState(rota.filtro ?? 'todas');
  const [selecao, setSelecao] = useState<Set<string> | null>(null);
  const [folha, setFolha] = useState<string[] | null>(null);
  const segura = useRef<number>(0), longo = useRef(false);

  const fatura = cartao ? faturaDe(r, cartao.id, mes) : undefined;
  const linhas = useMemo(() => (fatura ? linhasDaFatura(r, fatura.id) : []), [r, fatura]);
  const porId = useMemo(() => new Map(linhas.map(l => [l.parcela.id, l])), [linhas]);
  if (!cartao) return null;
  const d = datasDaFatura(cartao, mes);
  const sit = fatura ? situacaoDaFatura(fatura, hoje) : hoje >= d.fechamento ? 'fechada' : 'aberta';
  const t = totaisDaFatura(linhas);
  const nome = (id?: string | null) => r.pessoa.find(p => p.id === id);
  // Compra dividida aparece no filtro de cada pessoa que tem parte nela
  const temParte = (l: LinhaFatura, pessoa: string) => !l.pendente && partesDaLinha(l.compra, l.valor).some(p => p.pessoa === pessoa);
  const donos = (l: LinhaFatura) => partesDaLinha(l.compra, l.valor).map(p => nome(p.pessoa)).filter(Boolean) as Pessoa[];
  const mudarMes = (k: number) => { setFiltro('todas'); ir({ tela: 'fatura', cartao: cartao.id, mes: somarMeses(mes, k) }); };

  const filtros: [string, string, number][] = [['todas', 'Todas', t.quantidade], ['sem', 'Sem dono', t.semDono],
    ...r.pessoa.map(p => [p.id, p.nome, linhas.filter(l => temParte(l, p.id)).length] as [string, string, number]),
    ['parc', 'Parceladas', linhas.filter(l => l.total > 1).length], ['enc', 'Encargos', linhas.filter(l => l.compra.tipo !== 'compra' && l.compra.tipo !== 'parcela').length]];
  const visiveis = linhas.filter(l => filtro === 'todas' || (filtro === 'sem' ? !l.compra.pagador && !l.pendente : filtro === 'parc' ? l.total > 1 : filtro === 'enc' ? l.compra.tipo !== 'compra' && l.compra.tipo !== 'parcela' : temParte(l, filtro)));
  const grupos = new Map<string, LinhaFatura[]>(); visiveis.forEach(l => grupos.set(l.data, [...(grupos.get(l.data) ?? []), l]));

  const tocar = (l: LinhaFatura) => {
    if (longo.current) { longo.current = false; return; }
    if (selecao) { const s = new Set(selecao); if (s.has(l.compra.id)) s.delete(l.compra.id); else s.add(l.compra.id); setSelecao(s.size ? s : null); return; }
    if (l.pendente) return ir({ tela: 'conciliacao' });
    setFolha([l.compra.id]);
  };
  const apertar = (l: LinhaFatura) => { longo.current = false; window.clearTimeout(segura.current);
    segura.current = window.setTimeout(() => { longo.current = true; setSelecao(new Set([...(selecao ?? []), l.compra.id])); navigator.vibrate?.(10); }, 450); };
  const soltar = () => window.clearTimeout(segura.current);
  const daLinha = (e: React.SyntheticEvent) => { const id = (e.target as HTMLElement).closest<HTMLElement>('[data-l]')?.dataset.l; return id ? porId.get(id) : undefined; };

  const tudoCerto = fatura?.status === 'importada' && !t.semDono && !t.pendentes && linhas.length > 0;
  return (<>
    <Topo titulo={cartao.banco === 'nubank' ? 'Nubank' : cartao.banco === 'bb' ? 'BB' : cartao.apelido} voltar={podeVoltar ? voltar : undefined}
      direita={<button className="chip" onClick={() => ir({ tela: 'importar', cartao: cartao.id })}><FileUp size={16} strokeWidth={1.75} aria-hidden="true" />Importar</button>}
      abaixo={<SeletorMes mes={mes} mudar={mudarMes} rotulo="Fatura" />} />
    <main className="conteudo">
      {!linhas.length ? (
        <div className="vazio"><IconeVazio icone={FileUp} /><h2>Nenhuma linha nesta fatura ainda</h2>
          <p>Quando a fatura {mesCurto(mes)} do {cartao.apelido} fechar ({ddmm(d.fechamento)}), baixe o arquivo no app do banco e traga para cá. Compras lançadas no app também aparecem aqui.</p>
          <div className="acoes"><button className="bt principal medio" onClick={() => ir({ tela: 'importar', cartao: cartao.id })}>Importar</button><button className="bt secundario medio" onClick={() => ir({ tela: 'lancar' })}>Lançar</button></div></div>
      ) : (<>
        <div className="duas">
        <div className="col-a">
        <Divisao total={t.total}
          sub={<><LogoBanco banco={cartao.banco} /><span>{cartao.apelido} · {sit === 'aberta' ? `parcial, fecha ${ddmm(d.fechamento)}` : sit === 'importada' ? `importada, vence ${ddmm(d.vencimento)}` : `fechou ${ddmm(d.fechamento)}`}</span></>}
          fatias={[...r.pessoa.map(p => ({ pessoa: p, valor: t.porPessoa.get(p.id) ?? 0, acao: () => setFiltro(filtro === p.id ? 'todas' : p.id) })),
            ...(t.semDono ? [{ pessoa: null, valor: t.valorSemDono, rotulo: `${t.semDono} sem dono`, acao: () => setFiltro('sem') }] : []),
            ...(t.pendentes ? [{ pessoa: null, valor: t.valorPendente, rotulo: `${t.pendentes} para conferir`, conferir: true, acao: () => ir({ tela: 'conciliacao' }) }] : [])]}>
          {t.semDono && !t.pendentes ? <p className="heroi-nota">{t.semDono} {t.semDono > 1 ? 'linhas ainda sem dono' : 'linha ainda sem dono'}, o total de cada pessoa pode mudar.</p> : null}
          {sit !== 'importada' ? <p className="heroi-nota">Parcial com o que foi lançado no app e as parcelas previstas. Ao importar a fatura do banco, ela vira a palavra final.</p> : null}
        </Divisao>
        {t.pendentes ? <button className="aviso info" onClick={() => ir({ tela: 'conciliacao' })} style={{ border: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}><Copy size={20} aria-hidden="true" /><div><p>{t.pendentes} {t.pendentes > 1 ? 'linhas esperam' : 'linha espera'} você conferir a importação.</p><span className="bt link" style={{ minHeight: 0 }}>Conferir agora</span></div></button>
          : tudoCerto ? <div className="aviso ok" role="status"><Check size={20} aria-hidden="true" /><div><p>Todas as linhas têm dono. Os fechamentos estão prontos.</p><button className="bt link" onClick={() => ir({ tela: 'fechamentos', mes })}>Ver fechamentos e mandar resumos</button></div></div> : null}
        </div>
        <div className="col-b">
        <div className="filtros" role="group" aria-label="Filtrar linhas">{filtros.filter(([, , n], i) => n || i < 2).map(([k, n, q]) => <button key={k} className="chip" aria-pressed={filtro === k} onClick={() => setFiltro(filtro === k && k !== 'todas' ? 'todas' : k)}>{n} <span className="n">{q}</span></button>)}</div>
        <div className="dica-linha"><p className="dica-lista" aria-live="polite">{selecao ? 'Toque nas linhas para marcar ou desmarcar.' : 'Toque numa linha para dizer de quem é; toque longo para marcar várias.'}</p>
          {!selecao && visiveis.length ? <button className="bt link" onClick={() => setSelecao(new Set())}>Selecionar</button> : null}</div>
        {visiveis.length ? (
          <div className="lista" onClick={e => { const l = daLinha(e); if (l) tocar(l); }} onPointerDown={e => { const l = daLinha(e); if (l) apertar(l); }}
            onPointerUp={soltar} onPointerCancel={soltar} onPointerLeave={soltar}>{[...grupos.entries()].map(([dia, ls]) => (
            <div key={dia}><h2 className="dia">{diaLongo(dia)}</h2>{ls.map(l => <Linha key={l.parcela.id} l={l} pessoas={donos(l)} marcada={!!selecao?.has(l.compra.id)} emSelecao={!!selecao} />)}</div>))}
          </div>
        ) : <div className="vazio"><IconeVazio icone={Check} /><h2>Nada neste filtro</h2><p>{filtro === 'sem' ? 'Todas as linhas já têm dono.' : 'Nenhuma linha combina com este filtro.'}</p><button className="bt secundario medio" onClick={() => setFiltro('todas')}>Ver todas</button></div>}
        </div></div>
      </>)}
    </main>
    <div className={`massa vidro-normal ${selecao ? 'on' : ''}`} role="region" aria-label="Seleção" inert={!selecao}>
      <button className="redondo" onClick={() => setSelecao(null)} aria-label="Cancelar seleção"><X size={20} /></button>
      <p className="num">{selecao?.size ?? 0} {selecao?.size === 1 ? 'selecionada' : 'selecionadas'}</p>
      <button className="bt claro" disabled={!selecao?.size} onClick={() => setFolha([...(selecao ?? [])])}>Atribuir a…</button>
    </div>
    <FolhaPessoa compras={folha} aoFechar={() => setFolha(null)} aoSalvar={() => { setFolha(null); setSelecao(null); }} />
  </>);
}

const Linha = memo(function Linha({ l, pessoas, marcada, emSelecao }: { l: LinhaFatura; pessoas: Pessoa[]; marcada: boolean; emSelecao: boolean }) {
  const pessoa = pessoas[0], dividida = pessoas.length > 1;
  const quem = dividida ? `dividida entre ${pessoas.map(p => p.nome).join(' e ')}` : pessoa ? pessoa.nome : 'sem dono';
  const nome = `${l.compra.descricao}, ${reais(l.valor)}, ${l.total > 1 ? `parcela ${l.numero} de ${l.total}, ` : ''}${l.pendente ? 'para conferir' : quem}`;
  // Quando a linha ganha outro dono (ou muda de Pessoal para Casal, ou é dividida), ela acende para mostrar onde mudou
  const ref = useRef<HTMLButtonElement>(null), dono = `${pessoas.map(p => p.id).join('+')}|${l.compra.escopo ?? ''}|${l.pendente}`, antes = useRef(dono);
  useEffect(() => { if (antes.current !== dono) { antes.current = dono; destacar(ref.current); } }, [dono]);
  return (
    <button ref={ref} className={`lin${l.compra.tipo === 'iof' ? ' filho' : ''}`} data-l={l.parcela.id} aria-pressed={emSelecao ? marcada : undefined} aria-label={nome}>
      <Logo loja={l.compra.descricao} vazio={l.compra.tipo === 'iof'} />
      <span className="d"><b>{l.compra.descricao}</b>
        <small>{l.total > 1 ? <span className="parc num">{l.numero}/{l.total}</span> : ddmm(l.data)}{l.prevista ? <span className="mini">prevista</span> : null}
          {l.pendente ? <span className="pil at" style={{ padding: '2px 8px' }}>Conferir</span>
            : dividida ? <span className="selos">{pessoas.map(p => <Selo key={p.id} pessoa={p} />)}</span>
            : <Selo pessoa={pessoa} extra={l.compra.escopo === 'casal' ? ' · Casal' : ''} />}</small></span>
      <span className="r"><span className="v num">{reais(l.valor)}</span></span>
    </button>
  );
}, (a, b) => a.l.compra === b.l.compra && a.l.parcela === b.l.parcela && a.l.data === b.l.data && a.pessoas.length === b.pessoas.length && a.pessoas.every((p, i) => p === b.pessoas[i]) && a.marcada === b.marcada && a.emSelecao === b.emSelecao);

// ---------- Folha "De quem é?" (assinatura): E e L num toque; P e B pedem escopo e categoria (D4, D6) ----------
const RECENTES_PADRAO = ['Mercado', 'Alimentação fora', 'Transporte', 'Saúde', 'Compras pessoais'];
const lerRecentes = (pessoa: string): string[] => { try { return JSON.parse(localStorage.getItem('bp-cat-' + pessoa) ?? '[]'); } catch { return []; } };
export const usarCategoria = (pessoa: string, nome: string) => { try { localStorage.setItem('bp-cat-' + pessoa, JSON.stringify([nome, ...lerRecentes(pessoa).filter(x => x !== nome)].slice(0, 5))); } catch { /* sem armazenamento */ } };
export function categoriasVisiveis(r: Retrato, pessoa: string | null, atual: string | null, todas: boolean) {
  const ativas = r.categoria.filter(c => c.ativa && c.tipo === 'despesa').sort((a, b) => a.ordem - b.ordem);
  if (todas || !pessoa) return ativas;
  const nomes = [...new Set([...lerRecentes(pessoa), ...RECENTES_PADRAO])].slice(0, 5);
  const lista = nomes.map(n => ativas.find(c => c.nome === n)).filter(Boolean) as typeof ativas;
  const a = ativas.find(c => c.id === atual);
  return a && !lista.includes(a) ? [a, ...lista.slice(0, 4)] : lista;
}
const escopoPadrao = (pessoa: string): Escopo => { try { return (localStorage.getItem('bp-esc-' + pessoa) as Escopo) || 'pessoal'; } catch { return 'pessoal'; } };
export const lembrarEscopo = (pessoa: string, e: Escopo) => { try { localStorage.setItem('bp-esc-' + pessoa, e); } catch { /* sem armazenamento */ } };

export function FolhaPessoa({ compras, aoFechar, aoSalvar }: { compras: string[] | null; aoFechar: () => void; aoSalvar: () => void }) {
  const { r, executar } = useApp();
  const [escolha, setEscolha] = useState<string | null>(null);
  const [escopo, setEscopo] = useState<Escopo | null>(null);
  const [todas, setTodas] = useState(false);
  const [aberta, setAberta] = useState<string[] | null>(null);
  const [nome, setNome] = useState<string | null>(null); // null = não está editando o nome
  const [dividindo, setDividindo] = useState(false);
  // "Outras…": a caixa de categorias cresce de onde estava e as novas acendem
  const cats = useRef<HTMLDivElement>(null), fotoCats = useRef<ReturnType<typeof fotografar> | null>(null);
  useLayoutEffect(() => { if (todas && fotoCats.current) { crescer(cats.current, fotoCats.current); fotoCats.current = null; } }, [todas]);
  if (compras !== aberta) { setAberta(compras); const c = compras?.length === 1 ? r.compra.find(x => x.id === compras[0]) : null; setEscolha(c?.pagador ?? null); setEscopo(c?.escopo ?? null); setTodas(false); setNome(null); setDividindo((c?.divisao?.length ?? 0) > 1); }
  const ultimas = useRef<string[]>([]); if (compras?.length) ultimas.current = compras;
  const cs = (compras ?? ultimas.current).map(id => r.compra.find(c => c.id === id)).filter(Boolean) as Retrato['compra'];
  const um = cs.length === 1 ? cs[0] : null;
  const valor = cs.reduce((s, c) => s + (c.parcelas > 1 ? Math.round(c.valorTotal / c.parcelas) : c.valorTotal), 0);
  const pessoa = r.pessoa.find(p => p.id === escolha);
  const ehUsuario = pessoa?.tipo === 'usuario';
  const e = escopo ?? (escolha ? escopoPadrao(escolha) : 'pessoal');

  // Nome da compra: a pessoa troca "CleberSalvado" por "iPad". Vale para todas as parcelas, que são a mesma compra.
  const noBanco = (() => {
    const lid = um && r.parcela_cartao.find(x => x.compra === um.id && x.linhaImportada)?.linhaImportada;
    const d = r.linha_importada.find(l => l.id === lid)?.dados.descricao;
    return typeof d === 'string' ? d : null;
  })();
  const renomear = async () => {
    const novo = nome?.trim();
    if (!um || !novo || novo === um.descricao) return setNome(null);
    setNome(null);
    await executar(salvar(r, 'compra', { ...um, descricao: novo }), um.parcelas > 1 ? `Nome trocado para ${novo} nas ${um.parcelas} parcelas.` : `Nome trocado para ${novo}.`);
  };
  const salvarPessoa = async (pagador: string, esc: Escopo | null, categoria: string | null) => {
    const p = r.pessoa.find(x => x.id === pagador)!;
    if (p.tipo === 'usuario' && esc) lembrarEscopo(pagador, esc);
    if (categoria) usarCategoria(pagador, r.categoria.find(c => c.id === categoria)?.nome ?? '');
    aoSalvar();
    await executar(marcar(r, cs.map(c => c.id), { pagador, escopo: esc, categoria }), um ? `${um.descricao} agora é de ${p.nome}${p.tipo === 'usuario' ? ` · ${esc === 'casal' ? 'Casal' : 'Pessoal'}` : ''}` : `${cs.length} linhas agora são de ${p.nome}`);
  };
  return (
    <Folha aberta={!!compras?.length} aoFechar={aoFechar} titulo={um ? 'De quem é?' : `De quem são as ${cs.length}?`} sub={um ? `${um.descricao} · ${reais(valor)}` : reais(valor)}>
      {um ? (nome === null
        ? <button className="bt discreto mudar-nome" onClick={() => setNome(um.descricao)}><Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Mudar o nome</button>
        : <form className="campo" onSubmit={ev => { ev.preventDefault(); renomear(); }}>
            <label htmlFor="f-nome-compra">Nome da compra</label>
            <div className="entrada"><input id="f-nome-compra" value={nome} onChange={ev => setNome(ev.target.value)} autoFocus autoComplete="off" enterKeyHint="done" maxLength={60} /></div>
            {noBanco ? <p className="ajuda">No banco: {noBanco}{um.parcelas > 1 ? `. O nome novo vale para as ${um.parcelas} parcelas.` : ''}</p> : um.parcelas > 1 ? <p className="ajuda">O nome novo vale para as {um.parcelas} parcelas.</p> : null}
            <div className="acoes"><button type="button" className="bt secundario medio" onClick={() => setNome(null)}>Cancelar</button>
              <button type="submit" className="bt principal medio" disabled={!nome.trim() || nome.trim() === um.descricao}>Salvar nome</button></div>
          </form>) : null}
      {dividindo ? <Dividir key={(compras ?? []).join()} cs={cs} aoCancelar={() => setDividindo(false)} aoSalvar={aoSalvar} /> : (<>
      <div className="pessoas" role="group" aria-label="Pessoa">{r.pessoa.map(p => (
        <button key={p.id} aria-pressed={escolha === p.id} onClick={() => { setEscolha(p.id); setEscopo(null); if (p.tipo !== 'usuario') salvarPessoa(p.id, null, null); }}><Selo pessoa={p} grande /></button>))}
      </div>
      <button className="bt secundario medio" onClick={() => setDividindo(true)}><Users size={20} strokeWidth={1.75} aria-hidden="true" />Dividir entre pessoas</button>
      {ehUsuario ? (<>
        <div className="campo"><span className="rot">Para quê</span>
          <div className="seg" data-v={e === 'casal' ? 1 : 0} role="group" aria-label="Para quê"><span className="pino" aria-hidden="true" />
            <button aria-pressed={e !== 'casal'} onClick={() => setEscopo('pessoal')}>Pessoal</button><button aria-pressed={e === 'casal'} onClick={() => setEscopo('casal')}>Casal</button></div></div>
        <div className="campo"><span className="rot">Categoria · toque para salvar</span>
          <div className="cats" ref={cats}>{categoriasVisiveis(r, escolha, um?.categoria ?? null, todas).map(c => <button key={c.id} className="chip" aria-pressed={um?.categoria === c.id} onClick={() => salvarPessoa(escolha!, e, c.id)}>{c.nome}</button>)}
            {todas ? null : <button className="chip" onClick={() => { fotoCats.current = fotografar(cats.current); setTodas(true); }}>Outras…</button>}</div></div>
      </>) : null}
      </>)}
    </Folha>
  );
}

// ---------- Dividir a compra entre pessoas (decidido em 31/10/2026) ----------
// Uma compra: meio a meio com um toque, e dá para ajustar quanto cada um paga. Várias de uma vez: partes iguais em cada uma.
function Dividir({ cs, aoCancelar, aoSalvar }: { cs: Compra[]; aoCancelar: () => void; aoSalvar: () => void }) {
  const { r, executar } = useApp();
  const um = cs.length === 1 ? cs[0] : null;
  const total = um?.valorTotal ?? 0;
  const iguais = (lista: string[]) => valoresIguais(total, lista);
  const [quem, setQuem] = useState<string[]>(() => um?.divisao && um.divisao.length > 1 ? um.divisao.map(p => p.pessoa) : []);
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries((um?.divisao ?? []).map(p => [p.pessoa, emTexto(p.valor)])));
  const [escopo, setEscopo] = useState<Escopo>('pessoal');
  const [cat, setCat] = useState<string | null>(um?.categoria ?? null);
  // "Outras…": todas as categorias, inclusive as criadas em Mais; a caixa cresce de onde estava, como no resto do app
  const [todas, setTodas] = useState(false);
  const cats = useRef<HTMLDivElement>(null), fotoCats = useRef<ReturnType<typeof fotografar> | null>(null);
  useLayoutEffect(() => { if (todas && fotoCats.current) { crescer(cats.current, fotoCats.current); fotoCats.current = null; } }, [todas]);
  const alternar = (id: string) => { const nova = quem.includes(id) ? quem.filter(x => x !== id) : [...quem, id]; setQuem(nova); setValores(iguais(nova)); };
  const nomeDe = (id: string) => r.pessoa.find(p => p.id === id)?.nome ?? '';
  const partes = lerPartes(quem, valores);
  const falta = um ? faltaDividir(total, partes) : 0;
  const usuarios = quem.filter(id => r.pessoa.find(p => p.id === id)?.tipo === 'usuario');
  const pode = quem.length >= 2 && falta === 0 && (!um || partes.every(p => p.valor > 0));
  const confirmar = async () => {
    if (!pode) return;
    if (cat && usuarios[0]) usarCategoria(usuarios[0], r.categoria.find(c => c.id === cat)?.nome ?? '');
    aoSalvar();
    const nomes = juntar(quem.map(nomeDe));
    await executar(dividir(r, cs.map(c => c.id), { pessoas: quem, valores: um ? partes.map(p => p.valor) : undefined, escopo: usuarios.length === 1 ? escopo : null, categoria: cat }),
      um ? `${um.descricao} dividida entre ${nomes}.` : `${cs.length} linhas divididas entre ${nomes}.`);
  };
  return (<>
    <div className="campo"><span className="rot" id="r-div">Dividir entre · toque em quem participa</span>
      <div className="pessoas" role="group" aria-labelledby="r-div">{r.pessoa.map(p => (
        <button key={p.id} aria-pressed={quem.includes(p.id)} onClick={() => alternar(p.id)}><Selo pessoa={p} grande /></button>))}</div></div>
    {um && quem.length >= 2 ? <QuantoCadaUm pessoas={r.pessoa} quem={quem} valores={valores} mudar={setValores} iguais={() => setValores(iguais(quem))} total={total} parcelas={um.parcelas} /> : null}
    {!um && quem.length >= 2 ? <p className="ajuda">Cada uma das {cs.length} linhas fica dividida em partes iguais.</p> : null}
    {usuarios.length === 1 ? (
      <div className="campo"><span className="rot">Para quê, na parte de {nomeDe(usuarios[0])}</span>
        <div className="seg" data-v={escopo === 'casal' ? 1 : 0} role="group"><span className="pino" aria-hidden="true" />
          <button aria-pressed={escopo !== 'casal'} onClick={() => setEscopo('pessoal')}>Pessoal</button><button aria-pressed={escopo === 'casal'} onClick={() => setEscopo('casal')}>Casal</button></div></div>
    ) : usuarios.length >= 2 ? <p className="ajuda">{juntar(usuarios.map(nomeDe))} dividindo: a compra conta como Casal.</p> : null}
    {usuarios.length ? (
      <div className="campo"><span className="rot">Categoria (opcional)</span>
        <div className="cats" ref={cats}>{categoriasVisiveis(r, usuarios[0], cat, todas).map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.nome}</button>)}
          {todas ? null : <button className="chip" onClick={() => { fotoCats.current = fotografar(cats.current); setTodas(true); }}>Outras…</button>}</div></div>
    ) : null}
    <div className="acoes"><button className="bt secundario medio" onClick={aoCancelar}>Voltar</button>
      <button className="bt principal medio" disabled={!pode} onClick={confirmar}>{quem.length >= 2 ? `Dividir entre ${quem.length}` : 'Escolha 2 ou mais'}</button></div>
  </>);
}
