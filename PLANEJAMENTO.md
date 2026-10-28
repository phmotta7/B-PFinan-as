# B&P Finanças — Planejamento do Sistema

> Versão 1.0 · 28/10/2026 · Documento de planejamento (sem código).
> Fonte: sessão de entrevista de requisitos entre Pedro e Claude (rodadas Q1–Q45).

---

## Sumário

1. [Visão geral e objetivos](#1-visão-geral-e-objetivos)
2. [Glossário](#2-glossário)
3. [Pessoas, acesso e permissões](#3-pessoas-acesso-e-permissões)
4. [Módulo Cartões](#4-módulo-cartões)
5. [Módulo Fechamento e WhatsApp](#5-módulo-fechamento-e-whatsapp)
6. [Módulo Carteiras (Pedro, Bruna, Casal)](#6-módulo-carteiras-pedro-bruna-casal)
7. [Módulo Importação de extratos (OFX)](#7-módulo-importação-de-extratos-ofx)
8. [Módulo Dívidas](#8-módulo-dívidas)
9. [Módulo Orçamento](#9-módulo-orçamento)
10. [Módulo Metas](#10-módulo-metas)
11. [Categorias](#11-categorias)
12. [Telas e navegação](#12-telas-e-navegação)
13. [Modelo de dados](#13-modelo-de-dados)
14. [Arquitetura técnica](#14-arquitetura-técnica)
15. [Segurança e privacidade](#15-segurança-e-privacidade)
16. [Roteiro de entrega (etapas)](#16-roteiro-de-entrega-etapas)
17. [Estratégia de testes](#17-estratégia-de-testes)
18. [Cenário completo de um mês](#18-cenário-completo-de-um-mês)
19. [Pontos a validar e riscos](#19-pontos-a-validar-e-riscos)

---

## 1. Visão geral e objetivos

### 1.1 Problema
- Pedro, Eliete (mãe do Pedro) e Lucimar (mãe da Bruna) usam os cartões de crédito da Bruna (Nubank e Banco do Brasil).
- No vencimento, ninguém sabe o valor exato da própria parte; a soma é feita item por item, manualmente.
- O casal perdeu o controle dos gastos, tem dívidas (empréstimos, parcelas de cartão, crédito Shopee) e nenhuma reserva.

### 1.2 Objetivos, em ordem de prioridade
1. **Fechamento do cartão sem esforço**: saber, a cada fatura, quanto cada pessoa deve à Bruna, com detalhamento de compras e parcelas, enviado por WhatsApp.
2. **Visão financeira do casal e de cada um**: receitas, despesas, recorrentes, dívidas e "quanto sobra no mês".
3. **Estabilização**: orçamento por categoria, plano de quitação de dívidas e reserva de emergência.
4. **Fase 2**: acompanhamento de investimentos.

### 1.3 Fora do escopo (por decisão)
- Divisão de contas entre Pedro e Bruna (não há "rachar"; a única dívida entre eles é a fatura do cartão).
- Atribuição automática de dono por estabelecimento (gera conflitos, ex.: Drogasil usada por várias pessoas).
- Controle de saldo de contas bancárias.
- Open Finance / conexão direta com bancos.
- Recomendação de produtos de investimento.
- Login para Eliete e Lucimar.
- Histórico anterior a novembro/2026.

---

## 2. Glossário

| Termo | Significado |
|---|---|
| **Casa** | O espaço de dados compartilhado de Pedro e Bruna. Tudo pertence a uma casa. |
| **Pessoa** | Qualquer um que aparece no sistema: Pedro, Bruna, Eliete, Lucimar. |
| **Usuário** | Pessoa com login (Pedro e Bruna). |
| **Participante** | Pessoa sem login que usa um cartão (Eliete e Lucimar). |
| **Titular** | Dono do cartão ou da dívida no banco (hoje, sempre a Bruna). |
| **Pagador** | Quem efetivamente arca com o valor de um lançamento (Pedro, Bruna, Eliete ou Lucimar). |
| **Escopo** | Para quê foi o gasto: **Pessoal** ou **Casal**. Só se aplica a Pedro e Bruna. |
| **Carteira** | Visão derivada de pagador + escopo: carteira Pedro, carteira Bruna, carteira Casal. |
| **Ciclo / Fatura** | Período entre dois fechamentos de um cartão. A fatura é identificada pelo **mês de vencimento** (ex.: "Fatura Nov/26" vence em novembro). |
| **Competência** | Mês ao qual um gasto pertence para fins de análise. Compra de cartão → mês de vencimento da fatura. Outros lançamentos → mês da data. |
| **Compra** | Uma aquisição no cartão (à vista ou parcelada). |
| **Parcela** | Cada pedaço de uma compra, ligada a uma fatura. Compra à vista = 1 parcela. |
| **Encargo** | Linha da fatura que não é compra: IOF, anuidade, juros, multa, estorno, ajuste. |
| **Fechamento** | Cobrança mensal de uma pessoa para a Bruna: soma das suas parcelas nas faturas que vencem no mês + parcelas de dívidas que ela paga via Bruna. |
| **Liquidação** | Pagamento (total ou parcial) de um fechamento. |
| **A receber** | Saldo que Eliete/Lucimar (ou Pedro) ainda devem à Bruna. |
| **Transferência** | Pix entre Pedro e Bruna que não é pagamento de fatura (ex.: ajuda). Não é gasto nem receita de trabalho. |
| **Recorrente** | Modelo de lançamento que se repete todo mês (salário, aluguel, luz…), gerado como "previsto". |
| **Previsto / Realizado** | Status de um lançamento gerado por recorrente ou dívida: ainda não aconteceu / confirmado. |
| **Conciliação** | Ato de casar um lançamento manual com uma linha importada (fatura ou extrato). |
| **Dívida** | Empréstimo ou parcelamento externo ao cartão (ex.: crédito Shopee). |
| **Meta** | Objetivo de guardar dinheiro (ex.: reserva de emergência). |

---

## 3. Pessoas, acesso e permissões

### 3.1 Cadastro inicial
| Pessoa | Tipo | Login | Observações |
|---|---|---|---|
| Pedro | Usuário | Google | Paga a Bruna via Pix. Contas: Santander, Inter, Nubank. Sem cartão de crédito. |
| Bruna | Usuário | Google | Titular dos cartões Nubank e BB e dos empréstimos. Recebe todos os Pix. Contas: Nubank, BB. Chave Pix cadastrada aqui. |
| Eliete | Participante | — | Mãe do Pedro. Telefone WhatsApp cadastrado. |
| Lucimar | Participante | — | Mãe da Bruna. Telefone WhatsApp cadastrado. |

### 3.2 Regras
- **RN-AC-01**: só e-mails da lista de autorizados da casa conseguem entrar. Qualquer outro login é rejeitado.
- **RN-AC-02**: Pedro e Bruna têm permissão total sobre todos os dados da casa, inclusive a carteira pessoal do outro.
- **RN-AC-03**: todo registro guarda quem criou e quem alterou por último (auditoria simples: "editado por Bruna em 05/11").
- **RN-AC-04**: participantes não têm acesso ao app; recebem apenas a mensagem de fechamento.
- **RN-AC-05**: o modelo já suporta um cartão com titular diferente de Bruna (ex.: futuro cartão do Pedro); nesse caso os pagadores devem ao titular desse cartão.

---

## 4. Módulo Cartões

### 4.1 Cadastro de cartão
Campos: apelido ("Nubank Bruna"), banco (Nubank / BB / outro), titular, dia de fechamento, dia de vencimento, ativo/inativo, cor (para diferenciar na interface).

### 4.2 Ciclo e atribuição de fatura
- **RN-CA-01**: cada fatura tem data de fechamento e data de vencimento, calculadas a partir dos dias do cartão. Se o dia não existir no mês (ex.: 31 em fevereiro), usa o último dia do mês.
- **RN-CA-02**: uma compra feita **antes** da data de fechamento entra na fatura que fecha naquela data; compra feita **no dia do fechamento ou depois** entra na fatura seguinte. *(A validar com faturas reais; ver §19.)*
- **RN-CA-03**: o usuário pode mover manualmente um lançamento para outra fatura (para corrigir casos em que o banco atribuiu diferente).
- **RN-CA-04**: fatura tem status: **Aberta** (ciclo em andamento) → **Fechada** (data de fechamento passou) → **Importada** (fatura do banco conciliada) → **Encerrada** (todos os fechamentos ligados a ela quitados). O status é informativo; não bloqueia edição.
- **RN-CA-05**: a fatura aberta mostra a **parcial** com base nos lançamentos manuais e parcelas previstas.

### 4.3 Lançamento manual de compra
Campos: cartão, data, descrição, valor total, nº de parcelas (padrão 1), pagador, escopo (se pagador for Pedro/Bruna), categoria, observação.

- **RN-CA-10**: compra parcelada gera **todas** as parcelas de uma vez, cada uma ligada à sua fatura (parcela k vai para a fatura da parcela 1 + k−1 meses).
- **RN-CA-11**: valor da parcela = valor total ÷ n, arredondado para baixo no centavo; a diferença vai para a **1ª parcela** (ex.: R$ 100 em 3x → 33,34 + 33,33 + 33,33). Alternativa no formulário: informar o valor da parcela em vez do total.
- **RN-CA-12**: parcelas geradas manualmente nascem com status **Prevista**; viram **Confirmada** ao serem conciliadas com a fatura importada.
- **RN-CA-13**: editar pagador, escopo ou categoria de uma compra parcelada pergunta: "aplicar a todas as parcelas futuras?" (padrão: sim).
- **RN-CA-14**: excluir uma compra parcelada exclui todas as parcelas ainda não confirmadas e pede confirmação.

### 4.4 Importação de fatura
Fluxo geral (igual para qualquer formato):

1. Usuário escolhe o cartão e envia o arquivo.
2. O sistema lê o arquivo com o leitor do formato (Nubank CSV ou CSV genérico).
3. **Tela de pré-visualização**: lista todas as linhas lidas, com tipo detectado (compra, parcela X/Y, IOF, estorno, pagamento, anuidade…), fatura de destino e total. Linhas problemáticas destacadas. Nada é gravado ainda.
4. Usuário confirma → sistema grava as linhas e executa a **conciliação** (§4.5).
5. Sistema leva à **tela de marcação** com o filtro "sem dono" ativo.

#### 4.4.1 Leitor Nubank (CSV)
- Formato esperado: colunas `date`, `title`, `amount` (podendo ter `category` em versões antigas). Valores positivos = débitos; negativos = créditos.
- Linhas "Pagamento recebido" são **ignoradas** (é o pagamento da fatura, não compra).
- Parcelas detectadas por padrão na descrição: `Parcela X/Y` (e variações a mapear com arquivos reais).
- IOF identificado pela descrição ("IOF de …") e ligado à compra internacional correspondente, quando possível.
- Valores negativos que não são pagamento → **estorno/crédito**.

#### 4.4.2 Importação genérica (CSV/planilha) — caminho do BB até haver arquivo real
- Na primeira vez, o usuário mapeia colunas: data, descrição, valor, (opcional) parcela, formato de data e de decimal, se débito é positivo ou negativo, linhas de cabeçalho a pular.
- O mapeamento é salvo por cartão e reutilizado nas próximas importações.
- Detecção de parcela por padrões comuns na descrição (`X/Y`, `PARC X/Y`, `PARCELA X DE Y`).
- Quando um arquivo real do BB estiver disponível, cria-se um leitor dedicado (ver §19).

#### 4.4.3 Idempotência
- **RN-IM-01**: cada linha importada recebe uma impressão digital (cartão + data + descrição + valor + parcela + ordem de ocorrência no arquivo). Reimportar o mesmo arquivo não duplica linhas; a pré-visualização mostra "já importada".
- **RN-IM-02**: o arquivo original é guardado (para auditoria e reprocessamento).

### 4.5 Conciliação (manual × importado)
Ordem de tentativa para cada linha importada:

1. **Parcela de série conhecida**: linha com X/Y casa com a parcela X de uma compra já existente (criada manualmente ou por importação anterior) do mesmo cartão, com valor dentro de ±R$ 0,05 e descrição compatível. → a parcela vira **Confirmada**, herdando tudo. Não é duplicidade, é baixa.
2. **Lançamento manual idêntico** (à vista ou 1ª parcela): mesmo cartão, mesmo valor, data com até ±3 dias, ainda não conciliado. → **aviso de duplicidade**:
   > "Encontrei 1 duplicidade: *Uber R$ 23,00 (manual, 14/10)* ↔ *UBER \*TRIP R$ 23,00 (fatura, 15/10)*. Manter a da fatura e copiar pagador 'Pedro', escopo 'Pessoal', categoria 'Transporte'?" → [Confirmar] [Não é a mesma]
   - Confirmar: o lançamento manual é excluído e seus dados (pagador, escopo, categoria, observação, nº de parcelas) vão para a linha importada.
   - Várias confirmações podem ser feitas de uma vez ("Confirmar todas as óbvias").
3. **Ambíguo** (mais de um candidato): usuário escolhe qual.
4. **Sem par**: linha entra como **sem dono**.

- **RN-CO-01**: a fatura importada é sempre o veredito para cartões: valores e datas da fatura prevalecem.
- **RN-CO-02**: se a linha importada é a parcela 1/Y (ou X/Y de série desconhecida), o sistema **gera as parcelas futuras restantes** como Previstas, herdando o pagador quando for definido.
- **RN-CO-03**: parcelas manuais Previstas que **não** apareceram na fatura importada correspondente são sinalizadas ("esperada e não encontrada") para o usuário decidir: mover para a próxima fatura, ou excluir.

### 4.6 Marcação
- Cada linha tem: **pagador** (Pedro / Bruna / Eliete / Lucimar), **escopo** (Pessoal / Casal, só para Pedro e Bruna) e **categoria**.
- **Seleção em massa**: checkbox nas linhas + barra de ação "Atribuir a… / Escopo… / Categoria…".
- Filtros: sem dono, por pessoa, por categoria, parceladas, encargos.
- Sem regra automática por estabelecimento (decisão Q12).
- Contador no topo: "12 de 47 linhas sem dono".

### 4.7 Encargos
| Tipo | Quem paga (padrão) | Observação |
|---|---|---|
| IOF | Pagador da compra original | Ligado à compra internacional. |
| Estorno / crédito | Pagador da compra original | Valor negativo; abate do fechamento dessa pessoa. Se não achar a compra original, pede para escolher. |
| Anuidade | Titular (Bruna) | Editável manualmente. |
| Juros / multa / mora | Titular (Bruna) | Editável manualmente. |
| Ajuste / outros | Sem dono | Usuário decide. |

---

## 5. Módulo Fechamento e WhatsApp

### 5.1 Definição
- **Fechamento** = cobrança mensal de **uma pessoa** (devedor) para o **titular** (Bruna), referente a um **mês de vencimento**.
- Composição do fechamento de uma pessoa no mês M:
  - todas as parcelas/encargos com **pagador = essa pessoa** nas faturas dos cartões da Bruna que **vencem em M**;
  - todas as parcelas de **dívidas** em nome da Bruna cujo **responsável é essa pessoa** e que vencem em M (empréstimo do Pedro, Shopee — ver §8);
  - estornos com pagador = essa pessoa (abatem).
- A Bruna não tem fechamento consigo mesma: seus próprios itens são simplesmente gastos dela.
- **RN-FE-01**: compras "Casal" pagas pelo Pedro entram no fechamento do Pedro (Q38). Compras "Casal" pagas pela Bruna não geram cobrança.

### 5.2 Liquidação
- **RN-FE-10**: registrar pagamento: valor, data, observação. Pode ser **parcial**; o fechamento fica com saldo em aberto.
- **RN-FE-11**: status do fechamento: **Pendente** → **Parcial** → **Pago**.
- **RN-FE-12**: quando o Pedro importa seu extrato (§7) ou lança um Pix para a Bruna classificado como "Pagamento de fatura", o pagamento é ligado ao fechamento em aberto mais antigo dele automaticamente.
- **RN-FE-13**: para Eliete e Lucimar o pagamento é registrado manualmente pela Bruna (ou pela importação do extrato da Bruna, ao reconhecer um Pix recebido de uma delas — confirmação manual).
- **RN-FE-14**: saldo em aberto **não passa** para o mês seguinte. Ele fica no fechamento original (status Parcial) e aparece em "A receber" até ser quitado. Novos pagamentos dessa pessoa podem ser ligados a esse fechamento antigo.

### 5.3 Mensagem de WhatsApp
Gerada por pessoa, para o mês. Botão "Enviar no WhatsApp" abre `wa.me/<telefone>?text=<mensagem>`; botão "Copiar" como alternativa.

**Modelo padronizado** (ordem fixa em todas as linhas: loja – parcela – valor – faltam – restante – data):

```
Resumo Fatura Nov/26 – Lucimar

💳 Nubank (vence 10/11)
• Farmácia São João – R$ 45,90 (02/10)
• Magazine Luiza – 3/10 – R$ 80,00 – faltam 7x – restante R$ 560,00 (15/08)
Subtotal Nubank: R$ 125,90

💳 BB (vence 17/11)
• Renner – 1/4 – R$ 62,50 – faltam 3x – restante R$ 187,50 (20/10)
• Padaria Pão Quente – R$ 18,00 (12/10)
Subtotal BB: R$ 80,50

TOTAL: R$ 206,40
Pix: <chave da Bruna>
```

Regras de formatação:
- **RN-WA-01**: à vista: `• <loja> – R$ <valor> (<data>)`.
- **RN-WA-02**: parcelada: `• <loja> – <X>/<Y> – R$ <parcela> – faltam <Y−X>x – restante R$ <saldo> (<data da compra>)`. Na última parcela: `– última parcela` no lugar de "faltam/restante".
- **RN-WA-03**: estorno: `• Estorno <loja> – -R$ <valor> (<data>)`.
- **RN-WA-04**: ordem dentro do cartão: por data da compra.
- **RN-WA-05**: compras Pessoal e Casal do Pedro listadas juntas (sem separação na mensagem).
- **RN-WA-06**: dívidas pagas via Bruna aparecem em bloco próprio, no mesmo padrão:
  ```
  📄 Outros
  • Empréstimo <credor> – 5/24 – R$ 350,00 – faltam 19x – restante R$ 6.650,00
  • Shopee – 2/6 – R$ 74,90 – faltam 4x – restante R$ 299,60
  Subtotal Outros: R$ 424,90
  ```
- **RN-WA-07**: se já houver pagamento parcial neste fechamento, linhas extras antes do TOTAL: `Já pago: -R$ X` e `Falta pagar: R$ Y`. Saldos de meses anteriores não entram na mensagem (RN-FE-14).
- **RN-WA-08**: moeda no formato brasileiro (`R$ 1.234,56`), datas `dd/mm`.
- **RN-WA-09**: o resumo do Pedro também é gerado (para conferência e cópia), mesmo ele tendo acesso ao app.
- **RN-WA-10**: o sistema registra a data em que a mensagem foi enviada ("enviado em 03/11"), para saber quem já foi avisado.

### 5.4 Tela de fechamento
Uma linha por pessoa no mês: total, pago, em aberto, status, botão WhatsApp, botão "Registrar pagamento". Detalhe expande a mesma lista da mensagem.

---

## 6. Módulo Carteiras (Pedro, Bruna, Casal)

### 6.1 Conceito
A carteira não é um cadastro: é uma **visão** calculada a partir de pagador + escopo.

| Lançamento | Aparece em |
|---|---|
| pagador Pedro, escopo Pessoal | Carteira Pedro (gastos pessoais) |
| pagador Pedro, escopo Casal | Carteira Casal + Carteira Pedro ("contribuições para o casal") |
| pagador Bruna, escopo Pessoal | Carteira Bruna |
| pagador Bruna, escopo Casal | Carteira Casal + Carteira Bruna ("contribuições para o casal") |
| pagador Eliete / Lucimar | Nenhuma carteira; só "A receber" da Bruna |

### 6.2 Tipos de lançamento
| Tipo | Exemplo | Conta como gasto? | Conta como receita? | Fluxo de caixa |
|---|---|---|---|---|
| **Despesa** | Aluguel, luz, mercado no débito | Sim | — | Saída |
| **Receita** | Salário, renda extra | — | Sim | Entrada |
| **Compra no cartão** (via módulo Cartões) | Uber no Nubank | Sim (no mês de vencimento da fatura) | — | — (o caixa sai no pagamento) |
| **Pagamento de fatura** (Pix Pedro → Bruna) | Fechamento Nov | Não | — | Saída do Pedro / Entrada da Bruna |
| **Recebimento de participante** | Pix Lucimar → Bruna | Não | Não | Entrada da Bruna |
| **Pagamento do cartão ao banco** | Bruna paga a fatura Nubank | Não | — | Saída da Bruna |
| **Transferência** (Pix Pedro ↔ Bruna sem ser fatura) | Bruna dá R$ 100 para o Pedro | Não | Não (aparece separado como "Transferências recebidas") | Saída de um / Entrada do outro; na visão Casal se anula |
| **Parcela de dívida** | Empréstimo | Sim (categoria "Dívidas") | — | Saída de quem paga ao banco |
| **Aporte em meta** | Guardar na reserva | Não | — | Saída para a meta |

### 6.3 As duas visões de cada carteira pessoal
- **Gastos (competência)**: tudo que é gasto real, por categoria. Compras de cartão entram no mês de vencimento da fatura. É a base de orçamento e análise.
- **Fluxo de caixa**: o que entrou e saiu das contas, na data real (salário, Pix de fatura, pagamento do cartão, transferências, despesas no débito).

**Por que não há dupla contagem** (exemplo do Pedro): Uber R$ 23 + Mercado R$ 77 no cartão da Bruna e Pix de R$ 100.
- Gastos: R$ 100 (Transporte 23, Mercado 77).
- Fluxo de caixa: saída R$ 100 ("Pagamento fatura – Bruna").
- Sobra do mês = receitas − gastos = mesmo número nas duas visões.

**Do lado da Bruna**: ela paga a fatura inteira ao banco (ex.: R$ 3.000, saída de caixa) e recebe R$ 800 do Pedro e R$ 300 das mães (entradas de caixa). Seus gastos reais são só as linhas em que ela é pagadora (R$ 1.900). Caixa: −3.000 + 800 + 300 = −1.900. Consistente.

### 6.4 Lançamento manual (fora do cartão)
Campos: tipo, data, descrição, valor, pagador (de quem é o dinheiro), escopo, categoria, conta de origem (opcional, só informativa), observação, status (previsto/realizado).

### 6.5 Pix entre Pedro e Bruna
- **RN-CT-01**: ao lançar ou importar um Pix entre os dois, o sistema pede o tipo: **Pagamento de fatura** ou **Transferência**.
- **RN-CT-02**: sugestão automática: se o valor for igual ao saldo em aberto do fechamento do Pedro (ou menor que ele e o Pix for do Pedro para a Bruna perto do vencimento), pré-seleciona "Pagamento de fatura"; senão, "Transferência".
- **RN-CT-03**: um Pix importado nos dois extratos (saída no do Pedro e entrada no da Bruna) é **o mesmo evento**; a segunda importação concilia com a primeira (mesmo valor, mesma data ±1 dia, direções opostas).

### 6.6 Recorrentes
Campos: descrição, tipo (receita/despesa), valor estimado, dia do mês, pagador, escopo, categoria, início, fim (opcional), ativo.

- **RN-RE-01**: ao abrir um mês, o sistema garante que existam os lançamentos **Previstos** dos recorrentes desse mês (geração sob demanda, sem rotina agendada). Também gera os 2 meses seguintes, para a projeção.
- **RN-RE-02**: "Marcar como pago/recebido" transforma em Realizado, permitindo ajustar o valor real (ex.: conta de luz variou).
- **RN-RE-03**: importação de extrato que casa com um Previsto (valor ±10%, data ±5 dias, mesmo pagador) sugere a conciliação.
- **RN-RE-04**: editar um recorrente afeta só meses futuros ainda previstos.

### 6.7 Projeção do mês (por carteira pessoal)
```
Receitas previstas + realizadas
− Despesas recorrentes (previstas + realizadas)
− Gastos no cartão (fatura do mês: confirmadas + previstas)
− Parcelas de dívidas do mês
− Outras despesas realizadas
= Sobra do mês
```
A carteira Casal mostra "custo da casa no mês" e quanto cada um contribuiu, sem "sobra" (não há receita própria do casal).

### 6.8 A receber (visão da Bruna)
Lista de fechamentos em aberto de Pedro, Eliete e Lucimar, com valor e dias em atraso após o vencimento.

---

## 7. Módulo Importação de extratos (OFX)

### 7.1 Contas cadastradas (apenas como origem de importação)
| Pessoa | Bancos |
|---|---|
| Pedro | Santander, Inter, Nubank |
| Bruna | Nubank, Banco do Brasil |

Sem controle de saldo (Q19). A conta serve para: identificar origem, guardar mapeamento e evitar reimportação.

### 7.2 Leitor OFX único
- **RN-OF-01**: um leitor OFX genérico para os 4 bancos. CSV genérico (§4.4.2) como plano B.
- **RN-OF-02**: idempotência por identificador da transação do OFX (FITID) + conta; reimportar não duplica.
- **RN-OF-03**: mesma pré-visualização e mesma regra de duplicidade dos cartões: lançamento manual idêntico → aviso → o extrato é o veredito, copiando categoria, escopo e observação do manual.

### 7.3 Classificação automática de linhas do extrato
| Padrão detectado | Classificação sugerida |
|---|---|
| Pagamento de fatura de cartão (ex.: "PAGAMENTO FATURA", "NU PAGAMENTO") | Pagamento do cartão ao banco (não é gasto) |
| Pix para/de Bruna (no extrato do Pedro) ou para/de Pedro (no da Bruna) | Pedir tipo: Pagamento de fatura / Transferência (RN-CT-01) |
| Pix recebido de Eliete/Lucimar (extrato da Bruna) | Recebimento de participante → baixa no fechamento |
| Débito de parcela de empréstimo | Sugerir conciliação com a parcela da dívida |
| Casa com recorrente previsto | Sugerir conciliação (RN-RE-03) |
| Demais saídas | Despesa, categoria a escolher |
| Demais entradas | Receita, categoria a escolher |

- **RN-OF-04**: os padrões de reconhecimento (nomes, chaves, textos) ficam em uma lista editável nas configurações, para ajuste sem mudar o sistema.
- **RN-OF-05**: nada é classificado em silêncio: a pré-visualização mostra a sugestão e o usuário confirma (em massa, se quiser).

---

## 8. Módulo Dívidas

### 8.1 Cadastro
Campos: nome/credor, tipo (empréstimo / parcelamento externo / outro), titular (Bruna), **responsável pelo pagamento** (Pedro / Bruna), escopo (Pessoal / Casal), valor da parcela, parcela atual, total de parcelas, dia de vencimento, taxa de juros mensal (opcional), saldo devedor informado (opcional), forma de pagamento (débito na conta da titular / boleto).

### 8.2 Dívidas conhecidas
| Dívida | Titular | Responsável | Como paga |
|---|---|---|---|
| Empréstimo A | Bruna | Pedro | Pix para a Bruna → entra no fechamento do Pedro |
| Empréstimo B | Bruna | Bruna | Direto |
| Empréstimo C (se existir) | Bruna | a definir | a definir |
| Crédito Shopee | Bruna | definido no cadastro | Funciona como empréstimo; se o responsável for o Pedro, entra no fechamento dele (RN-DV-02) |

### 8.3 Regras
- **RN-DV-01**: o cadastro gera as parcelas restantes como lançamentos Previstos (tipo Parcela de dívida), no dia de vencimento.
- **RN-DV-02**: se responsável ≠ titular, as parcelas entram no **fechamento** do responsável (bloco "Outros" da mensagem — RN-WA-06) e, para a Bruna, aparecem como "A receber"; o gasto é do responsável.
- **RN-DV-03**: parcela marcada como paga (ou conciliada via extrato) reduz parcelas restantes e saldo.
- **RN-DV-04**: quitação antecipada: marcar dívida como quitada com valor final; parcelas previstas restantes são removidas.

### 8.4 Visões da aba Dívidas
1. **Lista de dívidas**: parcela, restantes, saldo, responsável, data prevista de término.
2. **Comprometido em cartões** (somente leitura, calculado das parcelas futuras): por mês e por pagador. Ex.: "Dez: R$ 980 (Pedro R$ 420 · Bruna R$ 360 · Lucimar R$ 200)".
3. **"Quando ficamos livres"**: linha do tempo com o mês de término de cada dívida e de cada compra parcelada, e o total mensal comprometido caindo ao longo do tempo.
4. **Ordem de quitação sugerida**: ordenada pela taxa de juros (maior primeiro) quando informada; dívidas sem taxa ficam no fim com aviso "informe a taxa para priorizar". Apenas informativo.

---

## 9. Módulo Orçamento

- **RN-OR-01**: orçamento = limite mensal por **categoria** e por **carteira** (Casal, Pedro, Bruna).
- **RN-OR-02**: **período de observação**: nos 2 primeiros meses completos de uso, o módulo só mostra gastos por categoria, sem limites.
- **RN-OR-03**: após a observação, o sistema **sugere** limites = média dos meses observados, arredondada para cima para múltiplo de R$ 10. O usuário aceita, edita ou ignora cada sugestão.
- **RN-OR-04**: alertas visuais em **80%** (amarelo) e **100%** (vermelho) do limite, na tela inicial e na tela de orçamento.
- **RN-OR-05**: o gasto considerado é o de **competência** (compras de cartão contam no mês de vencimento da fatura; previstas do cartão contam como "comprometido" em cor diferente).
- **RN-OR-06**: limites valem a partir do mês em que foram definidos até serem alterados (sem precisar recadastrar todo mês).

---

## 10. Módulo Metas

- Campos: nome, carteira (Casal / Pedro / Bruna), valor-alvo, aporte mensal planejado, onde está guardado (texto livre, ex.: "caixinha Nubank"), data-alvo (opcional).
- **Reserva de emergência**: alvo sugerido = **X × custo fixo mensal**, onde X é definido pelo casal e o custo fixo = soma das despesas recorrentes + parcelas de dívidas do mês (exibido com a composição para o usuário ajustar).
- **RN-MT-01**: aporte e resgate são registrados como movimentos da meta; aporte não é gasto (sai no fluxo de caixa, não nos gastos).
- **RN-MT-02**: progresso: guardado / alvo, % e previsão de chegada no ritmo atual.
- **RN-MT-03**: o app **não recomenda** produtos de investimento.
- Fase 2: rentabilidade e carteira de investimentos.

---

## 11. Categorias

Lista fixa inicial (editável nas configurações, mas sem excluir categorias com lançamentos):

**Despesas**
1. Moradia (aluguel, condomínio, manutenção)
2. Contas da casa (luz, água, gás, internet, celular)
3. Mercado
4. Alimentação fora (restaurante, delivery, lanche)
5. Transporte (Uber, combustível, ônibus, estacionamento)
6. Saúde (farmácia, consultas, plano)
7. Compras pessoais (roupas, beleza, eletrônicos)
8. Lazer (passeios, viagens, eventos)
9. Assinaturas (streaming, apps)
10. Educação
11. Presentes e doações
12. Dívidas e encargos (parcelas de empréstimo, juros, multas, anuidade, IOF)
13. Outros

**Receitas**
1. Salário
2. Renda extra
3. Outras receitas

Tipos especiais que **não são categorias** (não entram em gastos/receitas): Pagamento de fatura, Pagamento do cartão ao banco, Recebimento de participante, Transferência, Aporte/resgate de meta.

---

## 12. Telas e navegação

Aplicativo web instalável no celular (PWA), pensado primeiro para tela de celular.

### 12.1 Navegação inferior
`Início` · `Cartões` · `➕ Lançar` · `Carteiras` · `Mais`

### 12.2 Telas
| # | Tela | Conteúdo principal | Etapa |
|---|---|---|---|
| T1 | **Login** | Entrar com Google; mensagem de acesso negado para e-mails não autorizados. | 1 |
| T2 | **Início (dashboard)** | Blocos Casal / Pedro / Bruna com sobra do mês; pendências: faturas a fechar, linhas sem dono, fechamentos em aberto, a receber de Eliete e Lucimar; alertas de orçamento. Na etapa 1, só o bloco de cartões e pendências. | 1 (parcial) / 2 |
| T3 | **Cartões** | Lista de cartões com fatura atual (parcial), próxima data de fechamento e vencimento. | 1 |
| T4 | **Fatura** | Linhas da fatura selecionada, filtros, seleção em massa, totais por pagador, botão Importar. Navegação entre meses. | 1 |
| T5 | **Importar fatura** | Escolha do cartão e arquivo → pré-visualização → confirmação. Mapeamento de colunas na primeira vez (CSV genérico). | 1 |
| T6 | **Conciliação** | Lista de duplicidades e parcelas casadas, com Confirmar / Não é a mesma; "Confirmar todas as óbvias"; parcelas esperadas não encontradas. | 1 |
| T7 | **Lançar** | Formulário rápido: tipo (compra no cartão / despesa / receita / transferência), valor em destaque, parcelas, pagador, escopo, categoria. Lembra o último cartão e pagador usados. | 1 (cartão) / 2 (resto) |
| T8 | **Fechamentos** | Mês selecionado; uma linha por pessoa com total, pago, em aberto, status; WhatsApp, Copiar, Registrar pagamento. | 1 |
| T9 | **Carteira (Pedro / Bruna / Casal)** | Abas Gastos e Fluxo de caixa; projeção do mês; lista de lançamentos com filtro por categoria. | 2 |
| T10 | **Recorrentes** | Lista e cadastro. | 2 |
| T11 | **Importar extrato** | Escolha da conta, arquivo OFX/CSV, pré-visualização com classificação sugerida, confirmação em massa. | 2 |
| T12 | **Dívidas** | Lista, comprometido em cartões, "quando ficamos livres", ordem de quitação. | 1 (cadastro, p/ fechamento) / 3 (visões) |
| T13 | **Orçamento** | Gastos por categoria × limite, por carteira; sugestões após observação. | 3 |
| T14 | **Metas** | Lista de metas, progresso, aportes. | 3 |
| T15 | **Configurações** | Pessoas (telefones, chave Pix), cartões, contas, categorias, padrões de reconhecimento de extrato, e-mails autorizados, exportar dados (backup). | 1 |

### 12.3 Princípios de interface
- Valor monetário sempre com destaque e em formato brasileiro.
- Cada pessoa tem uma cor fixa (Pedro, Bruna, Eliete, Lucimar) usada em etiquetas e gráficos.
- Ações destrutivas (excluir, confirmar duplicidade) sempre com confirmação e opção de desfazer por alguns segundos.
- Tela de marcação otimizada para o polegar: tocar na linha abre seletor de pagador em um toque.
- Modo claro e escuro.

---

## 13. Modelo de dados

Descrição conceitual das entidades (o esquema físico será derivado disto na implementação). Todos os valores monetários em **centavos (inteiro)**. Toda tabela tem `casa`, `criado_em`, `criado_por`, `atualizado_em`, `atualizado_por`.

| Entidade | Campos principais | Relações |
|---|---|---|
| **Casa** | nome | — |
| **Usuário autorizado** | e-mail, pessoa | → Pessoa |
| **Pessoa** | nome, tipo (usuário/participante), cor, telefone WhatsApp, chave Pix (para quem recebe) | — |
| **Cartão** | apelido, banco, titular, dia fechamento, dia vencimento, cor, ativo, mapeamento CSV salvo | → Pessoa (titular) |
| **Fatura** | cartão, mês de referência (vencimento), data fechamento, data vencimento, status | → Cartão |
| **Compra** | cartão, data, descrição, descrição normalizada, valor total, nº parcelas, tipo (compra/IOF/anuidade/juros/multa/estorno/ajuste), compra de origem (para IOF/estorno), pagador, escopo, categoria, observação, origem (manual/importação) | → Cartão, Pessoa, Categoria |
| **Parcela de cartão** | compra, fatura, número, valor, status (prevista/confirmada), linha importada | → Compra, Fatura, Linha importada |
| **Importação** | tipo (fatura/extrato), formato (Nubank CSV/CSV genérico/OFX), cartão ou conta, arquivo original, status, totais | → Cartão / Conta |
| **Linha importada** | importação, dados brutos, impressão digital / FITID, situação (nova/conciliada/duplicada/ignorada) | → Importação |
| **Fechamento** | devedor, credor (titular), mês, status, data de envio da mensagem | → Pessoa ×2 |
| **Pagamento de fechamento** | fechamento, valor, data, lançamento de origem (Pix) | → Fechamento, Lançamento |
| **Conta** | pessoa, banco, apelido | → Pessoa |
| **Lançamento** | tipo (despesa/receita/pagamento de fatura/pagamento de cartão/recebimento de participante/transferência/parcela de dívida/aporte de meta), data, descrição, valor, pagador, escopo, categoria, conta, status (previsto/realizado), recorrente de origem, parcela de dívida de origem, linha importada, contraparte (para Pix entre pessoas) | → Pessoa, Categoria, Conta, Recorrente, Dívida |
| **Recorrente** | descrição, tipo, valor estimado, dia, pagador, escopo, categoria, início, fim, ativo | → Pessoa, Categoria |
| **Dívida** | nome/credor, tipo, titular, responsável, escopo, valor parcela, parcela atual, total parcelas, dia vencimento, juros (opcional), saldo informado, situação (ativa/quitada) | → Pessoa ×2 |
| **Parcela de dívida** | dívida, número, vencimento, valor, status, fechamento (se via titular) | → Dívida, Fechamento |
| **Categoria** | nome, tipo (despesa/receita), ícone, cor, ativa | — |
| **Orçamento** | carteira (Casal/Pedro/Bruna), categoria, limite, vigente desde | → Categoria |
| **Meta** | nome, carteira, valor-alvo, aporte planejado, onde está guardado, data-alvo, multiplicador (para reserva) | — |
| **Movimento de meta** | meta, tipo (aporte/resgate), valor, data | → Meta |
| **Padrão de reconhecimento** | texto/regex, banco, classificação sugerida, pessoa relacionada | — |

**Valores derivados (não armazenados, calculados)**: totais de fatura, fechamento por pessoa, saldo restante de compras parceladas, carteiras, projeção do mês, comprometido futuro, progresso de orçamento.

---

## 14. Arquitetura técnica

| Camada | Escolha | Motivo |
|---|---|---|
| Interface | **Next.js** (App Router), React, PWA instalável | Um código só para os dois celulares; deploy simples. |
| Banco e login | **Supabase**: Postgres + Auth (Google) + Storage (arquivos importados) | Gratuito, já conectado, segurança por linha (RLS). |
| Hospedagem | **Vercel** (plano gratuito) | Já conectado; deploy automático. |
| Idioma / moeda | pt-BR, BRL, fuso **America/Sao_Paulo** | Datas de fechamento dependem do fuso correto. |

Decisões técnicas:
- **Dinheiro em centavos inteiros** em todo o sistema; formatação só na exibição.
- **Leitores de arquivo (Nubank CSV, CSV genérico, OFX)** isolados e puros: recebem o conteúdo do arquivo e devolvem linhas normalizadas. Facilita testar com arquivos reais.
- **Regras de domínio** (ciclo de fatura, rateio de parcelas, conciliação, fechamento, mensagem) isoladas da interface e do banco, todas testáveis sem servidor.
- **Processamento de importação no servidor**, com o arquivo original guardado no Storage.
- **Sem rotinas agendadas**: recorrentes e parcelas geradas sob demanda ao abrir um mês.
- **Backup**: botão "Exportar tudo" (JSON + CSV) nas configurações; lembrete mensal na tela inicial.
- **Atenção ao plano gratuito do Supabase**: o projeto pausa após 7 dias sem acesso; reativação manual em um clique.

---

## 15. Segurança e privacidade

- Login exclusivamente via Google; lista de e-mails autorizados (Pedro e Bruna).
- **RLS** em todas as tabelas: cada registro só é visível/alterável por usuários membros da mesma casa.
- Arquivos de fatura/extrato no Storage em bucket privado, com a mesma regra de acesso.
- A mensagem do WhatsApp é montada no aparelho e aberta pelo link `wa.me`; nenhum dado é enviado a serviços de terceiros além do próprio WhatsApp, por ação do usuário.
- Nenhum dado pessoal em parâmetros de URL do app (exceto o texto da mensagem no link do WhatsApp, inevitável e iniciado pelo usuário).
- Chaves do Supabase de uso administrativo apenas no servidor (nunca no navegador).
- Sem armazenamento de senhas bancárias ou credenciais de banco (importação é sempre por arquivo).

---

## 16. Roteiro de entrega (etapas)

### Etapa 1 — Cartões e fechamento *(prioridade: fatura de novembro/26)*
Entregáveis:
- Login Google com lista de autorizados; cadastro de pessoas, cartões (Nubank e BB da Bruna) e categorias.
- Lançamento manual de compra no cartão, com parcelas.
- Importação Nubank CSV; importação CSV genérico com mapeamento (para o BB).
- Pré-visualização, conciliação (parcelas, duplicidades), geração de parcelas futuras a partir da fatura.
- Marcação individual e em massa (pagador, escopo, categoria); encargos.
- Cadastro de dívidas **somente** para o necessário ao fechamento (Empréstimo do Pedro, Shopee).
- Fechamentos por pessoa, mensagem de WhatsApp padronizada, registro de pagamento (inclusive parcial).
- Configurações e exportação de dados.

Critérios de aceite:
- Importar a fatura Nov/26 do Nubank, marcar todas as linhas e gerar as mensagens de Pedro, Eliete e Lucimar com totais que batem com a soma manual.
- Reimportar o mesmo arquivo não duplica nada.
- Uma compra parcelada lançada manualmente é baixada (não duplicada) ao importar a fatura.
- Pagamento parcial deixa saldo em aberto visível.

### Etapa 2 — Carteiras
- Carteiras Pedro, Bruna, Casal (gastos e fluxo de caixa).
- Despesas, receitas, transferências; Pix entre os dois com classificação.
- Recorrentes e projeção do mês.
- Contas e importação OFX com classificação sugerida e conciliação.
- Dashboard completo.

Critério de aceite: num mês de exemplo, a sobra do Pedro calculada por gastos é igual à calculada por fluxo de caixa (sem dupla contagem).

### Etapa 3 — Dívidas, orçamento e metas
- Aba Dívidas completa (comprometido em cartões, "quando ficamos livres", ordem de quitação).
- Orçamento por categoria com observação de 2 meses e sugestões.
- Meta de reserva de emergência.

### Etapa 4 — Fase 2: investimentos
- A planejar após 3+ meses de uso das etapas anteriores.

---

## 17. Estratégia de testes

Foco em testar as **regras de domínio**, onde estão os riscos de valor errado:

| Área | Casos de teste |
|---|---|
| Ciclo de fatura | compra antes/no dia/depois do fechamento; fechamento em dia 31 em mês curto; virada de ano. |
| Parcelas | rateio com centavos (100/3); parcela k na fatura correta; última parcela; edição em todas as futuras. |
| Leitor Nubank | arquivo real (quando disponível) como referência; pagamento ignorado; IOF; estorno; parcelas. |
| CSV genérico | formatos de data (dd/mm/aaaa, aaaa-mm-dd), decimal com vírgula/ponto, débito positivo/negativo. |
| OFX | arquivos reais de Santander, Inter, Nubank e BB; FITID repetido. |
| Conciliação | duplicidade exata; data ±3 dias; dois candidatos (ambíguo); parcela esperada e não encontrada; reimportação. |
| Fechamento | totais por pessoa; estorno abatendo; dívida no bloco "Outros"; pagamento parcial; saldo antigo não entra no mês seguinte. |
| Mensagem | texto gerado comparado com o modelo exato (§5.3), incluindo última parcela e estorno. |
| Carteiras | exemplo Uber+Mercado/Pix (sem dupla contagem); visão da Bruna fechando com o caixa. |
| Segurança | usuário não autorizado não lê nenhuma tabela. |

Os arquivos reais de fatura/extrato (com valores e nomes alterados) virarão **casos de teste permanentes**.

---

## 18. Cenário completo de um mês

1. **Durante outubro**: Pedro lança "Uber R$ 23" e "Tênis R$ 300 em 3x" no Nubank da Bruna pelo app. O cartão mostra a parcial da fatura aberta.
2. **Dia 3/11 (fechamento Nubank)**: Bruna baixa o CSV e importa. A pré-visualização mostra 47 linhas.
3. **Conciliação**: o app encontra o Uber duplicado (confirmado, dados copiados) e a parcela 1/3 do tênis (baixa; as parcelas 2/3 e 3/3 já estavam previstas). A "Magazine Luiza 3/10" da Lucimar é reconhecida como parcela de série já existente.
4. **Marcação**: restam 12 linhas sem dono; Bruna seleciona 5 de uma vez → Lucimar; 3 → Eliete; o resto → Bruna/Casal.
5. **BB**: mesmo processo, via CSV genérico.
6. **Fechamentos Nov/26**: Pedro R$ 812,40 (inclui bloco "Outros" com Empréstimo A e Shopee), Eliete R$ 154,00, Lucimar R$ 206,40. Bruna toca "WhatsApp" para Eliete e Lucimar.
7. **Pagamentos**: Pedro manda Pix de R$ 812,40. Ao importar seu extrato do Inter, o app reconhece o Pix para a Bruna, sugere "Pagamento de fatura", e o fechamento do Pedro fica Pago. Lucimar paga R$ 200 → Bruna registra pagamento parcial; o fechamento Nov/26 dela fica Parcial, com R$ 6,40 em "A receber" até ela quitar (não entra no fechamento de dezembro).
8. **Carteira do Pedro**: gastos de novembro por categoria (Transporte, Compras pessoais…), fluxo de caixa com salário entrando e o Pix saindo; sobra do mês calculada.
9. **Bruna paga a fatura ao banco**: no extrato dela, a linha é reconhecida como pagamento de cartão (não é gasto).

---

## 19. Pontos a validar e riscos

| # | Item | Impacto | Como resolver |
|---|---|---|---|
| V1 | **Formato real do CSV do Nubank** (colunas, como aparecem as parcelas, se a data das parcelas é a da compra original) | Leitor Nubank e conciliação de parcelas | Pedro/Bruna enviarem uma fatura de exemplo (valores podem ser alterados). |
| V2 | **Formato de exportação da fatura do BB** (PDF? CSV? TXT?) | Leitor dedicado do BB | Enviar exemplo; até lá, CSV genérico. Se o BB só exportar PDF, avaliar leitor de PDF na etapa 1 ou transcrição via planilha. |
| V3 | **Regra exata de corte no dia do fechamento** (RN-CA-02) em cada banco | Compras caindo na fatura errada | Validar com as primeiras faturas reais; ajuste manual disponível (RN-CA-03). |
| V4 | ~~Saldo pendente passa para o mês seguinte?~~ | — | **Resolvido (28/10/2026): não passa**; fica no fechamento original, conforme RN-FE-14. |
| V5 | ~~Crédito Shopee~~ | — | **Resolvido (28/10/2026)**: cadastrado como empréstimo; o responsável é escolhido no cadastro inicial. |
| V6 | **Quantidade e dados dos empréstimos** (2 ou 3) | Dívidas e fechamento | Cadastro na configuração inicial. |
| V7 | Chave Pix da Bruna e telefones de Eliete e Lucimar | Mensagem | Cadastro na configuração inicial. |
| V8 | Extratos OFX dos 4 bancos (Santander, Inter, Nubank, BB) | Etapa 2 | Enviar exemplos antes da etapa 2. |
| R1 | Pausa do Supabase gratuito após 7 dias sem uso | App indisponível até reativar | Uso semanal natural; reativação em um clique. |
| R2 | Mudança de layout de arquivo pelo banco | Importação quebra | Pré-visualização impede gravação errada; testes com arquivos reais; CSV genérico como fallback. |
| R3 | Esforço de marcação manual todo mês (sem regra automática) | Adoção | Seleção em massa, lançamento manual prévio e parcelas já atribuídas reduzem a marcação a poucas linhas. |
