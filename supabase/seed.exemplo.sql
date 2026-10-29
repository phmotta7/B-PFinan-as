-- Primeiro acesso: cria a casa, as pessoas, os cartões, as categorias e a lista de e-mails.
-- Rode UMA vez no SQL Editor do Supabase, trocando os valores entre <...>.
-- Telefones e chave Pix podem ficar vazios e ser preenchidos depois no app (Mais → Pessoas).
with c as (insert into public.casa (nome) values ('Casa de Pedro e Bruna') returning id),
p as (
  insert into public.pessoa (casa, nome, tipo, cor)
  select c.id, v.nome, v.tipo, v.cor from c, (values
    ('Pedro', 'usuario', '#56b4e9'), ('Bruna', 'usuario', '#bd4a87'),
    ('Eliete', 'participante', '#054836'), ('Lucimar', 'participante', '#e69f00')) as v(nome, tipo, cor)
  returning id, nome, casa
),
u as (
  insert into public.usuario_autorizado (casa, email, pessoa)
  select p.casa, v.email, p.id from p join (values ('Pedro', '<email do Pedro>'), ('Bruna', '<email da Bruna>')) as v(nome, email) on v.nome = p.nome
  returning 1
),
k as (
  insert into public.cartao (casa, apelido, banco, titular, dia_fechamento, dia_vencimento, cor)
  select p.casa, v.apelido, v.banco, p.id, v.fecha, v.vence, v.cor from p
  join (values ('Nubank da Bruna', 'nubank', 3, 10, '#820ad1'), ('BB da Bruna', 'bb', 7, 17, '#fde100')) as v(apelido, banco, fecha, vence, cor) on p.nome = 'Bruna'
  returning 1
)
insert into public.categoria (casa, nome, tipo, ordem)
select c.id, v.nome, v.tipo, v.ordem from c, (values
  ('Moradia','despesa',1),('Contas da casa','despesa',2),('Mercado','despesa',3),('Alimentação fora','despesa',4),('Transporte','despesa',5),
  ('Saúde','despesa',6),('Compras pessoais','despesa',7),('Lazer','despesa',8),('Assinaturas','despesa',9),('Educação','despesa',10),
  ('Presentes e doações','despesa',11),('Dívidas e encargos','despesa',12),('Outros','despesa',13),
  ('Salário','receita',14),('Renda extra','receita',15),('Outras receitas','receita',16)) as v(nome, tipo, ordem);
-- Os dias de fechamento e vencimento dos cartões acima são os do cenário de teste; confira e ajuste no app.
