import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(root,'public/media/consultorio-scroll.mp4');
export default defineConfig(({command})=>({base:command==='build'?'/velora-dental-demo/':'/',plugins:[{
  name:'local-consultorio-video',
  configureServer(server){server.middlewares.use('/media/consultorio-scroll.mp4',(req,res)=>{
    if(!fs.existsSync(source)){res.statusCode=204;res.end();return;}
    const size=fs.statSync(source).size;res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');
    if(req.method==='HEAD'){res.setHeader('Content-Length',size);res.end();return;}
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),size-1):size-1;
    if(start>end||start>=size){res.statusCode=416;res.setHeader('Content-Range',`bytes */${size}`);res.end();return;}
    if(match){res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
    res.setHeader('Content-Length',end-start+1);const stream=fs.createReadStream(source,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  });},
  closeBundle(){if(fs.existsSync(source)){fs.mkdirSync(path.join(root,'dist/media'),{recursive:true});fs.copyFileSync(source,path.join(root,'dist/media/consultorio-scroll.mp4'));}}
} ]}));
