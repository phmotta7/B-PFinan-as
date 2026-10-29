// Clientes do Supabase. Só a URL e a chave pública (anon) vão ao navegador; a proteção dos dados é a RLS do banco.
import { createBrowserClient } from '@supabase/ssr';

export const supabaseConfigurado = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cliente: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseNavegador() {
  if (!supabaseConfigurado()) throw new Error('Supabase não configurado');
  return (cliente ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
}
