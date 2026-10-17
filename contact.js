export function contactFrom(config){
  if(config.channel==='booking'){
    let url=null;
    try{const candidate=new URL(config.bookingUrl);if(config.mode==='REAL'&&config.bookingAuthorized===true&&candidate.protocol==='https:'&&!candidate.username&&!candidate.password)url=candidate.href;}catch{}
    return {mode:url?'configured':'demo',url,channel:'booking'};
  }
  const real=config.mode==='REAL'&&config.numberAuthorized===true&&/^[1-9]\d{6,14}$/.test(config.whatsappNumber);
  return {mode:real?'configured':'demo',url:real?'https://wa.me/'+config.whatsappNumber+'?text='+encodeURIComponent(config.message):null};
}
