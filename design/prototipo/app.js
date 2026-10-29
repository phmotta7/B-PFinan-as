// Protótipo navegável da Etapa 1 do B&P Finanças. Tudo roda no navegador, com dados fictícios.
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tela = $('#tela'), raiz = $('#app');
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clone = o => JSON.parse(JSON.stringify(o));

// ---------- Formatação ----------
const brl = c => { const n = Math.abs(c), r = Math.floor(n / 100), cent = String(n % 100).padStart(2, '0');
  return (c < 0 ? '-' : '') + 'R$ ' + String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + cent; };
const brlMsg = c => brl(c).replace(' ', ' ');
const dt = s => new Date(s + 'T12:00:00');
const dm = s => s.slice(8, 10) + '/' + s.slice(5, 7);
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const mesCurto = m => MES3[+m.slice(5, 7) - 1] + '/' + m.slice(2, 4);
const mesLongo = m => { const s = MESES[+m.slice(5, 7) - 1]; return s[0].toUpperCase() + s.slice(1); };
const diaLongo = s => { const d = dt(s); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const somaMes = (m, k) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const centavos = txt => { const t = String(txt).replace(/[^\d,]/g, ''); if (!t) return 0; const [a, b = ''] = t.split(','); return (+a || 0) * 100 + +(b + '00').slice(0, 2); };
const ic = (n, cl = '') => `<svg class="ic ${cl}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

// ---------- Estado ----------
let S;
const MANUAIS_NU = () => [
  { id: 'm1', d: '2026-10-14', loja: 'Uber', v: 2300, dono: 'P', esc: 'Pessoal', cat: 'Transporte', parc: '', manual: true },
  { id: 'm2', d: '2026-10-12', loja: 'Tênis Centauro', v: 10000, dono: 'P', esc: 'Pessoal', cat: 'Compras pessoais', parc: '1/3', compra: '2026-10-12', prev: true },
  { id: 'm3', d: '2026-10-04', loja: 'Magazine Luiza', v: 8000, dono: 'L', esc: '', cat: '', parc: '3/10', compra: '2026-08-15', prev: true },
  { id: 'm4', d: '2026-10-11', loja: 'Magazine Luiza', v: 6650, dono: 'B', esc: 'Pessoal', cat: 'Compras pessoais', parc: '4/6', compra: '2026-07-11', prev: true },
  { id: 'm5', d: '2026-10-27', loja: 'Renner', v: 4500, dono: 'B', esc: 'Pessoal', cat: 'Compras pessoais', parc: '2/4', compra: '2026-09-27', prev: true },
  { id: 'm6', d: '2026-10-19', loja: 'iFood', v: 4780, dono: 'P', esc: 'Pessoal', cat: 'Alimentação fora', parc: '', manual: true },
  { id: 'm7', d: '2026-10-21', loja: 'iFood', v: 4780, dono: 'B', esc: 'Casal', cat: 'Alimentação fora', parc: '', manual: true },
  { id: 'm8', d: '2026-10-08', loja: 'Curso de inglês', v: 4900, dono: 'B', esc: 'Pessoal', cat: 'Educação', parc: '2/6', compra: '2026-09-08', prev: true },
];
function inicial() {
  const f = clone(FATURAS);
  Object.values(f).forEach(fa => fa.linhas.forEach((l, i) => { l.id = fa.cartao + i; }));
  return {
    usuario: 'B', logado: false, login: 'normal', tema: 'auto',
    nu: 'fechada', faturas: f, manuaisNu: MANUAIS_NU(), extras: [],
    conc: clone(CONCILIACAO), fech: clone(FECHAMENTOS), dividas: clone(DIVIDAS),
    pilha: [], tela: 'login', p: {}, estado: 'normal', grande: false,
    filtro: 'todas', sel: new Set(), selModo: false,
    ultimo: { cartao: 'nu', dono: 'P', esc: { P: 'Pessoal', B: 'Pessoal' } },
    imp: { passo: 1, cartao: 'nu', arquivo: null, fatura: '2026-11', mapa: false }, bbMapa: null,
  };
}
S = inicial();

// ---------- Regras de apresentação (contas) ----------
const cartao = id => CARTOES.find(c => c.id === id);
const chaveFat = (c, m) => `${c}-${m}`;
function linhasDe(c, m) {
  let ls;
  if (c === 'nu' && m === '2026-11') ls = S.nu === 'fechada' ? S.manuaisNu.filter(l => l.id !== 'm8') : S.faturas['nu-2026-11'].linhas;
  else ls = (S.faturas[chaveFat(c, m)] || {}).linhas || [];
  ls = ls.concat(prevSeries(c, m)).concat(S.extras.filter(x => x.cartao === c && x.mes === m));
  if (S.grande && c === 'nu' && m === '2026-11') ls = ls.concat(linhasGrandes());
  return ls;
}
// Parcelas futuras previstas (RN-CO-02): mês seguinte das séries conhecidas
function prevSeries(c, m) {
  if (!(c === 'nu' && m === '2026-12')) return [];
  const base = S.nu === 'fechada' ? S.manuaisNu : S.faturas['nu-2026-11'].linhas;
  return base.filter(l => l.parc && !l.id.startsWith('m8')).flatMap(l => {
    const [x, y] = l.parc.split('/').map(Number); if (x >= y) return [];
    return [{ ...l, id: l.id + '-n', d: '2026-11-' + l.d.slice(8), parc: `${x + 1}/${y}`, prev: true, pend: null }];
  });
}
let _grandes;
function linhasGrandes() {
  if (_grandes) return _grandes;
  const lojas = ['Pão de Açúcar','Drogasil','Uber *Trip','iFood','Shopee','Amazon','Padaria Real','Renner','Posto Ipiranga','Magazine Luiza'];
  const donos = ['B','B','B','P','E','L',null];
  _grandes = Array.from({ length: 200 }, (_, i) => ({ id: 'g' + i, d: `2026-10-${String(3 + (i % 28)).padStart(2, '0')}`, loja: lojas[i % lojas.length],
    v: 900 + ((i * 7919) % 15000), dono: donos[i % donos.length], esc: 'Pessoal', cat: 'Outros', parc: '' }));
  return _grandes;
}
const fatInfo = (c, m) => {
  const ca = cartao(c), fd = S.faturas[chaveFat(c, m)];
  const fecha = `${m}-${String(ca.fecha).padStart(2, '0')}`, vence = `${m}-${String(ca.vence).padStart(2, '0')}`;
  let status = 'Aberta';
  if (fd && fd.status) status = fd.status;
  if (c === 'nu' && m === '2026-11') status = S.nu === 'fechada' ? 'Fechada' : 'Importada';
  return { fecha, vence, status };
};
function totais(ls) {
  const t = { P: 0, B: 0, E: 0, L: 0, x: 0, nx: 0, pend: 0, total: 0, n: ls.length };
  ls.forEach(l => { t.total += l.v; if (l.pend) t.pend++; if (l.dono) t[l.dono] += l.v; else if (!l.pend) { t.x += l.v; t.nx++; } else t.x += l.v; });
  return t;
}
const PESSOA_ORDEM = ['P', 'B', 'E', 'L'];
const selo = (k, extra = '', g = false) => k ? `<span class="selo ${PESSOAS[k].classe}${g ? ' g' : ''}"><b aria-hidden="true">${PESSOAS[k].nome[0]}</b>${PESSOAS[k].nome}${extra}</span>`
  : `<span class="selo x${g ? ' g' : ''}"><b aria-hidden="true">?</b>${extra || 'Sem dono'}</span>`;
function logo(loja, vazio) {
  if (vazio) return '<span class="logo vazio" aria-hidden="true"></span>';
  const k = LOJA_LOGO.find(([p]) => loja.toLowerCase().includes(p));
  if (k && LOGOS[k[1]]) return `<span class="logo" aria-hidden="true"><img src="${LOGOS[k[1]]}" alt=""></span>`;
  return `<span class="logo" aria-hidden="true">${esc(loja.replace(/[^A-Za-zÀ-ú]/g, '')[0] || '?')}</span>`;
}
const logoBanco = b => `<span class="logo" aria-hidden="true"><img src="${LOGOS[b]}" alt=""></span>`;

// Fechamento de uma pessoa num mês de vencimento (§5.1)
function itensFech(k, m) {
  const blocos = [];
  CARTOES.forEach(c => {
    const ls = linhasDe(c.id, m).filter(l => l.dono === k);
    if (ls.length) blocos.push({ c, vence: fatInfo(c.id, m).vence, ls });
  });
  const outros = S.dividas.filter(d => d.resp === k && m === '2026-11');
  return { blocos, outros };
}
function fech(k, m) {
  const { blocos, outros } = itensFech(k, m);
  let total = blocos.reduce((a, b) => a + b.ls.reduce((s, l) => s + l.v, 0), 0) + outros.reduce((s, d) => s + d.parcela, 0);
  const reg = (S.fech[m] || {})[k] || { pagos: [] };
  if (reg.total != null) total = reg.total;
  const pago = reg.pagos.reduce((s, p) => s + p.v, 0), aberto = Math.max(0, total - pago);
  const status = total === 0 ? 'Sem itens' : pago === 0 ? 'Pendente' : aberto === 0 ? 'Pago' : 'Parcial';
  return { total, pago, aberto, status, enviado: reg.enviado, blocos, outros };
}
// Mensagem do WhatsApp (§5.3, RN-WA-01..08, D2)
function linhaMsg(l) {
  if (l.v < 0) return `• Estorno ${l.loja} – -${brlMsg(-l.v)} (${dm(l.d)})`;
  if (l.parc) {
    const [x, y] = l.parc.split('/').map(Number);
    const fim = x >= y ? ' – última parcela' : ` – faltam ${y - x}x – restante ${brlMsg(l.v * (y - x))}`;
    return `• ${l.loja} – ${x}/${y} – ${brlMsg(l.v)}${fim} (${dm(l.compra || l.d)})`;
  }
  return `• ${l.loja} – ${brlMsg(l.v)} (${dm(l.d)})`;
}
function mensagem(k, m) {
  const f = fech(k, m), out = [`Resumo Fatura ${mesCurto(m)} – ${PESSOAS[k].nome}`, ''];
  f.blocos.forEach(b => {
    out.push(`💳 ${b.c.curto} (vence ${dm(b.vence)})`);
    const comp = b.ls.filter(l => l.tipo !== 'iof').sort((a, z) => (a.compra || a.d).localeCompare(z.compra || z.d));
    comp.forEach(l => { out.push(linhaMsg(l)); b.ls.filter(i => i.tipo === 'iof' && i.de === l.loja).forEach(i => out.push(linhaMsg(i))); });
    b.ls.filter(i => i.tipo === 'iof' && !comp.some(l => l.loja === i.de)).forEach(i => out.push(linhaMsg(i)));
    out.push(`Subtotal ${b.c.curto}: ${brlMsg(b.ls.reduce((s, l) => s + l.v, 0))}`, '');
  });
  if (f.outros.length) {
    out.push('📄 Outros');
    f.outros.forEach(d => out.push(`• ${d.nome} – ${d.atual}/${d.total} – ${brlMsg(d.parcela)}` + (d.atual >= d.total ? ' – última parcela' : ` – faltam ${d.total - d.atual}x – restante ${brlMsg(d.parcela * (d.total - d.atual))}`)));
    out.push(`Subtotal Outros: ${brlMsg(f.outros.reduce((s, d) => s + d.parcela, 0))}`, '');
  }
  if (f.pago > 0 && f.aberto > 0) out.push(`Já pago: -${brlMsg(f.pago)}`, `Falta pagar: ${brlMsg(f.aberto)}`);
  out.push(`TOTAL: ${brlMsg(f.total)}`, `Pix: ${CHAVE_PIX}`);
  return out.join('\n');
}
const semDonoMes = m => CARTOES.reduce((a, c) => a + linhasDe(c.id, m).filter(l => !l.dono && !l.pend).length, 0);
const pendMes = m => CARTOES.reduce((a, c) => a + linhasDe(c.id, m).filter(l => l.pend).length, 0);
const concAbertas = () => S.nu === 'importada' ? S.conc.duplicidades.filter(d => d.estado === 'aberta').length + S.conc.ambiguas.filter(d => d.estado === 'aberta').length + S.conc.naoEncontradas.filter(d => d.estado === 'aberta').length : 0;

// ---------- Navegação ----------
const ABAS = [['inicio', 'Início', 'inicio'], ['cartoes', 'Cartões', 'cartao'], ['lancar', 'Lançar', 'mais'], ['fechamentos', 'Fechamentos', 'fechamento'], ['mais', 'Mais', 'menu']];
const RAIZ = ['inicio', 'cartoes', 'fechamentos', 'mais'];
function ir(t, p = {}, opt = {}) {
  if (RAIZ.includes(t) && !opt.empilha) S.pilha = [];
  else if (!opt.troca) S.pilha.push({ tela: S.tela, p: S.p });
  S.tela = t; S.p = p; S.estado = 'normal'; sairSelecao(true);
  render(opt.volta ? 'volta' : 'vai');
}
function voltar() { const a = S.pilha.pop(); if (!a) return ir('inicio'); S.tela = a.tela; S.p = a.p; render('volta'); }

// ---------- Telas ----------
function topo(t, sub = '', { voltar: v = false, direita = '' } = {}) {
  return `<header class="topo"><div class="nav">${v ? `<button class="redondo" data-a="voltar" aria-label="Voltar"><span>${ic('voltar', 'p')}</span></button>` : '<span></span>'}${direita}</div>
    <h1>${t}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</header>`;
}
const esqueleto = (n = 4) => `<div class="esq" aria-busy="true" aria-label="Carregando"><i class="g"></i>${Array.from({ length: n }, (_, i) => `<div><i class="c"></i><i style="width:${40 + (i * 13) % 30}%"></i><i style="width:18%;margin-left:auto"></i></div>`).join('')}</div>`;
const erroCaixa = (msg, bt = 'Tentar de novo') => `<div class="aviso er" role="alert">${ic('atencao')}<div><p>${msg}</p><button class="bt link" data-a="estado" data-v="normal">${bt}</button></div></div>`;

const T = {};
T.login = () => {
  const neg = S.login === 'negado', car = S.login === 'carregando';
  return `<div class="login entra"><div class="marca">${MARCA}<h1>B&amp;P Finanças</h1><p>As contas da casa de Pedro e Bruna.</p></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${neg ? `<div class="aviso er" role="alert">${ic('atencao')}<div><p>O e-mail visitante@exemplo.com não está na lista da casa. Peça para o Pedro ou a Bruna incluir você em Configurações.</p></div></div>` : ''}
      <button class="bt google cheio" data-a="entrar" ${car ? 'aria-busy="true" disabled' : ''}>${car ? '<span class="giro" aria-hidden="true"></span>Entrando' : GOOGLE + 'Entrar com Google'}</button>
      <p class="mini" style="text-align:center">Só Pedro e Bruna têm acesso.</p></div></div>`;
};

T.inicio = () => {
  const m = '2026-11', nome = PESSOAS[S.usuario].nome;
  if (S.estado === 'carregando') return topo(mesLongo(m), `Olá, ${nome}`) + `<main class="conteudo">${esqueleto(3)}${esqueleto(4)}</main>`;
  if (S.estado === 'erro') return topo(mesLongo(m), `Olá, ${nome}`) + `<main class="conteudo">${erroCaixa('Não consegui carregar os dados agora. Verifique a internet; nada do que você marcou se perdeu.')}</main>`;
  if (S.estado === 'vazio') return topo('Boas-vindas', `Olá, ${nome}`) + `<main class="conteudo"><div class="vazio">${ic('cartao')}<h2>Vamos começar pelos cartões</h2><p>Cadastre o Nubank e o BB da Bruna com o dia de fechamento e de vencimento. Depois é só lançar compras ou importar a fatura.</p><button class="bt principal" data-a="ir" data-t="cfg-cartoes">${ic('mais')}Cadastrar cartões</button></div></main>`;
  const todos = CARTOES.flatMap(c => linhasDe(c.id, m)), t = totais(todos);
  const sd = semDonoMes(m), pc = concAbertas();
  const pend = [];
  if (S.nu === 'fechada') pend.push(['importar', 'importar', 'A fatura Nubank Nov/26 fechou', 'Importe o arquivo para conferir as 47 linhas', 'at']);
  if (pc) pend.push(['conciliacao', 'conferir', `${pc} ${pc > 1 ? 'itens' : 'item'} para conferir na importação`, 'Duplicidades e parcelas esperadas', 'at']);
  if (sd) pend.push(['fatura', 'pessoa', `${sd} linhas sem dono`, 'Fatura Nubank Nov/26', 'at', 'nu']);
  const abertos = ['P', 'E', 'L'].map(k => [k, fech(k, m)]).filter(([, f]) => f.status !== 'Pago' && f.total > 0);
  if (abertos.length) pend.push(['fechamentos', 'fechamento', `Fechamentos de novembro: ${abertos.length} em aberto`, abertos.map(([k]) => PESSOAS[k].nome).join(', '), 'n']);
  const rec = aReceber();
  return topo(mesLongo(m), `Olá, ${nome}`) + `<main class="conteudo entra-alvo">
    <section class="cartao" aria-labelledby="h-fat"><h3 id="h-fat">Faturas que vencem em novembro</h3>
      <div class="quem num">${CARTOES.map(c => { const fi = fatInfo(c.id, m), v = linhasDe(c.id, m).reduce((s, l) => s + l.v, 0);
        return `<button data-a="fatura" data-c="${c.id}" data-m="${m}"><span class="banco">${logoBanco(c.banco)}<span>${c.apelido}<small>${fi.status === 'Aberta' ? 'Parcial · fecha ' + dm(fi.fecha) : fi.status + ' · vence ' + dm(fi.vence)}</small></span></span><span class="v">${brl(v)}</span></button>`; }).join('')}</div></section>
    <section class="cartao" aria-labelledby="h-quem"><h3 id="h-quem">Quem paga quanto em novembro</h3>
      <div class="quem num">${PESSOA_ORDEM.map(k => `<div>${selo(k)}<span class="v">${brl(t[k])}</span></div>`).join('')}
      ${t.x ? `<div>${selo(null, `${sd + pendMes(m)} sem dono`)}<span class="v">${brl(t.x)}</span></div>` : ''}</div></section>
    ${pend.length ? `<section class="cartao" aria-labelledby="h-pend"><h3 id="h-pend">Para fazer</h3><div>${pend.map(([t2, i, a, b, cl, c]) => `<button class="pend" data-a="ir" data-t="${t2}" ${c ? `data-c="${c}"` : ''}><span class="ico ${cl}">${ic(i, 'p')}</span><span class="t"><b>${a}</b><small>${b}</small></span>${ic('seguir', 'p')}</button>`).join('')}</div></section>`
      : `<div class="aviso ok">${ic('ok')}<p>Tudo em dia por aqui.</p></div>`}
    ${rec.length ? `<section class="cartao" aria-labelledby="h-rec"><h3 id="h-rec">A receber de meses anteriores</h3><div class="quem num">${rec.map(r => `<button data-a="pagar" data-k="${r.k}" data-m="${r.m}">${selo(r.k, ` <span class="mini">· ${mesCurto(r.m)}</span>`)}<span class="v">${brl(r.aberto)}</span></button>`).join('')}</div></section>` : ''}
  </main>`;
};
function aReceber() {
  return Object.keys(S.fech).filter(m => m < '2026-11').flatMap(m => ['P', 'E', 'L'].map(k => ({ k, m, ...fech(k, m) }))).filter(r => r.aberto > 0);
}

T.cartoes = () => {
  const m = '2026-11';
  if (S.estado === 'carregando') return topo('Cartões') + `<main class="conteudo">${esqueleto(2)}${esqueleto(2)}</main>`;
  if (S.estado === 'erro') return topo('Cartões') + `<main class="conteudo">${erroCaixa('Não consegui carregar os cartões agora.')}</main>`;
  if (S.estado === 'vazio') return topo('Cartões') + `<main class="conteudo"><div class="vazio">${ic('cartao')}<h2>Nenhum cartão cadastrado</h2><p>Cadastre o cartão com o apelido, o banco e os dias de fechamento e vencimento.</p><button class="bt principal" data-a="ir" data-t="cfg-cartoes">${ic('mais')}Cadastrar cartão</button></div></main>`;
  return topo('Cartões', 'Faturas que vencem em novembro') + `<main class="conteudo">${CARTOES.map(c => {
    const fi = fatInfo(c.id, m), v = linhasDe(c.id, m).reduce((s, l) => s + l.v, 0), prox = linhasDe(c.id, '2026-12').reduce((s, l) => s + l.v, 0);
    return `<button class="cartao toque" data-a="fatura" data-c="${c.id}" data-m="${m}" aria-label="${c.apelido}, fatura ${mesCurto(m)}, ${brl(v)}">
      <div class="plastico ${c.banco}"><div class="t"><span>${c.apelido}</span>${statusPil(fi.status, true)}</div><div class="v num">${brl(v)}</div>
      <div class="s">${fi.status === 'Aberta' ? 'Parcial da fatura ' + mesCurto(m) : 'Fatura ' + mesCurto(m)} · fecha ${dm(fi.fecha)} · vence ${dm(fi.vence)}</div></div>
      <div class="linha-topo"><span class="mini">Próxima fatura (${mesCurto('2026-12')}), já prevista</span><b class="num">${brl(prox)}</b></div></button>`; }).join('')}</main>`;
};
function statusPil(s, plastico) {
  const map = { Aberta: ['acao', 'calendario'], Fechada: ['at', 'atencao'], Importada: ['neutra', 'ok'], Encerrada: ['ok', 'ok'] };
  const [cl, i] = map[s] || ['neutra', 'ok'];
  return `<span class="pil ${cl}" ${plastico ? 'style="box-shadow:none"' : ''}>${ic(i)}${s}</span>`;
}

T.fatura = () => {
  const c = S.p.c || 'nu', m = S.p.m || '2026-11', ca = cartao(c), fi = fatInfo(c, m);
  const head = topo(ca.curto, `Fatura ${mesCurto(m)} · vence ${dm(fi.vence)}`, { voltar: S.pilha.length > 0,
    direita: `<div class="mes"><button class="redondo" data-a="mes" data-k="-1" aria-label="Fatura anterior" ${m <= '2026-11' ? 'disabled style="opacity:.35"' : ''}><span>${ic('voltar', 'p')}</span></button><b>${mesCurto(m)}</b><button class="redondo" data-a="mes" data-k="1" aria-label="Próxima fatura" ${m >= '2026-12' ? 'disabled style="opacity:.35"' : ''}><span>${ic('seguir', 'p')}</span></button>
    <button class="redondo" data-a="ir" data-t="importar" data-c="${c}" aria-label="Importar fatura"><span>${ic('importar', 'p')}</span></button></div>` });
  if (S.estado === 'carregando') return head + `<main class="conteudo">${esqueleto(2)}${esqueleto(6)}</main>`;
  if (S.estado === 'erro') return head + `<main class="conteudo">${erroCaixa('Não consegui abrir esta fatura agora. As marcações já feitas estão guardadas.')}</main>`;
  const ls = S.estado === 'vazio' ? [] : linhasDe(c, m);
  if (!ls.length) return head + `<main class="conteudo"><div class="vazio">${ic('importar')}<h2>Nenhuma linha nesta fatura ainda</h2><p>Quando a fatura ${mesCurto(m)} do ${ca.curto} fechar, baixe o arquivo no app do banco e traga para cá. Compras lançadas no app também aparecem aqui.</p>
    <div class="acoes"><button class="bt principal medio" data-a="ir" data-t="importar" data-c="${c}">${ic('importar')}Importar</button><button class="bt secundario medio" data-a="ir" data-t="lancar">${ic('mais')}Lançar</button></div></div></main>`;
  const t = totais(ls);
  const filtros = [['todas', 'Todas', t.n], ['sem', 'Sem dono', t.nx], ...PESSOA_ORDEM.map(k => [k, PESSOAS[k].nome, ls.filter(l => l.dono === k).length]), ['parc', 'Parceladas', ls.filter(l => l.parc).length], ['enc', 'Encargos', ls.filter(l => l.tipo).length]];
  const f = S.filtro;
  const vis = ls.filter(l => f === 'todas' || (f === 'sem' ? !l.dono && !l.pend : f === 'parc' ? l.parc : f === 'enc' ? l.tipo : l.dono === f));
  const grupos = {}; vis.slice().sort((a, b) => a.d.localeCompare(b.d) || (a.tipo === 'iof') - (b.tipo === 'iof')).forEach(l => (grupos[l.d] = grupos[l.d] || []).push(l));
  return head + `<main class="conteudo" id="rolagem">
    <section class="cartao"><div class="linha-topo"><div class="banco">${logoBanco(ca.banco)}<span>${ca.apelido}<small>${fi.status === 'Aberta' ? 'Parcial · fecha ' + dm(fi.fecha) : 'Fechou ' + dm(fi.fecha)}</small></span></div>${statusPil(fi.status)}</div>
      <div class="total num"><span>R$</span>${brl(t.total).slice(3)}</div>
      <div class="quem num">${PESSOA_ORDEM.map(k => `<button data-a="filtro" data-f="${k}" aria-label="Ver só ${PESSOAS[k].nome}">${selo(k)}<span class="v">${brl(t[k])}</span></button>`).join('')}
      ${t.nx ? `<button data-a="filtro" data-f="sem">${selo(null, `${t.nx} sem dono`)}<span class="v">${brl(ls.filter(l => !l.dono && !l.pend).reduce((s, l) => s + l.v, 0))}</span></button>` : ''}
      ${t.pend ? `<button data-a="ir" data-t="conciliacao">${selo(null, `${t.pend} para conferir`)}<span class="v">${brl(ls.filter(l => l.pend).reduce((s, l) => s + l.v, 0))}</span></button>` : ''}</div></section>
    ${t.nx ? `<div class="aviso" role="status">${ic('atencao')}<p>${t.nx} ${t.nx > 1 ? 'linhas' : 'linha'} desta fatura ainda sem dono, o total pode mudar.</p></div>` : ''}
    ${t.pend ? `<button class="aviso info" data-a="ir" data-t="conciliacao" style="border:0;text-align:left;cursor:pointer;font:inherit">${ic('copiar')}<div><p>${t.pend} ${t.pend > 1 ? 'linhas esperam' : 'linha espera'} você conferir a importação.</p><span class="bt link" style="min-height:0">Conferir agora</span></div></button>` : ''}
    ${fi.status === 'Aberta' || fi.status === 'Fechada' ? `<p class="mini">Esta é a parcial com o que foi lançado no app e as parcelas previstas. Ao importar a fatura do banco, ela vira a palavra final.</p>` : ''}
    <div class="filtros" role="group" aria-label="Filtrar linhas">${filtros.filter(([, , n], i) => n || i < 2).map(([k, n, q]) => `<button class="chip" data-a="filtro" data-f="${k}" aria-pressed="${f === k}">${n} <span class="n">${q}</span></button>`).join('')}</div>
    <p class="mini" aria-live="polite">${t.nx} de ${t.n} linhas sem dono${S.selModo ? '' : ' · toque longo para marcar várias'}</p>
    ${vis.length ? `<div class="lista" role="list">${Object.entries(grupos).map(([d, g]) => `<div class="dia" role="presentation">${diaLongo(d)}</div>${g.map(linhaHTML).join('')}`).join('')}</div>`
      : `<div class="vazio"><h2>Nada neste filtro</h2><p>${f === 'sem' ? 'Todas as linhas já têm dono.' : 'Nenhuma linha combina com este filtro.'}</p><button class="bt secundario medio" data-a="filtro" data-f="todas">Ver todas</button></div>`}
  </main>
  <div class="massa ${S.selModo ? 'on' : ''}" role="region" aria-label="Seleção"><button class="redondo" data-a="sair-sel" aria-label="Cancelar seleção">${ic('fechar', 'p')}</button><p class="num">${S.sel.size} ${S.sel.size === 1 ? 'selecionada' : 'selecionadas'}</p><button class="bt claro" data-a="atribuir-sel" ${S.sel.size ? '' : 'disabled'}>Atribuir a…</button></div>`;
};
function linhaHTML(l) {
  const tag = l.pend ? `<span class="pil at" style="padding:2px 8px">${ic('copiar')}Conferir</span>` : l.dono ? selo(l.dono, l.esc === 'Casal' ? ' · Casal' : '') : selo(null);
  const sub = `${l.parc ? `<span class="parc num">${l.parc}</span>` : dm(l.d)}${l.prev ? ' <span class="mini">prevista</span>' : ''} ${tag}`;
  const nome = `${l.loja}, ${brl(l.v)}, ${l.parc ? 'parcela ' + l.parc + ', ' : ''}${l.pend ? 'para conferir' : l.dono ? PESSOAS[l.dono].nome : 'sem dono'}`;
  return `<button class="lin${l.tipo === 'iof' ? ' filho' : ''}" role="listitem" data-l="${l.id}" ${S.selModo ? `aria-checked="${S.sel.has(l.id)}"` : ''} aria-label="${esc(nome)}">
    ${logo(l.loja, l.tipo === 'iof')}<span class="d"><b>${esc(l.loja)}</b><small>${sub}</small></span><span class="r"><span class="v num">${brl(l.v)}</span></span></button>`;
}

T.importar = () => {
  const I = S.imp, ca = cartao(I.cartao);
  const head = topo('Importar fatura', I.passo === 1 ? 'Escolha o cartão e o arquivo' : I.passo === 2 ? 'Confira o arquivo antes de gravar' : 'Colunas do arquivo', { voltar: true });
  if (S.estado === 'carregando' || I.lendo) return head + `<main class="conteudo sem-barra"><div class="aviso info">${ic('importar')}<p>Lendo ${esc(I.arquivo || 'o arquivo')}…</p></div>${esqueleto(6)}</main>`;
  if (I.passo === 1) {
    const erro = I.erro || (S.estado === 'erro' ? 'Este arquivo parece ser um extrato da conta (OFX), não a fatura do cartão. Baixe a fatura em CSV no app do banco e tente de novo.' : '');
    return head + `<main class="conteudo sem-barra">
      <div class="campo"><span class="rot" id="r-cart">Cartão</span><div class="pessoas" role="group" aria-labelledby="r-cart">${CARTOES.map(c => `<button data-a="imp-cartao" data-c="${c.id}" aria-pressed="${I.cartao === c.id}"><span class="banco">${logoBanco(c.banco)}<span style="font:700 15px/1.2 var(--fonte)">${c.curto}<small>${c.id === 'nu' ? 'CSV do Nubank' : 'CSV ou planilha'}</small></span></span></button>`).join('')}</div></div>
      ${erro ? `<div class="aviso er" role="alert">${ic('atencao')}<div><p>${erro}</p></div></div>` : ''}
      <div class="vazio">${ic('importar')}<h2>Arquivo da fatura ${ca.curto}</h2><p>${I.cartao === 'nu' ? 'No app do Nubank, abra a fatura fechada e exporte em CSV. O arquivo vem com data, descrição e valor de cada linha.' : 'O BB ainda não tem leitor próprio. Na primeira vez, você mostra ao app qual coluna é a data, a descrição e o valor; ele lembra nas próximas.'}</p>
      <button class="bt principal" data-a="escolher-arq">${ic('importar')}Escolher arquivo</button></div>
      <p class="mini">Nada é gravado antes de você conferir.</p></main>`;
  }
  if (I.passo === 3) return head + mapaBB();
  // Passo 2: pré-visualização
  const ls = I.cartao === 'nu' ? S.faturas['nu-2026-11'].linhas : BB_ARQ.map(r => ({ d: r[0], loja: r[1], v: r[2], parc: r[3] }));
  const jaImp = I.cartao === 'nu' && S.nu === 'importada';
  const tipos = { compra: 0, parcela: 0, iof: 0, anuidade: 0 };
  ls.forEach(l => tipos[l.tipo || (l.parc ? 'parcela' : 'compra')]++);
  const total = ls.reduce((s, l) => s + l.v, 0);
  const fChips = ['2026-10', '2026-11', '2026-12'].map(m => `<button class="chip" data-a="imp-fat" data-m="${m}" aria-pressed="${I.fatura === m}">${mesCurto(m)}${m === '2026-11' ? ' <span class="n">sugerida</span>' : ''}</button>`).join('');
  return head + `<main class="conteudo sem-barra">
    <div class="cartao"><div class="linha-topo"><div class="banco">${logoBanco(ca.banco)}<span>${esc(I.arquivo)}<small>${ls.length + (I.cartao === 'nu' ? 1 : 0)} linhas lidas</small></span></div></div>
      <div class="total num"><span>R$</span>${brl(total).slice(3)}</div>
      <p class="mini">${tipos.compra} compras · ${tipos.parcela} parcelas · ${tipos.iof} IOF · ${tipos.anuidade} anuidade${I.cartao === 'nu' ? ' · 1 pagamento ignorado' : ''}</p></div>
    <div class="campo"><span class="rot" id="r-fat">Este arquivo é de qual fatura?</span><div class="chips" role="group" aria-labelledby="r-fat">${fChips}</div>
      <p class="ajuda">Sugeri pela data das compras: fecha ${dm(fatInfo(I.cartao, I.fatura).fecha)}, vence ${dm(fatInfo(I.cartao, I.fatura).vence)}. Todas as linhas entram nela.</p></div>
    ${jaImp ? `<div class="aviso info" role="status">${ic('ok')}<div><p>Este arquivo já foi importado em 03/11. As ${ls.length} linhas são iguais às que já estão no app, então nada novo será gravado.</p></div></div>` : ''}
    <div class="lista">${I.cartao === 'nu' ? `<div class="lin" style="cursor:default" aria-label="Pagamento recebido, ignorado"><span class="logo" aria-hidden="true">${ic('ok', 'pp')}</span><span class="d"><b>Pagamento recebido</b><small>02/11 <span class="pil neutra" style="padding:2px 8px">Ignorada: é o pagamento da fatura</span></small></span><span class="r"><span class="v num" style="color:var(--suave)">-${brl(195040)}</span></span></div>` : ''}
      ${ls.slice().sort((a, b) => a.d.localeCompare(b.d)).map(l => `<div class="lin${l.tipo === 'iof' ? ' filho' : ''}" style="cursor:default">${logo(l.loja, l.tipo === 'iof')}<span class="d"><b>${esc(l.loja)}</b><small>${l.parc ? `<span class="parc num">${l.parc}</span>` : dm(l.d)} <span class="pil ${jaImp ? 'neutra' : 'acao'}" style="padding:2px 8px">${jaImp ? 'Já importada' : l.tipo === 'iof' ? 'IOF' : l.tipo === 'anuidade' ? 'Anuidade' : l.parc ? 'Parcela' : 'Compra'}</span></small></span><span class="r"><span class="v num">${brl(l.v)}</span></span></div>`).join('')}</div>
    <div class="acoes"><button class="bt secundario" data-a="imp-cancelar">Cancelar</button><button class="bt principal" data-a="imp-gravar" ${jaImp ? 'disabled' : ''}>${jaImp ? 'Nada novo' : 'Gravar ' + ls.length + ' linhas'}</button></div>
  </main>`;
};
const BB_ARQ = [['2026-10-12', 'PADARIA PAO QUENTE', 1800, ''], ['2026-10-14', 'POSTO IPIRANGA', 7540, ''], ['2026-10-15', 'PAO DE ACUCAR', 21030, ''], ['2026-10-20', 'RENNER PARC 01/04', 6250, '1/4'], ['2026-10-22', 'DROGASIL', 3990, ''], ['2026-10-25', 'MAGAZINE LUIZA PARC 02/05', 23410, '2/5']];
function mapaBB() {
  const colunas = ['Data', 'Lançamento', 'Valor (R$)', 'Detalhe'];
  const linhas = [['12/10/2026', 'PADARIA PAO QUENTE', '18,00', 'Compra'], ['14/10/2026', 'POSTO IPIRANGA', '75,40', 'Compra'], ['20/10/2026', 'RENNER PARC 01/04', '62,50', 'Parcelado']];
  const sel = (nome, val, ops) => `<div class="campo"><label for="mp-${nome}">${nome}</label><div class="entrada"><select id="mp-${nome}">${ops.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>${ic('seguir', 'pp')}</div></div>`;
  return `<main class="conteudo sem-barra">
    <div class="aviso info">${ic('atencao')}<p>Primeira importação do BB. Diga ao app o que é cada coluna; ele guarda e não pergunta de novo.</p></div>
    <p class="secao">Começo do arquivo ${esc(S.imp.arquivo)}</p>
    <div class="tabela"><table><thead><tr>${colunas.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas.map(r => `<tr>${r.map((v, i) => `<td class="${i === 2 ? 'v' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${sel('Data', 'Data', colunas)}${sel('Descrição', 'Lançamento', colunas)}${sel('Valor', 'Valor (R$)', colunas)}${sel('Parcela (opcional)', 'Lançamento', ['Não tem', ...colunas])}
    ${sel('Formato da data', 'dia/mês/ano', ['dia/mês/ano', 'mês/dia/ano', 'ano-mês-dia'])}${sel('Decimal', 'vírgula (18,00)', ['vírgula (18,00)', 'ponto (18.00)'])}
    ${sel('Compras aparecem como', 'valor positivo', ['valor positivo', 'valor negativo'])}${sel('Linhas de cabeçalho para pular', '1', ['0', '1', '2', '3'])}
    <button class="bt principal cheio" data-a="imp-mapa-ok">Ver as linhas lidas</button></main>`;
}

T.conciliacao = () => {
  const C = S.conc, head = topo('Conferir importação', 'Fatura Nubank Nov/26', { voltar: true });
  if (S.nu !== 'importada') return head + `<main class="conteudo"><div class="vazio">${ic('copiar')}<h2>Nada para conferir</h2><p>Depois de importar uma fatura, aparecem aqui as compras que você já tinha lançado e as parcelas que o app reconheceu.</p><button class="bt principal" data-a="ir" data-t="importar">${ic('importar')}Importar fatura</button></div></main>`;
  const dup = C.duplicidades.filter(d => d.estado === 'aberta'), amb = C.ambiguas.filter(d => d.estado === 'aberta'), nao = C.naoEncontradas.filter(d => d.estado === 'aberta');
  const sd = linhasDe('nu', '2026-11').filter(l => !l.dono && !l.pend).length;
  const desc = (a, b) => `<b>${esc(a.loja)} ${brl(a.v)}</b> <span class="mini">(${b}, ${dm(a.d)})</span>`;
  return head + `<main class="conteudo">
    ${dup.length > 1 ? `<button class="bt secundario cheio" data-a="conc-obvias">${ic('ok')}Confirmar todas as óbvias (${dup.length})</button>` : ''}
    ${dup.length ? `<p class="secao">Lançadas no app e também na fatura</p>${dup.map(d => `<div class="cartao"><p>Encontrei 1 duplicidade: ${desc(d.manual, 'manual')} ↔ ${desc(d.fatura, 'fatura')}.</p>
      <p class="mini">Manter a da fatura e copiar ${selo(d.copia.dono)}, ${d.copia.esc}, ${d.copia.cat}?</p>
      <div class="acoes"><button class="bt secundario medio" data-a="conc-nao" data-id="${d.id}">Não é a mesma</button><button class="bt principal medio" data-a="conc-sim" data-id="${d.id}">Confirmar</button></div></div>`).join('')}` : ''}
    ${amb.length ? `<p class="secao">Mais de uma possibilidade</p>${amb.map(a => `<div class="cartao"><p>${desc(a.fatura, 'fatura')} pode ser uma destas compras lançadas no app. Qual é?</p>
      <div class="quem num">${a.candidatas.map(c => `<button data-a="conc-amb" data-id="${a.id}" data-c="${c.id}"><span>${esc(c.loja)} · ${dm(c.d)} ${selo(c.dono, c.esc === 'Casal' ? ' · Casal' : '')}</span><span class="v">${brl(c.v)}</span></button>`).join('')}
      <button data-a="conc-amb" data-id="${a.id}" data-c="nenhuma"><span>Nenhuma delas</span>${ic('seguir', 'pp')}</button></div></div>`).join('')}` : ''}
    ${nao.length ? `<p class="secao">Esperadas e não encontradas</p>${nao.map(n => `<div class="cartao"><div class="linha-topo"><span class="banco">${logo(n.loja)}<span>${esc(n.loja)}<small><span class="parc num">${n.parc}</span> ${selo(n.dono)}</small></span></span><b class="num">${brl(n.v)}</b></div>
      <p class="mini">Esta parcela estava prevista para Nov/26, mas não veio no arquivo. O banco pode ter jogado para a próxima fatura.</p>
      <div class="acoes"><button class="bt destrutivo medio" data-a="nao-excluir" data-id="${n.id}">${ic('lixo')}Excluir</button><button class="bt secundario medio" data-a="nao-mover" data-id="${n.id}">Mover para Dez/26</button></div></div>`).join('')}` : ''}
    <p class="secao">Reconhecidas automaticamente</p>
    <div class="cartao"><div class="quem num">${C.series.map(s => `<div style="align-items:flex-start;padding:10px 0;flex-direction:column;gap:4px"><div class="linha-topo" style="width:100%"><span class="banco">${logo(s.loja)}<span>${esc(s.loja)} <span class="parc num">${s.parc}</span></span></span><b>${brl(s.v)}</b></div><span class="mini">${selo(s.dono)} · ${s.nota}</span></div>`).join('')}</div></div>
    ${!dup.length && !amb.length && !nao.length ? `<div class="aviso ok" role="status">${ic('ok')}<p>Tudo conferido. ${sd ? `Faltam ${sd} linhas sem dono.` : ''}</p></div>` : ''}
    <button class="bt principal cheio" data-a="fatura" data-c="nu" data-m="2026-11" data-f="sem">${ic('pessoa')}Marcar as ${sd} sem dono</button>
  </main>`;
};

T.lancar = () => {
  const F = S.form || (S.form = novoForm());
  const ca = cartao(F.cartao), dest = destino(F);
  const parts = dividir(F.valor, F.n);
  const pb = F.dono === 'P' || F.dono === 'B';
  const err = F.tentou ? validar(F) : {};
  return topo('Lançar compra', 'No cartão', { voltar: S.pilha.length > 0 }) + `<main class="conteudo sem-barra">
    <div class="campo"><label for="f-valor">Valor</label><div class="entrada valor ${err.valor ? 'erro' : ''}"><span>R$</span><input id="f-valor" inputmode="decimal" placeholder="0,00" value="${F.valorTxt}" data-in="valor" autocomplete="off" ${err.valor ? 'aria-invalid="true" aria-describedby="e-valor"' : ''}></div>${err.valor ? `<p class="ajuda erro" id="e-valor">${ic('atencao')}${err.valor}</p>` : ''}</div>
    <div class="campo"><label for="f-desc">Descrição</label><div class="entrada ${err.desc ? 'erro' : ''}"><input id="f-desc" placeholder="Ex.: Tênis Centauro" value="${esc(F.desc)}" data-in="desc" autocomplete="off" enterkeyhint="next"></div>${err.desc ? `<p class="ajuda erro">${ic('atencao')}${err.desc}</p>` : ''}</div>
    <div class="campo"><span class="rot" id="r-pg">De quem é</span><div class="pessoas" role="group" aria-labelledby="r-pg">${PESSOA_ORDEM.map(k => `<button data-a="f-dono" data-k="${k}" aria-pressed="${F.dono === k}">${selo(k, '', true)}</button>`).join('')}</div></div>
    ${pb ? `<div class="campo"><span class="rot" id="r-esc">Para quê</span><div class="seg" data-v="${F.esc === 'Casal' ? 1 : 0}" role="group" aria-labelledby="r-esc"><span class="pino" aria-hidden="true"></span><button data-a="f-esc" data-v="Pessoal" aria-pressed="${F.esc !== 'Casal'}">Pessoal</button><button data-a="f-esc" data-v="Casal" aria-pressed="${F.esc === 'Casal'}">Casal</button></div></div>` : ''}
    <div class="campo"><span class="rot" id="r-cat">Categoria${pb ? '' : ' (opcional)'}</span><div class="cats" role="group" aria-labelledby="r-cat">${CATEGORIAS.map(c => `<button class="chip" data-a="f-cat" data-v="${c}" aria-pressed="${F.cat === c}">${c}</button>`).join('')}</div>${err.cat ? `<p class="ajuda erro">${ic('atencao')}${err.cat}</p>` : ''}</div>
    <div class="campo"><span class="rot">Parcelas</span><div class="linha-topo"><div class="passo"><button class="redondo" data-a="f-n" data-k="-1" aria-label="Menos uma parcela"><span>−</span></button><b class="num" aria-live="polite">${F.n}x</b><button class="redondo" data-a="f-n" data-k="1" aria-label="Mais uma parcela"><span>+</span></button></div></div>
      <p class="ajuda num">${F.n > 1 && F.valor ? `${F.n}x: ${parts.slice(0, 3).map(p => brl(p).slice(3)).join(' + ')}${F.n > 3 ? ' + …' : ''}` : 'À vista'}</p></div>
    <div class="campo"><span class="rot" id="r-ct">Cartão</span><div class="chips" role="group" aria-labelledby="r-ct">${CARTOES.map(c => `<button class="chip" data-a="f-cartao" data-c="${c.id}" aria-pressed="${F.cartao === c.id}">${c.curto}</button>`).join('')}</div></div>
    <div class="campo"><span class="rot" id="r-dt">Data da compra</span><div class="chips" role="group" aria-labelledby="r-dt">${[['2026-11-03', 'Hoje, 03/11'], ['2026-11-02', 'Ontem, 02/11'], ['2026-11-01', 'Sábado, 01/11']].map(([d, n]) => `<button class="chip" data-a="f-data" data-v="${d}" aria-pressed="${F.data === d}">${n}</button>`).join('')}</div>
      <p class="ajuda">${ic('calendario')}Entra na fatura ${mesCurto(dest)} do ${ca.curto}${F.data >= fatInfo(F.cartao, '2026-11').fecha && dest === '2026-12' ? ', porque o cartão fecha hoje' : ''}.</p></div>
    <button class="bt principal cheio" data-a="f-salvar">Lançar ${F.valor ? brl(F.valor) : ''}</button>
  </main>`;
};
function novoForm() { const d = S.ultimo.dono; return { valor: 0, valorTxt: '', desc: '', dono: d, esc: S.ultimo.esc[d] || 'Pessoal', cat: '', n: 1, cartao: S.ultimo.cartao, data: '2026-11-03', tentou: false }; }
function dividir(v, n) { const b = Math.floor(v / n), r = v - b * n; return Array.from({ length: n }, (_, i) => b + (i === 0 ? r : 0)); }
function destino(F) { const fi = fatInfo(F.cartao, '2026-11'); return F.data >= fi.fecha ? '2026-12' : '2026-11'; }
function validar(F) { const e = {}; if (!F.valor) e.valor = 'Digite o valor da compra.'; if (!F.desc.trim()) e.desc = 'Diga o que foi comprado, para reconhecer na fatura.';
  if ((F.dono === 'P' || F.dono === 'B') && !F.cat) e.cat = 'Escolha a categoria. Para Pedro e Bruna ela é obrigatória.'; return e; }

T.fechamentos = () => {
  const m = S.p.m || '2026-11';
  const head = topo('Fechamentos', 'Quanto cada pessoa deve à Bruna', { direita: `<div class="mes"><button class="redondo" data-a="fmes" data-k="-1" aria-label="Mês anterior" ${m <= '2026-10' ? 'disabled style="opacity:.35"' : ''}><span>${ic('voltar', 'p')}</span></button><b>${mesCurto(m)}</b><button class="redondo" data-a="fmes" data-k="1" aria-label="Próximo mês" ${m >= '2026-11' ? 'disabled style="opacity:.35"' : ''}><span>${ic('seguir', 'p')}</span></button></div>` });
  if (S.estado === 'carregando') return head + `<main class="conteudo">${esqueleto(3)}${esqueleto(3)}</main>`;
  if (S.estado === 'erro') return head + `<main class="conteudo">${erroCaixa('Não consegui calcular os fechamentos agora. Os pagamentos registrados estão guardados.')}</main>`;
  if (S.estado === 'vazio') return head + `<main class="conteudo"><div class="vazio">${ic('fechamento')}<h2>Nenhum fechamento em ${mesLongo(m).toLowerCase()}</h2><p>Os fechamentos aparecem quando alguém além da Bruna tem compras numa fatura que vence no mês.</p></div></main>`;
  const sd = m === '2026-11' ? semDonoMes(m) + pendMes(m) : 0;
  const naoImp = m === '2026-11' && S.nu === 'fechada';
  const bruna = m === '2026-11' ? CARTOES.reduce((a, c) => a + linhasDe(c.id, m).filter(l => l.dono === 'B').reduce((s, l) => s + l.v, 0), 0) : 61420;
  const rec = aReceber().filter(r => r.m < m);
  return head + `<main class="conteudo">
    ${naoImp ? `<div class="aviso" role="status">${ic('atencao')}<div><p>A fatura Nubank Nov/26 ainda não foi importada. Os valores abaixo são parciais.</p><button class="bt link" data-a="ir" data-t="importar">Importar agora</button></div></div>` : ''}
    ${sd ? `<div class="aviso" role="status">${ic('atencao')}<div><p>${sd} linhas desta fatura ainda sem dono, o total pode mudar.</p><button class="bt link" data-a="fatura" data-c="nu" data-m="${m}" data-f="sem">Marcar agora</button></div></div>` : ''}
    ${['P', 'E', 'L'].map(k => cardFech(k, m)).join('')}
    <section class="cartao"><div class="linha-topo">${selo('B')}<b class="num" style="font:var(--t-forte)">${brl(bruna)}</b></div><p class="mini">Gastos da Bruna nas faturas que vencem em ${mesLongo(m).toLowerCase()}. Ela é a dona dos cartões, então não tem cobrança.</p></section>
    ${rec.length ? `<p class="secao">A receber de meses anteriores</p><div class="cartao"><div class="quem num">${rec.map(r => `<button data-a="pagar" data-k="${r.k}" data-m="${r.m}">${selo(r.k, ` <span class="mini">· ${mesCurto(r.m)}, ${r.status.toLowerCase()}</span>`)}<span class="v">${brl(r.aberto)}</span></button>`).join('')}</div></div>` : ''}
  </main>`;
};
function cardFech(k, m) {
  const f = fech(k, m), aberto = S.p.aberto === k;
  const pil = { Pendente: ['at', 'atencao'], Parcial: ['at', 'atencao'], Pago: ['ok', 'ok'], 'Sem itens': ['neutra', 'ok'] }[f.status];
  if (!f.total) return `<section class="cartao"><div class="linha-topo">${selo(k)}<span class="pil neutra">${ic('ok')}Nada este mês</span></div></section>`;
  return `<section class="cartao" aria-label="Fechamento de ${PESSOAS[k].nome}">
    <button class="linha-topo" data-a="fech-abrir" data-k="${k}" aria-expanded="${aberto}" style="all:unset;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:44px">${selo(k, '', true)}<span class="pil ${pil[0]}">${ic(pil[1])}${f.status}</span></button>
    <div class="total num"><span>R$</span>${brl(f.total).slice(3)}</div>
    <p class="mini num">${f.pago ? `Pago ${brl(f.pago)} · falta ${brl(f.aberto)}` : 'Nada pago ainda'}${f.enviado ? ` · resumo enviado em ${f.enviado}` : ''}</p>
    ${aberto ? `<div class="msg" aria-label="Detalhe do fechamento">${esc(mensagem(k, m))}</div>` : `<button class="bt link" data-a="fech-abrir" data-k="${k}" style="min-height:32px;color:var(--acao-texto);align-self:flex-start">Ver o detalhe</button>`}
    <div class="acoes">${f.aberto ? `<button class="bt secundario medio" data-a="pagar" data-k="${k}" data-m="${m}">Registrar pagamento</button>` : ''}<button class="bt principal medio" data-a="msg" data-k="${k}" data-m="${m}">${ic('mensagem')}WhatsApp</button></div>
  </section>`;
}

T.mais = () => topo('Mais') + `<main class="conteudo">
  <div class="cartao"><div>${[['dividas', 'parcelas', 'Dívidas', 'Empréstimo e Shopee que entram no fechamento do Pedro'], ['conciliacao', 'copiar', 'Conferir importação', 'Duplicidades e parcelas da última fatura'], ['importar', 'importar', 'Importar fatura', 'Nubank ou BB']].map(linhaMais).join('')}</div></div>
  <p class="secao">Configurações</p>
  <div class="cartao"><div>${[['cfg-pessoas', 'pessoa', 'Pessoas', 'Telefones e chave Pix'], ['cfg-cartoes', 'cartao', 'Cartões', 'Dias de fechamento e vencimento'], ['cfg-cats', 'ajustes', 'Categorias', `${CATEGORIAS.length} categorias de gastos`], ['cfg-emails', 'pessoa', 'Quem pode entrar', 'E-mails do Pedro e da Bruna'], ['cfg-exportar', 'importar', 'Exportar dados', 'Cópia de tudo num arquivo']].map(linhaMais).join('')}</div></div>
  <p class="secao">Aparência</p>
  <div class="chips" role="group" aria-label="Tema">${[['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Do celular']].map(([v, n]) => `<button class="chip" data-a="tema" data-v="${v}" aria-pressed="${S.tema === v}">${n}</button>`).join('')}</div>
  <button class="bt secundario cheio" data-a="sair" style="margin-top:12px">Sair</button></main>`;
const linhaMais = ([t, i, a, b]) => `<button class="pend" data-a="ir" data-t="${t}"><span class="ico n">${ic(i, 'p')}</span><span class="t"><b>${a}</b><small>${b}</small></span>${ic('seguir', 'p')}</button>`;

T.dividas = () => topo('Dívidas', 'Pagas pela Bruna e repassadas no fechamento', { voltar: true }) + `<main class="conteudo">
  ${S.dividas.map(d => `<div class="cartao"><div class="linha-topo"><b style="font:var(--t-forte)">${esc(d.nome)}</b><span class="parc num">${d.atual}/${d.total}</span></div>
    <div class="quem num"><div><span class="mini">Parcela</span><span class="v">${brl(d.parcela)}</span></div><div><span class="mini">Falta pagar</span><span class="v">${brl(d.parcela * (d.total - d.atual))}</span></div>
    <div><span class="mini">Quem paga</span>${selo(d.resp)}</div><div><span class="mini">Vence todo dia</span><span class="v">${d.vence}</span></div></div></div>`).join('')}
  <button class="bt secundario cheio" data-a="nova-divida">${ic('mais')}Nova dívida</button></main>`;
T['cfg-pessoas'] = () => topo('Pessoas', '', { voltar: true }) + `<main class="conteudo"><div class="cartao"><div class="quem">${PESSOA_ORDEM.map(k => `<div style="padding:10px 0;align-items:flex-start;flex-direction:column;gap:4px">${selo(k)}<span class="mini">WhatsApp ${PESSOAS[k].tel}${k === 'B' ? ' · Pix ' + CHAVE_PIX : ''}${k === 'B' || k === 'P' ? ' · tem login' : ' · sem login, recebe o resumo'}</span></div>`).join('')}</div></div><p class="mini">Telefones e chave Pix são fictícios. Os de verdade você cadastra no app.</p></main>`;
T['cfg-cartoes'] = () => topo('Cartões', '', { voltar: true }) + `<main class="conteudo"><div class="cartao"><div class="quem">${CARTOES.map(c => `<div style="padding:10px 0"><span class="banco">${logoBanco(c.banco)}<span>${c.apelido}<small>Fecha dia ${c.fecha} · vence dia ${c.vence} · titular Bruna</small></span></span></div>`).join('')}</div></div><button class="bt secundario cheio">${ic('mais')}Novo cartão</button></main>`;
T['cfg-cats'] = () => topo('Categorias', '', { voltar: true }) + `<main class="conteudo"><div class="cartao"><div class="quem">${CATEGORIAS.map(c => `<div>${c}</div>`).join('')}</div></div><p class="mini">Categorias com lançamentos não podem ser excluídas, só renomeadas.</p></main>`;
T['cfg-emails'] = () => topo('Quem pode entrar', '', { voltar: true }) + `<main class="conteudo"><div class="cartao"><div class="quem">${EMAILS.map(e => `<div>${e}</div>`).join('')}</div></div><p class="mini">Só estes e-mails conseguem entrar com Google.</p></main>`;
T['cfg-exportar'] = () => topo('Exportar dados', '', { voltar: true }) + `<main class="conteudo"><div class="vazio">${ic('importar')}<h2>Cópia de tudo</h2><p>Gera um arquivo com cartões, faturas, marcações, fechamentos e pagamentos, para guardar onde você quiser.</p><button class="bt principal" data-a="exportar">Gerar arquivo</button></div></main>`;

// ---------- Desenho ----------
let telaAnterior = '';
function render(dir) {
  document.documentElement.toggleAttribute('data-theme', S.tema !== 'auto');
  if (S.tema !== 'auto') document.documentElement.setAttribute('data-theme', S.tema);
  const rol = $('#rolagem'); const y = rol && telaAnterior === S.tela ? rol.scrollTop : 0;
  const t = S.logado ? S.tela : 'login';
  const html = (T[t] || T.inicio)();
  const barra = S.logado && !['importar', 'lancar'].includes(t) ? `<nav class="barra" aria-label="Navegação principal">${ABAS.map(([k, n, i]) => k === 'lancar'
    ? `<button class="lancar" data-a="ir" data-t="lancar"><span>${ic(i)}</span>${n}</button>`
    : `<button data-a="aba" data-t="${k}" ${aba() === k ? 'aria-current="page"' : ''}>${ic(i)}${n}</button>`).join('')}</nav>` : '';
  raiz.innerHTML = html + barra;
  const main = $('main', raiz);
  if (main && telaAnterior !== S.tela && dir && !reduz()) { main.classList.add('entra'); if (dir === 'volta') main.classList.add('volta'); }
  const r2 = $('#rolagem'); if (r2 && y) r2.scrollTop = y;
  telaAnterior = S.tela;
  syncDemo();
}
const aba = () => { const t = S.pilha.length ? S.pilha[0].tela : S.tela; return RAIZ.includes(t) ? t : RAIZ.includes(S.tela) ? S.tela : (S.pilha.find(p => RAIZ.includes(p.tela)) || {}).tela || 'inicio'; };

// ---------- Folha (mola criticamente amortecida, segue o dedo) ----------
const folha = $('#folha'), veu = $('#veu');
let fy = 0, fv = 0, falvo = 0, fraf = 0, faberta = false, focoAntes = null, aoFechar = null;
const fpinta = () => { folha.style.transform = `translateY(${fy}px)`; };
const falt = () => folha.getBoundingClientRect().height + 24;
let ft0 = 0;
function fpasso(t) {
  const w = 2 * Math.PI / 0.34, dt = Math.min(0.032, ft0 ? (t - ft0) / 1000 : 0.016); ft0 = t;
  fv += (-w * w * (fy - falvo) - 2 * w * fv) * dt; fy += fv * dt; fpinta();
  if (Math.abs(fy - falvo) < 0.5 && Math.abs(fv) < 5) { fy = falvo; fv = 0; fpinta(); ft0 = 0; fraf = 0; if (!faberta) { folha.style.visibility = 'hidden'; folha.innerHTML = ''; } return; }
  fraf = requestAnimationFrame(fpasso);
}
function fmola(dest, vel = fv) {
  falvo = dest; fv = vel;
  if (reduz()) { fy = dest; fpinta(); folha.style.transition = 'opacity 150ms linear'; folha.style.opacity = faberta ? 1 : 0; if (!faberta) setTimeout(() => { if (!faberta) { folha.style.visibility = 'hidden'; folha.innerHTML = ''; } }, 150); return; }
  folha.style.opacity = 1; if (!fraf) fraf = requestAnimationFrame(fpasso);
}
function abreFolha(html, foco, onClose) {
  focoAntes = document.activeElement; aoFechar = onClose || null;
  folha.innerHTML = `<div class="pega" aria-hidden="true"><i></i></div>${html}`;
  const estava = faberta; faberta = true; folha.style.visibility = 'visible';
  if (!estava && !fraf) { fy = falt(); fpinta(); }
  veu.classList.add('on'); fmola(0);
  const alvo = foco ? $(foco, folha) : $('button, input', folha); if (alvo) alvo.focus({ preventScroll: true });
}
function fechaFolha(vel = 0) {
  if (!faberta) return; faberta = false; veu.classList.remove('on'); fmola(falt(), vel);
  const cb = aoFechar; aoFechar = null; if (cb) cb();
  if (focoAntes && document.contains(focoAntes)) focoAntes.focus({ preventScroll: true });
}
let arr = false, iy = 0, by = 0, hist = [];
folha.addEventListener('pointerdown', e => { if (!e.target.closest('.pega, .cab')) return; arr = true; folha.setPointerCapture(e.pointerId); cancelAnimationFrame(fraf); fraf = 0; ft0 = 0; iy = e.clientY; by = fy; hist = [{ y: e.clientY, t: e.timeStamp }]; });
folha.addEventListener('pointermove', e => { if (!arr) return; let d = by + e.clientY - iy; if (d < 0) d = -(-d * 120 * 0.55) / (120 + 0.55 * -d); fy = d; fpinta(); hist.push({ y: e.clientY, t: e.timeStamp }); if (hist.length > 5) hist.shift(); });
const fsolta = () => { if (!arr) return; arr = false; const a = hist[0], b = hist[hist.length - 1]; const v = b.t > a.t ? (b.y - a.y) / ((b.t - a.t) / 1000) : 0;
  if (fy + (v / 1000) * 0.998 / 0.002 > falt() * 0.5) fechaFolha(v); else fmola(0, v); };
folha.addEventListener('pointerup', fsolta); folha.addEventListener('pointercancel', fsolta);
veu.addEventListener('click', () => { fechaFolha(); fechaDialogo(); });

// ---------- Aviso com Desfazer ----------
const toast = $('#toast'); let ttoast, desfazer = null;
function avisa(txt, undo) {
  desfazer = undo || null; $('#toast-t').textContent = txt; $('#desfazer').hidden = !undo;
  toast.classList.toggle('alto', !!$('.barra', raiz) === false);
  toast.classList.add('on'); clearTimeout(ttoast); ttoast = setTimeout(() => toast.classList.remove('on'), 5000);
}
$('#desfazer').addEventListener('click', () => { toast.classList.remove('on'); if (desfazer) { desfazer(); desfazer = null; render(); setTimeout(() => avisa('Desfeito.'), reduz() ? 0 : 200); } });

// ---------- Diálogo ----------
const dialogo = $('#dialogo'); let dSim = null, dFoco = null;
function confirma(titulo, texto, sim, rotulo = 'Excluir') {
  dFoco = document.activeElement; dSim = sim; $('#d-t').textContent = titulo; $('#d-p').textContent = texto; $('#d-sim').textContent = rotulo;
  dialogo.classList.add('on'); veu.classList.add('on'); $('#d-nao').focus();
}
function fechaDialogo() { if (!dialogo.classList.contains('on')) return; dialogo.classList.remove('on'); if (!faberta) veu.classList.remove('on'); if (dFoco && document.contains(dFoco)) dFoco.focus(); }
$('#d-nao').addEventListener('click', fechaDialogo);
$('#d-sim').addEventListener('click', () => { const f = dSim; fechaDialogo(); if (f) f(); });

// ---------- Marcação ----------
const achaLinha = id => CARTOES.flatMap(c => ['2026-11', '2026-12'].flatMap(m => linhasDe(c.id, m))).find(l => l.id === id);
function folhaPessoa(ids) {
  const ls = ids.map(achaLinha).filter(Boolean); if (!ls.length) return;
  const um = ls.length === 1 ? ls[0] : null;
  const titulo = um ? 'De quem é?' : `De quem são as ${ls.length}?`;
  const sub = um ? `${um.loja}${um.parc ? ' · ' + um.parc : ''} · ${brl(um.v)}` : brl(ls.reduce((s, l) => s + l.v, 0));
  let escolha = um && um.dono, escopo = um && um.esc ? um.esc : null, cat = um && um.cat;
  const desenha = () => {
    const pb = escolha === 'P' || escolha === 'B';
    const e = escopo || S.ultimo.esc[escolha] || 'Pessoal';
    $('.corpo', folha).innerHTML = `<div class="pessoas" role="group" aria-label="Pessoa">${PESSOA_ORDEM.map(k => `<button data-fp="${k}" aria-pressed="${escolha === k}">${selo(k, '', true)}</button>`).join('')}</div>
      ${pb ? `<div class="campo"><span class="rot">Para quê</span><div class="seg" data-v="${e === 'Casal' ? 1 : 0}" role="group" aria-label="Para quê"><span class="pino" aria-hidden="true"></span><button data-fe="Pessoal" aria-pressed="${e !== 'Casal'}">Pessoal</button><button data-fe="Casal" aria-pressed="${e === 'Casal'}">Casal</button></div></div>
      <div class="campo"><span class="rot">Categoria · toque para salvar</span><div class="cats">${CATEGORIAS.map(c => `<button class="chip" data-fc="${c}" aria-pressed="${cat === c}">${c}</button>`).join('')}</div></div>` : ''}`;
  };
  abreFolha(`<div class="cab"><h2>${titulo}</h2><p class="num">${esc(sub)}</p></div><div class="corpo"></div>`, null, null);
  desenha(); $('.corpo button', folha).focus({ preventScroll: true });
  const salva = (k, e, c) => {
    const antes = ls.map(l => ({ l, dono: l.dono, esc: l.esc, cat: l.cat }));
    ls.forEach(l => { l.dono = k; l.esc = k === 'P' || k === 'B' ? e : ''; if (c) l.cat = c; });
    if (k === 'P' || k === 'B') S.ultimo.esc[k] = e;
    sairSelecao(true); fechaFolha(); render();
    avisa(um ? `${um.loja} agora é de ${PESSOAS[k].nome}${k === 'P' || k === 'B' ? ' · ' + e : ''}` : `${ls.length} linhas agora são de ${PESSOAS[k].nome}`, () => antes.forEach(a => Object.assign(a.l, { dono: a.dono, esc: a.esc, cat: a.cat })));
  };
  folha.onclick = ev => {
    const p = ev.target.closest('[data-fp]'), e2 = ev.target.closest('[data-fe]'), c = ev.target.closest('[data-fc]');
    if (p) { escolha = p.dataset.fp; if (escolha === 'E' || escolha === 'L') return setTimeout(() => salva(escolha, '', ''), reduz() ? 0 : 90);
      escopo = null; desenha(); if (cat) {/* mantém */} $('.corpo [data-fe]', folha) && $(`[data-fp="${escolha}"]`, folha).focus(); return; }
    if (e2) { escopo = e2.dataset.fe; const seg = $('.seg', folha); seg.dataset.v = escopo === 'Casal' ? 1 : 0; $$('[data-fe]', folha).forEach(b => b.setAttribute('aria-pressed', String(b === e2))); return; }
    if (c) { cat = c.dataset.fc; salva(escolha, escopo || S.ultimo.esc[escolha] || 'Pessoal', cat); }
  };
}
function sairSelecao(silencioso) { S.selModo = false; S.sel.clear(); if (!silencioso) render(); }

// Toque longo para selecionar várias
let segura = null, longo = false;
raiz.addEventListener('pointerdown', e => {
  const l = e.target.closest('.lin[data-l]'); if (!l) return; longo = false;
  segura = setTimeout(() => { longo = true; S.selModo = true; S.sel.add(l.dataset.l); if (navigator.vibrate) navigator.vibrate(10); render(); }, 450);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => raiz.addEventListener(ev, () => clearTimeout(segura), true));
raiz.addEventListener('scroll', () => clearTimeout(segura), true);
raiz.addEventListener('contextmenu', e => { if (e.target.closest('.lin')) e.preventDefault(); });

// ---------- Ações ----------
const A = {};
A.voltar = () => voltar();
A.aba = d => ir(d.t);
A.ir = d => {
  if (d.t === 'fatura') return A.fatura({ c: d.c || 'nu', m: '2026-11', f: 'sem' });
  if (d.t === 'importar') { S.imp = { passo: 1, cartao: d.c || S.imp.cartao || 'nu', arquivo: null, fatura: '2026-11' }; }
  if (d.t === 'lancar') S.form = null;
  ir(d.t, {}, { empilha: !RAIZ.includes(d.t) });
};
A.fatura = d => { S.filtro = d.f || 'todas'; const mesma = S.tela === 'fatura'; ir('fatura', { c: d.c, m: d.m || '2026-11' }, mesma ? { troca: true } : {}); };
A.mes = d => { S.p = { ...S.p, m: somaMes(S.p.m || '2026-11', +d.k) }; S.filtro = 'todas'; render(); };
A.fmes = d => { S.p = { ...S.p, m: somaMes(S.p.m || '2026-11', +d.k), aberto: null }; render(); };
A.filtro = d => { S.filtro = S.filtro === d.f && d.f !== 'todas' ? 'todas' : d.f; render(); };
A['sair-sel'] = () => sairSelecao();
A['atribuir-sel'] = () => folhaPessoa([...S.sel]);
A.entrar = () => { if (S.login === 'negado') return; S.login = 'carregando'; render(); setTimeout(() => { S.login = 'normal'; S.logado = true; S.tela = 'inicio'; render('vai'); }, 900); };
A.sair = () => confirma('Sair do B&P?', 'Você volta para a tela de entrada. Nada do que foi marcado se perde.', () => { S.logado = false; S.tela = 'login'; render(); }, 'Sair');
A.tema = d => { S.tema = d.v; render(); };
A['fech-abrir'] = d => { S.p = { ...S.p, aberto: S.p.aberto === d.k ? null : d.k }; render(); };
A.msg = d => {
  const k = d.k, m = d.m, txt = mensagem(k, m), sd = m === '2026-11' ? semDonoMes(m) + pendMes(m) : 0;
  abreFolha(`<div class="cab"><h2>Resumo para ${PESSOAS[k].nome}</h2><p>WhatsApp ${PESSOAS[k].tel}</p></div><div class="corpo">
    ${sd ? `<div class="aviso">${ic('atencao')}<p>${sd} linhas desta fatura ainda sem dono, o total pode mudar.</p></div>` : ''}
    <div class="msg">${esc(txt)}</div>
    <div class="acoes"><button class="bt secundario" data-m="copiar">${ic('copiar')}Copiar</button><button class="bt principal" data-m="wa">${ic('mensagem')}Abrir WhatsApp</button></div></div>`);
  folha.onclick = ev => {
    const b = ev.target.closest('[data-m]'); if (!b) return;
    if (b.dataset.m === 'copiar') { try { navigator.clipboard.writeText(txt); } catch (e) {} avisa('Texto copiado.'); }
    else { const reg = (S.fech[m] = S.fech[m] || {})[k] = (S.fech[m] || {})[k] || { pagos: [] }; reg.enviado = '03/11'; fechaFolha(); render();
      avisa(`No app de verdade, abre o WhatsApp da ${PESSOAS[k].nome} com o texto pronto. Anotado: enviado em 03/11.`); }
  };
};
A.pagar = d => {
  const k = d.k, m = d.m, f = fech(k, m);
  abreFolha(`<div class="cab"><h2>Pagamento de ${PESSOAS[k].nome}</h2><p class="num">Fechamento ${mesCurto(m)} · falta ${brl(f.aberto)}</p></div><div class="corpo">
    <div class="campo"><label for="p-v">Valor recebido</label><div class="entrada valor"><span>R$</span><input id="p-v" inputmode="decimal" value="${brl(f.aberto).slice(3)}" autocomplete="off"></div><p class="ajuda" id="p-aj">Se for menos que o total, o fechamento fica parcial e o resto aparece em "A receber".</p></div>
    <div class="campo"><span class="rot">Quando</span><div class="chips"><button class="chip" aria-pressed="true">Hoje, 03/11</button><button class="chip" aria-pressed="false">Ontem, 02/11</button></div></div>
    <div class="campo"><label for="p-o">Observação (opcional)</label><div class="entrada"><input id="p-o" placeholder="Ex.: Pix"></div></div>
    <button class="bt principal cheio" data-p="ok">Registrar</button></div>`, '#p-v');
  folha.onclick = ev => {
    if (ev.target.closest('.chips .chip')) { $$('.chips .chip', folha).forEach(c => c.setAttribute('aria-pressed', String(c === ev.target.closest('.chip')))); return; }
    if (!ev.target.closest('[data-p="ok"]')) return;
    const v = centavos($('#p-v').value);
    if (!v) { $('#p-aj').classList.add('erro'); $('#p-aj').textContent = 'Digite quanto foi recebido.'; return; }
    const reg = (S.fech[m] = S.fech[m] || {})[k] = (S.fech[m] || {})[k] || { pagos: [] };
    reg.pagos.push({ v, d: '2026-11-03' }); fechaFolha(); render();
    const nf = fech(k, m);
    avisa(nf.aberto ? `${PESSOAS[k].nome}: ${brl(v)} recebido, falta ${brl(nf.aberto)}.` : `${PESSOAS[k].nome}: fechamento ${mesCurto(m)} pago.`, () => reg.pagos.pop());
  };
};
// Importação
A['imp-cartao'] = d => { S.imp.cartao = d.c; S.imp.erro = ''; render(); };
A['escolher-arq'] = () => {
  const arqs = S.imp.cartao === 'nu' ? [['Nubank_2026-11-03.csv', '12 KB · hoje'], ['extrato-outubro.ofx', '8 KB · ontem']] : [['BB-fatura-nov.csv', '3 KB · hoje'], ['extrato-outubro.ofx', '8 KB · ontem']];
  abreFolha(`<div class="cab"><h2>Escolher arquivo</h2><p>Downloads</p></div><div class="corpo"><div class="quem">${arqs.map(([n, i]) => `<button data-arq="${n}"><span class="banco"><span class="logo" aria-hidden="true">${ic('importar', 'pp')}</span><span>${n}<small>${i}</small></span></span>${ic('seguir', 'pp')}</button>`).join('')}</div>
    <p class="mini">No app de verdade, abre o seletor de arquivos do celular.</p></div>`);
  folha.onclick = ev => {
    const b = ev.target.closest('[data-arq]'); if (!b) return; const n = b.dataset.arq; fechaFolha();
    if (n.endsWith('.ofx')) { S.imp.erro = 'Este arquivo parece ser um extrato da conta (OFX), não a fatura do cartão. Baixe a fatura em CSV no app do banco e tente de novo.'; return render(); }
    S.imp.arquivo = n; S.imp.erro = ''; S.imp.lendo = true; render();
    setTimeout(() => { S.imp.lendo = false; S.imp.passo = S.imp.cartao === 'bb' && !S.bbMapa ? 3 : 2; render('vai'); }, 800);
  };
};
A['imp-mapa-ok'] = () => { S.bbMapa = true; S.imp.passo = 2; render('vai'); };
A['imp-fat'] = d => { S.imp.fatura = d.m; render(); };
A['imp-cancelar'] = () => voltar();
A['imp-gravar'] = () => {
  if (S.imp.cartao === 'bb') { avisa('Protótipo: a gravação do BB não está simulada. O caminho completo está no Nubank.'); return; }
  if (S.imp.fatura !== '2026-11') { confirma('Gravar na fatura ' + mesCurto(S.imp.fatura) + '?', 'As compras do arquivo são de 03/10 a 03/11, que é a fatura Nov/26. Tem certeza de que quer gravar em outra?', () => gravarNu(), 'Gravar mesmo assim'); return; }
  gravarNu();
};
function gravarNu() {
  S.imp.lendo = true; render();
  setTimeout(() => { S.nu = 'importada'; S.imp.lendo = false; S.pilha = [{ tela: 'inicio', p: {} }]; S.tela = 'conciliacao'; S.p = {}; render('vai'); avisa('47 linhas gravadas. Confira o que o app encontrou.'); }, 900);
}
// Conciliação
const linhaPend = id => S.faturas['nu-2026-11'].linhas.find(l => l.pend === id);
A['conc-sim'] = d => { const du = S.conc.duplicidades.find(x => x.id === d.id), l = linhaPend(d.id); du.estado = 'ok'; Object.assign(l, { dono: du.copia.dono, esc: du.copia.esc, cat: du.copia.cat, pend: null, _p: d.id }); render();
  avisa('Duplicidade resolvida: ficou a linha da fatura, com os dados do Pedro.', () => { du.estado = 'aberta'; Object.assign(l, { dono: null, esc: '', cat: '', pend: l._p }); }); };
A['conc-nao'] = d => { const du = S.conc.duplicidades.find(x => x.id === d.id), l = linhaPend(d.id); du.estado = 'nao'; Object.assign(l, { pend: null, _p: d.id }); render();
  avisa('Mantive as duas. A linha da fatura ficou sem dono.', () => { du.estado = 'aberta'; l.pend = l._p; }); };
A['conc-obvias'] = () => S.conc.duplicidades.filter(x => x.estado === 'aberta').forEach(x => A['conc-sim']({ id: x.id }));
A['conc-amb'] = d => { const a = S.conc.ambiguas.find(x => x.id === d.id), l = linhaPend(d.id), c = a.candidatas.find(x => x.id === d.c); a.estado = 'ok';
  Object.assign(l, c ? { dono: c.dono, esc: c.esc, cat: 'Alimentação fora', pend: null, _p: d.id } : { pend: null, _p: d.id }); render();
  avisa(c ? `iFood ficou com ${PESSOAS[c.dono].nome}.` : 'iFood ficou sem dono.', () => { a.estado = 'aberta'; Object.assign(l, { dono: null, esc: '', cat: '', pend: l._p }); }); };
A['nao-mover'] = d => { const n = S.conc.naoEncontradas.find(x => x.id === d.id); n.estado = 'movida'; render(); avisa('Parcela movida para a fatura Dez/26.', () => { n.estado = 'aberta'; }); };
A['nao-excluir'] = d => { const n = S.conc.naoEncontradas.find(x => x.id === d.id);
  confirma(`Excluir ${n.loja} ${n.parc}?`, 'Só esta parcela prevista sai do app. As outras parcelas da série continuam.', () => { n.estado = 'excluida'; render(); avisa(`${n.loja} ${n.parc} excluída.`, () => { n.estado = 'aberta'; }); }); };
// Lançar
A['f-dono'] = d => { const F = S.form; F.dono = d.k; F.esc = S.ultimo.esc[d.k] || 'Pessoal'; render(); };
A['f-esc'] = d => { S.form.esc = d.v; render(); };
A['f-cat'] = d => { S.form.cat = S.form.cat === d.v ? '' : d.v; render(); };
A['f-n'] = d => { S.form.n = Math.min(48, Math.max(1, S.form.n + +d.k)); render(); };
A['f-cartao'] = d => { S.form.cartao = d.c; render(); };
A['f-data'] = d => { S.form.data = d.v; render(); };
A['f-salvar'] = () => {
  const F = S.form; F.tentou = true; const e = validar(F); if (Object.keys(e).length) { render(); const c = $('[aria-invalid], .erro input', raiz); if (c) c.focus(); return; }
  const dest = destino(F), parts = dividir(F.valor, F.n), id = 'x' + Date.now();
  const novas = parts.map((v, i) => ({ id: id + i, cartao: F.cartao, mes: somaMes(dest, i), d: F.data, loja: F.desc.trim(), v, dono: F.dono, esc: F.dono === 'P' || F.dono === 'B' ? F.esc : '', cat: F.cat,
    parc: F.n > 1 ? `${i + 1}/${F.n}` : '', compra: F.data, prev: F.n > 1, manual: true }));
  S.extras.push(...novas); S.ultimo = { ...S.ultimo, cartao: F.cartao, dono: F.dono, esc: { ...S.ultimo.esc, ...(F.dono === 'P' || F.dono === 'B' ? { [F.dono]: F.esc } : {}) } };
  S.form = null; voltar();
  avisa(`Lançado: ${F.desc.trim()}, ${brl(F.valor)}${F.n > 1 ? ` em ${F.n}x` : ''}, fatura ${mesCurto(dest)}.`, () => { S.extras = S.extras.filter(x => !x.id.startsWith(id)); });
};
A['nova-divida'] = () => avisa('No protótipo, o cadastro de dívida não está simulado.');
A.exportar = () => avisa('Arquivo gerado. No protótipo, nada é baixado.');
A.estado = d => { S.estado = d.v; render(); };

raiz.addEventListener('click', e => {
  const lin = e.target.closest('.lin[data-l]');
  if (lin) {
    if (longo) { longo = false; return; }
    const id = lin.dataset.l, l = achaLinha(id);
    if (S.selModo) { S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); if (!S.sel.size) S.selModo = false; return render(); }
    if (l && l.pend) return ir('conciliacao', {}, { empilha: true });
    return folhaPessoa([id]);
  }
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const f = A[b.dataset.a]; if (f) { e.preventDefault(); f({ ...b.dataset }); }
});
raiz.addEventListener('input', e => {
  const k = e.target.dataset.in; if (!k || !S.form) return;
  if (k === 'valor') { const v = e.target.value.replace(/[^\d,]/g, ''); S.form.valorTxt = v; S.form.valor = centavos(v); const p = $('.ajuda.num', raiz), bt = $('[data-a="f-salvar"]', raiz);
    if (p) { const parts = dividir(S.form.valor, S.form.n); p.textContent = S.form.n > 1 && S.form.valor ? `${S.form.n}x: ${parts.slice(0, 3).map(x => brl(x).slice(3)).join(' + ')}${S.form.n > 3 ? ' + …' : ''}` : 'À vista'; }
    if (bt) bt.textContent = 'Lançar ' + (S.form.valor ? brl(S.form.valor) : ''); }
  if (k === 'desc') S.form.desc = e.target.value;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (dialogo.classList.contains('on')) fechaDialogo(); else if (faberta) fechaFolha(); else if (S.selModo) sairSelecao(); } });

// ---------- Painel de demonstração ----------
const demo = $('#demo');
function syncDemo() {
  $$('[data-d="tela"]', demo).forEach(b => b.setAttribute('aria-pressed', String(S.logado ? b.dataset.v === S.tela : b.dataset.v === 'login')));
  $$('[data-d="estado"]', demo).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.estado)));
  $$('[data-d="tema"]', demo).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.tema)));
  $$('[data-d="grande"]', demo).forEach(b => b.setAttribute('aria-pressed', String(S.grande)));
}
demo.addEventListener('click', e => {
  const b = e.target.closest('[data-d]'); if (!b) return; const v = b.dataset.v;
  fechaFolha(); fechaDialogo();
  switch (b.dataset.d) {
    case 'tela':
      if (v === 'login') { S.logado = false; S.login = 'normal'; S.tela = 'login'; return render(); }
      if (v === 'negado') { S.logado = false; S.login = 'negado'; S.tela = 'login'; return render(); }
      S.logado = true; if (v === 'fatura') return A.fatura({ c: 'nu', m: '2026-11' });
      if (v === 'importar') S.imp = { passo: 1, cartao: 'nu', fatura: '2026-11' }; if (v === 'lancar') S.form = null;
      return ir(v, {}, { empilha: !RAIZ.includes(v) });
    case 'estado': S.estado = v; return render();
    case 'tema': S.tema = v; return render();
    case 'grande': S.grande = !S.grande; _grandes = null; return render();
    case 'momento': {
      const t = S.tema, tela = S.tela; S = inicial(); S.tema = t; S.logado = true; S.tela = 'inicio';
      if (v !== 'antes') { S.nu = 'importada'; S.conc.duplicidades.forEach(x => A['conc-sim']({ id: x.id })); A['conc-amb']({ id: 'a1', c: 'c1' }); A['nao-mover']({ id: 'n1' }); }
      if (v === 'marcado') S.faturas['nu-2026-11'].linhas.forEach(l => { if (!l.dono && l.alvo) Object.assign(l, { dono: l.alvo, esc: l.alvoEsc || '', cat: l.alvoCat || '' }); });
      toast.classList.remove('on'); S.tela = tela === 'login' ? 'inicio' : tela; S.pilha = []; return render();
    }
  }
});

render();
})();
