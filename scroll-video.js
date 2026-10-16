// One local player, one seek in flight. A stalled decoder never holds page scroll.
export class ScrollVideo {
  constructor(video,background,reduced,{src=(import.meta.env?.BASE_URL??'/')+'media/consultorio-scroll.mp4',poster=''}={}){
    Object.assign(this,{video,background,reduced,src,ready:false,started:false,busy:false,target:0,visible:false,mode:'poster',lastSeek:0});
    this.abort=new AbortController();
    if(poster)video.poster=poster;video.muted=true;video.playsInline=true;
    const on=(event,fn)=>video.addEventListener(event,fn,{signal:this.abort.signal});
    on('loadedmetadata',()=>{this.ready=Number.isFinite(video.duration)&&video.duration>0;if(this.ready){this.mode='scrub';this.seek();}});
    on('loadeddata',()=>{if(!this.reduced.matches)this.background.classList.add('video-ready');});
    on('seeked',()=>{clearTimeout(this.watchdog);this.busy=false;this.seek();});
    on('error',()=>this.poster());
    video.addEventListener('ended',()=>{if(this.mode==='playback'&&this.visible){video.currentTime=0;video.play().catch(()=>this.poster());}},{signal:this.abort.signal});
  }
  async load(){
    this.started=true;
    try{
      const response=await fetch(this.src,{method:'HEAD',signal:this.abort.signal});
      if(!response.ok||response.status===204||!response.headers.get('content-type')?.includes('video/')){this.poster();return;}
      this.video.preload='auto';this.video.src=this.src;this.video.load();
    }catch{this.poster();}
  }
  update(progress,visible){
    this.target=Math.min(1,Math.max(0,progress));this.visible=visible;
    this.background.dataset.videoMode=this.mode;
    if(this.reduced.matches){this.video.pause();this.background.classList.remove('video-ready');return;}
    if(visible&&!this.started)this.load();
    if(!visible){this.video.pause();return;}
    if(this.mode==='playback'){if(this.video.paused)this.video.play().catch(()=>this.poster());return;}
    if(this.ready&&this.mode==='scrub'){this.background.classList.add('video-ready');this.seek();}
  }
  seek(){
    if(!this.ready||this.mode!=='scrub'||this.busy||!this.visible||this.reduced.matches)return;
    const time=this.target*Math.max(0,this.video.duration-.05);
    if(Math.abs(this.video.currentTime-time)<.045)return;
    const wait=85-(performance.now()-this.lastSeek);
    if(wait>0){if(!this.deferred)this.deferred=setTimeout(()=>{this.deferred=0;this.seek();},wait);return;}
    this.busy=true;this.lastSeek=performance.now();
    try{
      this.video.currentTime=time;
      clearTimeout(this.watchdog);
      this.watchdog=setTimeout(()=>{this.busy=false;if(this.video.seeking)this.playback();else this.seek();},2200);
    }catch{this.playback();}
  }
  playback(){
    clearTimeout(this.watchdog);clearTimeout(this.deferred);this.deferred=0;this.busy=false;
    this.mode='playback';this.video.muted=true;
    if(this.visible&&!this.reduced.matches)this.video.play().catch(()=>this.poster());
  }
  poster(){clearTimeout(this.watchdog);clearTimeout(this.deferred);this.deferred=0;this.busy=false;this.mode='poster';this.background.classList.remove('video-ready');this.video.pause();}
  destroy(){this.abort.abort();clearTimeout(this.watchdog);clearTimeout(this.deferred);this.video.pause();this.video.removeAttribute('src');this.video.load();}
}

