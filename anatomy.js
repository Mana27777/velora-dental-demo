import drawing from './public/illustrations/anatomia-implante.svg?raw';

export function anatomyPose(progress){
  const p=Math.max(0,Math.min(1,progress));
  const ramp=(start,end)=>Math.max(0,Math.min(1,(p-start)/(end-start)));
  return {index:p<.25?0:p<.75?1:2,implant:ramp(.12,.4),crown:ramp(.62,.9),gap:1-ramp(.12,.4)};
}

export function createAnatomy(root,reduced){
  const abort=new AbortController(),signal=abort.signal;
  const story=root.querySelector('.anatomy-story'),figure=root.querySelector('.anatomy-drawing');
  const cards=[...root.querySelectorAll('.anatomy-caption')],buttons=[...root.querySelectorAll('[data-anatomy-state]')];
  figure.innerHTML=drawing;
  const svg=figure.querySelector('svg');
  let frame=0,manual=false,progress=0,target=0,previous=performance.now(),disposed=false;
  function render(){
    const pose=anatomyPose(progress);
    svg.style.setProperty('--implant-opacity',pose.implant);
    svg.style.setProperty('--crown-opacity',pose.crown);
    svg.style.setProperty('--gap-opacity',pose.gap);
    root.dataset.anatomyState=String(pose.index+1);
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
    if(manual)return;
    const rect=story.getBoundingClientRect();
    target=Math.max(0,Math.min(1,-rect.top/Math.max(1,story.offsetHeight-innerHeight)));
    if(reduced.matches)target=1;
    request();
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>{manual=true;target=index/2;request();},{signal});
    button.addEventListener('keydown',event=>{
      const keys={ArrowLeft:(index+2)%3,ArrowRight:(index+1)%3,Home:0,End:2};
      if(!(event.key in keys))return;event.preventDefault();buttons[keys[event.key]].focus();buttons[keys[event.key]].click();
    },{signal});
  });
  window.addEventListener('scroll',()=>{manual=false;sync();},{passive:true,signal});
  window.addEventListener('resize',sync,{passive:true,signal});
  function mode(){root.classList.toggle('anatomy-reduced',reduced.matches);manual=false;sync();}
  reduced.addEventListener('change',mode,{signal});
  root.classList.add('anatomy-enhanced');mode();render();
  return {destroy(){disposed=true;abort.abort();cancelAnimationFrame(frame);}};
}
