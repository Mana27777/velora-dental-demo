import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base='/velora-dental-demo/';
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.includes(base+'assets/'),'HTML sin base de Pages');
for(const file of ['models/velora-implante-v1.glb','media/consultorio-desktop.mp4','media/consultorio-mobile.mp4','images/recepcion-velora.webp','images/gabinete-velora.webp','illustrations/anatomia-implante.svg','fonts/fredoka-variable.ttf','fonts/nunito-variable.ttf']){
 assert(fs.statSync(path.join('dist',file)).size>0,'Recurso ausente: '+file);
}
for(const name of fs.readdirSync('dist/assets')){
 const text=fs.readFileSync(path.join('dist/assets',name),'utf8');
 assert(!/["']\/(?:models|media|images|fonts)\//.test(text),'Ruta de recurso sin subdirectorio en '+name);
}
assert(!html.includes('C:\\Users\\'),'Ruta local filtrada');
console.log('PASS: base GitHub Pages y recursos de producción.');
