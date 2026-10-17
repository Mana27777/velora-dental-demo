import map from './animation-map.json';
export const animationMap=map;
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const narrativeProgress=(scroll,start,trackHeight,sceneHeight)=>clamp((scroll-start)/Math.max(1,trackHeight-sceneHeight));
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function poseAt(progress){
  const keys=map.timeline;let i=0;while(i<keys.length-2&&progress>keys[i+1].p)i++;
  const a=keys[i],b=keys[i+1],t=smooth((progress-a.p)/(b.p-a.p)),pose={};
  for(const name of ['yaw','pitch','roll','fill','desktopFill','centerX','focus','elevation','fov'])pose[name]=a[name]+(b[name]-a[name])*t;
  return pose;
}
export function chapterAt(p){
  const index=clamp(Math.round(p*5),0,5),distance=Math.abs(p-index/5);
  return {index,opacity:1-smooth((distance-.082)/.018),entrance:smooth((distance-.07)/.03)};
}
