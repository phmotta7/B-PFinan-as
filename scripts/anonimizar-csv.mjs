// Fatura em CSV (Nubank ou outro banco) → cópia com nomes de pessoas trocados, para virar caso de teste sem dados reais.
// Mantém o formato do arquivo (vírgula ou ponto decimal, aspas, "- " no crédito), que é o que o leitor precisa aprender.
// Uso: node scripts/anonimizar-csv.mjs fatura.csv "Pedro Henrique Moreira Mota=Fulano de Tal" ["Outro Nome=Beltrano"] > ficticio.csv
// Com --valores, também troca os valores (cada um multiplicado pelo mesmo fator, mantendo o formato).
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const arquivo = args.find(a => !a.includes('=') && !a.startsWith('--'));
if (!arquivo) { console.error('Uso: node scripts/anonimizar-csv.mjs fatura.csv "Nome Real=Nome Fictício" [--valores]'); process.exit(1); }
const trocas = args.filter(a => a.includes('=')).map(a => a.split('='));
let texto = readFileSync(arquivo, 'utf8');
for (const [real, ficticio] of trocas) texto = texto.split(real).join(ficticio);

if (args.includes('--valores')) {
  const fator = 0.7 + Math.random() * 0.6;
  // "1.541,31" / "121,30" / 54.90: troca o número e mantém separadores e casas
  texto = texto.replace(/(-\s?)?\d{1,3}(?:([.,])\d{3})*(?:([.,])\d{2})(?!\d)/g, v => {
    const decimal = v.match(/[.,](\d{2})$/) ? v.at(-3) : '.';
    const milhar = decimal === ',' ? '.' : ',';
    const neg = /^-/.test(v) ? v.match(/^-\s?/)[0] : '';
    const numero = Number(v.replace(neg, '').split(milhar).join('').replace(decimal, '.'));
    const [int, dec] = (Math.round(numero * fator * 100) / 100).toFixed(2).split('.');
    const comMilhar = v.includes(milhar) ? int.replace(/\B(?=(\d{3})+(?!\d))/g, milhar) : int;
    return `${neg}${comMilhar}${decimal}${dec}`;
  });
}
process.stdout.write(texto);
