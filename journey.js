import { clamp } from './motion.js';

export function followPoseAt(progress){
  const p=clamp(progress),a=p*3,i=Math.min(2,Math.floor(a)),t=a-i;
  const frames=[
    {yaw:380,pitch:52,roll:12,centerX:.66},
    {yaw:450,pitch:-52,roll:-20,centerX:.35},
    {yaw:520,pitch:36,roll:24,centerX:.68},
    {yaw:570,pitch:0,roll:90,centerX:.56},
  ];
  const s=t*t*(3-2*t),pose={};
  for(const key of Object.keys(frames[0]))pose[key]=frames[i][key]+(frames[i+1][key]-frames[i][key])*s;
  return {...pose,fill:.145,desktopFill:.16,focus:0,elevation:0,fov:34};
}

export function createDepth(root,reduced){
  const elements=[...root.querySelectorAll('.education-copy,.section-heading,.steps li,.valuation-room,.faq>div:first-child,.questions details,.final-cta h2,.invitation')];
  let measurements=[];
  function layout(){measurements=elements.map(el=>({el,top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight}));}
  function update(y,height){
    for(const {el,top,height:h} of measurements){
      if(reduced.matches){el.style.removeProperty('transform');el.style.opacity='1';continue;}
      const position=(top-y)/height;
      if(position>1.2||position< -h/height-.2)continue;
      const entrance=clamp((position-.55)/.5),exit=clamp((-position-.25)/.7);
      const drift=(position-.35)*8;
      el.style.transform=`translate3d(0,${entrance*28-exit*12+drift}px,0) scale(${1-entrance*.025})`;
      el.style.opacity=String(1-entrance*.65);
    }
  }
  layout();return {layout,update,destroy(){elements.forEach(el=>{el.style.removeProperty('transform');el.style.removeProperty('opacity');});}};
}
