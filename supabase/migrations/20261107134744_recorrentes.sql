-- B&P Finanças · Entrega 2C: contas fixas e receitas que se repetem todo mês (PLANEJAMENTO §6.6; aprovado pelo Pedro em 07/11/2026).
-- O "previsto" do mês não é guardado: o app calcula a partir do recorrente e marca como pago quando um lançamento é ligado a ele.
-- Privacidade igual à dos extratos (D15): o dono vê e mexe; o que é Casal o outro só vê.

create table public.recorrente (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  pessoa uuid not null references public.pessoa(id), -- de quem é (quem paga ou recebe)
  descricao text not null,
  tipo text not null check (tipo in ('despesa', 'receita')),
  valor bigint not null check (valor > 0), -- valor previsto, em centavos
  dia int not null check (dia between 1 and 31),
  escopo text check (escopo in ('pessoal', 'casal')),
  categoria uuid references public.categoria(id),
  inicio text not null check (inicio ~ '^\d{4}-\d{2}$'), -- primeiro mês
  fim text check (fim ~ '^\d{4}-\d{2}$'), -- último mês (vazio = sem fim)
  ativo boolean not null default true,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

-- Lançamento que pagou (ou recebeu) a conta fixa daquele mês
alter table public.lancamento add column if not exists recorrente uuid references public.recorrente(id) on delete set null;

create trigger carimbar before insert or update on public.recorrente for each row execute function public.carimbar();
alter table public.recorrente enable row level security;
create policy "dono ou casal ve" on public.recorrente for select to authenticated using (casa = public.minha_casa() and (pessoa = public.minha_pessoa() or escopo = 'casal'));
create policy "dono cria" on public.recorrente for insert to authenticated with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono altera" on public.recorrente for update to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa()) with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono apaga" on public.recorrente for delete to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa());
