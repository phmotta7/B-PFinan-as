// Volta do login com Google: troca o código pela sessão (cookies) e leva ao app.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('code');
  const destino = new URL('/', req.nextUrl.origin);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!codigo || !url || !chave) return NextResponse.redirect(destino);
  const jar = await cookies();
  const sb = createServerClient(url, chave, {
    cookies: { getAll: () => jar.getAll(), setAll: lista => lista.forEach(({ name, value, options }) => jar.set(name, value, options)) },
  });
  await sb.auth.exchangeCodeForSession(codigo);
  return NextResponse.redirect(destino);
}
