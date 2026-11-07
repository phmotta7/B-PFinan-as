-- B&P Finanças · Etapa 3: orçamento, metas e dívidas completas (PLANEJAMENTO §8, §9 e §10; aprovado pelo Pedro em 07/11/2026).
-- Quem vê: carteira Casal, os dois; carteira pessoal, só o dono. Dívida Pessoal: só quem paga e quem é o titular (que precisa dela no fechamento).

-- ---------- Orçamento: limite mensal por categoria e carteira, valendo a partir de um mês (RN-OR-01, RN-OR-06) ----------
create table public.orcamento (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  carteira text not null, -- 'casal' ou o id da pessoa
  categoria uuid not null references public.categoria(id),
  limite bigint not null check (limite > 0),
  desde text not null check (desde ~ '^\d{4}-\d{2}$'),
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (casa, carteira, categoria, desde)
);

-- ---------- Metas e reserva de emergência (§10) ----------
create table public.meta (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  carteira text not null, -- 'casal' ou o id da pessoa
  nome text not null,
  alvo bigint not null check (alvo > 0),
  aporte_planejado bigint,
  onde text, -- onde está guardado, ex.: "caixinha Nubank"
  data_alvo date,
  reserva boolean not null default false, -- reserva de emergência: alvo sugerido = meses × custo fixo
  meses_reserva int,
  encerrada boolean not null default false,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

create table public.movimento_meta (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  meta uuid not null references public.meta(id) on delete cascade,
  pessoa uuid not null references public.pessoa(id), -- quem guardou ou tirou
  tipo text not null check (tipo in ('aporte', 'resgate')),
  valor bigint not null check (valor > 0),
  data date not null,
  observacao text,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

-- Pagamento de parcela de dívida que veio pelo extrato ou foi lançado à mão (RN-DV-03)
alter table public.lancamento add column if not exists divida uuid references public.divida(id) on delete set null;

do $$
declare t text;
begin
  foreach t in array array['orcamento', 'meta', 'movimento_meta'] loop
    execute format('create trigger carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array array['orcamento', 'meta'] loop
    execute format('create policy "carteira ve" on public.%I for select to authenticated using (casa = public.minha_casa() and (carteira = ''casal'' or carteira = public.minha_pessoa()::text))', t);
    execute format('create policy "carteira cria" on public.%I for insert to authenticated with check (casa = public.minha_casa() and (carteira = ''casal'' or carteira = public.minha_pessoa()::text))', t);
    execute format('create policy "carteira altera" on public.%I for update to authenticated using (casa = public.minha_casa() and (carteira = ''casal'' or carteira = public.minha_pessoa()::text)) with check (casa = public.minha_casa() and (carteira = ''casal'' or carteira = public.minha_pessoa()::text))', t);
    execute format('create policy "carteira apaga" on public.%I for delete to authenticated using (casa = public.minha_casa() and (carteira = ''casal'' or carteira = public.minha_pessoa()::text))', t);
  end loop;
end $$;

-- Movimento da meta: segue a meta (a subconsulta já passa pela regra de quem vê a meta)
create policy "meta ve" on public.movimento_meta for select to authenticated using (casa = public.minha_casa() and exists (select 1 from public.meta m where m.id = meta));
create policy "meta cria" on public.movimento_meta for insert to authenticated with check (casa = public.minha_casa() and exists (select 1 from public.meta m where m.id = meta));
create policy "meta altera" on public.movimento_meta for update to authenticated using (casa = public.minha_casa() and exists (select 1 from public.meta m where m.id = meta)) with check (casa = public.minha_casa() and exists (select 1 from public.meta m where m.id = meta));
create policy "meta apaga" on public.movimento_meta for delete to authenticated using (casa = public.minha_casa() and exists (select 1 from public.meta m where m.id = meta));

-- ---------- Dívida Pessoal: só quem paga e o titular (decidido em 07/11/2026) ----------
drop policy if exists "casa ve" on public.divida;
drop policy if exists "casa cria" on public.divida;
drop policy if exists "casa altera" on public.divida;
drop policy if exists "casa apaga" on public.divida;
create policy "envolvidos ou casal ve" on public.divida for select to authenticated
  using (casa = public.minha_casa() and (escopo = 'casal' or responsavel = public.minha_pessoa() or titular = public.minha_pessoa()));
create policy "envolvidos ou casal cria" on public.divida for insert to authenticated
  with check (casa = public.minha_casa() and (escopo = 'casal' or responsavel = public.minha_pessoa() or titular = public.minha_pessoa()));
create policy "envolvidos ou casal altera" on public.divida for update to authenticated
  using (casa = public.minha_casa() and (escopo = 'casal' or responsavel = public.minha_pessoa() or titular = public.minha_pessoa()))
  with check (casa = public.minha_casa() and (escopo = 'casal' or responsavel = public.minha_pessoa() or titular = public.minha_pessoa()));
create policy "envolvidos ou casal apaga" on public.divida for delete to authenticated
  using (casa = public.minha_casa() and (escopo = 'casal' or responsavel = public.minha_pessoa() or titular = public.minha_pessoa()));
