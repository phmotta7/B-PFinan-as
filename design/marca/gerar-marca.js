const fs=require('fs'),path=require('path'),ot=require('opentype.js');
const out=process.argv[2];
const F=n=>ot.loadSync(path.join(__dirname,'node_modules/@fontsource/figtree/files/figtree-latin-'+n+'-normal.woff'));
const f800=F(800),f500=F(500);
const BLUE='#2d47d6',SOFT='#bcc7ff',INK='#1c1b19',PAPER='#eceae6',NIGHT='#1f2130',NSOFT='#8c9cff';
// O B: haste + barriga de cima (p) + barriga de baixo (b), centrado opticamente
const B=(top,bottom,stem,k=1)=>`<g transform="translate(50 50) scale(${k}) translate(-53 -51)">
<path d="M38 50H56a12.5 12.5 0 0 1 0 25H38" fill="none" stroke="${bottom}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M38 27H53a11.5 11.5 0 0 1 0 23H38" fill="none" stroke="${top}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M38 27V75" stroke="${stem}" stroke-width="11" stroke-linecap="round"/></g>`;
const svg=(vb,body,title='B&amp;P Finanças')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img"><title>${title}</title>${body}</svg>\n`;
const tile=(bg,r=23)=>`<rect width="100" height="100" rx="${r}" fill="${bg}"/>`;
const w=(n,s)=>fs.writeFileSync(path.join(out,n),s);
w('marca.svg',svg('0 0 100 100',tile(BLUE)+B('#fff',SOFT,'#fff')));
w('marca-escura.svg',svg('0 0 100 100',tile(NIGHT)+B('#fff',NSOFT,'#fff')));
w('marca-mono.svg',svg('0 0 100 100',B('currentColor','currentColor','currentColor')));
w('marca-mono-preta.svg',svg('0 0 100 100',tile(INK)+B('#fff','#fff','#fff')));
w('favicon.svg',svg('0 0 100 100',tile(BLUE)+B('#fff',SOFT,'#fff',1.08)));
w('icone-maskable.svg',svg('0 0 100 100',`<rect width="100" height="100" fill="${BLUE}"/>`+B('#fff',SOFT,'#fff',0.9)));
w('icone-apple.svg',svg('0 0 100 100',`<rect width="100" height="100" fill="${BLUE}"/>`+B('#fff',SOFT,'#fff',0.92)));
// Horizontal: marca + nome em curvas (não depende da fonte instalada)
function word(color){
  const size=54.5, y=69, x0=127;
  const p1=f800.getPath('B&P',x0,y,size); const a1=f800.getAdvanceWidth('B&P',size);
  const gap=f500.getAdvanceWidth(' ',size);
  const p2=f500.getPath('Finanças',x0+a1+gap,y,size); const a2=f500.getAdvanceWidth('Finanças',size);
  return {d:`<path fill="${color}" d="${p1.toPathData(2)}"/><path fill="${color}" d="${p2.toPathData(2)}"/>`,width:Math.ceil(x0+a1+gap+a2+2)};
}
for(const [n,ink,mark] of [['horizontal-clara.svg',INK,tile(BLUE)+B('#fff',SOFT,'#fff')],['horizontal-escura.svg',PAPER,tile(BLUE)+B('#fff',SOFT,'#fff')],['horizontal-mono.svg','currentColor',B('currentColor','currentColor','currentColor')]]){
  const t=word(ink); w(n,svg(`0 0 ${t.width} 100`,mark+t.d));
}
console.log('ok');
