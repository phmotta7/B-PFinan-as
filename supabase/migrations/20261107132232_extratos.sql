-- B&P Finanças · Entrega 2B: contas e lançamentos do extrato (PLANEJAMENTO §6, §7 e §15; aprovado pelo Pedro em 07/11/2026).
-- Privacidade (D15): cada um vê só as próprias contas e os próprios lançamentos; o que é Casal os dois veem.
-- A regra vale no banco (RLS por pessoa), não só na tela. O arquivo do extrato não é guardado.

-- Pessoa do usuário logado, pelo e-mail verificado do Google (mesma regra de minha_casa)
create or replace function public.minha_pessoa() returns uuid
language sql stable security definer set search_path = public as $$
  select ua.pessoa from public.usuario_autorizado ua
  where lower(ua.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, true)
  limit 1
$$;
revoke all on function public.minha_pessoa() from public, anon;
grant execute on function public.minha_pessoa() to authenticated;

create table public.conta (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  pessoa uuid not null references public.pessoa(id), -- dono da conta
  banco text not null, -- código do banco no OFX (0260 Nubank, 077 Inter, 001 BB)
  apelido text not null,
  numero text, -- número da conta como vem no OFX, para reconhecer o arquivo
  ativa boolean not null default true,
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);
create unique index conta_numero_unico on public.conta (casa, banco, numero) where numero is not null;

create table public.lancamento (
  id uuid primary key default gen_random_uuid(),
  casa uuid not null references public.casa(id) on delete cascade,
  pessoa uuid not null references public.pessoa(id), -- de quem é (o dono da conta)
  conta uuid references public.conta(id) on delete cascade,
  data date not null,
  descricao text not null,
  contraparte text,
  valor bigint not null, -- entrada positiva, saída negativa
  tipo text not null check (tipo in ('despesa', 'receita', 'transferencia_propria', 'transferencia', 'pagamento_fechamento', 'pagamento_cartao', 'investimento')),
  escopo text check (escopo in ('pessoal', 'casal')),
  categoria uuid references public.categoria(id),
  observacao text,
  fitid text, -- identificador da transação no banco (RN-OF-02)
  par uuid references public.lancamento(id) on delete set null, -- a outra ponta de uma transferência entre contas próprias
  pagamento uuid references public.pagamento_fechamento(id) on delete set null, -- pagamento de fechamento que este Pix registrou
  origem text not null check (origem in ('manual', 'importacao')),
  criado_em timestamptz, criado_por uuid, atualizado_em timestamptz, atualizado_por uuid
);
-- Reimportar o mesmo extrato não duplica (RN-OF-02)
create unique index lancamento_fitid_unico on public.lancamento (conta, fitid) where fitid is not null;
create index lancamento_data on public.lancamento (casa, data);

do $$
declare t text;
begin
  foreach t in array array['conta', 'lancamento'] loop
    execute format('create trigger carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Conta: só o dono vê e mexe
create policy "dono ve" on public.conta for select to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono cria" on public.conta for insert to authenticated with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono altera" on public.conta for update to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa()) with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono apaga" on public.conta for delete to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa());

-- Lançamento: o dono vê e mexe; o que é Casal o outro só vê
create policy "dono ou casal ve" on public.lancamento for select to authenticated using (casa = public.minha_casa() and (pessoa = public.minha_pessoa() or escopo = 'casal'));
create policy "dono cria" on public.lancamento for insert to authenticated with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono altera" on public.lancamento for update to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa()) with check (casa = public.minha_casa() and pessoa = public.minha_pessoa());
create policy "dono apaga" on public.lancamento for delete to authenticated using (casa = public.minha_casa() and pessoa = public.minha_pessoa());
