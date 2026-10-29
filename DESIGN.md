---
name: B&P Finanças
description: O caderno de contas da família, onde cada pessoa vê a própria parte da fatura com nome, inicial e valor.
colors:
  acao: "#2d47d6"
  acao-forte: "#2338b0"
  acao-texto: "#2d47d6"
  acao-leve: "#e9ecfd"
  foco: "#2d47d6"
  no-acao: "#ffffff"
  chao: "#f1efeb"
  cartao: "#ffffff"
  elevado: "#ffffff"
  vidro: "rgba(255,255,255,.82)"
  linha: "#e4e0d8"
  linha-forte: "#cfcac0"
  veu: "rgba(28,27,25,.32)"
  tinta: "#1c1b19"
  suave: "#5b574f"
  apagado: "#6e6962"
  ok: "#1f7a4d"
  ok-leve: "#e3f3ea"
  atencao: "#8a5a00"
  atencao-leve: "#fdf1d8"
  erro: "#b3261e"
  erro-leve: "#fde8e6"
  no-erro: "#ffffff"
  inverso: "#1c1b19"
  no-inverso: "#f4f2ee"
  acao-inverso: "#aebaff"
  pedro: "#56b4e9"
  pedro-tinta: "#1c1b19"
  bruna: "#bd4a87"
  bruna-tinta: "#ffffff"
  eliete: "#054836"
  eliete-tinta: "#ffffff"
  lucimar: "#e69f00"
  lucimar-tinta: "#1c1b19"
  sem-dono: "#6e6962"
  nubank: "#820ad1"
  bb: "#fcf000"
  bb-tinta: "#2a3a8f"
  marca-bojo: "#bcc7ff"
typography:
  t-mes:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  t-valor:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "tnum, lnum"
  t-titulo:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  t-forte:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  t-corpo:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.45
  t-apoio:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  t-rotulo:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
  t-mini:
    fontFamily: "Figtree, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  r-pequeno: "8px"
  r-campo: "14px"
  r-bloco: "16px"
  r-cartao: "22px"
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
    padding: "0 12px"
    height: "48px"
  button-destrutivo:
    backgroundColor: "{colors.erro-leve}"
    textColor: "{colors.erro}"
    rounded: "{rounded.r-pilula}"
    padding: "0 20px"
    height: "48px"
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
    height: "64px"
  campo-desligado:
    backgroundColor: "{colors.chao}"
    textColor: "{colors.apagado}"
  segmentado:
    backgroundColor: "{colors.linha}"
    textColor: "{colors.suave}"
    rounded: "{rounded.r-pilula}"
    padding: "3px"
    height: "48px"
  segmentado-escolhido:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
  cartao-fatura:
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
    padding: "12px 14px"
  barra-inferior:
    backgroundColor: "{colors.vidro}"
    textColor: "{colors.suave}"
    height: "84px"
  barra-lancar:
    backgroundColor: "{colors.acao}"
    textColor: "{colors.no-acao}"
    rounded: "{rounded.r-pilula}"
    size: "52px"
  folha:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-folha}"
    padding: "8px 16px 20px"
  folha-pessoa:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.tinta}"
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
    width: "340px"
  aviso-desfazer:
    backgroundColor: "#1c1b19"
    textColor: "#f4f2ee"
    padding: "8px 8px 8px 16px"
    width: "380px"
---

# Design System: B&P Finanças

## Overview

**Creative North Star: "Sala de estar"**

A fatura é tratada como a sala da família, não como a tela de um banco. O fundo é um papel quente, cada assunto mora num cartão branco de cantos bem redondos que quase encosta no chão, e cada pessoa (Pedro, Bruna, Eliete, Lucimar) aparece pelo nome, com a inicial num círculo da sua cor e o seu valor ao lado. A sensação procurada é a da marca: serena, exata, da casa, transparente. Nada de bronca, nada de alerta piscando.

A tela é feita para o celular e para o polegar: uma coluna só, margem de 16 dos lados, ações na metade de baixo, o botão Lançar fixo no meio da barra inferior. A densidade é média: linhas de 64 de altura, valores grandes onde importam (o total da fatura, o campo de valor) e texto de apoio discreto no resto. Há uma única cor de interface, o azul da marca, e ela só aparece no que se pode tocar ou no que está escolhido. As outras cores são informação: verde, âmbar e vermelho com significado fixo, e as quatro cores de pessoa.

O que este sistema recusa, por decisão confirmada no briefing: o painel azul-banco com gráfico e alerta vermelho, a cara de "dashboard de IA", gráficos sem pergunta, gamificação.

**Key Characteristics:**
- Chão de papel quente, cartões brancos com raio de 22 e sombra curta e macia.
- Um azul só, reservado para toque e seleção.
- Pessoas sempre com cor + inicial + nome; "sem dono" é um círculo tracejado com "?".
- Uma fonte só (Figtree), números de largura igual, dinheiro com o "R$" menor e mais claro.
- Escuro de verdade, mas sem preto puro: "noite em casa".
- Movimento curto e interrompível; números nunca animam.

## Colors

Um papel quente com cartões brancos, um azul de ação e uma família de cores de significado e de pessoa que sempre vêm acompanhadas de palavra.

### Primary
- **Azul B&P** (`acao`): o mesmo azul do quadrado do logo. Fundo do botão principal, do botão Lançar, do círculo da linha marcada, do controle deslizante de seleção. Pressionado escurece para `acao-forte`.
- **Azul de texto** (`acao-texto`): links, botão discreto, item ativo da barra de baixo, borda da pessoa escolhida na folha. No escuro vira um azul claro para manter o contraste.
- **Azul de seleção** (`acao-leve`): fundo de linha marcada, de pessoa escolhida e da pílula "Aberta".
- **Foco** (`foco`): o anel de 2,5px que aparece quando se navega pelo teclado.

### Secondary
- **Cores de pessoa** (`pedro`, `bruna`, `eliete`, `lucimar`): escolhidas e testadas simulando protanopia, deuteranopia e tritanopia; a menor distância entre duas delas fica perto de ΔE 26 nos três casos. O par que mais resiste ao daltonismo é claro contra escuro: Pedro (azul-céu) e Lucimar (âmbar) são claras e levam a inicial em tinta escura (`pedro-tinta`, `lucimar-tinta`); Bruna (magenta) e Eliete (verde-garrafa) são escuras e levam a inicial em branco (`bruna-tinta`, `eliete-tinta`). Essas cores só existem dentro do selo da pessoa.
- **Sem dono** (`sem-dono`): não é uma pessoa e não ganha cor de pessoa. No selo, aparece como círculo tracejado na cor `atencao`, com "?" e a palavra.

### Tertiary
- **Significado**: `ok` / `ok-leve` para pago e conferido; `atencao` / `atencao-leve` para sem dono, falta pagar e parcial; `erro` / `erro-leve` para arquivo inválido e falha. Sempre texto escuro sobre fundo leve, sempre com palavra e ícone.
- **Bancos** (`nubank`, `bb` com `bb-tinta`): só no círculo do banco e na cor do cartão na tela de Cartões.
- **Bojo da marca** (`marca-bojo`): o azul-lavanda do bojo de baixo do logo "Um B que são dois" (quadrado `acao`, bojo de cima e haste em branco). Uso exclusivo do logo; não é cor de interface.

### Neutral
- **Chão** (`chao`): fundo do app, papel quente.
- **Cartão** (`cartao`) e **Elevado** (`elevado`): cartões e linhas; folhas e diálogos. No claro os dois são brancos; no escuro o elevado é um degrau mais claro.
- **Vidro** (`vidro`): barra de baixo e topo, translúcidos com desfoque.
- **Linha** (`linha`) e **Linha forte** (`linha-forte`): divisórias finas; bordas de campo e alça da folha.
- **Véu** (`veu`): escurece o fundo atrás de folha e diálogo.
- **Tinta** (`tinta`), **Suave** (`suave`), **Apagado** (`apagado`): texto principal; texto de apoio (7,2:1 no cartão); texto de apoio menor, placeholders e texto desativado (4,8:1 no chão). Nenhum texto fica abaixo de 4,5:1.

### Escuro: "noite em casa"
O tema escuro segue o celular, e pode ser forçado claro ou escuro. Valores que mudam:

| Token | Escuro |
|---|---|
| chao / cartao / elevado | #141519 / #1e2025 / #26282e |
| vidro | rgba(30,32,37,.82) |
| linha / linha-forte | #2e3036 / #43464e |
| veu | rgba(0,0,0,.5) |
| tinta / suave / apagado | #eceae6 / #aaa59c / #9a958d |
| acao / acao-forte / acao-texto / acao-leve / foco | #3d57e6 / #2f48cc / #8c9cff / #252b4d / #8c9cff |
| ok / ok-leve | #6fd3a6 / #173328 |
| atencao / atencao-leve | #f2c46b / #3a2e15 |
| erro / erro-leve | #ff8f87 / #3d1c1a |
| sem-dono | #9a958d |

No escuro, o círculo de cada pessoa ganha um anel fino branco translúcido (`--anel-pessoa`) para não sumir no fundo; Eliete, a cor mais escura, depende dele.

Quem pede **mais contraste** no celular recebe divisórias na força de borda de campo e texto suave igual à tinta.

### Named Rules
**The Cor Única Rule.** O azul é a única cor de interface. Só aparece no que se toca ou no que está escolhido; nunca como enfeite, faixa ou fundo de seção.

**The Nome Junto Rule.** Cor de pessoa nunca aparece sozinha: sempre com a inicial dentro do círculo e o nome ao lado. Status nunca aparece só por cor: sempre com palavra e ícone.

**The Vermelho no Lugar Rule.** Vermelho é só para falha (arquivo não lido, erro de campo, excluir). Dívida, "falta pagar" e "sem dono" são âmbar, nunca vermelho.

## Typography

**Display Font:** Figtree (com Segoe UI, system-ui)
**Body Font:** Figtree (com Segoe UI, system-ui)

**Character:** Uma fonte só, redonda e calma, em pesos de 500 a 800. O peso faz a hierarquia; o tamanho cresce pouco.

### Hierarchy
- **Mês** (`t-mes`, 800, 32px, 1.1, aperto -0,02em): título da tela, como "Novembro".
- **Valor** (`t-valor`, 800, 34px, 1.05, aperto -0,02em): total da fatura e o campo de valor da tela Lançar.
- **Título** (`t-titulo`, 700, 20px, 1.25): título de folha, diálogo e bloco ("Quem paga quanto", "De quem é?").
- **Forte** (`t-forte`, 700, 17px, 1.3): nome do banco no cartão, título do estado vazio, valor de cada pessoa no resumo (em 16px).
- **Corpo** (`t-corpo`, 500, 16px, 1.45): texto corrido e conteúdo de campo. Campo nunca abaixo de 16px, para o celular não dar zoom.
- **Apoio** (`t-apoio`, 500, 14px, 1.4): vencimento, contagens ("47 linhas, 12 sem dono"), explicação de diálogo, data da linha (em 13px).
- **Rótulo** (`t-rotulo`, 700, 13px, 1.3): rótulo de campo, cabeçalho do dia na lista ("Sexta, 3 de outubro"), título pequeno de cartão. Escrito como frase, em cor `suave`.
- **Mini** (`t-mini`, 600, 12px, 1.3): pílulas de status, nome no selo de pessoa (em 13px), número da parcela.

Linhas da fatura usam 600/16px na descrição e 700/16px no valor; nomes na barra de baixo usam 600/11px.

### Named Rules
**The Valor Manda Rule.** Dinheiro é sempre escrito "R$ 1.234,56". Nos valores grandes, o "R$" vem menor (700, 20px), na cor `suave` e sem aperto, com 4px de espaço; o número manda.

**The Coluna Reta Rule.** Todo número usa algarismos de largura igual (tabular-nums, lining-nums), para que os valores fiquem alinhados um embaixo do outro. O aperto de letra negativo só vale em 28px ou mais.

## Layout

Uma coluna, pensada a partir de 375px de largura. Margem lateral de 16 (`margem`). Os espaços crescem de 4 em 4 (`e1` a `e10`): 4 entre ícone e texto, 8 dentro de um grupo, 12 entre linhas de um cartão, 16 de margem e respiro interno do cartão, 24 entre blocos, 32 entre seções.

Nada que se toca tem menos de 44 de altura (`alvo`); botões e linhas de resumo têm 48, linhas da fatura e botões de pessoa 64. As ações ficam na metade de baixo da tela: a barra inferior com cinco lugares e Lançar no centro, e a folha que sobe de baixo.

Larguras que limitam camadas por cima em telas maiores: folha até 480px, centralizada; diálogo até 340px; aviso com Desfazer até 380px. Tudo respeita a área segura de baixo do iPhone (`env(safe-area-inset-bottom)`).

## Elevation & Depth

Sistema em camadas com sombras macias e quentes (tingidas de marrom no claro, pretas no escuro). O cartão quase encosta no chão; só o que fica por cima do conteúdo ganha sombra mais funda. Toda sombra tem deslocamento e desfoque; não há sombra dura nem contorno grosso.

### Shadow Vocabulary
- **Cartão** (`--s-cartao`): sombra de 1–2px com um contorno quase invisível. Cartões, listas, a peça escolhida do seletor.
- **Elevado** (`--s-elevado`): sombra larga e difusa. Diálogo e aviso com Desfazer.
- **Folha** (`--s-folha`): sombra projetada para cima. Folha que sobe de baixo.
- **Ação** (`--s-acao`): sombra azulada sob o botão principal e o Lançar da barra. No escuro vira sombra preta.

### Materiais
A barra de baixo (e o topo) é de vidro: `vidro` com desfoque de 20px e saturação de 170%, e o conteúdo passa por trás. Quem pede menos transparência no celular recebe a barra sólida na cor do cartão.

### Named Rules
**The Encosta no Chão Rule.** Em repouso, cartões usam só a sombra de cartão. Sombra funda é para o que está por cima de outra coisa (folha, diálogo, aviso), nunca para destacar um cartão comum.

## Shapes

Cantos bem arredondados e uma família pequena de raios: 8 para peças pequenas, 14 para campos, 16 para blocos (faixa de aviso, aviso com Desfazer, botões de pessoa), 22 para cartões, listas e diálogos, 28 para o topo da folha que sobe (embaixo ela é reta, encostada na borda da tela) e pílula completa para botões, seletor, pílulas de status e o Lançar. Círculos para selos de pessoa (22px no texto, 32px na folha), logos de loja e banco (36px) e o Lançar (52px).

Bordas são desenhadas por dentro (sombra interna de 1 a 2px), para não mudar o tamanho da peça: 1,5px `linha-forte` em campo e botão secundário, 2px `foco` ou `erro` no campo em foco ou com erro. As divisórias da lista começam depois do logo (64px da borda), deixando o círculo livre.

## Components

### Buttons
Firmes e calmos; respondem no instante do toque.
- **Shape:** pílula (`r-pilula`), 48 de altura, 700/16px, ícone de 20px a 8 do texto.
- **Principal:** azul com texto branco e sombra de ação. Um por tela, no máximo (Lançar, Salvar, Mandar no WhatsApp).
- **Pressionado:** encolhe para 97% em 100ms e escurece para `acao-forte`.
- **Foco:** anel `foco` de 2,5px, 2px afastado.
- **Desativado:** fundo `linha`, texto `apagado`, sem sombra, sem encolher.
- **Carregando:** um círculo girando no lugar do ícone e o verbo no gerúndio ("Salvando"); o botão para de aceitar toques.
- **Secundário:** cartão com borda interna `linha-forte` e texto `tinta` (Copiar texto).
- **Discreto:** só texto `acao-texto`, padding 12 (Ver todas).
- **Destrutivo:** fundo `erro-leve` com texto `erro`. Sempre pede confirmação ou oferece desfazer.

### Chips
- **Pílulas de status:** fundo leve + texto da cor do significado, ícone de 14px com traço 2,25 e palavra. Variantes: ok (Pago), atenção (Falta pagar, Parcial), erro (Arquivo não lido), ação (Aberta), neutra (Fechada, sobre o chão com contorno fino).
- **Selo de pessoa:** círculo com a inicial (800/11px) e o nome ao lado (600/13px). Versão grande na folha: círculo de 32 e nome em 700/15px.
- **Parcela:** "3/10" em mini, sobre o chão, cantos de 6px, ao lado do selo na linha da fatura.

### Cards / Containers
- **Corner Style:** 22px (`r-cartao`).
- **Background:** `cartao` sobre `chao`.
- **Shadow Strategy:** sombra de cartão (ver Elevation & Depth).
- **Border:** nenhuma; separação interna por divisórias de 1px `linha`.
- **Internal Padding:** 16, com 12 entre blocos internos.

### Inputs / Fields
- **Style:** 52 de altura, fundo cartão, borda interna `linha-forte` de 1,5px, raio 14, texto 16px. Rótulo em cima (`t-rotulo`, `suave`) e ajuda embaixo (13px, `suave`).
- **Campo de valor:** 64 de altura, número em `t-valor` com "R$" menor e suave; abre teclado numérico; a ajuda mostra a divisão em parcelas ("Em 3 vezes: 100,00 + 100,00 + 100,00").
- **Focus:** a borda vira 2px `foco`.
- **Error:** borda 2px `erro` e, logo abaixo, ícone de atenção + frase que diz o que houve e como resolver ("Parcelas vai de 1 a 48. Para à vista, use 1."), enquanto a pessoa digita.
- **Disabled:** fundo `chao`, borda `linha`, texto `apagado`, com ajuda explicando o porquê.

### Segmentado (Pessoal / Casal)
Dois lados numa pílula `linha` com 3px de folga; o lado escolhido é uma peça de cartão com sombra de cartão que desliza em 0,22s com mola. Texto 700/15px, `suave` no lado livre e `tinta` no escolhido. Só aparece quando a pessoa é Pedro ou Bruna.

### Cartão da fatura
O resumo de quem paga quanto. No topo, o círculo do banco (36px, cor do banco), o nome do cartão ("Nubank da Bruna") com o vencimento embaixo, e a pílula de situação à direita. Depois o total em `t-valor`. Depois uma linha por pessoa, 48 de altura, com divisória: selo à esquerda, valor à direita em 700/16px. Ordem fixa: Pedro, Bruna, Eliete, Lucimar, sem dono.

**The Bruna Presente Rule.** Bruna aparece em todo resumo, mesmo sendo a titular que recebe dos outros, do mesmo jeito que as outras pessoas: selo (inicial + nome) e valor, sem nota extra.

### Linhas da fatura
Lista num cartão, agrupada por dia com cabeçalho em `t-rotulo`. Cada linha tem 64 de altura: logo da loja num círculo de 36 à esquerda, descrição (600/16px, cortada com reticências) com data e selo da pessoa embaixo, valor à direita (700/16px).
- **Logo:** o logo real da loja, guardado no próprio app; quando a loja não é conhecida, a inicial em 800/14px `suave` sobre o chão com contorno fino.
- **Sem dono:** o selo tracejado âmbar no lugar da pessoa.
- **Parcela:** a etiqueta "1/3" no lugar da data.
- **IOF:** linha filha logo abaixo da compra, sem círculo de logo, descrição em peso 500 e cor `suave`.
- **Toque:** fundo `chao` enquanto o dedo está em cima; toque abre a folha de escolher pessoa.
- **Várias de uma vez:** toque longo (0,45s) marca a linha; marcada, ganha fundo `acao-leve` e o círculo do logo fica azul. Com alguma marcada, toques simples marcam e desmarcam.

### Aviso
Faixa com cantos de 16, ícone de 20 e texto 600/14px. Âmbar para pendência ("12 linhas desta fatura ainda sem dono, o total de cada pessoa pode mudar."); vermelho para erro, com a saída escrita como link sublinhado ("Escolher outro arquivo").

### Vazio, carregando e erro
Toda tela tem os três.
- **Vazio:** cartão com ícone de 32 em `suave`, título em `t-forte`, explicação do que vai aparecer ali e o botão principal do primeiro passo.
- **Carregando:** o formato do que vem (círculo + barras de cor `linha`), pulsando devagar entre opacidade 1 e 0,45 em 1,6s.
- **Erro:** aviso vermelho que diz o que houve e como seguir, sem culpa.

### Navigation
Barra de baixo de 84 de altura, de vidro, com uma linha fina em cima. Cinco lugares, sempre com ícone e nome (600/11px): Início, Cartões, Lançar, Fechamentos, Ajustes. Lugar atual em `acao-texto`, os outros em `suave`. Lançar fica no centro, num círculo azul de 52 com sombra de ação, subindo 18px acima da barra.

### Folha de escolher pessoa (interação-assinatura)
Sobe de baixo sobre um véu, com topo de raio 28, alça de 40×5 em `linha-forte`, título "De quem é?" e a linha em questão embaixo ("Centauro · 1/3 · R$ 33,34"). Quatro botões de pessoa em duas colunas, 64 de altura, cantos de 16 (`r-bloco`), contorno `linha`; o escolhido ganha contorno 2px `acao-texto` e fundo `acao-leve`. Ao escolher, a folha fecha e aparece o aviso com Desfazer. O foco vai para a primeira pessoa ao abrir e volta para a linha ao fechar; Esc e toque no véu fecham.

Movimento: mola sem quique (criticamente amortecida, resposta de 0,34s), interrompível a qualquer momento. Segue o dedo 1:1 ao arrastar para baixo; para cima, resiste como elástico. Ao soltar, projeta para onde o gesto levaria: se passar da metade da altura, fecha com a velocidade do dedo; senão, volta.

### Aviso com Desfazer
Superfície invertida (`inverso`, texto `no-inverso`, cantos `r-bloco`, sombra elevada): escura no tema claro e clara no tema escuro, centralizada perto da base, com a frase do que aconteceu ("Centauro marcada como Lucimar") e o botão Desfazer em `acao-inverso` com ícone. Sobe 20px e aparece em 0,22s; fica 5s.

### Diálogo de confirmação
Para ação destrutiva sem desfazer. Cartão elevado de raio 22, até 340px, centralizado sobre o véu. Título em pergunta com o objeto ("Excluir a importação de 3/11?"), explicação do que se perde e do que dá para refazer, e dois botões lado a lado: Manter (secundário) e Excluir (vermelho cheio `erro` com texto `no-erro`, que é branco no claro e escuro no tema escuro). Aparece de 97% para 100% em 0,22s. O foco vai para Manter.

### Ícones
Desenho da coleção Lucide: quadro de 24, traço de 1,75, pontas e cantos arredondados, sem preenchimento, na cor do texto ao lado. Tamanhos: 24 na barra e soltos, 20 em botões e avisos, 18 no aviso com Desfazer, 16 na ajuda de campo, 14 nas pílulas (traço 2,25). Ícone sozinho só quando o significado é óbvio (voltar, fechar).

### Movimento (regras gerais)
- Toque em botão ou pessoa: encolhe para 97% em 100ms, na hora do toque.
- Troca de cor de fundo e de borda: 160ms.
- Seletor, aviso com Desfazer e diálogo: 0,22s, saída rápida no começo.
- Folha: mola de 0,34s, como descrito acima.
- Números e listas não animam: valor é informação e aparece pronto. Atalhos de teclado nunca animam.
- Menos movimento (pedido no celular): nada se desloca nem encolhe, nada de mola; só troca de opacidade em 150ms.

## Do's and Don'ts

### Do:
- **Do** usar `acao` só em botão, Lançar, seleção e foco; um botão principal por tela.
- **Do** mostrar cada pessoa com círculo colorido + inicial + nome, com a inicial em tinta escura para Pedro e Lucimar e em branco para Bruna e Eliete.
- **Do** incluir Bruna em todo resumo, com selo e valor como as outras pessoas.
- **Do** escrever dinheiro como "R$ 1.234,56", com algarismos de largura igual e o "R$" menor e suave nos valores grandes.
- **Do** acompanhar todo status de palavra e ícone, e todo erro de uma frase que diz como seguir.
- **Do** manter todo alvo de toque com 44 ou mais e as ações na metade de baixo da tela.
- **Do** usar o logo real da loja no círculo de 36, guardado no app, com a inicial quando a loja não for conhecida.
- **Do** oferecer Desfazer ou confirmação em toda ação destrutiva.
- **Do** desligar deslocamento e mola quando o celular pede menos movimento, e a transparência quando pede menos transparência.

### Don't:
- **Don't** montar o painel azul-banco com gráfico e alerta vermelho, nem a cara de "dashboard de IA", gráficos sem pergunta ou gamificação.
- **Don't** usar cor de pessoa fora do selo da pessoa, nem dar cor de pessoa ao "sem dono".
- **Don't** pintar dívida, "falta pagar" ou "sem dono" de vermelho; isso é âmbar.
- **Don't** usar preto puro no tema escuro.
- **Don't** animar números, totais ou a entrada de listas.
- **Don't** usar sombra dura ou sem desfoque, nem sombra funda em cartão em repouso.
- **Don't** usar ícone sozinho quando o significado não for óbvio.
