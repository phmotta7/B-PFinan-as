'use client';
// Lançar compra no cartão (T7, §4.3). Lembra o último cartão e a última pessoa; escopo padrão D6; categoria obrigatória só para Pedro e Bruna (D4).
import { useLayoutEffect, useRef, useState } from 'react';
import { Calendar, CircleAlert, CreditCard, Users } from 'lucide-react';
import { useApp } from '../estado';
import { IconeVazio, Selo, Topo, ddmm, reais } from '../comum';
import { categoriasVisiveis, lembrarEscopo, usarCategoria } from './Fatura';
import { lancarCompra } from '@/dados/operacoes';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { dividirEmParcelas } from '@/dominio/parcelas';
import { datasDaFatura, faturaDaCompra, somarMeses } from '@/dominio/ciclo';
import { mesCurto } from '@/dominio/mensagem';
import type { Escopo } from '@/dados/tipos';
import { crescer, fotografar } from '../movimento';
import { QuantoCadaUm, juntar, lerPartes, valoresIguais } from '../divisao';
import { faltaDividir } from '@/dominio/divisao';

const ler = (k: string, padrao: string) => { try { return localStorage.getItem(k) ?? padrao; } catch { return padrao; } };
const gravar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
// Parcelado no lançamento manual: de 2x a 12x (decisão D13)
const PARCELAS = Array.from({ length: 11 }, (_, i) => i + 2);
const menosDias = (d: string, n: number) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };

export function Lancar() {
  const { r, hoje, voltar, podeVoltar, executar, usuario } = useApp();
  const [texto, setTexto] = useState('');
  const [desc, setDesc] = useState('');
  const [dono, setDono] = useState(() => ler('bp-ultimo-dono', usuario?.id ?? r.pessoa[0]?.id ?? ''));
  const [escopo, setEscopo] = useState<Escopo>(() => (ler('bp-esc-' + dono, 'pessoal') as Escopo));
  const [cat, setCat] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  // "Outras…": a caixa de categorias cresce de onde estava e as novas acendem
  const cats = useRef<HTMLDivElement>(null), fotoCats = useRef<ReturnType<typeof fotografar> | null>(null);
  useLayoutEffect(() => { if (todas && fotoCats.current) { crescer(cats.current, fotoCats.current); fotoCats.current = null; } }, [todas]);
  const [n, setN] = useState(1);
  const [cartaoId, setCartaoId] = useState(() => ler('bp-ultimo-cartao', r.cartao.find(c => c.ativo)?.id ?? ''));
  const [data, setData] = useState(hoje);
  const [alterar, setAlterar] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  // Divisão (PLANEJAMENTO §4.6.1): várias pessoas; os valores seguem o meio a meio até alguém ajustar à mão
  const [dividindo, setDividindo] = useState(false);
  const [quem, setQuem] = useState<string[]>([]);
  const [valoresAjustados, setValoresAjustados] = useState<Record<string, string> | null>(null);

  const valor = lerValorDigitado(texto);
  const pessoa = r.pessoa.find(p => p.id === dono);
  const valores = valoresAjustados ?? valoresIguais(valor, quem);
  const divisao = lerPartes(quem, valores);
  const usuarios = quem.filter(id => r.pessoa.find(p => p.id === id)?.tipo === 'usuario');
  const nomeDe = (id: string) => r.pessoa.find(p => p.id === id)?.nome ?? '';
  // Quem dá a categoria e o Pessoal/Casal: a pessoa escolhida; na divisão, o primeiro de Pedro e Bruna que estiver nela
  const ehUsuario = dividindo ? usuarios.length > 0 : pessoa?.tipo === 'usuario';
  const donoDaCategoria = dividindo ? usuarios[0] ?? quem[0] ?? null : dono;
  const alternar = (id: string) => { setQuem(quem.includes(id) ? quem.filter(x => x !== id) : [...quem, id]); setValoresAjustados(null); };
  const cartao = r.cartao.find(c => c.id === cartaoId) ?? r.cartao.find(c => c.ativo);
  if (!cartao) return <><Topo titulo="Lançar compra" voltar={voltar} /><main className="conteudo"><div className="vazio"><IconeVazio icone={CreditCard} /><h2>Cadastre um cartão primeiro</h2><p>Em Mais → Cartões.</p></div></main></>;
  const destino = faturaDaCompra(cartao, data);
  const fechaNoDia = data === datasDaFatura(cartao, somarMeses(destino, -1)).fechamento; // RN-CA-02: no dia do fechamento vai para a seguinte
  const partes = valor ? dividirEmParcelas(valor, n) : [];
  const erros = { valor: !valor ? 'Digite o valor da compra.' : '', desc: !desc.trim() ? 'Diga o que foi comprado, para reconhecer na fatura.' : '', cat: ehUsuario && !cat ? 'Escolha a categoria. Para Pedro e Bruna ela é obrigatória.' : '',
    div: !dividindo ? '' : quem.length < 2 ? 'Escolha duas ou mais pessoas para dividir.' : valor && (faltaDividir(valor, divisao) !== 0 || divisao.some(d => d.valor <= 0)) ? 'A soma das partes precisa fechar com o valor da compra.' : '' };
  const mostra = (k: keyof typeof erros) => tentou && erros[k];
  const datas = [[hoje, `Hoje, ${ddmm(hoje)}`], [menosDias(hoje, 1), `Ontem, ${ddmm(menosDias(hoje, 1))}`], [menosDias(hoje, 2), ddmm(menosDias(hoje, 2))]];

  const salvar = async () => {
    setTentou(true);
    if (erros.valor || erros.desc || erros.cat || erros.div) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    setSalvando(true);
    gravar('bp-ultimo-cartao', cartao.id);
    if (!dividindo) gravar('bp-ultimo-dono', dono);
    if (!dividindo && ehUsuario) lembrarEscopo(dono, escopo);
    if (cat && donoDaCategoria) usarCategoria(donoDaCategoria, r.categoria.find(c => c.id === cat)?.nome ?? '');
    // Na divisão: o pagador é a primeira pessoa; Pedro e Bruna juntos = Casal; só um deles = o Pessoal/Casal escolhido
    const escopoFinal = dividindo ? (usuarios.length >= 2 ? 'casal' : usuarios.length === 1 ? escopo : null) : ehUsuario ? escopo : null;
    const ok = await executar(lancarCompra(r, { cartao: cartao.id, data, descricao: desc, valorTotal: valor, parcelas: n, pagador: dividindo ? quem[0] : dono, escopo: escopoFinal, categoria: cat, divisao: dividindo ? divisao : null }),
      `Lançado: ${desc.trim()}, ${reais(valor)}${n > 1 ? ` em ${n}x` : ''}, fatura ${mesCurto(destino)}${dividindo ? `, dividida entre ${juntar(quem.map(nomeDe))}` : ''}.`);
    setSalvando(false);
    if (ok) { if (podeVoltar) voltar(); else { setTexto(''); setDesc(''); setN(1); setCat(null); setTentou(false); setDividindo(false); setQuem([]); setValoresAjustados(null); } }
  };

  return (<>
    <Topo titulo="Lançar compra" sub="No cartão" voltar={podeVoltar ? voltar : undefined} />
    <main className="conteudo sem-barra form-estreito">
      <div className="campo"><label htmlFor="f-valor">Valor</label>
        <div className={`entrada valor ${mostra('valor') ? 'erro' : ''}`}><span>R$</span><input id="f-valor" inputMode="decimal" placeholder="0,00" autoComplete="off" value={texto} onChange={e => setTexto(e.target.value.replace(/[^\d,.]/g, ''))} aria-invalid={!!mostra('valor')} aria-describedby="f-parts" /></div>
        {mostra('valor') ? <p className="ajuda erro"><CircleAlert size={16} aria-hidden="true" />{erros.valor}</p> : null}
      </div>
      <div className="campo"><span className="rot" id="r-pag">Pagamento</span>
        <div className="seg" data-v={n > 1 ? 1 : 0} role="group" aria-labelledby="r-pag"><span className="pino" aria-hidden="true" />
          <button aria-pressed={n === 1} onClick={() => setN(1)}>À vista</button><button aria-pressed={n > 1} onClick={() => n === 1 && setN(2)}>Parcelado</button></div>
        {n > 1 ? <div className="chips parcelas" role="group" aria-label="Quantas parcelas">{PARCELAS.map(k => <button key={k} className="chip num" aria-pressed={n === k} onClick={() => setN(k)}>{k}x</button>)}</div> : null}
        {n > 1 && valor ? <p className="ajuda num" id="f-parts" aria-live="polite">{n}x de {reais(partes[n - 1])}{partes[0] !== partes[n - 1] ? ` (a 1ª de ${reais(partes[0])})` : ''}</p> : null}
      </div>
      <div className="campo"><label htmlFor="f-desc">Descrição</label>
        <div className={`entrada ${mostra('desc') ? 'erro' : ''}`}><input id="f-desc" placeholder="Ex.: Tênis Centauro" autoComplete="off" enterKeyHint="done" value={desc} onChange={e => setDesc(e.target.value)} aria-invalid={!!mostra('desc')} /></div>
        {mostra('desc') ? <p className="ajuda erro"><CircleAlert size={16} aria-hidden="true" />{erros.desc}</p> : null}</div>
      <div className="campo"><span className="rot" id="r-pg">{dividindo ? 'Dividir entre · toque em quem participa' : 'De quem é'}</span>
        {dividindo
          ? <div className="pessoas" role="group" aria-labelledby="r-pg">{r.pessoa.map(p => <button key={p.id} aria-pressed={quem.includes(p.id)} onClick={() => alternar(p.id)}><Selo pessoa={p} grande /></button>)}</div>
          : <div className="pessoas" role="group" aria-labelledby="r-pg">{r.pessoa.map(p => <button key={p.id} aria-pressed={dono === p.id} onClick={() => { setDono(p.id); setEscopo(ler('bp-esc-' + p.id, 'pessoal') as Escopo); }}><Selo pessoa={p} grande /></button>)}</div>}
        <button className="bt secundario medio" onClick={() => { if (dividindo) { setDividindo(false); } else { setDividindo(true); setQuem([dono]); setValoresAjustados(null); } }}>
          <Users size={20} strokeWidth={1.75} aria-hidden="true" />{dividindo ? 'Não dividir' : 'Dividir entre pessoas'}</button>
        {mostra('div') ? <p className="ajuda erro"><CircleAlert size={16} aria-hidden="true" />{erros.div}</p> : null}</div>
      {dividindo && quem.length >= 2 && valor ? <QuantoCadaUm pessoas={r.pessoa} quem={quem} valores={valores} mudar={setValoresAjustados} iguais={() => setValoresAjustados(null)} total={valor} parcelas={n} /> : null}
      {dividindo && quem.length >= 2 && !valor ? <p className="ajuda">Digite o valor da compra para ver quanto cada um paga.</p> : null}
      {dividindo && usuarios.length >= 2 ? <p className="ajuda">{juntar(usuarios.map(nomeDe))} dividindo: a compra conta como Casal.</p> : null}
      {(dividindo ? usuarios.length === 1 : ehUsuario) ? <div className="campo"><span className="rot" id="r-esc">{dividindo ? `Para quê, na parte de ${nomeDe(usuarios[0])}` : 'Para quê'}</span>
        <div className="seg" data-v={escopo === 'casal' ? 1 : 0} role="group" aria-labelledby="r-esc"><span className="pino" aria-hidden="true" />
          <button aria-pressed={escopo !== 'casal'} onClick={() => setEscopo('pessoal')}>Pessoal</button><button aria-pressed={escopo === 'casal'} onClick={() => setEscopo('casal')}>Casal</button></div></div> : null}
      <div className="campo"><span className="rot" id="r-cat">Categoria{ehUsuario ? '' : ' (opcional)'}</span>
        <div className="cats" role="group" aria-labelledby="r-cat" ref={cats}>{categoriasVisiveis(r, donoDaCategoria, cat, todas).map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.nome}</button>)}
          {todas ? null : <button className="chip" onClick={() => { fotoCats.current = fotografar(cats.current); setTodas(true); }}>Outras…</button>}</div>
        {mostra('cat') ? <p className="ajuda erro"><CircleAlert size={16} aria-hidden="true" />{erros.cat}</p> : null}</div>
      {alterar ? (<>
        <div className="campo"><span className="rot" id="r-ct">Cartão</span><div className="chips" role="group" aria-labelledby="r-ct">{r.cartao.filter(c => c.ativo).map(c => <button key={c.id} className="chip" aria-pressed={cartao.id === c.id} onClick={() => setCartaoId(c.id)}>{c.apelido}</button>)}</div></div>
        <div className="campo"><label htmlFor="f-data">Data da compra</label>
          <div className="chips" role="group">{datas.map(([d, rot]) => <button key={d} className="chip" aria-pressed={data === d} onClick={() => setData(d)}>{rot}</button>)}</div>
          <div className="entrada"><input id="f-data" type="date" value={data} max={hoje} onChange={e => e.target.value && setData(e.target.value)} /></div></div>
      </>) : null}
      <div className="resumo-ct"><p><Calendar size={20} strokeWidth={1.75} aria-hidden="true" /><span><b>{cartao.apelido} · {data === hoje ? 'hoje' : ddmm(data)}</b> · entra na fatura {mesCurto(destino)}{fechaNoDia ? `, porque o cartão fecha ${data === hoje ? 'hoje' : 'neste dia'}` : ''}</span></p>
        {alterar ? null : <button className="bt discreto" onClick={() => setAlterar(true)}>Alterar</button>}</div>
      <div className="rodape vidro-normal"><button className="bt principal cheio" disabled={salvando} aria-busy={salvando} onClick={salvar}>{salvando ? <><span className="giro" aria-hidden="true" />Lançando</> : `Lançar ${valor ? reais(valor) : ''}`}</button></div>
    </main>
  </>);
}
