# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, PWA instalável, mobile-first) + Supabase (Postgres, Auth Google, Storage, RLS) + Vercel, todos no plano gratuito. pt-BR, BRL, fuso America/Sao_Paulo, dinheiro em centavos inteiros. Definido pelo Pedro.

## Users

Pedro e Bruna (casal), os únicos com login. Usam quase sempre pelo celular, com uma mão e com pressa: lançar uma compra na fila do mercado, conferir a fatura no sofá, mandar o resumo no WhatsApp. A Bruna é titular dos cartões e faz o fechamento; o Pedro lança muito e confere a própria parte. Nenhum dos dois é da área financeira.

Eliete (mãe do Pedro) e Lucimar (mãe da Bruna) nunca abrem o app; para elas, o produto é a mensagem de WhatsApp do fechamento.

## Product Purpose

Acabar com a soma manual item por item a cada vencimento: importar a fatura, marcar de quem é cada linha e mandar a cada pessoa quanto ela deve à Bruna, com detalhe de compras e parcelas. Depois, dar ao casal visão de gastos, dívidas e sobra do mês, e ajudar a estabilizar (orçamento, quitação, reserva). Sucesso: fechamento do mês numa sentada curta, totais que batem com a soma manual, lançar uma compra em menos de 10 segundos, ninguém com medo de abrir o app.

## Positioning

Um caderno de contas de uma família específica, não um app de banco: conhece quatro pessoas pelo nome, entende que as mães usam os cartões da Bruna e transforma a fatura do banco em resumos individuais conferíveis no WhatsApp.

## Operating Context

Fatura Nubank (CSV) e BB (CSV genérico com mapeamento) importadas por arquivo; envio por link wa.me ou cópia do texto. Regras de negócio completas em PLANEJAMENTO.md (fonte da verdade), incluindo decisões D1–D7 de 28/10/2026.

## Capabilities and Constraints

Ver PLANEJAMENTO.md §4–§16. Sem Open Finance, sem atribuição automática por loja, sem login para participantes, sem recomendação de investimento.

## Brand Commitments

Nome: B&P Finanças. Personalidade aprovada (briefing de 28/10/2026, design/briefing.html): sereno, exato, da casa, transparente. Calma, controle e confiança; nunca culpa nem bronca. Escrita curta, com nome e número no lugar de adjetivos. Usar: fatura, fechamento, parcela, sem dono, falta pagar, a receber, sobra do mês, Casal, Pessoal, lançar, conferir. Evitar: transação, débito/crédito, devedor, inadimplente, alerta, urgente, dashboard, insights. Emojis só dentro da mensagem do WhatsApp. Evitar visual de "dashboard de IA", padrão azul-banco com vermelho de alerta, gráficos sem pergunta, gamificação.

## Evidence on Hand

Nenhum arquivo real de fatura ou extrato ainda; usar dados fictícios do cenário §18 do planejamento. Dados reais (chave Pix, telefones, empréstimos) serão cadastrados pelo Pedro no app.

## Product Principles

1. Todo número se explica com um toque.
2. Feito para o polegar: poucos toques, ações na metade de baixo.
3. Nada em silêncio: pré-visualização antes de gravar, confirmação ou desfazer em ações destrutivas.
4. A fatura do banco é a palavra final.
5. Cor é informação rara; nunca informação só por cor.

## Accessibility & Inclusion

Contraste AA, foco visível, rótulos para leitor de tela, alvos de toque ≥ 44px, cores de pessoa distinguíveis com daltonismo, movimento desligado com reduced-motion.
