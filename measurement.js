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
    if(!['education_view','contact_section_view','whatsapp_cta_click','whatsapp_open_attempt'].includes(event))return;
    const contactMode=mode==='configured'?'configured':'demo';
    const detail={
      event,
      section:event==='education_view'?'educacion':'consulta',
      campaign,
      appointment_confirmed:false,
      contact_mode:contactMode,
      message_sent:false,conversation_started:false,
      ...(event==='whatsapp_open_attempt'?{action:'open_attempt_only'}:{})
    };
    target.dispatchEvent(new CustomEvent('velora:measurement',{detail}));
  };
}
