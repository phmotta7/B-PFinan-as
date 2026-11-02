---
description: Transforma uma fatura real nova (CSV ou PDF) em caso de teste com dados fictícios e ajusta o leitor
argument-hint: caminho do arquivo da fatura
---
O Pedro trouxe uma fatura real nova: $ARGUMENTS. Faça o leitor do app aprender o formato dela sem guardar dados reais no projeto.

1. Leia o arquivo só neste computador. Não copie o arquivo real para dentro do projeto nem cole valores reais em testes.
2. Gere a versão fictícia:
   - CSV: `node scripts/anonimizar-csv.mjs "<arquivo>" "Nome Real=Fulano de Tal" --valores`. Troque todo nome de pessoa que aparecer (Pix, transferência). O formato (vírgula decimal, aspas, "- " no crédito) precisa continuar igual.
   - PDF: `node scripts/itens-pdf.mjs "<arquivo>" [senha]` devolve os pedaços de texto no formato `...L(página, y, [[x, 'texto']])` usado em `src/dominio/leitor-bb.test.ts`. Troque nomes, número do cartão e valores antes de usar.
3. Rode o leitor atual (`lerNubank`, `lerCsvGenerico` ou `lerBbPdf` em `src/dominio/leitores.ts`) na versão fictícia e compare com o que o banco mostra: total das compras, pagamentos, saldo anterior e "a pagar" (RN-IM-04). Peça ao Pedro o valor que o app do banco mostra, se ele ainda não disse.
4. Escreva o teste primeiro (em `leitores.test.ts` ou `leitor-bb.test.ts`), com as linhas fictícias e os totais esperados; veja ele falhar e então ajuste o leitor.
5. Registre a regra nova do leitor no PLANEJAMENTO.md (§4.4) com a data, e rode `npm run conferir`.
