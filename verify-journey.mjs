import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {followPoseAt}=await load(read('./journey.js').replace("import { clamp } from './motion.js';",'const clamp=p=>Math.max(0,Math.min(1,p));'));
assert.equal(followPoseAt(1).roll,90);assert.equal(followPoseAt(0).yaw,380);
for(let i=0;i<=1000;i++){const pose=followPoseAt(i/1000);assert(Object.values(pose).every(Number.isFinite));assert(pose.centerX>=.3&&pose.centerX<=.7);}
const {pinnedAnatomyProgress}=await load(read('./anatomy.js').replace(/^import drawing.*;\s*/,"const drawing='';"));
for(const height of [800,844,915,932]){const panel=600,travel=height*1.6,top=146;assert.equal(pinnedAnatomyProgress(top,panel+travel,panel,146),0);assert(Math.abs(pinnedAnatomyProgress(top-travel/2,panel+travel,panel,146)-.5)<1e-12);assert(Math.abs(pinnedAnatomyProgress(top-travel,panel+travel,panel,146)-1)<1e-12);}
const html=read('./index.html'),booking=read('./booking.js');
assert(html.includes('AGENDA DE DEMOSTRACIÓN')&&html.includes('no se reserva una cita real'));
assert(html.includes('id="booking-confirm" type="button" disabled'));
assert(!/fetch\(|localStorage|sendBeacon/.test(booking));
assert(read('./config.js').includes("playbackMode: 'scrub'"));
assert(read('./style.css').includes('.model-touch.exploring{touch-action:none;'));
function glb(name){const bytes=fs.readFileSync(new URL(name,import.meta.url)),length=bytes.readUInt32LE(12),data=JSON.parse(bytes.subarray(20,20+length).toString()),binary=bytes.subarray(28+length);return {data,bytes,view:i=>{const v=data.bufferViews[i],start=v.byteOffset??0;return binary.subarray(start,start+v.byteLength);}};}
const original=glb('./public/models/velora-implante-v1.glb'),web=glb('./public/models/velora-implante-web.glb');
assert.deepEqual(web.data.meshes,original.data.meshes);assert.deepEqual(web.data.materials,original.data.materials);assert.deepEqual(web.data.accessors,original.data.accessors);
const imageViews=new Set(original.data.images.map(image=>image.bufferView));
original.data.bufferViews.forEach((_,i)=>{if(!imageViews.has(i))assert(original.view(i).equals(web.view(i)),'Geometry changed in web derivative');});
assert(web.bytes.length<original.bytes.length*.5);
console.log('PASS: seguimiento continuo hasta posición horizontal; anatomía con 160svh de lectura; agenda demo sin envío ni reserva real; exploración táctil explícita.');
