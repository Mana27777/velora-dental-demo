import assert from 'node:assert/strict';
import {ScrollVideo} from './scroll-video.js';

class MediaPreference extends EventTarget {constructor(){super();this.matches=false;}}
class FakeDocument extends EventTarget {constructor(){super();this.hidden=false;}}
class FakeVideo extends EventTarget {
  constructor({seekCompletes=true,rejectPlay=false}={}){
    super();Object.assign(this,{duration:8,_time:0,seeking:false,paused:true,playCalls:0,seekCalls:0,seekCompletes,rejectPlay});
  }
  get currentTime(){return this._time;}
  set currentTime(value){
    this._time=value;this.seekCalls++;this.seeking=true;
    if(this.seekCompletes)queueMicrotask(()=>{this.seeking=false;this.dispatchEvent(new Event('seeked'));});
  }
  load(){if(this.src)queueMicrotask(()=>{this.dispatchEvent(new Event('loadedmetadata'));this.dispatchEvent(new Event('loadeddata'));});}
  pause(){this.paused=true;}
  async play(){this.playCalls++;if(this.rejectPlay)throw new Error('NotAllowedError');this.paused=false;this.dispatchEvent(new Event('playing'));}
  removeAttribute(name){if(name==='src')this.src='';}
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const layer=()=>{const classes=new Set();return {dataset:{},classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)}};};
const saved={fetch:globalThis.fetch,document:globalThis.document,matchMedia:globalThis.matchMedia};
const doc=new FakeDocument();globalThis.document=doc;
globalThis.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'video/mp4'}});
globalThis.matchMedia=()=>({matches:false});
const reduced=new MediaPreference();

const desktopVideo=new FakeVideo(),desktop=new ScrollVideo(desktopVideo,layer(),reduced);
desktop.update(.8,true);await wait(130);
assert.equal(desktop.mode,'scrub');assert(Math.abs(desktopVideo.currentTime-6.36)<.05);
desktop.update(.2,true);await wait(130);assert(Math.abs(desktopVideo.currentTime-1.59)<.05);
desktop.destroy();

globalThis.matchMedia=()=>({matches:true});
const mobileVideo=new FakeVideo(),mobileLayer=layer();
const mobile=new ScrollVideo(mobileVideo,mobileLayer,reduced,{src:'/desktop.mp4',mobileSrc:'/mobile.mp4'});
mobile.update(.5,true);await wait(0);
assert.equal(mobile.src,'/mobile.mp4');assert.equal(mobile.mode,'playback');
assert.equal(mobileVideo.seekCalls,0);assert.equal(mobileVideo.playCalls,1);
assert(mobileVideo.loop&&mobileVideo.muted&&mobileVideo.defaultMuted&&mobileVideo.playsInline);
mobile.update(.9,true);mobile.update(.1,true);assert.equal(mobileVideo.seekCalls,0);
assert(mobileLayer.classList.contains('video-ready'));
doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert(mobileVideo.paused);
doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await wait(0);assert(!mobileVideo.paused);
reduced.matches=true;reduced.dispatchEvent(new Event('change'));
assert(mobileVideo.paused);assert(!mobileLayer.classList.contains('video-ready'));
reduced.matches=false;reduced.dispatchEvent(new Event('change'));await wait(0);assert(!mobileVideo.paused);
mobile.update(.5,false);assert(mobileVideo.paused);
mobile.destroy();const calls=mobileVideo.playCalls;doc.dispatchEvent(new Event('pointerdown'));assert.equal(mobileVideo.playCalls,calls);

const blockedVideo=new FakeVideo({rejectPlay:true}),blockedLayer=layer();
const blocked=new ScrollVideo(blockedVideo,blockedLayer,reduced);
blocked.update(.3,true);await wait(0);assert(blocked.blocked);assert.equal(blockedLayer.dataset.videoMode,'poster');
blocked.update(.4,true);assert.equal(blockedVideo.playCalls,1);
blockedVideo.rejectPlay=false;doc.dispatchEvent(new Event('pointerdown'));await wait(0);
assert(!blocked.blocked);assert(!blockedVideo.paused);assert.equal(blockedVideo.seekCalls,0);blocked.destroy();

globalThis.matchMedia=()=>({matches:false});
const stalledVideo=new FakeVideo({seekCompletes:false}),stalled=new ScrollVideo(stalledVideo,layer(),reduced);
stalled.update(.7,true);await wait(150);assert.equal(stalledVideo.seekCalls,1);
stalled.update(.1,true);assert.equal(stalledVideo.seekCalls,1);
await wait(1200);assert.equal(stalled.mode,'playback');assert.equal(stalledVideo.playCalls,1);stalled.destroy();

const metadataVideo=new FakeVideo();metadataVideo.load=()=>{};
const metadataLayer=layer(),metadataOnly=new ScrollVideo(metadataVideo,metadataLayer,reduced);
metadataOnly.update(.1,true);await wait(0);metadataVideo.dispatchEvent(new Event('loadedmetadata'));
assert(!metadataLayer.classList.contains('video-ready'));metadataOnly.destroy();

globalThis.fetch=async()=>({ok:false,status:404,headers:{get:()=>null}});
const missing=new ScrollVideo(new FakeVideo(),layer(),reduced);missing.update(.5,true);await wait(0);
assert.equal(missing.mode,'poster');missing.destroy();
globalThis.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'video/mp4'}});
globalThis.matchMedia=()=>({matches:true});
const strictVideo=new FakeVideo(),strict=new ScrollVideo(strictVideo,layer(),reduced,{src:'/desktop.mp4',mobileSrc:'/scrub.mp4',playbackMode:'scrub'});
strict.update(.8,true);await wait(130);assert.equal(strict.src,'/scrub.mp4');assert.equal(strict.mode,'scrub');assert(strictVideo.paused);assert.equal(strictVideo.playCalls,0);
const heldTime=strictVideo.currentTime;await wait(130);assert.equal(strictVideo.currentTime,heldTime);
strict.update(.2,true);await wait(130);assert(strictVideo.currentTime<heldTime);assert.equal(strictVideo.playCalls,0);strict.destroy();
const failedSeekVideo=new FakeVideo({seekCompletes:false}),failedSeek=new ScrollVideo(failedSeekVideo,layer(),reduced,{playbackMode:'scrub'});
failedSeek.update(.5,true);await wait(1400);assert.equal(failedSeek.mode,'poster');assert.equal(failedSeekVideo.playCalls,0);assert(failedSeekVideo.paused);failedSeek.destroy();
Object.assign(globalThis,saved);
console.log('PASS: desktop forward/reverse + one seek; mobile loop without seeks; visibility/reduced pause; blocked autoplay gesture retry; metadata poster; missing file; cleanup.');
