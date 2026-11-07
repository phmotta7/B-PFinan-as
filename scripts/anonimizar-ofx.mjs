// Extrato OFX real → cópia fictícia para virar caso de teste (entrega 2B), sem dados reais no projeto.
// Troca nomes (sem ligar para maiúsculas: "PEDRO HENRIQUE" e "Pedro Henrique" viram o nome fictício no mesmo estilo),
// apaga os dígitos de CPF e de contas, troca o número da conta e multiplica todos os valores pelo MESMO fator,
// para a transferência entre duas contas da mesma pessoa continuar com o mesmo valor nos dois arquivos.
// Uso: node scripts/anonimizar-ofx.mjs extrato.ofx "Nome Real=Nome Fictício" [...] [--fator=0.83] > ficticio.ofx
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const arquivo = args.find(a => !a.includes('=') && !a.startsWith('--'));
if (!arquivo) { console.error('Uso: node scripts/anonimizar-ofx.mjs extrato.ofx "Nome Real=Nome Fictício" [--fator=0.83]'); process.exit(1); }
const fator = Number(args.find(a => a.startsWith('--fator='))?.slice(8) ?? 1);
const trocas = args.filter(a => a.includes('=') && !a.startsWith('--')).map(a => a.split('='));
let texto = readFileSync(arquivo, 'utf8');

const sem = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const estilo = (modelo, novo) => modelo === modelo.toUpperCase() ? novo.toUpperCase() : modelo === modelo.toLowerCase() ? novo.toLowerCase() : novo;
// Do nome mais longo para o mais curto, para "Maria Eliete ... Ltda" ser trocado antes de "Maria Eliete ..."
for (const [real, ficticio] of trocas.sort((a, b) => b[0].length - a[0].length)) {
  const padrao = sem(real).split(/\s+/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeiouc]/gi, c => `[${c}${{ a: 'áàâã', e: 'éê', i: 'í', o: 'óôõ', u: 'ú', c: 'ç' }[c.toLowerCase()] ?? ''}]`)).join('\\s+');
  texto = texto.replace(new RegExp(padrao, 'gi'), m => estilo(m, ficticio));
}

// Dígitos que identificam alguém: CPF mascarado, agência/conta, número da conta do arquivo. Sempre o mesmo falso para o mesmo real.
const falsos = new Map();
const falso = (real) => {
  if (!falsos.has(real)) { let h = 7; for (const c of real) h = (h * 31 + c.charCodeAt(0)) % 1e9; falsos.set(real, real.replace(/\d/g, () => String((h = (h * 1103515245 + 12345) % 2147483648) % 10))); }
  return falsos.get(real);
};
texto = texto.replace(/•••\.\d{3}\.\d{3}-••/g, m => falso(m));
texto = texto.replace(/(Conta:\s*)([\d-]+)/g, (_, a, n) => a + falso(n));
texto = texto.replace(/(<ACCTID>)([^<\r\n]+)/g, (_, a, n) => a + falso(n));

if (fator !== 1) texto = texto.replace(/(<(?:TRNAMT|BALAMT)>)(-?)(\d+)[.,](\d{2})/g, (_, tag, neg, i, d) => {
  const v = Math.round((Number(`${i}.${d}`) * fator) * 100) / 100;
  return `${tag}${neg}${v.toFixed(2)}`;
});
process.stdout.write(texto);
