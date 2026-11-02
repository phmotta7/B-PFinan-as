// Fatura em PDF → pedaços de texto com posição, no formato dos testes do leitor do BB (src/dominio/leitor-bb.test.ts).
// Uso: node scripts/itens-pdf.mjs fatura.pdf [senha] > itens.txt
// O arquivo é lido só neste computador. Antes de colar num teste, troque nomes, números de cartão e valores por fictícios.
import { readFileSync } from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const [arquivo, senha] = process.argv.slice(2);
if (!arquivo) { console.error('Uso: node scripts/itens-pdf.mjs fatura.pdf [senha]'); process.exit(1); }
pdfjs.GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href;

const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(arquivo)), password: senha, verbosity: pdfjs.VerbosityLevel.ERRORS }).promise;
const aspas = s => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
for (let p = 1; p <= doc.numPages; p++) {
  const { items } = await (await doc.getPage(p)).getTextContent();
  const linhas = new Map();
  for (const it of items) {
    if (!('str' in it) || !it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    linhas.set(y, [...(linhas.get(y) ?? []), [Math.round(it.transform[4]), it.str]]);
  }
  for (const [y, pedacos] of [...linhas].sort((a, b) => b[0] - a[0]))
    console.log(`  ...L(${p}, ${y}, [${pedacos.sort((a, b) => a[0] - b[0]).map(([x, t]) => `[${x}, ${aspas(t)}]`).join(', ')}]),`);
}
await doc.destroy();
