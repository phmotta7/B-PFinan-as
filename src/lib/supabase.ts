// Clientes do Supabase. Só a URL e a chave pública (anon) vão ao navegador; a proteção dos dados é a RLS do banco.
import { createBrowserClient } from '@supabase/ssr';

// NEXT_PUBLIC_MODO_DEMO=1 força o modo demonstração mesmo com o Supabase configurado (capturas e testes visuais)
export const supabaseConfigurado = () => process.env.NEXT_PUBLIC_MODO_DEMO !== '1' && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cliente: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseNavegador() {
  if (!supabaseConfigurado()) throw new Error('Supabase não configurado');
  return (cliente ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
}
