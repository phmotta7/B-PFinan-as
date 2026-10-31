-- Divisão de compras entre pessoas (PLANEJAMENTO §4.6.1): lista de { pessoa, valor } da compra inteira; vazio = compra de uma pessoa só.
alter table public.compra add column if not exists divisao jsonb;
