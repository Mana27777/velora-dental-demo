import {defineConfig} from 'vite';
// Vite serves public/media directly, including byte ranges; no second video player or middleware.
export default defineConfig(({command})=>({base:command==='build'?'/velora-dental-demo/':'/'}));
