// Publicar o app: confere tudo e só então manda para a Vercel (git push origin <ramo>:main, que publica sozinho).
// npm run publicar  → confere, monta o app e envia.   npm run conferir → só confere (tipos, testes, lint, regras).
import { execSync, spawnSync } from 'node:child_process';

const soConferir = process.argv.includes('--so-conferir');
const git = a => execSync(`git ${a}`, { encoding: 'utf8' }).trim();
const parar = msg => { console.error(`\n✖ ${msg}`); process.exit(1); };
const etapa = (rotulo, cmd, args) => {
  console.log(`\n▶ ${rotulo}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) parar(`Parou em "${rotulo}".${soConferir ? '' : ' Nada foi publicado.'}`);
};
const node = (rotulo, ...args) => etapa(rotulo, process.execPath, args);

if (!soConferir && git('status --porcelain')) parar('Há mudanças sem commit. Faça o commit antes de publicar.');

node('Tipos', 'node_modules/typescript/bin/tsc', '--noEmit');
node('Testes', 'node_modules/vitest/vitest.mjs', 'run');
node('Lint', 'node_modules/eslint/bin/eslint.js');
node('Regras e planejamento', 'scripts/conferir-regras.mjs');
if (soConferir) { console.log('\n✔ Tudo conferido.'); process.exit(0); }

// O build usa a pasta .next: com o servidor de teste aberto, feche-o antes
node('Montar o app (como a Vercel faz)', 'node_modules/next/dist/bin/next', 'build');
const ramo = git('rev-parse --abbrev-ref HEAD');
etapa(`Enviar ${ramo} para main`, 'git', ['push', 'origin', `${ramo}:main`]);
console.log(`\n✔ Enviado (${git('rev-parse --short HEAD')}). A Vercel publica em bpfinancas.vercel.app em 1 ou 2 minutos.`);
