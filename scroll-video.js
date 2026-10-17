// Scroll mode never falls back to autoplay. One seek at a time; poster on failure.
export class ScrollVideo {
  constructor(video,background,reduced,{src=(import.meta.env?.BASE_URL??'/')+'media/consultorio-desktop.mp4',poster='',mobileSrc='',playbackMode='auto'}={}){
    this.mobile=globalThis.matchMedia?.('(max-width: 700px), (pointer: coarse)')??{matches:false};
    this.prefersPlayback=playbackMode==='playback'||(playbackMode==='auto'&&this.mobile.matches);
    Object.assign(this,{video,background,reduced,strictScroll:playbackMode==='scrub',src:this.mobile.matches&&mobileSrc?mobileSrc:src,ready:false,frameReady:false,started:false,busy:false,target:0,visible:false,mode:'poster',lastSeek:0,blocked:false,disposed:false});
    this.abort=new AbortController();
    this.document=globalThis.document;
    if(poster)video.poster=poster;
    video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=!this.strictScroll;
    const on=(target,event,fn,options={})=>target?.addEventListener?.(event,fn,{...options,signal:this.abort.signal});
    on(video,'loadedmetadata',()=>{
      this.ready=Number.isFinite(video.duration)&&video.duration>0;
      if(this.ready){this.mode=this.prefersPlayback?'playback':'scrub';this.sync();}
    });
    on(video,'loadeddata',()=>{this.frameReady=true;this.sync();});
    on(video,'playing',()=>{this.frameReady=true;this.blocked=false;this.refresh();});
    on(video,'seeked',()=>{clearTimeout(this.watchdog);this.busy=false;this.refresh();this.seek();});
    on(video,'error',()=>this.poster());
    on(video,'ended',()=>{if(this.mode==='playback'&&this.canAnimate())this.playVisible();});
    on(this.document,'visibilitychange',()=>this.sync());
    on(reduced,'change',()=>this.sync());
    // Retry muted autoplay on a page gesture, without cancelling touch scrolling.
    const retry=()=>{if(this.blocked&&this.canAnimate()){this.blocked=false;this.playVisible();}};
    on(this.document,'pointerdown',retry,{passive:true});
    on(this.document,'keydown',retry);
  }
  canAnimate(){return !this.disposed&&this.visible&&!this.reduced.matches&&!this.document?.hidden;}
  refresh(){
    this.background.dataset.videoMode=this.blocked?'poster':this.mode;
    this.background.dataset.videoPlayback=this.prefersPlayback?'mobile-loop':this.mobile.matches?'mobile-scrub':'desktop-scrub';
    this.background.dataset.videoBlocked=String(this.blocked);
    const visible=this.frameReady&&this.canAnimate()&&this.mode!=='poster'&&!this.blocked;
    if(visible)this.background.classList.add('video-ready');else this.background.classList.remove('video-ready');
  }
  async load(){
    this.started=true;
    try{
      const response=await fetch(this.src,{method:'HEAD',signal:this.abort.signal});
      if(this.disposed)return;
      if(!response.ok||response.status===204||!response.headers.get('content-type')?.includes('video/')){this.poster();return;}
      this.video.preload='auto';this.video.src=this.src;this.video.load();
    }catch{if(!this.disposed)this.poster();}
  }
  update(progress,visible){
    this.target=Math.min(1,Math.max(0,progress));this.visible=visible;this.sync();
  }
  sync(){
    if(this.disposed)return;
    if(!this.canAnimate()){
      this.video.pause();this.cancelSeek();this.refresh();return;
    }
    if(!this.started)this.load();
    if(this.ready){
      if(this.mode==='playback')this.playVisible();
      else if(this.mode==='scrub')this.seek();
    }
    this.refresh();
  }
  seek(){
    if(!this.ready||this.mode!=='scrub'||this.busy||!this.canAnimate())return;
    const time=this.target*Math.max(0,this.video.duration-.05);
    if(Math.abs(this.video.currentTime-time)<.045)return;
    const wait=85-(performance.now()-this.lastSeek);
    if(wait>0){if(!this.deferred)this.deferred=setTimeout(()=>{this.deferred=0;this.seek();},wait);return;}
    this.busy=true;this.lastSeek=performance.now();
    try{
      this.video.currentTime=time;
      clearTimeout(this.watchdog);
      this.watchdog=setTimeout(()=>{this.busy=false;if(this.video.seeking)this.playback();else this.seek();},1200);
    }catch{this.playback();}
  }
  cancelSeek(){clearTimeout(this.watchdog);clearTimeout(this.deferred);this.deferred=0;this.busy=false;}
  playVisible(){
    if(!this.canAnimate()||this.mode!=='playback'||this.blocked||this.playRequest||!this.video.paused)return;
    try{
      this.playRequest=Promise.resolve(this.video.play()).then(()=>{
        if(!this.canAnimate())this.video.pause();
      }).catch(()=>{
        if(!this.disposed){this.blocked=true;this.video.pause();this.refresh();}
      }).finally(()=>{this.playRequest=null;});
    }catch{this.blocked=true;this.refresh();}
  }
  playback(){
    if(this.strictScroll){this.poster();return;}
    this.cancelSeek();this.mode='playback';this.video.muted=true;
    this.playVisible();this.refresh();
  }
  poster(){this.cancelSeek();this.mode='poster';this.frameReady=false;this.video.pause();this.refresh();}
  destroy(){
    this.disposed=true;this.abort.abort();this.cancelSeek();this.video.pause();
    this.video.removeAttribute('src');this.video.load();this.refresh();
  }
}

