'use client';
// Meu mês (entrega 2C, §6.6 e §6.7): a sobra de quem está usando, as contas fixas do mês e o custo do Casal.
// Cada um vê só a própria sobra (decidido com o Pedro em 07/11/2026). Contas fixas: cadastro em Mais → Contas fixas.
import { useState } from 'react';
import { CalendarClock, Check, CircleAlert, Plus } from 'lucide-react';
import { useApp } from '../estado';
import { Folha, IconeVazio, SeletorMes, Selo, Topo, Valor, ddmm, mesLongo, reais } from '../comum';
import { custoDoCasal, fixasDoMes, ligarFixa, pagarFixa, sobraDoMes, type FixaDoMes } from '@/dados/mes';
import { apagarLancamentos } from '@/dados/extrato';
import { novoId, salvar } from '@/dados/operacoes';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { somarMeses, type Mes } from '@/dominio/ciclo';
import type { Escopo, Recorrente } from '@/dados/tipos';

const centavosParaTexto = (c: number) => (c / 100).toFixed(2).replace('.', ',');
const comSinal = (c: number) => reais(c).replace(/^-/, '−');
const SITUACAO = { paga: ['Paga', 'ok'], prevista: ['Prevista', 'neutra'], atrasada: ['Passou do dia', 'at'] } as const;

/** Resumo da sobra, usado no Início e no topo do Meu mês. */
export function CartaoSobra({ mes, compacto }: { mes: Mes; compacto?: boolean }) {
  const { r, hoje, usuario, ir } = useApp();
  if (!usuario) return null;
  const s = sobraDoMes(r, mes, usuario.id, hoje);
  const linha = (rotulo: string, v: number, sinal: '+' | '−' | '' = '−') => v ? <div><span>{rotulo}</span><span className="v">{sinal === '−' ? '− ' : sinal === '+' ? '+ ' : ''}{reais(v)}</span></div> : null;
  const abertas = s.fixas.filter(f => !f.pago && f.rec.pessoa === usuario.id);
  return (
    <section className="cartao" aria-labelledby="h-sobra">
      <div className="linha-topo"><h2 id="h-sobra">Sobra de {mesLongo(mes).toLowerCase()}</h2>{s.aberto ? <span className="pil neutra">previsão</span> : null}</div>
      <Valor c={s.sobraPrevista} tamanho="g" />
      <p className="mini num">{s.aberto ? `Até agora: ${comSinal(s.sobraAteAgora)}. ` : ''}Só você vê a sua sobra.</p>
      {compacto ? null : (
        <div className="quem num">
          {linha('Receitas', s.receitas, '+')}{linha('Receitas previstas', s.receitasPrevistas, '+')}
          {linha('Cartão (sua parte nas faturas do mês)', s.cartao)}{linha('Extrato e lançados à mão', s.extrato)}
          {linha('Dívidas pagas pelo fechamento', s.dividas)}{linha('Contas fixas a pagar', s.fixasPrevistas)}
          {s.paraOCasal ? <div><span className="mini">Destes gastos, para o Casal</span><span className="mini">{reais(s.paraOCasal)}</span></div> : null}
        </div>)}
      {compacto && abertas.length ? <p className="mini">{abertas.slice(0, 2).map(f => `${f.rec.descricao} ${reais(f.rec.valor)} (dia ${ddmm(f.data)})`).join(' · ')}{abertas.length > 2 ? ` e mais ${abertas.length - 2}` : ''} ainda a {abertas[0].rec.tipo === 'receita' ? 'receber' : 'pagar'}.</p> : null}
      {compacto ? <button className="bt secundario cheio" onClick={() => ir({ tela: 'mes', mes })}>Ver meu mês</button> : null}
      {!s.receitas && !s.receitasPrevistas ? <p className="mini">Sem receita no mês ainda. Importe o extrato, lance a receita ou cadastre o salário em Contas fixas.</p> : null}
    </section>
  );
}

/** Folha de uma conta fixa do mês: marcar como paga com o valor real (RN-RE-02) ou desfazer. */
function FolhaFixa({ f, aoFechar }: { f: FixaDoMes | null; aoFechar: () => void }) {
  const { r, hoje, executar, usuario } = useApp();
  const [ultima, setUltima] = useState<FixaDoMes | null>(null);
  if (f && f !== ultima) setUltima(f);
  const x = f ?? ultima;
  const [texto, setTexto] = useState('');
  const [de, setDe] = useState('');
  if (x && de !== x.rec.id + x.data) { setDe(x.rec.id + x.data); setTexto(centavosParaTexto(x.rec.valor)); }
  if (!x) return null;
  const meu = x.rec.pessoa === usuario?.id, receita = x.rec.tipo === 'receita';
  const valor = lerValorDigitado(texto);
  return (
    <Folha aberta={!!f} aoFechar={aoFechar} titulo={x.rec.descricao} sub={`${receita ? 'Receita' : 'Conta'} fixa · dia ${ddmm(x.data)} · ${reais(x.rec.valor)} previsto`}>
      {!meu ? <p className="mini">Esta conta é de {r.pessoa.find(p => p.id === x.rec.pessoa)?.nome}; só quem paga marca como paga.</p>
        : x.pago ? (<>
          <p className="mini">{receita ? 'Recebida' : 'Paga'} em {ddmm(x.pago.data)}: {reais(Math.abs(x.pago.valor))}{x.pago.origem === 'importacao' ? ', pela linha do extrato' : ', lançada à mão'}.</p>
          <button className="bt secundario cheio" onClick={async () => { aoFechar(); await executar(x.pago!.origem === 'manual' ? apagarLancamentos(r, [x.pago!.id]) : ligarFixa(r, x.pago!.id, null), 'Voltou a ficar prevista.'); }}>
            {x.pago.origem === 'manual' ? `Desfazer: não ${receita ? 'recebi' : 'paguei'}` : 'Não era esta linha do extrato'}</button>
        </>) : (<>
          <div className="campo"><label htmlFor="f-fixa">Valor {receita ? 'recebido' : 'pago'}</label>
            <div className="entrada valor"><span>R$</span><input id="f-fixa" inputMode="decimal" value={texto} onChange={e => setTexto(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
          <p className="mini">Se o pagamento vier no extrato, o app liga sozinho a linha a esta conta (valor parecido, perto do dia) e não precisa marcar aqui.</p>
          <button className="bt principal cheio" disabled={!valor} onClick={async () => { aoFechar(); await executar(pagarFixa(x.rec, valor, hoje < x.data ? hoje : x.data), `${x.rec.descricao}: ${receita ? 'recebida' : 'paga'}.`); }}>
            <Check size={20} strokeWidth={1.75} aria-hidden="true" />Marcar como {receita ? 'recebida' : 'paga'}</button>
        </>)}
    </Folha>
  );
}

export function MeuMes() {
  const { r, rota, hoje, usuario, mesDeTrabalho, ir, voltar, podeVoltar } = useApp();
  const mes = rota.mes ?? mesDeTrabalho;
  const [aberta, setAberta] = useState<FixaDoMes | null>(null);
  if (!usuario) return null;
  const fixas = fixasDoMes(r, mes, hoje, usuario.id);
  const casal = custoDoCasal(r, mes, hoje);
  return (<>
    <Topo titulo="Meu mês" voltar={podeVoltar ? voltar : () => ir({ tela: 'inicio' })} abaixo={<SeletorMes mes={mes} mudar={k => ir({ tela: 'mes', mes: somarMeses(mes, k) })} rotulo="Mês" />} />
    <main className="conteudo"><div className="duas"><div className="col-a">
      <CartaoSobra mes={mes} />
      <p className="mini">Pix entre suas contas, pagamento de cartão, pagamento do fechamento e investimento não entram: é dinheiro mudando de lugar. As compras no cartão contam no mês em que a fatura vence.</p>
    </div><div className="col-b">
      <section className="cartao" aria-labelledby="h-fixas">
        <div className="linha-topo"><h2 id="h-fixas">Contas fixas</h2><button className="chip" onClick={() => ir({ tela: 'fixas' })}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Cadastrar</button></div>
        {fixas.length ? <div className="quem num">{fixas.map(f => {
          const [rot, cor] = SITUACAO[f.situacao];
          return (
            <button key={f.rec.id} onClick={() => setAberta(f)} aria-label={`${f.rec.descricao}, ${reais(f.pago ? Math.abs(f.pago.valor) : f.rec.valor)}, dia ${ddmm(f.data)}, ${rot}`}>
              <span><b>{f.rec.descricao}</b><small className="mini"> · dia {ddmm(f.data)}{f.rec.escopo === 'casal' ? ' · Casal' : ''}{f.rec.tipo === 'receita' ? ' · receita' : ''}</small></span>
              <span className="fixa-dir"><span className={`pil ${cor}`}>{rot}</span><span className="v">{reais(f.pago ? Math.abs(f.pago.valor) : f.rec.valor)}</span></span>
            </button>);
        })}</div> : <p className="mini">Nenhuma conta fixa em {mesLongo(mes).toLowerCase()}. Cadastre aluguel, luz, internet, assinaturas e o salário: o app mostra o que falta pagar e já conta na previsão da sobra.</p>}
      </section>
      <section className="cartao" aria-labelledby="h-casal">
        <div className="linha-topo"><h2 id="h-casal">Custo do Casal</h2><span className="mini num">{reais(casal.total)}</span></div>
        <div className="quem num">{[...casal.porPessoa.entries()].map(([id, v]) => <div key={id}><Selo pessoa={r.pessoa.find(p => p.id === id)} /><span className="v">{reais(v)}</span></div>)}</div>
        {casal.previsto ? <p className="mini">Mais {reais(casal.previsto)} em contas fixas do Casal ainda a pagar.</p> : null}
        <p className="mini">O que cada um pôs nas compras e contas marcadas como Casal (cartão e o que cada um deixou visível do extrato).</p>
      </section>
    </div></div></main>
    <FolhaFixa f={aberta} aoFechar={() => setAberta(null)} />
  </>);
}

// ---------- Cadastro de contas fixas ----------
function FormFixa({ rec, aoFechar }: { rec: Recorrente | null; aoFechar: () => void }) {
  const { r, executar, usuario, mesDeTrabalho, confirmar } = useApp();
  const [x, setX] = useState<Recorrente | null>(null);
  const [texto, setTexto] = useState('');
  const [de, setDe] = useState<Recorrente | null>(null);
  const [tentou, setTentou] = useState(false);
  if (rec && de !== rec) { setDe(rec); setX(rec); setTexto(rec.valor ? centavosParaTexto(rec.valor) : ''); setTentou(false); }
  if (!x || !usuario) return <Folha aberta={false} aoFechar={aoFechar} titulo="">{null}</Folha>;
  const novo = !r.recorrente.some(y => y.id === x.id);
  const valor = lerValorDigitado(texto);
  const cats = r.categoria.filter(c => c.ativa && c.tipo === x.tipo).sort((a, b) => a.ordem - b.ordem);
  const erro = !x.descricao.trim() ? 'Dê um nome, ex.: Luz.' : !valor ? 'Digite o valor previsto.' : !(x.dia >= 1 && x.dia <= 31) ? 'O dia vai de 1 a 31.' : !x.categoria ? 'Escolha a categoria.' : '';
  const usado = r.lancamento.some(l => l.recorrente === x.id);
  const gravar = async () => { setTentou(true); if (erro) return; aoFechar(); await executar(salvar(r, 'recorrente', { ...x, descricao: x.descricao.trim(), valor }), `${x.descricao.trim()} ${novo ? 'cadastrada' : 'atualizada'}.`); };
  return (
    <Folha aberta={!!rec} aoFechar={aoFechar} titulo={novo ? 'Nova conta fixa' : x.descricao} sub="Repete todo mês, a partir do mês de início">
      <div className="seg" data-v={x.tipo === 'receita' ? 1 : 0} role="group" aria-label="Tipo"><span className="pino" aria-hidden="true" />
        <button aria-pressed={x.tipo === 'despesa'} onClick={() => setX({ ...x, tipo: 'despesa', categoria: null })}>Conta a pagar</button>
        <button aria-pressed={x.tipo === 'receita'} onClick={() => setX({ ...x, tipo: 'receita', categoria: null, escopo: 'pessoal' })}>Receita</button></div>
      <div className="campo"><label htmlFor="ff-desc">Nome</label><div className="entrada"><input id="ff-desc" placeholder={x.tipo === 'receita' ? 'Ex.: Salário' : 'Ex.: Luz'} value={x.descricao} onChange={e => setX({ ...x, descricao: e.target.value })} /></div></div>
      <div className="duas-campos">
        <div className="campo"><label htmlFor="ff-valor">Valor previsto</label><div className="entrada valor"><span>R$</span><input id="ff-valor" inputMode="decimal" placeholder="0,00" value={texto} onChange={e => setTexto(e.target.value.replace(/[^\d,.]/g, ''))} /></div></div>
        <div className="campo"><label htmlFor="ff-dia">Dia do mês</label><div className="entrada"><input id="ff-dia" inputMode="numeric" value={x.dia || ''} onChange={e => setX({ ...x, dia: Number(e.target.value.replace(/\D/g, '').slice(0, 2)) })} /></div></div>
      </div>
      {x.tipo === 'despesa' ? <div className="seg" data-v={x.escopo === 'casal' ? 1 : 0} role="group" aria-label="Para quê"><span className="pino" aria-hidden="true" />
        <button aria-pressed={x.escopo !== 'casal'} onClick={() => setX({ ...x, escopo: 'pessoal' as Escopo })}>Pessoal</button><button aria-pressed={x.escopo === 'casal'} onClick={() => setX({ ...x, escopo: 'casal' })}>Casal</button></div> : null}
      <div className="cats" role="group" aria-label="Categoria">{cats.map(c => <button key={c.id} className="chip" aria-pressed={x.categoria === c.id} onClick={() => setX({ ...x, categoria: c.id })}>{c.nome}</button>)}</div>
      {tentou && erro ? <p className="ajuda erro"><CircleAlert size={16} aria-hidden="true" />{erro}</p> : null}
      <button className="bt principal cheio" onClick={gravar}>{novo ? 'Cadastrar' : 'Salvar'}</button>
      {!novo ? (x.fim ? <button className="bt secundario cheio" onClick={async () => { aoFechar(); await executar(salvar(r, 'recorrente', { ...x, fim: null }), 'Voltou a valer.'); }}>Voltar a valer</button>
        : <button className="bt secundario cheio" onClick={() => confirmar({ titulo: `Parar ${x.descricao}?`, texto: usado ? `Vale até ${mesLongo(mesDeTrabalho).toLowerCase()} e some dos meses seguintes. O que já foi pago continua no histórico.` : 'Ela ainda não foi paga nenhuma vez, então sai do app.', rotulo: usado ? 'Parar' : 'Excluir',
          aoConfirmar: async () => { aoFechar(); await executar(usado ? salvar(r, 'recorrente', { ...x, fim: mesDeTrabalho }) : { inserir: {}, atualizar: {}, apagar: { recorrente: [x.id] } }, usado ? `${x.descricao} parada.` : `${x.descricao} excluída.`); } })}>
          {usado ? 'Parar a partir do mês que vem' : 'Excluir'}</button>) : null}
    </Folha>
  );
}

export function ContasFixas() {
  const { r, usuario, mesDeTrabalho, ir, voltar, podeVoltar } = useApp();
  const [aberta, setAberta] = useState<Recorrente | null>(null);
  if (!usuario) return null;
  const nova = (): Recorrente => ({ id: novoId(), pessoa: usuario.id, descricao: '', tipo: 'despesa', valor: 0, dia: 10, escopo: 'pessoal', categoria: null, inicio: mesDeTrabalho, fim: null, ativo: true });
  const lista = [...r.recorrente].sort((a, b) => Number(!!a.fim) - Number(!!b.fim) || a.tipo.localeCompare(b.tipo) || a.dia - b.dia);
  return (<>
    <Topo titulo="Contas fixas" sub="Aluguel, luz, internet, assinaturas, salário" voltar={podeVoltar ? voltar : () => ir({ tela: 'mais' })}
      direita={<button className="chip" onClick={() => setAberta(nova())}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Nova</button>} />
    <main className="conteudo">
      {!lista.length ? <div className="vazio"><IconeVazio icone={CalendarClock} /><h2>Nenhuma conta fixa ainda</h2>
        <p>Cadastre o que se repete todo mês. O app mostra o que falta pagar, conta na previsão da sobra e reconhece o pagamento quando ele aparece no extrato.</p>
        <button className="bt principal" onClick={() => setAberta(nova())}><Plus size={20} strokeWidth={1.75} aria-hidden="true" />Cadastrar a primeira</button></div>
        : <section className="cartao"><div className="quem num">{lista.map(x => {
          const meu = x.pessoa === usuario.id;
          return (
            <button key={x.id} onClick={() => meu ? setAberta(x) : undefined} aria-disabled={!meu}>
              <span><b>{x.descricao}</b><small className="mini"> · dia {x.dia}{x.escopo === 'casal' ? ' · Casal' : ''}{x.tipo === 'receita' ? ' · receita' : ''}{!meu ? ` · de ${r.pessoa.find(p => p.id === x.pessoa)?.nome}` : ''}{x.fim ? ` · parada desde ${mesLongo(somarMeses(x.fim, 1)).toLowerCase()}` : ''}</small></span>
              <span className="v">{reais(x.valor)}</span>
            </button>);
        })}</div></section>}
    </main>
    <FormFixa rec={aberta} aoFechar={() => setAberta(null)} />
  </>);
}
