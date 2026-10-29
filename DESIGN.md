---
name: B&P Finanças
description: O caderno de contas da família, onde cada pessoa vê a própria parte da fatura com nome, inicial e valor.
colors:
  acao: "#1b2453"
  acao-forte: "#121a40"
  acao-texto: "#2b3a8f"
  acao-leve: "#e9ecf8"
  foco: "#2b3a8f"
  no-acao: "#ffffff"
  chao: "#f2f3f6"
  cartao: "#ffffff"
  elevado: "#ffffff"
  vidro: "rgba(246,247,250,.86)"
  linha: "#e2e5eb"
  linha-forte: "#c9ced8"
  veu: "rgba(17,20,28,.36)"
  cofre-1: "#1d2446"
  cofre-2: "#0f1328"
  cofre-tinta: "#f3f5fb"
  cofre-suave: "#aeb6cf"
  cofre-atencao: "#f6cd7a"
  tinta: "#11141c"
  suave: "#565e6e"
  apagado: "#636b7b"
  ok: "#1f7a4d"
  ok-leve: "#e3f3ea"
  atencao: "#8a5a00"
  atencao-leve: "#fdf1d8"
  erro: "#b3261e"
  erro-leve: "#fde8e6"
  no-erro: "#ffffff"
  inverso: "#11141c"
  no-inverso: "#f3f5fb"
  acao-inverso: "#aebaff"
  pedro: "#56b4e9"
  pedro-tinta: "#1c1b19"
  bruna: "#bd4a87"
  bruna-tinta: "#ffffff"
  eliete: "#054836"
  eliete-tinta: "#ffffff"
  lucimar: "#e69f00"
  lucimar-tinta: "#1c1b19"
  sem-dono: "#636b7b"
  nubank: "#820ad1"
  bb: "#fde100"
  bb-tinta: "#003882"
typography:
  valor-gg:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum, lnum"
  t-valor:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum, lnum"
  t-mes:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  t-titulo:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  t-forte:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  t-corpo:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  t-apoio:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  t-rotulo:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  t-mini:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
  rotulo-barra:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  r-pequeno: "8px"
  r-campo: "12px"
  r-bloco: "14px"
  r-cartao: "18px"
  r-painel: "24px"
  r-folha: "28px"
  r-pilula: "999px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "20px"
  e6: "24px"
  e8: "32px"
  e10: "40px"
  margem: "16px"
  alvo: "44px"
components:
  button-principal:
    backgroundColor: "{colors.acao}"
    textColor: "{colors.no-acao}"
    rounded: "{rounded.r-pilula}"
    padding: "0 20px"
    height: "48px"
  button-principal-pressionado:
    backgroundColor: "{colors.acao-forte}"
    textColor: "{colors.no-acao}"
  button-principal-desativado:
    backgroundColor: "{colors.linha}"
    textColor: "{colors.apagado}"
  button-secundario:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-pilula}"
    padding: "0 20px"
    height: "48px"
  button-discreto:
    textColor: "{colors.acao-texto}"
    rounded: "{rounded.r-pilula}"
    padding: "0 10px"
    height: "44px"
  button-destrutivo:
    backgroundColor: "{colors.erro-leve}"
    textColor: "{colors.erro}"
    rounded: "{rounded.r-pilula}"
    padding: "0 20px"
    height: "48px"
  button-perigo:
    backgroundColor: "{colors.erro}"
    textColor: "{colors.no-erro}"
    rounded: "{rounded.r-pilula}"
    padding: "0 20px"
    height: "48px"
  painel-cofre:
    backgroundColor: "{colors.cofre-2}"
    textColor: "{colors.cofre-tinta}"
    typography: "{typography.valor-gg}"
    rounded: "{rounded.r-painel}"
    padding: "22px 20px 14px"
  chip:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-pilula}"
    padding: "0 14px"
    height: "38px"
  chip-escolhido:
    backgroundColor: "{colors.acao-leve}"
    textColor: "{colors.tinta}"
  campo:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    typography: "{typography.t-corpo}"
    rounded: "{rounded.r-campo}"
    padding: "0 16px"
    height: "52px"
  campo-valor:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    typography: "{typography.t-valor}"
    rounded: "{rounded.r-campo}"
    padding: "0 16px"
    height: "72px"
  segmentado:
    backgroundColor: "{colors.linha}"
    textColor: "{colors.suave}"
    rounded: "{rounded.r-pilula}"
    padding: "3px"
    height: "50px"
  segmentado-escolhido:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
  cartao:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-cartao}"
    padding: "16px"
  linha-fatura:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    padding: "10px 16px"
    height: "64px"
  linha-fatura-marcada:
    backgroundColor: "{colors.acao-leve}"
    textColor: "{colors.tinta}"
  pilula-ok:
    backgroundColor: "{colors.ok-leve}"
    textColor: "{colors.ok}"
    typography: "{typography.t-mini}"
    rounded: "{rounded.r-pilula}"
    padding: "5px 10px 5px 8px"
  pilula-atencao:
    backgroundColor: "{colors.atencao-leve}"
    textColor: "{colors.atencao}"
    typography: "{typography.t-mini}"
    rounded: "{rounded.r-pilula}"
    padding: "5px 10px 5px 8px"
  pilula-erro:
    backgroundColor: "{colors.erro-leve}"
    textColor: "{colors.erro}"
    typography: "{typography.t-mini}"
    rounded: "{rounded.r-pilula}"
    padding: "5px 10px 5px 8px"
  pilula-acao:
    backgroundColor: "{colors.acao-leve}"
    textColor: "{colors.acao-texto}"
    typography: "{typography.t-mini}"
    rounded: "{rounded.r-pilula}"
    padding: "5px 10px 5px 8px"
  pilula-neutra:
    backgroundColor: "{colors.chao}"
    textColor: "{colors.suave}"
    typography: "{typography.t-mini}"
    rounded: "{rounded.r-pilula}"
    padding: "5px 10px 5px 8px"
  aviso:
    backgroundColor: "{colors.atencao-leve}"
    textColor: "{colors.atencao}"
    rounded: "{rounded.r-bloco}"
    padding: "12px 14px"
  barra-inferior:
    backgroundColor: "{colors.vidro}"
    textColor: "{colors.suave}"
    typography: "{typography.rotulo-barra}"
    height: "84px"
  barra-lancar:
    backgroundColor: "{colors.acao}"
    textColor: "{colors.no-acao}"
    rounded: "{rounded.r-pilula}"
    size: "48px"
  lateral:
    backgroundColor: "{colors.chao}"
    textColor: "{colors.suave}"
    padding: "24px 16px"
    width: "248px"
  lateral-item-atual:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-campo}"
    padding: "0 12px"
    height: "44px"
  folha:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-folha}"
    padding: "4px 20px 24px"
    width: "560px"
  folha-pessoa:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-bloco}"
    padding: "0 14px"
    height: "64px"
  folha-pessoa-escolhida:
    backgroundColor: "{colors.acao-leve}"
    textColor: "{colors.tinta}"
  dialogo:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-cartao}"
    padding: "20px"
  aviso-desfazer:
    backgroundColor: "{colors.inverso}"
    textColor: "{colors.no-inverso}"
    rounded: "{rounded.r-bloco}"
    padding: "8px 8px 8px 16px"
    width: "380px"
  barra-selecao:
    backgroundColor: "{colors.inverso}"
    textColor: "{colors.no-inverso}"
    rounded: "{rounded.r-cartao}"
    padding: "10px 10px 10px 16px"
---

# Design System: B&P Finanças

## Overview

**Creative North Star: "Cofre"**

O dinheiro da família guardado com o cuidado de um banco de primeira linha, mas com o nome de cada pessoa escrito nele. O fundo é uma porcelana fria e clara; cada assunto mora num cartão branco; e o número do mês fica dentro de um painel escuro, o cofre, com uma luz suave no alto. Embaixo do total, uma régua divide o dinheiro pelas cores das pessoas (Pedro, Bruna, Eliete, Lucimar) e uma legenda escreve o nome e o valor de cada uma. A sensação continua a da marca: serena, exata, da casa, transparente. Nada de bronca, nada de alerta piscando.

Estilo escolhido pelo Pedro em 29/10/2026, no lugar do "Sala de estar" (papel quente, Figtree). A estrutura do produto e as regras de negócio não mudaram. No celular, uma coluna só, margem de 16, ações na metade de baixo e a barra inferior com Lançar no centro. No computador (a partir de 1024px), um menu lateral à esquerda substitui a barra e a tela se abre em duas colunas: o cofre e o resumo à esquerda, o conteúdo à direita.

Há duas cores de interface, ambas azuis: o azul-marinho do botão principal e o azul de tinta dos links, da seleção e do foco. O resto da cor é informação: verde, âmbar e vermelho com significado fixo, as quatro cores de pessoa e o próprio cofre. O que o sistema recusa, por compromisso da marca: vermelho de alerta para dinheiro, gráficos que não respondem a uma pergunta, cara de "dashboard de IA", gamificação.

**Key Characteristics:**
- Chão de porcelana fria (`chao`), cartões brancos de raio 18 com sombra fria em duas camadas.
- Um cofre por tela: o total do mês em 56px (64 no computador) num painel escuro de raio 24, com luz no alto.
- A régua: o único gráfico do app, respondendo "de quem é esse dinheiro?".
- Uma fonte só (Geist, 400 a 700), números de largura igual, "R$" e centavos menores e mais claros.
- Escuro profundo, sem preto puro, com camadas separadas por claridade.
- Movimento curto e interrompível; números nunca animam.

## Colors

Porcelana fria com cartões brancos, um cofre azul-noite para o total, dois azuis de interface e uma família de cores de significado e de pessoa que sempre vêm com palavra.

### Primary
- **Azul-marinho** (`acao`): fundo do botão principal (Lançar compra, Salvar, Mandar no WhatsApp), do círculo do Lançar na barra, do passo atual na lista do mês e do círculo da linha marcada. Pressionado, escurece para `acao-forte`.
- **Azul de tinta** (`acao-texto`): links, botão discreto, item atual da barra de baixo, contorno da pessoa e da opção escolhidas, pílula "Aberta". No escuro vira um azul-lavanda claro.
- **Azul de seleção** (`acao-leve`): fundo de linha marcada, de pessoa e de opção escolhidas, da faixa de informação e da seleção de texto.
- **Foco** (`foco`): o anel de 2,5px da navegação por teclado; mesmo tom do azul de tinta.

### Secondary
- **Cores de pessoa** (`pedro`, `bruna`, `eliete`, `lucimar`): inalteradas na troca de estilo. Testadas simulando protanopia, deuteranopia e tritanopia; a menor distância entre duas delas fica perto de ΔE 26 nos três casos. Pedro (azul-céu) e Lucimar (âmbar) são claras e levam a inicial em tinta escura (`pedro-tinta`, `lucimar-tinta`); Bruna (magenta) e Eliete (verde-garrafa) são escuras e levam a inicial em branco. Aparecem só no selo da pessoa e na fatia dela na régua.
- **Sem dono** (`sem-dono`): não é pessoa e não ganha cor de pessoa. No selo, círculo tracejado em `atencao` com "?"; na régua, fatia hachurada.

### Tertiary
- **O cofre** (`cofre-1`, `cofre-2`, `cofre-tinta`, `cofre-suave`): material exclusivo do painel do total. Fundo em gradiente radial, com `cofre-1` como luz no alto à esquerda caindo para `cofre-2`. Texto em `cofre-tinta`; "R$", centavos e notas em `cofre-suave` (9:1 sobre o painel); "sem dono" dentro do painel em `cofre-atencao` (10:1).
- **Significado**: `ok` / `ok-leve` para pago e conferido; `atencao` / `atencao-leve` para sem dono, falta pagar e parcial; `erro` / `erro-leve` para arquivo inválido e falha. Sempre texto escuro sobre fundo leve, com palavra e ícone.
- **Bancos** (`nubank`, `bb` com `bb-tinta`): só no logo do banco e no cartão de plástico da tela Cartões.

### Neutral
- **Chão** (`chao`): fundo do app e do menu lateral, porcelana fria.
- **Cartão** (`cartao`) e **Elevado** (`elevado`): cartões e listas; folhas e diálogos. No claro os dois são brancos; no escuro o elevado é um degrau mais claro.
- **Vidro** (`vidro`): barra de baixo, translúcida com desfoque.
- **Linha** (`linha`) e **Linha forte** (`linha-forte`): divisórias finas; bordas de campo, opção e botão secundário, alça da folha.
- **Véu** (`veu`): escurece o fundo atrás de folha e diálogo.
- **Tinta**, **Suave**, **Apagado** (`tinta`, `suave`, `apagado`): texto principal; texto de apoio (5,9:1 no chão); texto menor de apoio e placeholders (4,8:1 no chão). Nenhum texto abaixo de 4,5:1.
- **Inverso** (`inverso`, `no-inverso`, `acao-inverso`): aviso com Desfazer e barra de seleção em massa. Escuro no tema claro, claro no escuro.

### Escuro: "cofre à noite"
Segue o celular e pode ser forçado em Mais (Claro, Escuro, Do celular). Fundo quase preto azulado, nunca preto puro; as camadas se separam por claridade (chão, cartão, elevado sobem um degrau cada) e as sombras viram quase só um fio de luz no alto. Valores que mudam:

| Token | Escuro |
|---|---|
| chao / cartao / elevado | #0d0f15 / #161922 / #1d212c |
| vidro | rgba(16,18,26,.86) |
| linha / linha-forte | #262b37 / #3a404e |
| veu | rgba(0,0,0,.55) |
| cofre-1 / cofre-2 | #232a4d / #141936 |
| tinta / suave / apagado | #eef0f5 / #a5adbd / #9aa2b2 |
| acao / acao-forte / acao-texto / acao-leve / foco | #4d5fd6 / #3f50c0 / #a9b6ff / #232945 / #a9b6ff |
| ok / ok-leve | #6fd3a6 / #173328 |
| atencao / atencao-leve | #f2c46b / #3a2e15 |
| erro / erro-leve / no-erro | #ff8f87 / #3d1c1a / #0d0f15 |
| inverso / no-inverso / acao-inverso | #eef0f5 / #0d0f15 / #2b3a8f |
| sem-dono | #9aa2b2 |

No escuro, o círculo de cada pessoa ganha um anel fino branco translúcido (`--anel-pessoa`, 22%) para não sumir no fundo; Eliete depende dele. Dentro do cofre, o anel é sempre branco a 35%, nos dois temas.

Quem pede **mais contraste** recebe divisórias na força de `linha-forte` e texto suave igual à tinta. Quem pede **menos transparência** recebe a barra de baixo sólida, na cor do cartão.

### Named Rules
**The Dois Azuis Rule.** O azul-marinho é do botão principal; o azul de tinta é de link, seleção e foco. Só aparecem no que se toca ou no que está escolhido, nunca como enfeite, faixa ou fundo de seção.

**The Um Cofre Rule.** O painel escuro guarda o total do mês e a divisão por pessoa, e aparece no máximo uma vez por tela. Nenhum outro bloco usa as cores do cofre.

**The Nome Junto Rule.** Cor de pessoa nunca aparece sozinha: no selo, sempre com a inicial no círculo e o nome ao lado; na régua, sempre com a legenda logo abaixo. Status nunca aparece só por cor: sempre com palavra e ícone.

**The Vermelho no Lugar Rule.** Vermelho é só para falha (arquivo não lido, erro de campo, excluir). Dívida, "falta pagar" e "sem dono" são âmbar, nunca vermelho.

## Typography

**Display Font:** Geist (com Segoe UI, system-ui)
**Body Font:** Geist (com Segoe UI, system-ui)

**Character:** Uma fonte só, geométrica e precisa, carregada nos pesos 400, 500, 600 e 700. O corpo é leve (400) e a hierarquia vem do peso e de poucos tamanhos: são dez no app inteiro.

### Hierarchy
- **Total do cofre** (`valor-gg`, 600, 56px no celular e 64px no computador, altura 1, aperto -0,035em): só o total do mês, dentro do painel.
- **Valor** (`t-valor`, 600, 34px, 1.05, aperto -0,03em): valor em destaque fora do painel (total de um fechamento, total lido na importação) e o campo de valor da tela Lançar (em 700).
- **Mês** (`t-mes`, 700, 28px, 1.15, aperto -0,03em): título da tela, como "Novembro". O valor do cartão de plástico também usa 28px.
- **Título** (`t-titulo`, 600, 20px, 1.25): título de folha, diálogo e cartão.
- **Forte** (`t-forte`, 600, 17px, 1.3): nome do banco, título de estado vazio, nome do app no menu lateral, mês no seletor de mês.
- **Corpo** (`t-corpo`, 400, 16px, 1.5): texto corrido. Campos usam 500/16px; descrição da linha da fatura 600/16px e valor 700/16px. Campo nunca abaixo de 16px, para o celular não dar zoom.
- **Apoio** (`t-apoio`, 400, 14px, 1.45): vencimento, contagens, explicações. Opções (chips) e itens do menu lateral usam 600/14px; avisos 600/14px.
- **Rótulo** (`t-rotulo`, 600, 13px, 1.3): rótulo de campo, cabeçalho do dia na lista, título pequeno de cartão. Escrito como frase, em `suave`. Data da linha, ajuda de campo e nome no selo também ficam em 13px.
- **Mini** (`t-mini`, 500, 12px, 1.3): pílulas de status, número da parcela, faixa do modo demonstração.
- **Barra** (`rotulo-barra`, 600, 11px, aperto -0,01em): nomes da barra de baixo; a inicial do selo também é 11px (700).

### Named Rules
**The Valor Manda Rule.** Dinheiro é sempre escrito "R$ 1.234,56". Nos valores grandes, só os reais ficam no tamanho cheio (600); o "R$" (42% do tamanho) e os centavos (50%) vêm em 600, na cor suave, alinhados pelo alto. Em valores pequenos (16px e abaixo), tudo no mesmo tamanho e peso.

**The Coluna Reta Rule.** Todo número usa algarismos de largura igual (tabular-nums, lining-nums), para que os valores fiquem alinhados um embaixo do outro. Aperto de letra negativo só em 28px ou mais.

## Layout

**Celular** (pensado a partir de 375px; até 480px de largura útil, centralizado). Uma coluna, margem lateral de 16 (`margem`), 14 entre blocos. Os espaços crescem de 4 em 4 (`e1` a `e10`): 4 entre ícone e texto, 8 dentro de um grupo, 12 entre linhas de um cartão, 16 de respiro interno do cartão, 24 e 32 entre seções. Entre 520 e 1023px a coluna fica centralizada sobre fundo `linha`, com a sombra elevada.

**Computador** (a partir de 1024px). O menu lateral (248px, fundo `chao`, fio `linha` à direita) toma o lugar da barra de baixo. O conteúdo tem margem de pelo menos 32 e largura máxima de 1120px, e as telas com cofre se abrem em duas colunas (5 para 7, 32 de espaço): o cofre e o resumo à esquerda, fixos ao rolar; a lista ou o conteúdo à direita. O total do cofre sobe para 64px.

Nada que se toca tem menos de 44 de altura (`alvo`); botões têm 48, linhas da fatura e botões de pessoa 64. Onde a peça visível é menor (opções de 38px, link da faixa de demonstração), uma área invisível em volta leva o alvo a 44. As ações ficam na metade de baixo: a barra inferior, a folha que sobe e o rodapé fixo das telas sem barra (Lançar e Importar), que se apoia num degradê do transparente para o `chao`.

**The Uma Faixa Rule.** No máximo uma faixa de aviso por tela. Notas que explicam o total (parcial, sem dono) vão dentro do cofre, em texto pequeno `cofre-suave`, não em outra faixa.

Camadas por cima: folha até 560px, centralizada; aviso com Desfazer até 380px. Tudo respeita a área segura do iPhone (`env(safe-area-inset-*)`).

## Elevation & Depth

Sistema em camadas com sombras frias (tingidas de azul-noite no claro, pretas no escuro), sempre em duas camadas: um contato curto e uma sombra larga e baixa. O cartão quase encosta no chão; o cofre ganha uma sombra mais funda e um fio de luz no alto; o que fica por cima do conteúdo (folha, diálogo, avisos) ganha a sombra elevada. Não há sombra dura nem contorno grosso. No escuro, a separação vem da claridade das camadas e de um fio de luz interno, e o botão principal fica sem sombra.

### Shadow Vocabulary
- **Cartão** (`--s-cartao`): contato de 1–2px e sombra baixa de 22px. Cartões, listas, a peça escolhida do seletor, o item atual do menu lateral, os botões redondos do topo.
- **Elevado** (`--s-elevado`): contato de 2–6px e sombra larga de 48px. Diálogo, aviso com Desfazer, barra de seleção em massa.
- **Ação** (`--s-acao`): só um contato de 1–2px sob o botão principal. No escuro, nenhuma.
- **Painel** (`--s-painel`): fio de luz branca de 1px por dentro, no alto, e sombra azul-noite de 40px. Só o cofre.
- **Folha** (`--s-folha`): sombra projetada para cima. Folha que sobe de baixo.

### Materiais
O cofre é um gradiente radial (120% × 90% a partir de 20% da largura, no topo) de `cofre-1` para `cofre-2`: a luz cai do alto. A barra de baixo é de vidro: `vidro` com desfoque de 20px e saturação de 170%, com o conteúdo passando por trás.

### Named Rules
**The Encosta no Chão Rule.** Em repouso, cartões usam só a sombra de cartão. A sombra do painel é só do cofre; sombra elevada é para o que está por cima de outra coisa, nunca para destacar um cartão comum.

## Shapes

Quanto maior a superfície, mais redondo o canto: 8 para peças pequenas (parcela, barras do esqueleto, botões internos), 12 para campos e itens do menu lateral, 14 para blocos (faixa de aviso, aviso com Desfazer, botões de pessoa, cartão de plástico, mensagem), 18 para cartões, listas, diálogo e barra de seleção, 24 para o cofre, 28 para o topo da folha (embaixo ela é reta, encostada na borda) e pílula completa para botões, opções, seletor, pílulas de status e a régua. Círculos para selos de pessoa (22px no texto, 32px na folha), logos de loja e banco (36px; 24px no cofre), botões redondos do topo (36 visíveis, 44 de alvo) e o Lançar (48px).

Bordas são desenhadas por dentro (sombra interna de 1 a 2px), para não mudar o tamanho da peça: 1,5px `linha-forte` em campo, opção e botão secundário; 2px `foco` no campo em foco; 2px `acao-texto` na opção e na pessoa escolhidas; 2px `erro` no campo com erro. As divisórias da lista começam depois do logo (64px da borda).

## Components

### Buttons
Firmes e calmos; respondem no instante do toque.
- **Shape:** pílula (`r-pilula`), 48 de altura, 700/16px, ícone de 20px a 8 do texto. Variante média: 44 de altura, 14px.
- **Principal:** azul-marinho com texto branco e sombra de ação. Um por tela, no máximo.
- **Pressionado:** encolhe para 97% em 100ms e escurece para `acao-forte`.
- **Foco:** anel `foco` de 2,5px, 2px afastado.
- **Desativado:** fundo `linha`, texto `apagado`, sem sombra, sem encolher.
- **Carregando:** um círculo girando no lugar do ícone e o verbo no gerúndio ("Lançando"); o botão para de aceitar toques.
- **Secundário:** cartão com borda interna `linha-forte` e texto `tinta` (Cancelar, Manter, Copiar texto).
- **Discreto:** só texto `acao-texto`, 44 de altura. **Link:** texto sublinhado na cor de onde está, usado como saída dentro de avisos.
- **Destrutivo:** fundo `erro-leve` com texto `erro`. **Perigo:** vermelho cheio `erro` com texto `no-erro`, só no diálogo de confirmação.

### Chips
- **Opções (chips):** pílula branca de 38 visíveis com borda interna 1,5px `linha-forte`, 600/14px, área invisível que leva o alvo a 44. Escolhida: fundo `acao-leve` e borda 2px `acao-texto`. Usadas para filtros da fatura (com a contagem em 700 `suave`), categoria, cartão, data, mês da importação e tema. Encolhem a 97% no toque.
- **Pílulas de status:** fundo leve + texto da cor do significado, ícone de 14px com traço 2,25 e palavra. Variantes ok, atenção, erro, ação e neutra (sobre o chão com contorno fino).
- **Selo de pessoa:** círculo de 22 com a inicial (700/11px) e o nome ao lado (600/13px). Versão grande na folha: círculo de 32 e nome em 700/16px.
- **Parcela:** "3/10" em mini, sobre o chão, cantos de 8.

### Cards / Containers
- **Corner Style:** 18px (`r-cartao`).
- **Background:** `cartao` sobre `chao`.
- **Shadow Strategy:** sombra de cartão (ver Elevation & Depth).
- **Border:** nenhuma; separação interna por divisórias de 1px `linha`.
- **Internal Padding:** 16, com 12 entre blocos internos. Cartão tocável encolhe para 98,5%.

### Inputs / Fields
- **Style:** 52 de altura, fundo cartão, borda interna `linha-forte` de 1,5px, raio 12, texto 500/16px. Rótulo em cima (`t-rotulo`, `suave`) e ajuda embaixo (13px, `suave`, ícone de 16).
- **Campo de valor:** 72 de altura, número em 700/34px com "R$" em 700/20px `suave`; abre teclado numérico.
- **Focus:** a borda vira 2px `foco`.
- **Error:** borda 2px `erro` e, logo abaixo, ícone + frase que diz o que houve e como resolver.

### Navigation
- **Celular:** barra de baixo de 84 de altura, de vidro, com um fio `linha` em cima. Cinco lugares, sempre com ícone de 24 e nome: Início, Cartões, Lançar, Fechamentos, Mais (D10). Lugar atual em `acao-texto`, os outros em `suave`. Lançar fica no centro, num círculo azul-marinho de 48 que sobe 20px acima da barra, com sombra própria. Some nas telas Lançar e Importar, que têm rodapé com a ação.
- **Computador:** menu lateral com a marca (36px) e o nome do app, o botão principal "Lançar compra" na largura toda e os itens Início, Cartões, Fechamentos e Mais (44 de altura, raio 12, ícone de 22, 600/14px `suave`). Passar o mouse dá fundo `cartao`; o item atual fica em `cartao` com texto `tinta` e sombra de cartão.
- **Topo:** título em `t-mes` com subtítulo em `t-apoio`; botões redondos de 44 (círculo branco de 36 com sombra de cartão) para voltar e trocar de mês.

### O cofre (painel do total, assinatura)
O painel escuro que abre o Início e a Fatura. Raio 24, respiro de 22/20/14, 12 entre peças. De cima para baixo:
- **Total** em `valor-gg`, com "R$" e centavos menores em `cofre-suave`.
- **Linha de apoio** (vencimentos, ou logo do banco de 24 com o nome do cartão) em 14px `cofre-suave`.
- **Régua:** barra de 14 de altura, pílula, fatias separadas por 3px, cada uma proporcional ao valor da pessoa e com no mínimo 6px. Cada fatia na cor da pessoa; "sem dono" em listras diagonais (no cofre, branco a 12% e 26%; fora dele, `linha` e `linha-forte`). Quando os valores mudam, as fatias deslizam em 0,34s. Para leitor de tela, a régua é uma imagem com a divisão escrita por extenso.
- **Legenda:** grade de duas colunas; cada item mostra o selo (inicial + nome) e, embaixo, o valor em 14px, alinhado com o nome. "Sem dono" ocupa a linha inteira. Na Fatura, cada item é tocável (52 de altura) e filtra a lista.
- **Notas** em 13px `cofre-suave`: "linhas ainda sem dono", "valores parciais".

**The Bruna Presente Rule.** Bruna aparece em todo resumo, mesmo sendo a titular que recebe dos outros, do mesmo jeito que as outras pessoas: selo (inicial + nome) e valor, sem nota extra.

### Linhas da fatura
Lista num cartão, agrupada por dia com cabeçalho em `t-rotulo`. Cada linha tem 64 de altura: logo da loja num círculo de 36, descrição (600/16px, cortada com reticências) com data ou parcela e selo da pessoa embaixo (13px), valor à direita (700/16px). O IOF é linha filha, sem logo, em peso 500 `suave`. Toque abre a folha de escolher pessoa; toque longo (0,45s) marca a linha (fundo `acao-leve`, logo vira círculo azul-marinho) e faz subir a barra de seleção em massa, invertida, acima da barra de baixo.

### Aviso
Faixa com cantos de 14, ícone de 20 e texto 600/14px. Âmbar para pendência, vermelho para erro, verde para "tudo certo", azul de seleção para informação. A saída vem escrita como link sublinhado ("Conferir agora", "Marcar agora").

### Folha (interação-assinatura)
Sobe de baixo sobre o véu, com topo de raio 28, alça de 40×5 em `linha-forte`, título em `t-titulo` e a linha em questão embaixo. Na folha de pessoa, quatro botões em duas colunas (64 de altura, raio 14, contorno `linha`; o escolhido ganha contorno 2px `acao-texto` e fundo `acao-leve`) e, para Pedro e Bruna, o seletor Pessoal / Casal: pílula `linha` com uma peça branca que desliza em 0,22s.

Movimento: mola criticamente amortecida (sem quique, resposta de 0,34s), interrompível a qualquer momento. Segue o dedo 1:1 ao arrastar para baixo; para cima resiste como elástico. Ao soltar, projeta para onde o gesto levaria: se passar da metade da altura, fecha com a velocidade do dedo; senão, volta. O foco vai para o primeiro botão ao abrir; Esc e toque no véu fecham.

### Aviso com Desfazer
Superfície invertida (`inverso`, texto `no-inverso`, raio 14, sombra elevada), até 380px, perto da base, com a frase do que aconteceu e o botão Desfazer em `acao-inverso`. Sobe 20px e aparece em 0,22s; fica 5s. Em erro, fundo `erro`.

### Diálogo de confirmação
Para ação destrutiva sem desfazer. Cartão elevado de raio 18, centralizado sobre o véu, com título em pergunta, explicação e dois botões lado a lado: Manter (secundário, recebe o foco) e o verbo em vermelho cheio. Aparece de 97% para 100% em 0,22s.

### Ícones
Coleção Lucide: quadro de 24, traço de 1,75, pontas e cantos arredondados, sem preenchimento, na cor do texto ao lado. Tamanhos: 24 na barra de baixo, 22 no menu lateral, 20 em botões, avisos e botões redondos, 16 em opções e ajuda de campo, 14 nas pílulas (traço 2,25). Ícone sozinho só quando o significado é óbvio (voltar, fechar, mês anterior e próximo, com nome para leitor de tela).

### Movimento (regras gerais)
- Toque em botão, opção ou pessoa: encolhe para 97% em 100ms, na hora do toque.
- Troca de cor de fundo e de borda: 160ms.
- Seletor, aviso com Desfazer, diálogo, barra de seleção e troca de tela (desliza 12px): 0,22s, saída rápida no começo.
- Folha: mola de 0,34s. Fatias da régua: 0,34s.
- Números e listas não animam: valor é informação e aparece pronto.
- Menos movimento (pedido no celular): nada se desloca nem encolhe, nada de mola, a régua não desliza; só troca de opacidade em 150ms.

### Ainda a refinar no estilo Cofre
Estas peças existem no app, mas ainda não foram redesenhadas no novo estilo; vão ser refeitas tela a tela e não servem de modelo:
- Cartões de plástico dos bancos na tela Cartões.
- Estados vazios.
- Tela de abertura (splash) e ícone do app.
- Formas do esqueleto de carregamento.

## Do's and Don'ts

### Do:
- **Do** usar `acao` só no botão principal, no Lançar e no que está escolhido; um botão principal por tela.
- **Do** colocar o total do mês num único cofre por tela, com a régua e a legenda logo abaixo.
- **Do** mostrar cada pessoa com círculo colorido + inicial + nome, com a inicial em tinta escura para Pedro e Lucimar e em branco para Bruna e Eliete.
- **Do** incluir Bruna em todo resumo, com selo e valor como as outras pessoas.
- **Do** escrever dinheiro como "R$ 1.234,56", com algarismos de largura igual e o "R$" e os centavos menores e suaves nos valores grandes.
- **Do** acompanhar todo status de palavra e ícone, e todo erro de uma frase que diz como seguir.
- **Do** manter todo alvo de toque com 44 ou mais e as ações na metade de baixo da tela.
- **Do** usar no máximo uma faixa de aviso por tela e levar as notas do total para dentro do cofre.
- **Do** oferecer Desfazer ou confirmação em toda ação destrutiva.
- **Do** desligar deslocamento e mola quando o celular pede menos movimento, e a transparência quando pede menos transparência.

### Don't:
- **Don't** usar vermelho de alerta para dinheiro, gráfico que não responde a uma pergunta, cara de "dashboard de IA" ou gamificação; a régua é o único gráfico.
- **Don't** usar as cores do cofre fora do painel do total, nem azul como enfeite ou fundo de seção.
- **Don't** usar cor de pessoa fora do selo e da régua, nem dar cor de pessoa ao "sem dono".
- **Don't** pintar dívida, "falta pagar" ou "sem dono" de vermelho; isso é âmbar.
- **Don't** usar preto puro no tema escuro.
- **Don't** usar outra fonte além da Geist, nem pesos acima de 700.
- **Don't** animar números, totais ou a entrada de listas.
- **Don't** usar sombra dura ou sem desfoque, nem sombra elevada em cartão em repouso.
- **Don't** usar ícone sozinho quando o significado não for óbvio.
