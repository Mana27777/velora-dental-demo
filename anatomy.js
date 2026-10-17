import drawing from './public/illustrations/anatomia-implante.svg?raw';

export function anatomyPose(progress){
  const p=Math.max(0,Math.min(1,progress));
  const ramp=(start,end)=>Math.max(0,Math.min(1,(p-start)/(end-start)));
  return {index:p<.25?0:p<.75?1:2,implant:ramp(.12,.4),crown:ramp(.62,.9),gap:1-ramp(.12,.4)};
}

// Use the existing visible space, rather than inserting a scroll-only track below the controls.
export function anatomyProgress(top,height,viewportHeight,inset=16){
  const travel=viewportHeight-height-inset*2;
  if(!Number.isFinite(top+height+viewportHeight)||travel<64)return null;
  return Math.max(0,Math.min(1,(viewportHeight-height-inset-top)/travel));
}

export function pinnedAnatomyProgress(top,height,stageHeight,offset){
  return Math.max(0,Math.min(1,(offset-top)/Math.max(1,height-stageHeight)));
}

export function createAnatomy(root,reduced){
  const abort=new AbortController(),signal=abort.signal;
  const story=root.querySelector('.anatomy-story'),figure=root.querySelector('.anatomy-drawing');
  const panel=root.querySelector('.anatomy-stage');
  const cards=[...root.querySelectorAll('.anatomy-caption')],buttons=[...root.querySelectorAll('[data-anatomy-state]')];
  const hint=root.querySelector('.anatomy-hint');
  figure.innerHTML=drawing;
  const svg=figure.querySelector('svg');
  let frame=0,manual=false,progress=0,target=0,previous=performance.now(),disposed=false;
  let viewportWidth=innerWidth,viewportHeight=innerHeight,lastScroll=scrollY;
  function render(){
    const pose=anatomyPose(progress);
    svg.style.setProperty('--implant-opacity',pose.implant);
    svg.style.setProperty('--crown-opacity',pose.crown);
    svg.style.setProperty('--gap-opacity',pose.gap);
    root.dataset.anatomyState=String(pose.index+1);
    root.dataset.anatomyProgress=progress.toFixed(4);
    cards.forEach((card,i)=>{card.hidden=!reduced.matches&&i!==pose.index;});
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===pose.index)));
  }
  function tick(now){
    frame=0;if(disposed)return;
    const dt=Math.min(.06,(now-previous)/1000);previous=now;
    progress=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-12*dt));
    if(Math.abs(target-progress)<.001)progress=target;
    render();if(progress!==target)request();
  }
  function request(){if(!frame&&!disposed){previous=performance.now();frame=requestAnimationFrame(tick);}}
  function sync(){
    const rect=story.getBoundingClientRect();
    const stageHeight=panel.offsetHeight,dock=innerWidth<=700?146:126;
    const fits=stageHeight<innerHeight-dock-12;
    story.classList.toggle('anatomy-unpinned',!fits);
    const reserved=stageHeight+'px';
    if(story.style.getPropertyValue('--anatomy-height')!==reserved)story.style.setProperty('--anatomy-height',reserved);
    const next=reduced.matches?1:fits?pinnedAnatomyProgress(rect.top,story.offsetHeight,stageHeight,dock):null;
    root.dataset.anatomyScroll=next===null?'manual':'available';
    hint.textContent=next===null?'Elegí una etapa para explorar el esquema.':'Deslizá para descubrir o elegí una etapa.';
    if(manual)return;
    if(reduced.matches)target=1;
    else if(next!==null)target=next;
    request();
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>{manual=true;target=index/2;request();},{signal});
    button.addEventListener('keydown',event=>{
      const keys={ArrowLeft:(index+2)%3,ArrowRight:(index+1)%3,Home:0,End:2};
      if(!(event.key in keys))return;
      event.preventDefault();buttons[keys[event.key]].focus({preventScroll:true});buttons[keys[event.key]].click();
    },{signal});
  });
  window.addEventListener('scroll',()=>{
    if(Math.abs(scrollY-lastScroll)>.5){manual=false;lastScroll=scrollY;sync();}
  },{passive:true,signal});
  window.addEventListener('resize',()=>{
    // Mobile browser chrome can resize the viewport during a gesture; do not retime its states.
    if(innerWidth!==viewportWidth||Math.abs(innerHeight-viewportHeight)>=120){
      viewportWidth=innerWidth;viewportHeight=innerHeight;sync();
    }
  },{passive:true,signal});
  const resize=new ResizeObserver(sync);resize.observe(panel);
  function mode(){root.classList.toggle('anatomy-reduced',reduced.matches);manual=false;sync();}
  reduced.addEventListener('change',mode,{signal});
  root.classList.add('anatomy-enhanced');mode();render();
  return {destroy(){disposed=true;abort.abort();resize.disconnect();cancelAnimationFrame(frame);}};
}
