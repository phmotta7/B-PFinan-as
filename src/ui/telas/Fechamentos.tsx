'use client';
// Fechamentos (T8, §5): uma linha por pessoa com total, pago, em aberto, situação; WhatsApp, Copiar, Registrar pagamento.
import { useState } from 'react';
import { MessageCircle, Copy, Check, CircleAlert, ReceiptText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../estado';
import { IconeVazio, Folha, SeletorMes, Selo, Topo, Valor, ddmm, mesLongo, reais } from '../comum';
import { aReceberAntesDe, faturaDe, fechamentosDoMes, gastosDaTitularNoMes, linhasDaFatura, mensagemDe } from '@/dados/consultas';
import { marcarEnviado, registrarPagamento } from '@/dados/operacoes';
import { linkWhatsApp, mesCurto } from '@/dominio/mensagem';
import { lerValorDigitado } from '@/dominio/dinheiro';
import { somarMeses, type Mes } from '@/dominio/ciclo';
import type { Pessoa } from '@/dados/tipos';

export function Fechamentos() {
  const { r, rota, ir, titular, mesDeTrabalho, hoje } = useApp();
  const mes = rota.mes ?? mesDeTrabalho;
  const [aberto, setAberto] = useState<string | null>(null);
  const [msg, setMsg] = useState<Pessoa | null>(null);
  const [pagar, setPagar] = useState<{ pessoa: Pessoa; mes: Mes } | null>(null);
  const credor = r.pessoa.find(p => p.id === titular);
  const fs = fechamentosDoMes(r, mes, titular);
  const comItens = fs.filter(f => f.total > 0);
  const linhas = r.cartao.filter(c => c.titular === titular).flatMap(c => { const f = faturaDe(r, c.id, mes); return f ? linhasDaFatura(r, f.id) : []; });
  const semDono = linhas.filter(l => !l.compra.pagador || l.pendente).length;
  const naoImportadas = r.cartao.filter(c => c.titular === titular && c.ativo).filter(c => faturaDe(r, c.id, mes)?.status !== 'importada');
  const rec = aReceberAntesDe(r, mes, titular);
  const todosAvisados = comItens.length > 0 && comItens.every(f => f.enviadoEm) && !semDono;
  const nav = (k: number) => { setAberto(null); ir({ tela: 'fechamentos', mes: somarMeses(mes, k) }); };

  return (<>
    <Topo titulo="Fechamentos" sub={`Quanto cada pessoa deve à ${credor?.nome ?? 'titular'}`} abaixo={<SeletorMes mes={mes} mudar={nav} rotulo="Mês dos fechamentos" />} />
    <main className="conteudo">
      {naoImportadas.length && mes >= mesDeTrabalho ? <div className="aviso" role="status"><CircleAlert size={20} aria-hidden="true" /><div><p>{naoImportadas.map(c => c.apelido).join(' e ')}: fatura {mesCurto(mes)} ainda não importada. Os valores são parciais.</p>
        <button className="bt link" onClick={() => ir({ tela: 'importar', cartao: naoImportadas[0].id })}>Importar agora</button></div></div> : null}
      {semDono && !(naoImportadas.length && mes >= mesDeTrabalho) ? <div className="aviso" role="status"><CircleAlert size={20} aria-hidden="true" /><div><p>{semDono} linhas desta fatura ainda sem dono, o total pode mudar.</p>
        <button className="bt link" onClick={() => ir({ tela: 'fatura', cartao: linhas.find(l => !l.compra.pagador || l.pendente)?.compra.cartao, mes, filtro: 'sem' })}>Marcar agora</button></div></div> : null}
      {todosAvisados ? <div className="aviso ok" role="status"><Check size={20} aria-hidden="true" /><p>Todos avisados. Agora é registrar os Pix quando chegarem.</p></div> : null}
      {!comItens.length ? <div className="vazio"><IconeVazio icone={ReceiptText} /><h2>Nenhum fechamento em {mesLongo(mes).toLowerCase()}</h2><p>Os fechamentos aparecem quando alguém além da {credor?.nome ?? 'titular'} tem compras numa fatura que vence no mês.</p></div> : null}
      {comItens.length ? <div className="grade-fech">{comItens.map(f => {
        const pil = f.situacao === 'Pago' ? 'ok' : 'at';
        const aberta = aberto === f.pessoa.id;
        return (
          <section key={f.pessoa.id} className="cartao" aria-label={`Fechamento de ${f.pessoa.nome}`}>
            <div className="fech-cab">
              <Selo pessoa={f.pessoa} grande /><span className={`pil ${pil}`}>{f.situacao === 'Pago' ? <Check size={14} strokeWidth={2.25} aria-hidden="true" /> : <CircleAlert size={14} strokeWidth={2.25} aria-hidden="true" />}{f.situacao}</span></div>
            <Valor c={f.total} tamanho="g" />
            <p className="mini num">{f.pago ? `Pago ${reais(f.pago)} · falta ${reais(f.emAberto)}` : 'Nada pago ainda'}{f.enviadoEm ? ` · resumo enviado em ${ddmm(f.enviadoEm)}` : ''}</p>
            <button className="ver-detalhe" onClick={() => setAberto(aberta ? null : f.pessoa.id)} aria-expanded={aberta} aria-controls={`det-${f.pessoa.id}`}>{aberta ? 'Esconder o detalhe' : 'Ver o detalhe'}<ChevronDown size={18} aria-hidden="true" /></button>
            {aberta ? <div className="msg" id={`det-${f.pessoa.id}`} aria-label="Detalhe do fechamento">{mensagemDe(r, f.pessoa, mes, titular)}</div> : null}
            <div className="fech-acoes">
              {f.emAberto ? <button className={`bt ${f.enviadoEm ? 'principal' : 'secundario'} medio`} onClick={() => setPagar({ pessoa: f.pessoa, mes })}>Registrar pagamento</button> : null}
              <button className={`bt ${f.enviadoEm && f.emAberto ? 'secundario' : 'principal'} medio`} onClick={() => setMsg(f.pessoa)}><MessageCircle size={20} aria-hidden="true" />WhatsApp</button>
            </div>
          </section>);
      })}</div> : null}
      {credor ? <section className="cartao"><div className="linha-topo"><Selo pessoa={credor} /><b className="num" style={{ font: 'var(--t-forte)' }}>{reais(gastosDaTitularNoMes(r, mes, titular))}</b></div>
        <p className="mini">Gastos da {credor.nome} nas faturas que vencem em {mesLongo(mes).toLowerCase()}. Ela é a dona dos cartões, então não tem cobrança.</p></section> : null}
      {rec.length ? <><p className="secao">A receber de meses anteriores</p>
        <div className="cartao"><div className="quem num">{rec.map(x => <button key={x.pessoa.id + x.mes} onClick={() => setPagar({ pessoa: x.pessoa, mes: x.mes })}><Selo pessoa={x.pessoa} extra={<span className="mini"> · {mesCurto(x.mes)}, {x.situacao.toLowerCase()}</span>} /><span className="v">{reais(x.emAberto)}</span></button>)}</div></div></> : null}
    </main>
    <FolhaMensagem pessoa={msg} mes={mes} aoFechar={() => setMsg(null)} semDono={semDono} hoje={hoje} />
    <FolhaPagamento alvo={pagar} aoFechar={() => setPagar(null)} />
  </>);
}

function FolhaMensagem({ pessoa, mes, aoFechar, semDono, hoje }: { pessoa: Pessoa | null; mes: Mes; aoFechar: () => void; semDono: number; hoje: string }) {
  const { r, titular, executar, modo } = useApp();
  const [ultima, setUltima] = useState<Pessoa | null>(null);
  if (pessoa && pessoa !== ultima) setUltima(pessoa);
  const p = pessoa ?? ultima;
  const texto = p ? mensagemDe(r, p, mes, titular) : '';
  const enviado = () => executar(marcarEnviado(r, { devedor: p!.id, credor: titular, mes, data: hoje }));
  return (
    <Folha aberta={!!pessoa} aoFechar={aoFechar} titulo={p ? `Resumo para ${p.nome}` : ''} sub={p?.telefoneWhatsapp ? `WhatsApp ${p.telefoneWhatsapp}` : 'Sem telefone cadastrado'}>
      {semDono ? <div className="aviso" role="status"><CircleAlert size={20} aria-hidden="true" /><p>{semDono} linhas desta fatura ainda sem dono, o total pode mudar.</p></div> : null}
      <div className="msg">{texto}</div>
      <div className="acoes">
        <button className="bt secundario" onClick={async () => { try { await navigator.clipboard.writeText(texto); toast('Texto copiado.'); } catch { toast.error('Não consegui copiar. Selecione o texto e copie.'); } }}><Copy size={20} aria-hidden="true" />Copiar</button>
        {p?.telefoneWhatsapp ? <a className="bt principal" href={linkWhatsApp(p.telefoneWhatsapp, texto)} target="_blank" rel="noopener noreferrer" onClick={() => { enviado(); aoFechar(); }}><MessageCircle size={20} aria-hidden="true" />Abrir WhatsApp</a>
          : <button className="bt principal" disabled>Cadastre o telefone</button>}
      </div>
      {modo === 'demo' ? <p className="mini">Modo demonstração: o telefone é fictício.</p> : null}
    </Folha>
  );
}

function FolhaPagamento({ alvo, aoFechar }: { alvo: { pessoa: Pessoa; mes: Mes } | null; aoFechar: () => void }) {
  const { r, titular, executar, hoje } = useApp();
  const [texto, setTexto] = useState('');
  const [data, setData] = useState(hoje);
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');
  const [ultimo, setUltimo] = useState(alvo);
  const f = alvo ? fechamentosDoMes(r, alvo.mes, titular).find(x => x.pessoa.id === alvo.pessoa.id) : null;
  if (alvo !== ultimo) { setUltimo(alvo); if (alvo && f) { setTexto(reais(f.emAberto).slice(3)); setData(hoje); setObs(''); setErro(''); } }
  const a = alvo ?? ultimo;
  return (
    <Folha aberta={!!alvo} aoFechar={aoFechar} titulo={a ? `Pagamento de ${a.pessoa.nome}` : ''} sub={a && f ? `Fechamento ${mesCurto(a.mes)} · falta ${reais(f.emAberto)}` : ''}>
      <div className="campo"><label htmlFor="p-v">Valor recebido</label>
        <div className={`entrada valor ${erro ? 'erro' : ''}`}><span>R$</span><input id="p-v" inputMode="decimal" autoComplete="off" value={texto} onChange={e => { setTexto(e.target.value); setErro(''); }} aria-invalid={!!erro} aria-describedby="p-aj" /></div>
        <p className={`ajuda ${erro ? 'erro' : ''}`} id="p-aj">{erro || 'Se for menos que o total, o fechamento fica parcial e o resto aparece em "A receber".'}</p></div>
      <div className="campo"><label htmlFor="p-d">Quando</label><div className="entrada"><input id="p-d" type="date" value={data} max={hoje} onChange={e => e.target.value && setData(e.target.value)} /></div></div>
      <div className="campo"><label htmlFor="p-o">Observação (opcional)</label><div className="entrada"><input id="p-o" placeholder="Ex.: Pix" value={obs} onChange={e => setObs(e.target.value)} /></div></div>
      <button className="bt principal cheio" onClick={async () => {
        const v = lerValorDigitado(texto);
        if (!v) return setErro('Digite quanto foi recebido.');
        if (!a || !f) return;
        aoFechar();
        const falta = f.emAberto - v;
        await executar(registrarPagamento(r, { devedor: a.pessoa.id, credor: titular, mes: a.mes, valor: v, data, observacao: obs || undefined }),
          falta > 0 ? `${a.pessoa.nome}: ${reais(v)} recebido, falta ${reais(falta)}.` : `${a.pessoa.nome}: fechamento ${mesCurto(a.mes)} pago.`);
      }}>Registrar</button>
    </Folha>
  );
}
