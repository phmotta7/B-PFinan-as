---
description: Compara o banco do Supabase com as migrações e com os tipos do app (só lê)
---
Confira se o banco do Supabase, as migrações em `supabase/migrations/` e `src/dados/tipos.ts` estão iguais. Só leitura: não aplique migração nem mude nada no Supabase sem o Pedro pedir (regra da memória do projeto).

1. Rode `npx vitest run src/dados/banco.test.ts`: ele compara as migrações com os tipos do app (campo que o banco não tem, coluna obrigatória que o app não manda).
2. Com as ferramentas do Supabase, liste as migrações aplicadas no projeto (`list_migrations`) e compare com os arquivos de `supabase/migrations/` (mesmo nome e mesma ordem). Aponte migração que está só no banco ou só nos arquivos.
3. Liste as tabelas (`list_tables`) e compare as colunas com as migrações. Colunas calculadas pelo banco (como `descricao_normalizada`) precisam estar em `CALCULADAS` em `src/dados/repositorio.ts`.
4. Explique em português simples o que está diferente e o que você sugere. Se for preciso mudar o banco, escreva a migração nova em `supabase/migrations/` e peça confirmação antes de aplicar.
