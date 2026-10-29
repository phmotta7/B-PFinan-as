// Monta design/prototipo.html: modelo + tokens + CSS + dados + app + logos (embutidos) + marca
const fs = require('fs'), path = require('path'); const d = __dirname, ler = p => fs.readFileSync(path.join(d, p), 'utf8');
const logos = {};
for (const f of fs.readdirSync(path.join(d, '..', 'logos')).filter(f => f.endsWith('.svg')))
  logos[f.replace('.svg', '')] = 'data:image/svg+xml;base64,' + Buffer.from(ler('../logos/' + f)).toString('base64');
const marca = ler('../marca/marca.svg').replace(/<title>[^<]*<\/title>/, '').replace(' role="img"', ' aria-hidden="true"').trim();
let t = ler('prototipo.tpl.html')
  .replace('/*TOKENS*/', () => ler('../sistema/tokens.css'))
  .replace('/*APPCSS*/', () => ler('app.css'))
  .replace('/*DADOS*/', () => ler('dados.js'))
  .replace('/*LOGOS*/', () => JSON.stringify(logos))
  .replace('/*MARCA*/', () => marca)
  .replace('/*APPJS*/', () => ler('app.js'));
fs.writeFileSync(path.join(d, '..', 'prototipo.html'), t); console.log('ok', Math.round(t.length / 1024) + ' KB');
