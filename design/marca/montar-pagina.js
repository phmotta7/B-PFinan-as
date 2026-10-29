const fs=require('fs'),path=require('path');const dir=process.argv[2];
let t=fs.readFileSync(path.join(dir,'marca.tpl.html'),'utf8');
const strip=s=>s.replace(/<title>[^<]*<\/title>/,'').replace(' role="img"',' aria-hidden="true"');
const apps=src=>{const n=['Fotos','Mapas','Clima','Notas','Nubank','B&amp;P','WhatsApp','Câmera','Música','Relógio','Ajustes','BB'];
 return n.map(x=>x==='B&amp;P'?`<div class="app"><img src="data:image/png;base64,${src}" alt=""><small>${x}</small></div>`:`<div class="app"><i></i><small>${x}</small></div>`).join('')};
const b64=f=>fs.readFileSync(path.join(dir,f)).toString('base64');
t=t.replace(/\{\{apps:apple\}\}/g,apps(b64('png/apple-touch-icon.png'))).replace(/\{\{apps:maskable\}\}/g,apps(b64('png/icon-maskable-192.png')));
t=t.replace(/\{\{(png\/[^}]+)\}\}/g,(_,f)=>b64(f)).replace(/\{\{([^}]+\.svg)\}\}/g,(_,f)=>strip(fs.readFileSync(path.join(dir,f),'utf8')));
fs.writeFileSync(path.join(dir,'..','marca.html'),t);console.log('built',t.length);
