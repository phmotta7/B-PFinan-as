// Gera o arquivo CSV do cenário para testar a importação no navegador (não é um teste de regra).
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { ARQUIVO_NUBANK_NOV } from './cenario';
it.skipIf(!process.env.GERAR_CSV)('gera o CSV do Nubank do cenário', () => { writeFileSync(process.env.GERAR_CSV!, ARQUIVO_NUBANK_NOV); });
