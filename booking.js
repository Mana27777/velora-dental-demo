export function createBooking(dialog,track){
  const abort=new AbortController(),signal=abort.signal;
  const days=dialog.querySelector('.booking-days'),times=dialog.querySelector('.booking-times');
  const confirm=dialog.querySelector('#booking-confirm'),summary=dialog.querySelector('.booking-summary');
  const choice=dialog.querySelector('.booking-choice'),result=dialog.querySelector('.booking-result');
  let day='',hour='';
  const select=(parent,value,callback)=>{
    const button=document.createElement('button');button.type='button';button.textContent=value;button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{for(const item of parent.children)item.setAttribute('aria-pressed',String(item===button));callback(value);summary.textContent=day&&hour?`${day}, ${hour}. Horario ilustrativo.`:'Elegí un día y un horario para continuar.';confirm.disabled=!(day&&hour);track('booking_demo_slot_selected');},{signal});parent.append(button);
  };
  for(let i=1;i<=4;i++){const date=new Date();date.setDate(date.getDate()+i);select(days,new Intl.DateTimeFormat('es-AR',{weekday:'short',day:'numeric',month:'short'}).format(date),value=>{day=value;});}
  for(const value of ['09:00','11:30','16:00'])select(times,value,value=>{hour=value;});
  confirm.addEventListener('click',()=>{
    if(!day||!hour)return;
    choice.hidden=true;confirm.hidden=true;summary.hidden=true;result.hidden=false;
    dialog.querySelector('.booking-selection').textContent=`Valoración · ${day} · ${hour} — demostración`;
    track('booking_demo_completed');dialog.querySelector('#booking-restart').focus({preventScroll:true});
  },{signal});
  dialog.querySelector('#booking-restart').addEventListener('click',()=>{choice.hidden=false;confirm.hidden=false;summary.hidden=false;result.hidden=true;days.querySelector('button').focus({preventScroll:true});},{signal});
  return {destroy(){abort.abort();}};
}
