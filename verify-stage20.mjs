import fs from 'node:fs';
import assert from 'node:assert/strict';
const fromSource=async(file,replace)=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8').replace(replace,'const drawing="";const map={timeline:[]};')).toString('base64'));
const {narrativeProgress}=await fromSource('motion.js',/^import map[^\n]+/);
const {anatomyProgress,anatomyPose}=await fromSource('anatomy.js',/^import drawing[^\n]+/);
const sizes=[[360,800],[390,844],[393,873],[412,915],[430,932],[1440,900]];
for(const [width,viewport] of sizes){
  // Android can show a taller viewport after hiding its address bar.
  for(const scene of [viewport,viewport-80,viewport+40]){
    const track=scene+viewport*4,start=17,end=start+track-scene;
    assert.equal(narrativeProgress(start-10,start,track,scene),0);
    assert.equal(narrativeProgress(end,start,track,scene),1);
    assert.equal(narrativeProgress((start+end)/2,start,track,scene),.5);
  }
  const height=width<701?610:520,travel=viewport-height-32;
  if(travel>=64){
    const start=viewport-height-16;
    assert.equal(anatomyProgress(start,height,viewport),0);
    assert.equal(anatomyProgress(16,height,viewport),1);
    for(let i=0;i<=100;i++){const p=anatomyProgress(start-travel*i/100,height,viewport);assert(Math.abs(p-i/100)<1e-10);}
  }
}
assert.equal(anatomyProgress(0,790,800),null);
assert.deepEqual([0,.5,1].map(p=>anatomyPose(p).index),[0,1,2]);

function inspectMp4(file){
  const data=fs.readFileSync(file),containers=new Set(['moov','trak','mdia','minf','stbl']),boxes=[];
  function walk(start,end){
    for(let p=start;p+8<=end;){
      let size=data.readUInt32BE(p),header=8;const type=data.toString('ascii',p+4,p+8);
      if(size===1){size=Number(data.readBigUInt64BE(p+8));header=16;}
      if(size===0)size=end-p;
      assert(size>=header&&p+size<=end,'MP4 box inválido');
      boxes.push({type,p,size,payload:p+header});if(containers.has(type))walk(p+header,p+size);p+=size;
    }
  }
  walk(0,data.length);
  const stss=boxes.find(b=>b.type==='stss'),stsd=boxes.find(b=>b.type==='stsd');
  const sample=stsd.payload+8;
  return {bytes:data.length,width:data.readUInt16BE(sample+32),height:data.readUInt16BE(sample+34),keyframes:stss?data.readUInt32BE(stss.payload+4):null,audio:boxes.filter(b=>b.type==='hdlr'&&data.toString('ascii',b.payload+8,b.payload+12)==='soun').length,faststart:boxes.find(b=>b.type==='moov').p<boxes.find(b=>b.type==='mdat').p};
}
const media={};
for(const kind of ['desktop','mobile']){
  const info=inspectMp4('public/media/consultorio-'+kind+'.mp4');media[kind]=info;
  assert.equal(info.width,1280);assert.equal(info.height,720);assert.equal(info.audio,0);assert(info.faststart);
  assert(info.keyframes>=8);assert(info.bytes<3_000_000);
}
console.log(JSON.stringify({status:'PASS',viewports:sizes.length,geometry:'pin end uses rendered scene height; anatomy reserves no track',media},null,2));
