import './anatomy.css';
import { createAnatomy } from './anatomy.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { commercial, whatsappMessage, clinicInformation, clinicVideo } from './config.js';
import { contactFrom } from './contact.js';
import { ScrollVideo } from './scroll-video.js';
import { poseAt, chapterAt, clamp } from './motion.js';
import { createMeasurement } from './measurement.js';

const abort=new AbortController();
const on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:abort.signal});
const params=new URLSearchParams(location.search);
const qa=import.meta.env.DEV&&params.has('qa');
const measure=createMeasurement();
if(qa)on(window,'velora:measurement',e=>{document.documentElement.dataset.lastMeasurement=JSON.stringify(e.detail);});
const systemReduced=matchMedia('(prefers-reduced-motion: reduce)');
const reduced=qa&&params.get('motion')==='reduce'?{matches:true,addEventListener(){}}:systemReduced;
const anatomy=createAnatomy(document.querySelector('#educacion'),reduced);
const stage=document.querySelector('.scroll-stage'),hero=document.querySelector('.hero');
const container=document.querySelector('.product'),canvas=container.querySelector('canvas');
const chapters=[...document.querySelectorAll('.chapter')],labels=document.querySelector('.component-labels');
const counter=document.querySelector('.moment-counter'),track=document.querySelector('.progress-track span');
const videoLayer=document.querySelector('.hero-video');
const video=new ScrollVideo(videoLayer.querySelector('video'),videoLayer,reduced,qa&&params.get('video')==='off'?{...clinicVideo,src:'/media/qa-unavailable.mp4'}:clinicVideo);
const measureModel=qa;
const dialog=document.querySelector('#mensaje-demo');
document.querySelector('#prepared-message').textContent=whatsappMessage;
const cta=document.querySelector('.cta');
const contact=contactFrom(commercial),ctaUrl=contact.url;
cta.querySelector('.cta-label').textContent=commercial.buttonTitle;
document.title=commercial.clinicName+' — Valoración odontológica';
if(commercial.clinicName!=='VÉLORA DENTAL')document.querySelectorAll('.identity').forEach(el=>{el.textContent=commercial.clinicName;el.setAttribute('aria-label',commercial.clinicName+', inicio');});
if(ctaUrl)document.querySelector('footer>p').hidden=true;
if(ctaUrl){
  cta.href=ctaUrl;
  cta.querySelector('.cta-label').textContent='SOLICITAR VALORACIÓN POR WHATSAPP';
  document.querySelector('#contact-state').textContent='Se abrirá WhatsApp para enviar tu consulta. La solicitud no confirma un turno.';
}
else{
  cta.setAttribute('aria-haspopup','dialog');
  on(cta,'click',e=>{e.preventDefault();dialog.showModal();});
}
on(cta,'click',()=>{
  measure('whatsapp_cta_click',contact.mode);
  if(ctaUrl)measure('whatsapp_open_attempt',contact.mode);
});
document.querySelector('#contact-state').textContent=ctaUrl?'Se abrirá WhatsApp para consultar disponibilidad. No se reserva automáticamente un turno.':'Podés ver y copiar el mensaje antes de consultar. No se enviará automáticamente.';
const contactViews=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){measure('contact_section_view',contact.mode);contactViews.disconnect();}},{threshold:.3});
contactViews.observe(document.querySelector('#consulta'));
on(document.querySelector('.dialog-close'),'click',()=>dialog.close());
on(dialog,'click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
on(document.querySelector('#copy-message'),'click',async()=>{
  try{await navigator.clipboard.writeText(whatsappMessage);document.querySelector('.copy-status').textContent='Mensaje copiado. No se envió a ningún contacto.';}
  catch{document.querySelector('.copy-status').textContent='Seleccioná el mensaje para copiarlo manualmente.';}
});
for(const [key,label] of [['environment','Ambiente'],['team','Equipo profesional'],['location','Ubicación'],['hours','Horarios'],['contact','Contacto']]){
  if(!clinicInformation[key])continue;
  const dl=document.createElement('dl'),dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=label;dd.textContent=clinicInformation[key];dl.append(dt,dd);document.querySelector('.clinic-info').append(dl);
}
const reveals=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveals.unobserve(e.target);}}),{threshold:.12});
document.body.classList.add('motion-ready');document.querySelectorAll('.reveal').forEach(el=>reveals.observe(el));
const education=document.querySelector('#educacion');
const educationViews=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>=.35){measure('education_view');educationViews.disconnect();break;}}},{threshold:.35});
educationViews.observe(education.querySelector('.education-copy'));

let renderer,scene,camera,group,manualRig,model,environment,observer;
let frame=0,disposed=false,failed=false,lastTime=0,lastRender=-Infinity,lastMeasurement=-Infinity;
let target=0,progress=0,orientationProgress=0,pointer=null,returning=false,manualHold=false;
let velocityX=0,velocityY=0,lastInteraction=performance.now(),viewWidth=1,viewHeight=1;
const identity=new THREE.Quaternion(),axisY=new THREE.Vector3(0,1,0),axisX=new THREE.Vector3(1,0,0);
const qYaw=new THREE.Quaternion(),qPitch=new THREE.Quaternion(),manualOffset=new THREE.Quaternion();
const v=new THREE.Vector3(),samples=[],allVertices=[];
const damp=(a,b,lambda,dt)=>THREE.MathUtils.damp(a,b,lambda,dt),rad=THREE.MathUtils.degToRad;

function staticMode(){
  document.body.classList.toggle('static-story',reduced.matches||failed);
  document.body.classList.toggle('no-webgl',failed);
}
function syncTarget(){target=clamp((scrollY-stage.offsetTop)/Math.max(1,stage.offsetHeight-innerHeight));}
function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
function projectedBounds(points){
  let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
  for(const point of points){
    v.copy(point).applyMatrix4(manualRig.matrixWorld).project(camera);
    left=Math.min(left,v.x);right=Math.max(right,v.x);top=Math.max(top,v.y);bottom=Math.min(bottom,v.y);
  }
  return {left,right,top,bottom,height:top-bottom,width:right-left};
}
function setPose(pose,time){
  const mobile=viewWidth<=700,tablet=viewWidth>700&&viewWidth<=1050;
  group.rotation.set(rad(pose.pitch),rad(-32+pose.yaw),rad(pose.roll),'YXZ');
  manualRig.quaternion.copy(manualOffset);
  group.position.set(0,0,0);group.updateMatrixWorld(true);
  const manualActive=manualHold||pointer||returning;
  camera.fov=pose.fov;
  camera.clearViewOffset();camera.updateProjectionMatrix();
  let desired=reduced.matches?.82:mobile?pose.fill:tablet?pose.fill:pose.desktopFill;
  const maxWidth=mobile?.88:tablet?.76:.46;
  const detailWeight=clamp(pose.focus/.45);
  const maxHeight=reduced.matches?.88:mobile?.68+detailWeight*.07:tablet?.63+detailWeight*.07:.92;
  desired=Math.min(desired,maxHeight);
  desired*=.975; // Reserve a small margin for vertices between framing samples.
  const focus=manualActive?pose.focus*.3:pose.focus;
  let distance=2.3/(2*Math.tan(rad(camera.fov/2))*desired);
  // Fit actual sampled geometry after each orientation; no CSS scaling or opaque product frame.
  for(let i=0;i<3;i++){
    camera.position.set(0,focus+pose.elevation,distance);camera.lookAt(0,focus,0);camera.updateMatrixWorld();
    const b=projectedBounds(samples);
    const ratio=Math.max(b.height/(desired*2),b.width/(maxWidth*2));
    if(Math.abs(ratio-1)<.002)break;distance*=ratio;
  }
  camera.position.set(0,focus+pose.elevation,distance);camera.lookAt(0,focus,0);camera.updateMatrixWorld();
  const b=projectedBounds(samples);
  const x=reduced.matches?.5:mobile?.5:tablet?.5:pose.centerX;
  // The mobile text has its own top band; geometry remains below it for every pose.
  const centerY=reduced.matches?.5:mobile?.645-detailWeight*.03:tablet?.65-detailWeight*.035:.53;
  camera.setViewOffset(viewWidth,viewHeight,((b.left+b.right)/2-(x*2-1))*viewWidth/2,((1-centerY*2)-(b.top+b.bottom)/2)*viewHeight/2,viewWidth,viewHeight);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  if(stage.dataset.moment==='4'){
    const bounds=projectedBounds(samples);
    const top=(1-bounds.top)*viewHeight/2,height=bounds.height*viewHeight/2;
    const center=(bounds.left+bounds.right+2)*viewWidth/4;
    for(const [key,fraction,left] of [['crown',.2,true],['abutment',.48,false],['implant',.78,true]]){
      const label=labels.querySelector('.label-'+key),y=top+height*fraction;
      const labelX=left?viewWidth*.04:viewWidth*.78;
      label.style.cssText='left:'+labelX+'px;top:'+(y-18)+'px;right:auto;bottom:auto';
      const start=left?labelX+label.offsetWidth+5:labelX-5;
      const end=center+(left?-1:1)*viewWidth*.025;
      labels.querySelector('[data-arrow="'+key+'"]').setAttribute('d','M'+start+' '+y+' L'+end+' '+y);
    }
  }
  container.dataset.rotation=String(group.rotation.y);
  container.dataset.pitch=String(group.rotation.x);
  container.dataset.manual=JSON.stringify(manualOffset.toArray());
  container.dataset.camera=JSON.stringify({distance,focus,elevation:pose.elevation,fov:pose.fov});
  if(measureModel&&time-lastMeasurement>200){
    lastMeasurement=time;
    const bounds=projectedBounds(allVertices),r=canvas.getBoundingClientRect();
    container.dataset.modelBounds=JSON.stringify({left:r.left+(bounds.left+1)*r.width/2,right:r.left+(bounds.right+1)*r.width/2,top:r.top+(1-bounds.top)*r.height/2,bottom:r.top+(1-bounds.bottom)*r.height/2,height:bounds.height*r.height/2});
  }
}
function addManual(dx,dy){
  qYaw.setFromAxisAngle(axisY,dx);qPitch.setFromAxisAngle(axisX,dy);
  manualOffset.premultiply(qYaw).premultiply(qPitch).normalize();
}
function draw(time){
  frame=0;const dt=Math.min((time-lastTime)/1000||1/60,.05);lastTime=time;
  progress=reduced.matches?0:damp(progress,target,11,dt);
  if(!manualHold&&!pointer)orientationProgress=damp(orientationProgress,progress,returning?5:14,dt);
  if(returning&&!pointer){
    manualOffset.slerp(identity,1-Math.exp(-5*dt));velocityX=velocityY=0;
    if(manualOffset.angleTo(identity)<.0002&&Math.abs(orientationProgress-progress)<.0002){manualOffset.identity();returning=false;}
  }else if(!pointer&&!reduced.matches&&(Math.abs(velocityX)+Math.abs(velocityY)>.001)){
    addManual(velocityX*dt,velocityY*dt);velocityX*=Math.exp(-7*dt);velocityY*=Math.exp(-7*dt);
  }
  stage.dataset.progress=String(progress);stage.dataset.target=String(target);
  stage.dataset.settled=String(Math.abs(progress-target)<.0004);
  const {index,opacity,entrance}=chapterAt(progress);
  stage.dataset.moment=String(index+1);
  chapters.forEach((el,i)=>{
    const visible=reduced.matches||failed||i===index;
    el.classList.toggle('active',visible);el.inert=!visible;el.setAttribute('aria-hidden',String(!visible));
    el.style.opacity=String(i===index?opacity:0);
    el.style.transform=`translate3d(${(i%2?1:-1)*entrance*(viewWidth<=700?18:45)}px,${entrance*12}px,0)`;
  });
  labels.style.opacity=String(!failed&&!reduced.matches&&!manualHold&&!pointer&&!returning&&index===3?opacity:0);
  labels.setAttribute('aria-hidden',String(index!==3||reduced.matches||failed));
  counter.textContent=`0${index+1} / 06`;track.style.transform=`scaleX(${progress})`;
  const rect=hero.getBoundingClientRect(),visible=rect.bottom>0&&rect.top<innerHeight&&!document.hidden;
  video.update(target,visible&&!failed);
  if(model&&visible){
    const pose=poseAt(progress),orientation=poseAt(orientationProgress);
    pose.yaw=orientation.yaw;pose.pitch=orientation.pitch;pose.roll=orientation.roll;
    if(!manualHold&&!pointer&&!returning&&!reduced.matches&&time-lastInteraction>2600)pose.yaw+=Math.sin(time*.00023)*1.2;
    setPose(pose,time);
    if(renderer&&time-lastRender>1000/45){renderer.render(scene,camera);lastRender=time;}
  }
  if(visible&&model&&!reduced.matches||!reduced.matches&&Math.abs(progress-target)>.0001||returning)requestDraw();
}
function reset(){
  if(pointer&&canvas.hasPointerCapture(pointer.id))canvas.releasePointerCapture(pointer.id);
  pointer=null;canvas.classList.remove('dragging');velocityX=velocityY=0;manualHold=false;returning=true;lastInteraction=performance.now();
  if(reduced.matches){manualOffset.identity();returning=false;}requestDraw();
}
on(document.querySelector('#reset-view'),'click',reset);
on(canvas,'pointerdown',e=>{
  if(!e.isPrimary||e.button!==0||!model)return;
  lastInteraction=performance.now();velocityX=velocityY=0;returning=false;
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),axis:e.pointerType==='mouse'?'explore':null};
  if(pointer.axis){manualHold=true;canvas.setPointerCapture(e.pointerId);}
  requestDraw();
});
on(canvas,'pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(!pointer.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8){
    pointer.axis=Math.abs(dx)>Math.abs(dy)*1.15?'explore':'scroll';
    if(pointer.axis==='explore'){manualHold=true;canvas.setPointerCapture(e.pointerId);}
  }
  if(pointer.axis!=='explore')return;
  canvas.classList.add('dragging');lastInteraction=performance.now();
  const now=performance.now(),deltaX=(e.clientX-pointer.lastX)*.011,deltaY=(e.clientY-pointer.lastY)*.009,dt=Math.max(.016,(now-pointer.time)/1000);
  addManual(deltaX,deltaY);velocityX=clamp(deltaX/dt,-2.3,2.3);velocityY=clamp(deltaY/dt,-1.6,1.6);
  pointer.lastX=e.clientX;pointer.lastY=e.clientY;pointer.time=now;requestDraw();
});
function release(e){
  if(!pointer||pointer.id!==e.pointerId)return;
  const id=pointer.id;pointer=null;canvas.classList.remove('dragging');
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);lastInteraction=performance.now();requestDraw();
}
on(window,'pointerup',release);
on(canvas,'pointercancel',e=>{velocityX=velocityY=0;release(e);});
on(canvas,'lostpointercapture',e=>{if(pointer)release(e);});
on(canvas,'keydown',e=>{
  const moves={ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]};
  if(moves[e.key]){e.preventDefault();addManual(...moves[e.key]);manualHold=true;returning=false;velocityX=velocityY=0;lastInteraction=performance.now();requestDraw();}
  else if(e.key==='Home'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();reset();}
});
on(window,'scroll',()=>{
  syncTarget();lastInteraction=performance.now();
  if(!pointer&&manualHold){manualHold=false;returning=true;}
  requestDraw();
},{passive:true});
on(document,'visibilitychange',()=>{lastInteraction=performance.now();requestDraw();});
on(reduced,'change',()=>{staticMode();reset();syncTarget();requestDraw();});
function fail(message){
  if(disposed)return;failed=true;staticMode();container.querySelector('.load-status').textContent=message;
  container.classList.remove('loaded');
  document.querySelector('#reset-view').hidden=true;syncTarget();requestDraw();
}
try{
  if(qa&&params.get('webgl')==='off')throw new Error('QA: WebGL unavailable');
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0xf6f0e8,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(33,1,.01,100);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff8ec,0x899194,1.7));
  const key=new THREE.DirectionalLight(0xfff5e6,2.7);key.position.set(-3,4,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,2);rim.position.set(3,2,-2);scene.add(rim);
  group=new THREE.Group();manualRig=new THREE.Group();group.add(manualRig);scene.add(group);
  observer=new ResizeObserver(()=>{
    const r=container.getBoundingClientRect();viewWidth=Math.max(1,r.width);viewHeight=Math.max(1,r.height);
    renderer.setSize(viewWidth,viewHeight,false);camera.aspect=viewWidth/viewHeight;camera.updateProjectionMatrix();syncTarget();requestDraw();
  });observer.observe(container);
  new GLTFLoader().load(import.meta.env.BASE_URL+'models/velora-implante-v1.glb',gltf=>{
    if(disposed){disposeModel(gltf.scene);return;}
    model=gltf.scene;
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0){disposeModel(model);model=null;fail('El modelo no está disponible. Podés consultar la información a continuación.');return;}
    model.position.sub(center);const normalizer=new THREE.Group();normalizer.add(model);normalizer.scale.setScalar(2.3/size.y);manualRig.add(normalizer);manualRig.updateMatrixWorld(true);
    let meshes=0,vertices=0;
    model.traverse(o=>{
      if(!o.isMesh)return;meshes++;const a=o.geometry.attributes.position;vertices+=a.count;
      const stride=Math.max(1,Math.ceil(a.count/1200));
      for(let i=0;i<a.count;i++){const point=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);allVertices.push(point);if(i%stride===0)samples.push(point);}
    });
    container.dataset.meshes=String(meshes);container.dataset.vertices=String(vertices);
    container.classList.add('loaded');container.dataset.modelLoaded='true';requestDraw();
  },undefined,()=>fail('La vista del implante no está disponible. El contenido sigue a continuación.'));
  on(canvas,'webglcontextlost',e=>{e.preventDefault();renderer?.dispose();renderer=null;fail('La vista 3D no está disponible. Podés explorar toda la información.');});
}catch{renderer?.dispose();renderer=null;fail('Tu navegador no tiene vista 3D. Podés explorar la información a continuación.');}
function disposeModel(root){
  const textures=new Set(),materials=new Set(),geometries=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
}
function cleanup(){
  disposed=true;abort.abort();cancelAnimationFrame(frame);observer?.disconnect();reveals.disconnect();educationViews.disconnect();contactViews.disconnect();video.destroy();anatomy.destroy();
  if(model)disposeModel(model);environment?.dispose();renderer?.dispose();
}
on(window,'pagehide',e=>{if(!e.persisted)cleanup();});
if(import.meta.hot)import.meta.hot.dispose(cleanup);
staticMode();syncTarget();requestDraw();

