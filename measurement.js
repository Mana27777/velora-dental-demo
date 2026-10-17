// Local integration points only: no fetch, storage, cookies or analytics provider.
const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
export function campaignFrom(search){
  const params=new URLSearchParams(search),campaign={};
  for(const key of campaignKeys){
    const value=params.get(key)?.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,120);
    if(value)campaign[key]=value;
  }
  return Object.freeze(campaign);
}
export function createMeasurement({target=window,search=location.search}={}){
  const campaign=campaignFrom(search);
  return function track(event,mode='demo'){
    if(!['page_view','education_interaction','education_view','contact_section_view','whatsapp_cta_click','whatsapp_open_attempt','booking_cta_click','booking_open_attempt','booking_demo_slot_selected','booking_demo_completed'].includes(event))return;
    const contactMode=mode==='configured'?'configured':'demo';
    const detail={
      event,
      section:event==='page_view'?'inicio':event.startsWith('education')?'educacion':'consulta',
      campaign,
      appointment_confirmed:false,
      contact_mode:contactMode,
      message_sent:false,conversation_started:false,
      ...(event.endsWith('open_attempt')?{action:'open_attempt_only'}:{})
    };
    target.dispatchEvent(new CustomEvent('velora:measurement',{detail}));
  };
}

// Development-only laboratory sample. No network, identifiers or field-INP claim.
export function observeLabPerformance(root){
  const values={lcpMs:null,cls:0,maxEventDurationMs:null,conditions:'IAB local; no CPU/network throttling; not field data'},observers=[];
  if(typeof PerformanceObserver==='undefined')return ()=>{};
  let shiftStart=0,shiftLast=0,shiftValue=0;
  const publish=()=>{root.dataset.labPerformance=JSON.stringify(values);};
  function observe(type,consume,extra={}){
    if(!PerformanceObserver.supportedEntryTypes.includes(type))return;
    const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())consume(entry);publish();});
    observer.observe({type,buffered:true,...extra});observers.push(observer);
  }
  observe('largest-contentful-paint',e=>{values.lcpMs=Math.round(e.startTime);});
  observe('layout-shift',e=>{if(e.hadRecentInput)return;if(e.startTime-shiftLast>1000||e.startTime-shiftStart>5000){shiftStart=e.startTime;shiftValue=0;}shiftLast=e.startTime;shiftValue+=e.value;values.cls=Math.max(values.cls,shiftValue);});
  observe('event',e=>{values.maxEventDurationMs=Math.max(values.maxEventDurationMs??0,e.duration);},{durationThreshold:16});
  publish();return ()=>observers.forEach(observer=>observer.disconnect());
}
