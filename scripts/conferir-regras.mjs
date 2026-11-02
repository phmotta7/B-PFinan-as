// O código cita as regras do PLANEJAMENTO.md nos comentários (RN-CO-01, RN-IM-04…). Esta conferência:
// 1. falha se o código cita uma regra que não existe no planejamento (regra renomeada ou esquecida);
// 2. avisa (sem falhar) quando os commits ainda não publicados mudam regras do app sem mexer no PLANEJAMENTO.md.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RN = /RN-[A-Z]{2}-\d{2}/g;
const arquivos = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? arquivos(p) : /\.tsx?$/.test(n) ? [p] : []; });
const noPlano = new Set(readFileSync('PLANEJAMENTO.md', 'utf8').match(RN) ?? []);
const faltam = new Map();
for (const f of arquivos('src')) for (const rn of readFileSync(f, 'utf8').match(RN) ?? []) if (!noPlano.has(rn)) faltam.set(rn, [...(faltam.get(rn) ?? []), f]);

if (faltam.size) {
  console.error('O código cita regras que não estão no PLANEJAMENTO.md:');
  for (const [rn, fs] of faltam) console.error(`  ${rn}: ${[...new Set(fs)].join(', ')}`);
  process.exit(1);
}
console.log(`Regras citadas no código: todas no planejamento (${noPlano.size} regras no PLANEJAMENTO.md).`);

try {
  const mudou = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean);
  const regras = mudou.filter(f => /^src\/(dominio|dados)\/.*\.ts$/.test(f) && !f.endsWith('.test.ts'));
  if (regras.length && !mudou.includes('PLANEJAMENTO.md'))
    console.warn(`Aviso: os commits a publicar mudam regras do app (${regras.join(', ')}) sem mudar o PLANEJAMENTO.md. Se alguma regra mudou, registre lá.`);
} catch { /* sem origin/main (primeira vez ou sem rede): só a conferência acima */ }
