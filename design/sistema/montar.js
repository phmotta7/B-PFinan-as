// Monta design/sistema.html a partir do modelo, dos tokens e da marca
const fs=require('fs'),path=require('path');const d=__dirname;
let t=fs.readFileSync(path.join(d,'sistema.tpl.html'),'utf8');
const tokens=fs.readFileSync(path.join(d,'tokens.css'),'utf8');
const marca=fs.readFileSync(path.join(d,'..','marca','marca.svg'),'utf8').replace(/<title>[^<]*<\/title>/,'').replace(' role="img"',' aria-hidden="true"').trim();
t=t.replace('/*TOKENS*/',()=>tokens).replace('{{marca}}',()=>marca);
fs.writeFileSync(path.join(d,'..','sistema.html'),t);console.log('ok',t.length);
