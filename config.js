// Número internacional, solo dígitos. Vacío mantiene el botón en modo demo.
export const commercial = {
  clinicName: 'VÉLORA DENTAL',
  mode: 'DEMO', // REAL exige número válido y autorización explícita.
  whatsappNumber: '', // Internacional, solo dígitos; no usar números inventados.
  numberAuthorized: false,
  message: 'Hola, quisiera solicitar una valoración de implantología. ¿Qué turnos tienen disponibles?',
  buttonTitle: 'SOLICITAR VALORACIÓN POR WHATSAPP',
};
export const whatsappNumber = commercial.whatsappNumber;
export const whatsappMessage = commercial.message;
// Completar únicamente con información autorizada del cliente real.
export const clinicInformation = {
  environment: '', team: '', location: '', hours: '', contact: '',
};
const asset=(path)=>(import.meta.env?.BASE_URL??'/')+path;
export const clinicVideo = { src: asset('media/consultorio-desktop.mp4'), mobileSrc: asset('media/consultorio-mobile.mp4'), playbackMode: 'auto', poster: asset('images/recepcion-velora.webp') };
// Slot educativo reservado. No se carga ni se representa anatomía sin un recurso aprobado.
export const anatomyResource = { src: '', approved: false };
