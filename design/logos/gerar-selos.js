// Gera selos redondos (100x100) a partir dos logos originais do Wikimedia Commons
const fs=require('fs'),path=require('path');
const cfg={
  nubank:{bg:'#ffffff',box:[0,0,263.84,145.57],pad:.2},
  bb:{bg:'#fde100',box:[11.56,5.25,31.52,31.52],pad:.23}, // só o símbolo, centrado (o recorte antigo pegava o começo do nome e deixava o símbolo à direita)
  drogasil:{bg:'#ffffff',box:[0,5,70,76],pad:.2},
  magalu:{bg:'#ffffff',box:[0,0,490.35,139.88],pad:.12},
  uber:{bg:'#000000',box:[0,0,926.9,321.78],pad:.18,fill:'#ffffff'},
  centauro:{bg:'#ffffff',box:[0,2,56,41],pad:.18},
  ifood:{bg:'#ea1d2c',box:[0,0,1004,530.58],pad:.16,fill:'#ffffff'},
  amazon:{bg:'#ffffff',box:[0,0,603,182],pad:.12},
  renner:{bg:'#ffffff',box:[0,4,78,88],pad:.18},
  shopee:{bg:'#ffffff',box:[0,0,300,320],pad:.18},
};
const out={};
for(const [n,c] of Object.entries(cfg)){
  let src=fs.readFileSync(path.join(__dirname,'originais',n+'.svg'),'utf8').replace(/<\?xml[^>]*>/,'').replace(/<!DOCTYPE[^>]*>/i,'').replace(/<!--[\s\S]*?-->/g,'');
  const root=src.match(/<svg[^>]*>/)[0];
  const inner=src.slice(src.indexOf(root)+root.length,src.lastIndexOf('</svg>'));
  let [x,y,w,h]=c.box; const s=Math.max(w,h); x-= (s-w)/2; y-=(s-h)/2;
  const p=100*c.pad, sz=100-2*p;
  const ns=[...new Set((root.match(/xmlns:[a-z0-9]+="[^"]*"/gi)||[]).filter(a=>!a.startsWith('xmlns:xlink')))].join(' ');
  const fill=c.fill?`<style>.f-${n} *{fill:${c.fill} !important;stroke:none}</style>`:'';
  // ids internos recebem prefixo para não colidir quando vários selos estão na mesma página
  const pre=inner.replace(/id="([^"]+)"/g,`id="${n}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#${n}-$1)`).replace(/href="#([^"]+)"/g,`href="#${n}-$1"`);
  out[n]=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${ns} viewBox="0 0 100 100">${fill}<circle cx="50" cy="50" r="50" fill="${c.bg}"/><svg x="${p}" y="${p}" width="${sz}" height="${sz}" viewBox="${x} ${y} ${s} ${s}" class="f-${n}">${pre}</svg></svg>`;
  fs.writeFileSync(path.join(__dirname,n+'.svg'),out[n]);
}
console.log(Object.keys(out).join(' '));
