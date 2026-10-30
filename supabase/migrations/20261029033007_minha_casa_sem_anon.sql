-- Verificação de segurança do Supabase: a função de acesso não precisa ser chamada sem login.
revoke execute on function public.minha_casa() from anon;
revoke execute on function public.carimbar() from anon, authenticated, public;
