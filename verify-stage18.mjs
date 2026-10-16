import assert from 'node:assert/strict';
import {contactFrom} from './contact.js';
import {commercial} from './config.js';
import {campaignFrom,createMeasurement} from './measurement.js';
assert.equal(contactFrom(commercial).url,null);
for(const number of ['', '+123','123 456','0000000','1234567890123456']){
 assert.equal(contactFrom({...commercial,mode:'REAL',numberAuthorized:true,whatsappNumber:number}).url,null);
}
// Synthetic digits test formatting only; never opened or used as a recipient.
const sample={...commercial,mode:'REAL',numberAuthorized:true,whatsappNumber:'12345678901'};
assert.equal(contactFrom(sample).url,'https://wa.me/12345678901?text='+encodeURIComponent(sample.message));
assert.equal(contactFrom({...sample,numberAuthorized:false}).url,null);
assert.equal(contactFrom({...sample,mode:'DEMO'}).url,null);
const campaign=campaignFrom('?utm_source=test&utm_term=implant&patient=private');
assert.deepEqual({...campaign},{utm_source:'test',utm_term:'implant'});
const events=[],target=new EventTarget();
target.addEventListener('velora:measurement',e=>events.push(e.detail));
const track=createMeasurement({target,search:'?utm_campaign=qa'});
track('contact_section_view');track('whatsapp_cta_click');track('whatsapp_open_attempt','configured');track('generate_lead');track('whatsapp_intent');
assert.equal(events.length,3);
assert(events.every(e=>e.appointment_confirmed===false&&e.message_sent===false));
console.log('PASS: configuración segura, enlace codificado, UTM limitado y eventos sin conversiones falsas.');
