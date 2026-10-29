// Renova a sessão do Supabase a cada visita (cookies), quando o Supabase está configurado.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return res;
  const sb = createServerClient(url, chave, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: lista => lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) },
  });
  await sb.auth.getUser();
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon|logos|icon|apple-touch|marca|manifest).*)'] };
