export function contactFrom(config){
  const real=config.mode==='REAL'&&config.numberAuthorized===true&&/^[1-9]\d{6,14}$/.test(config.whatsappNumber);
  return {mode:real?'configured':'demo',url:real?'https://wa.me/'+config.whatsappNumber+'?text='+encodeURIComponent(config.message):null};
}
