'use client';
// Importar fatura (T5): escolher cartão e arquivo → mapeamento (CSV genérico, 1ª vez) → pré-visualização → gravar (§4.4).
import { useRef, useState } from 'react';
import { FileUp, Check } from 'lucide-react';
import { useApp } from '../estado';
import { Aviso, Esqueleto, Logo, LogoBanco, Topo, Valor, ddmm, reais } from '../comum';
import { lerCsvGenerico, lerNubank, ErroDeLeitura, type Leitura, type MapaDeColunas, type FormatoData } from '@/dominio/leitores';
import { datasDaFatura, somarMeses, sugerirFatura, type Mes } from '@/dominio/ciclo';
import { mesCurto } from '@/dominio/mensagem';
import { importarFatura, salvar } from '@/dados/operacoes';
import { aplicar } from '@/dados/mudanca';

type Passo = { n: 'escolher' } | { n: 'mapa'; texto: string; nome: string } | { n: 'previa'; texto: string; nome: string; leitura: Leitura; mes: Mes };

export function Importar() {
  const { r, rota, voltar, ir, executar, repo, hoje } = useApp();
  const [cartaoId, setCartaoId] = useState(rota.cartao ?? r.cartao[0]?.id);
  const [passo, setPasso] = useState<Passo>({ n: 'escolher' });
  const [erro, setErro] = useState('');
  const [lendo, setLendo] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cartao = r.cartao.find(c => c.id === cartaoId)!;
  const ehNubank = cartao?.banco === 'nubank';

  const ler = (texto: string, nome: string, mapa?: MapaDeColunas | null) => {
    try {
      const leitura = ehNubank ? lerNubank(texto, cartao.id) : lerCsvGenerico(texto, cartao.id, mapa!);
      if (!leitura.linhas.length) throw new ErroDeLeitura('Não encontrei nenhuma compra neste arquivo.');
      setPasso({ n: 'previa', texto, nome, leitura, mes: sugerirFatura(cartao, leitura.linhas.map(l => l.data)) }); setErro('');
    } catch (e) { setErro(e instanceof ErroDeLeitura ? e.message : 'Não consegui ler este arquivo. Confira se é a fatura em CSV.'); setPasso({ n: 'escolher' }); }
  };
  const escolher = async (f: File) => {
    setLendo(true); setErro('');
    const texto = await f.text(); setLendo(false);
    if (!ehNubank && !cartao.mapaCsv) return setPasso({ n: 'mapa', texto, nome: f.name });
    ler(texto, f.name, cartao.mapaCsv);
  };

  // Avançar um passo chega da direita; voltar (cancelar, arquivo com erro), da esquerda
  const ordem = lendo ? 1 : ({ escolher: 0, mapa: 2, previa: 3 } as const)[passo.n];
  const anterior = useRef(ordem), direcao = useRef<'frente' | 'volta' | undefined>(undefined);
  if (anterior.current !== ordem) { direcao.current = ordem > anterior.current ? 'frente' : 'volta'; anterior.current = ordem; }
  const titulo = passo.n === 'escolher' ? 'Escolha o cartão e o arquivo' : passo.n === 'mapa' ? 'Colunas do arquivo' : 'Confira o arquivo antes de gravar';
  return (<>
    <Topo titulo="Importar fatura" sub={titulo} voltar={voltar} />
    <main className="conteudo sem-barra"><div className="passo" key={ordem} data-dir={direcao.current}>
      {lendo ? <Esqueleto linhas={6} /> : passo.n === 'escolher' ? (<>
        <div className="campo"><span className="rot" id="r-cart">Cartão</span>
          <div className="pessoas" role="group" aria-labelledby="r-cart">{r.cartao.filter(c => c.ativo).map(c => (
            <button key={c.id} aria-pressed={cartaoId === c.id} onClick={() => { setCartaoId(c.id); setErro(''); }}><span className="banco"><LogoBanco banco={c.banco} /><span className="nome-banco">{c.banco === 'nubank' ? 'Nubank' : c.banco === 'bb' ? 'BB' : c.apelido}<small>{c.banco === 'nubank' ? 'Arquivo CSV' : 'CSV ou planilha'}</small></span></span></button>))}
          </div></div>
        {erro ? <Aviso tipo="er" papel="alert"><p>{erro}</p></Aviso> : null}
        <div className="escolha-arquivo"><h2>Arquivo da fatura</h2>
          <p>{ehNubank ? 'No app do Nubank, abra a fatura fechada e exporte em CSV. O arquivo vem com data, descrição e valor de cada linha.' : cartao?.mapaCsv ? 'O app já sabe ler o arquivo deste cartão.' : 'Na primeira vez, você mostra ao app qual coluna é a data, a descrição e o valor; ele lembra nas próximas.'}</p>
          <button className="bt principal" onClick={() => input.current?.click()}><FileUp size={20} strokeWidth={1.75} aria-hidden="true" />Escolher arquivo</button>
          <input ref={input} type="file" accept=".csv,text/csv,text/plain" className="escondido" onChange={e => { const f = e.target.files?.[0]; if (f) escolher(f); e.target.value = ''; }} />
        </div>
        <p className="mini">Nada é gravado antes de você conferir.</p>
      </>) : passo.n === 'mapa' ? (
        <Mapa texto={passo.texto} nome={passo.nome} aoConfirmar={async mapa => {
          await executar(salvar(r, 'cartao', { ...cartao, mapaCsv: mapa }));
          ler(passo.texto, passo.nome, mapa);
        }} />
      ) : (
        <Previa passo={passo} cartaoId={cartao.id} mudarMes={mes => setPasso({ ...passo, mes })} cancelar={() => setPasso({ n: 'escolher' })}
          gravar={async () => {
            const res = importarFatura(r, { cartao: cartao.id, mes: passo.mes, leitura: passo.leitura, formato: ehNubank ? 'nubank_csv' : 'csv_generico', arquivoNome: passo.nome, hoje });
            const ok = await executar(res.mudanca, `${res.resumo.novas} linhas gravadas na fatura ${mesCurto(passo.mes)}.`, { semDesfazer: true });
            if (!ok) return;
            const imp = aplicar(r, res.mudanca).importacao.find(i => i.fatura === res.resumo.fatura && i.arquivoNome === passo.nome);
            if (imp) repo.guardarArquivo(imp.id, passo.nome, passo.texto).catch(() => undefined);
            ir({ tela: 'conciliacao', cartao: cartao.id, mes: passo.mes });
          }} />
      )}
    </div></main>
  </>);
}

function Previa({ passo, cartaoId, mudarMes, cancelar, gravar }: { passo: Extract<Passo, { n: 'previa' }>; cartaoId: string; mudarMes: (m: Mes) => void; cancelar: () => void; gravar: () => Promise<void> }) {
  const { r } = useApp();
  const [gravando, setGravando] = useState(false);
  const cartao = r.cartao.find(c => c.id === cartaoId)!;
  const { leitura, mes } = passo;
  const ja = new Set(r.linha_importada.filter(l => l.cartao === cartaoId).map(l => l.digital));
  const repetidas = leitura.linhas.filter(l => ja.has(l.digital)).length;
  const conta = (t: string) => leitura.linhas.filter(l => l.tipo === t).length;
  const total = leitura.linhas.reduce((s, l) => s + l.valor, 0);
  const sugerida = sugerirFatura(cartao, leitura.linhas.map(l => l.data));
  const d = datasDaFatura(cartao, mes);
  const rotulo = (t: string) => ({ compra: 'Compra', parcela: 'Parcela', iof: 'IOF', estorno: 'Estorno', anuidade: 'Anuidade', juros: 'Juros', ajuste: 'Ajuste' }[t] ?? t);
  const novas = leitura.linhas.length - repetidas;
  return (<>
    <div className="cartao">
      <div className="banco"><LogoBanco banco={cartao.banco} /><span>{passo.nome}<small>{leitura.linhas.length + leitura.ignoradas.length} linhas lidas</small></span></div>
      <Valor c={total} tamanho="g" />
      <p className="mini">{conta('compra')} compras · {conta('parcela')} parcelas · {conta('iof')} IOF · {conta('estorno')} estornos · {conta('anuidade') + conta('juros')} encargos{leitura.ignoradas.length ? ` · ${leitura.ignoradas.length} ignorada${leitura.ignoradas.length > 1 ? 's' : ''}` : ''}</p>
    </div>
    <div className="campo"><span className="rot" id="r-fat">Este arquivo é de qual fatura?</span>
      <div className="chips" role="group" aria-labelledby="r-fat">{[-1, 0, 1].map(k => somarMeses(sugerida, k)).map(m => <button key={m} className="chip" aria-pressed={mes === m} onClick={() => mudarMes(m)}>{mesCurto(m)}{m === sugerida ? <span className="n"> sugerida</span> : null}</button>)}</div>
      <p className="ajuda">Sugeri pela data das compras: fecha {ddmm(d.fechamento)}, vence {ddmm(d.vencimento)}. Todas as linhas entram nela.</p></div>
    {repetidas ? <Aviso tipo="info"><p>{repetidas === leitura.linhas.length ? `Este arquivo já foi importado. As ${repetidas} linhas são iguais às que já estão no app, então nada novo será gravado.` : `${repetidas} linhas já estavam no app e não entram de novo.`}</p></Aviso> : null}
    <div className="lista">
      {leitura.ignoradas.map(l => <div key={l.descricao + l.data} className="lin" style={{ cursor: 'default' }}><span className="logo" aria-hidden="true"><Check size={16} /></span><span className="d"><b>{l.descricao}</b><small>{ddmm(l.data)} <span className="pil neutra" style={{ padding: '2px 8px' }}>Ignorada: {l.motivo.replace(/\.$/, '').toLowerCase()}</span></small></span><span className="r"><span className="v num" style={{ color: 'var(--suave)' }}>{reais(l.valor)}</span></span></div>)}
      {[...leitura.linhas].sort((a, b) => a.data.localeCompare(b.data)).map(l => (
        <div key={l.digital} className={`lin${l.tipo === 'iof' ? ' filho' : ''}`} style={{ cursor: 'default' }}><Logo loja={l.loja} vazio={l.tipo === 'iof'} />
          <span className="d"><b>{l.loja}</b><small>{l.parcela ? <span className="parc num">{l.parcela.atual}/{l.parcela.total}</span> : ddmm(l.data)} <span className={`pil ${ja.has(l.digital) ? 'neutra' : 'acao'}`} style={{ padding: '2px 8px' }}>{ja.has(l.digital) ? 'Já importada' : rotulo(l.tipo)}</span></small></span>
          <span className="r"><span className="v num">{reais(l.valor)}</span></span></div>))}
    </div>
    <div className="rodape acoes"><button className="bt secundario" onClick={cancelar}>Cancelar</button>
      <button className="bt principal" disabled={!novas || gravando} aria-busy={gravando} onClick={async () => { setGravando(true); await gravar(); setGravando(false); }}>{gravando ? <><span className="giro" aria-hidden="true" />Gravando</> : novas ? `Gravar ${novas} linhas` : 'Nada novo'}</button></div>
  </>);
}

function Mapa({ texto, nome, aoConfirmar }: { texto: string; nome: string; aoConfirmar: (m: MapaDeColunas) => void }) {
  const brutas = texto.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const [pular, setPular] = useState(() => Math.max(0, brutas.findIndex(l => (l.match(/[;,\t]/g) ?? []).length >= 2)));
  const sep = (brutas[pular] ?? '').split(';').length > (brutas[pular] ?? '').split(',').length ? ';' : ',';
  const corta = (l: string) => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim());
  const cab = corta(brutas[pular] ?? '');
  const exemplo = brutas.slice(pular + 1, pular + 4).map(corta);
  const acha = (re: RegExp) => cab.find(c => re.test(c)) ?? cab[0] ?? '';
  const [m, setM] = useState<MapaDeColunas>({ colData: acha(/data|date/i), colDescricao: acha(/descri|lan[cç]amento|hist|title/i), colValor: acha(/valor|amount/i), formatoData: 'dd/mm/aaaa', decimal: ',', compraPositiva: true, pularLinhas: pular });
  const sel = (rot: string, valor: string, ops: [string, string][], muda: (v: string) => void) => (
    <div className="campo"><label htmlFor={'mp-' + rot}>{rot}</label><div className="entrada"><select id={'mp-' + rot} value={valor} onChange={e => muda(e.target.value)}>{ops.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div></div>);
  const cols = cab.map(c => [c, c] as [string, string]);
  return (<>
    <Aviso tipo="info"><p>Primeira importação deste cartão. Diga ao app o que é cada coluna; ele guarda e não pergunta de novo.</p></Aviso>
    <p className="secao">Começo do arquivo {nome}</p>
    <div className="tabela"><table><thead><tr>{cab.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{exemplo.map((l, i) => <tr key={i}>{l.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>
    {sel('Linhas de cabeçalho para pular', String(pular), [0, 1, 2, 3, 4, 5].map(n => [String(n), String(n)]), v => { setPular(+v); setM({ ...m, pularLinhas: +v }); })}
    {sel('Data', m.colData, cols, v => setM({ ...m, colData: v }))}
    {sel('Descrição', m.colDescricao, cols, v => setM({ ...m, colDescricao: v }))}
    {sel('Valor', m.colValor, cols, v => setM({ ...m, colValor: v }))}
    {sel('Parcela (opcional)', m.colParcela ?? '', [['', 'Não tem, ou vem na descrição'], ...cols], v => setM({ ...m, colParcela: v || undefined }))}
    {sel('Formato da data', m.formatoData, [['dd/mm/aaaa', 'dia/mês/ano'], ['mm/dd/aaaa', 'mês/dia/ano'], ['aaaa-mm-dd', 'ano-mês-dia']], v => setM({ ...m, formatoData: v as FormatoData }))}
    {sel('Decimal', m.decimal, [[',', 'vírgula (18,00)'], ['.', 'ponto (18.00)']], v => setM({ ...m, decimal: v as ',' | '.' }))}
    {sel('Compras aparecem como', m.compraPositiva ? '+' : '-', [['+', 'valor positivo'], ['-', 'valor negativo']], v => setM({ ...m, compraPositiva: v === '+' }))}
    <div className="rodape vidro-normal"><button className="bt principal cheio" onClick={() => aoConfirmar({ ...m, pularLinhas: pular })}>Ver as linhas lidas</button></div>
  </>);
}
