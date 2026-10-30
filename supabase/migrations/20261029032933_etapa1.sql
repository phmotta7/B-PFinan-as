-- B&P Finanças · Etapa 1 (cartões e fechamento). PLANEJAMENTO §13 e §15.
-- Dinheiro em centavos (bigint). Datas de calendário em date (fuso America/Sao_Paulo é aplicado no app).
-- Toda tabela tem casa e auditoria simples (RN-AC-03). RLS: só quem está na lista de e-mails da casa vê e altera.

create extension if not exists pgcrypto;

-- ---------- Casa e acesso ----------
create table public.casa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table public.usuario_autorizado (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  email text not null,
  pessoa uuid, -- ligada depois que a pessoa existe
  criado_em timestamptz not null default now(),
  unique (casa, email)
);
create unique index usuario_autorizado_email_unico on public.usuario_autorizado (lower(email));

-- Casa do usuário logado, pelo e-mail verificado do Google. security definer para não depender da própria RLS.
create or replace function public.minha_casa() returns uuid
language sql stable security definer set search_path = public as $$
  select ua.casa from public.usuario_autorizado ua
  where lower(ua.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, true)
  limit 1
$$;
revoke all on function public.minha_casa() from public;
grant execute on function public.minha_casa() to authenticated;
alter table public.usuario_autorizado alter column casa set default public.minha_casa();

-- Auditoria: quem criou e quem alterou por último ("editado por Bruna em 05/11")
create or replace function public.carimbar() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em := coalesce(new.criado_em, now()); new.criado_por := coalesce(new.criado_por, auth.uid());
    if new.casa is null then new.casa := public.minha_casa(); end if;
  end if;
  new.atualizado_em := now(); new.atualizado_por := auth.uid();
  return new;
end $$;

-- Colunas comuns a todas as tabelas de dados
-- (casa, criado_em, criado_por, atualizado_em, atualizado_por) são repetidas em cada create table abaixo.

-- ---------- Cadastros ----------
create table public.pessoa (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('usuario', 'participante')),
  cor text not null,
  telefone_whatsapp text,
  chave_pix text,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);
alter table public.usuario_autorizado add constraint usuario_autorizado_pessoa_fk foreign key (pessoa) references public.pessoa(id) on delete set null;

create table public.categoria (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('despesa', 'receita')),
  ativa boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (casa, nome)
);

create table public.cartao (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  apelido text not null,
  banco text not null check (banco in ('nubank', 'bb', 'outro')),
  titular uuid not null references public.pessoa(id),
  dia_fechamento int not null check (dia_fechamento between 1 and 31),
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  cor text,
  ativo boolean not null default true,
  mapa_csv jsonb, -- mapeamento salvo do CSV genérico (§4.4.2)
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

-- ---------- Faturas, compras e parcelas ----------
create table public.fatura (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  cartao uuid not null references public.cartao(id) on delete cascade,
  mes text not null check (mes ~ '^\d{4}-\d{2}$'), -- mês de vencimento
  data_fechamento date not null,
  data_vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta', 'fechada', 'importada', 'encerrada')),
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (cartao, mes)
);

create table public.importacao (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  tipo text not null default 'fatura' check (tipo in ('fatura', 'extrato')),
  formato text not null check (formato in ('nubank_csv', 'csv_generico', 'ofx')),
  cartao uuid references public.cartao(id) on delete set null,
  fatura uuid references public.fatura(id) on delete set null,
  arquivo_caminho text, -- no Storage, bucket privado "importacoes"
  arquivo_nome text,
  status text not null default 'gravada' check (status in ('gravada', 'desfeita')),
  total bigint,
  linhas_novas int, linhas_repetidas int, linhas_ignoradas int,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

create table public.linha_importada (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  importacao uuid not null references public.importacao(id) on delete cascade,
  cartao uuid not null references public.cartao(id) on delete cascade,
  dados jsonb not null, -- linha como veio no arquivo
  digital text not null, -- impressão digital (RN-IM-01)
  situacao text not null check (situacao in ('nova', 'conciliada', 'duplicada', 'ignorada')),
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);
-- Reimportar o mesmo arquivo não duplica (RN-IM-01)
create unique index linha_importada_digital_unica on public.linha_importada (cartao, digital) where situacao <> 'ignorada';

create table public.compra (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  cartao uuid not null references public.cartao(id) on delete cascade,
  data date not null,
  descricao text not null,
  descricao_normalizada text generated always as (lower(descricao)) stored,
  valor_total bigint not null,
  parcelas int not null default 1 check (parcelas >= 1),
  tipo text not null default 'compra' check (tipo in ('compra', 'parcela', 'iof', 'anuidade', 'juros', 'multa', 'estorno', 'ajuste')),
  compra_origem uuid references public.compra(id) on delete set null, -- IOF e estorno
  pagador uuid references public.pessoa(id), -- null = sem dono
  escopo text check (escopo in ('pessoal', 'casal')),
  categoria uuid references public.categoria(id),
  observacao text,
  origem text not null check (origem in ('manual', 'importacao')),
  conciliada boolean not null default false,
  pendencia jsonb, -- conferência pendente da importação: {"tipo":"duplicidade","manual":uuid} ou {"tipo":"ambigua","candidatos":[uuid]}
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

create table public.parcela_cartao (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  compra uuid not null references public.compra(id) on delete cascade,
  fatura uuid not null references public.fatura(id) on delete restrict,
  numero int not null check (numero >= 1),
  valor bigint not null,
  status text not null default 'prevista' check (status in ('prevista', 'confirmada')),
  linha_importada uuid references public.linha_importada(id) on delete set null,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (compra, numero)
);
create index parcela_cartao_fatura on public.parcela_cartao (fatura);

-- ---------- Dívidas (só o necessário para o fechamento na Etapa 1) ----------
create table public.divida (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('emprestimo', 'parcelamento_externo', 'outro')),
  titular uuid not null references public.pessoa(id),
  responsavel uuid not null references public.pessoa(id),
  escopo text check (escopo in ('pessoal', 'casal')),
  valor_parcela bigint not null,
  parcela_atual int not null,
  mes_parcela_atual text not null check (mes_parcela_atual ~ '^\d{4}-\d{2}$'), -- mês em que vence a parcela_atual; as outras são calculadas a partir dele
  total_parcelas int not null,
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  juros_mensal numeric,
  saldo_informado bigint,
  situacao text not null default 'ativa' check (situacao in ('ativa', 'quitada')),
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

-- ---------- Fechamento ----------
create table public.fechamento (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  devedor uuid not null references public.pessoa(id),
  credor uuid not null references public.pessoa(id),
  mes text not null check (mes ~ '^\d{4}-\d{2}$'),
  enviado_em date, -- RN-WA-10
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (devedor, credor, mes),
  check (devedor <> credor)
);

create table public.parcela_divida (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  divida uuid not null references public.divida(id) on delete cascade,
  numero int not null,
  vencimento date not null,
  valor bigint not null,
  status text not null default 'prevista' check (status in ('prevista', 'paga')),
  fechamento uuid references public.fechamento(id) on delete set null,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid,
  unique (divida, numero)
);

create table public.pagamento_fechamento (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  fechamento uuid not null references public.fechamento(id) on delete cascade,
  valor bigint not null check (valor > 0),
  data date not null,
  observacao text,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);

-- ---------- Auditoria e RLS em todas as tabelas de dados ----------
do $$
declare t text;
begin
  foreach t in array array['pessoa','categoria','cartao','fatura','importacao','linha_importada','compra','parcela_cartao','divida','fechamento','parcela_divida','pagamento_fechamento']
  loop
    execute format('create trigger carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "casa ve" on public.%I for select to authenticated using (casa = public.minha_casa())', t);
    execute format('create policy "casa cria" on public.%I for insert to authenticated with check (casa = public.minha_casa())', t);
    execute format('create policy "casa altera" on public.%I for update to authenticated using (casa = public.minha_casa()) with check (casa = public.minha_casa())', t);
    execute format('create policy "casa apaga" on public.%I for delete to authenticated using (casa = public.minha_casa())', t);
  end loop;
end $$;

alter table public.casa enable row level security;
create policy "ve a propria casa" on public.casa for select to authenticated using (id = public.minha_casa());
create policy "altera a propria casa" on public.casa for update to authenticated using (id = public.minha_casa()) with check (id = public.minha_casa());

alter table public.usuario_autorizado enable row level security;
create policy "ve a lista da casa" on public.usuario_autorizado for select to authenticated using (casa = public.minha_casa());
create policy "inclui na lista da casa" on public.usuario_autorizado for insert to authenticated with check (casa = public.minha_casa());
create policy "altera a lista da casa" on public.usuario_autorizado for update to authenticated using (casa = public.minha_casa()) with check (casa = public.minha_casa());
create policy "tira da lista da casa" on public.usuario_autorizado for delete to authenticated using (casa = public.minha_casa());

-- Ninguém anônimo lê nada
revoke all on all tables in schema public from anon;

-- ---------- Arquivos importados (Storage, bucket privado) ----------
insert into storage.buckets (id, name, public) values ('importacoes', 'importacoes', false) on conflict (id) do nothing;
create policy "casa le arquivos" on storage.objects for select to authenticated
  using (bucket_id = 'importacoes' and (storage.foldername(name))[1] = public.minha_casa()::text);
create policy "casa envia arquivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'importacoes' and (storage.foldername(name))[1] = public.minha_casa()::text);
create policy "casa troca arquivos" on storage.objects for update to authenticated
  using (bucket_id = 'importacoes' and (storage.foldername(name))[1] = public.minha_casa()::text)
  with check (bucket_id = 'importacoes' and (storage.foldername(name))[1] = public.minha_casa()::text);
