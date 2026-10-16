# VÉLORA

Demostración conceptual de una landing odontológica interactiva. No representa una clínica real, no brinda atención odontológica ni confirma reservas.

## Desarrollo
Node.js 22. Ejecutar npm ci y npm run dev. Para producción: npm run build. La salida es dist/ y la base de producción es /velora-dental-demo/.

Se usan Vite y Three.js, fuentes locales Fredoka/Nunito, un modelo GLB, un MP4 silencioso y una ilustración SVG educativa. El modelo y la ilustración son conceptuales.

## Contacto
config.js concentra la identidad comercial y el modo DEMO/REAL. Se mantiene DEMO, sin número. REAL exige número internacional válido y autorización explícita. No se recopilan datos clínicos ni se conecta un proveedor de analítica.

## Publicación y actualizaciones
GitHub Pages usa .github/workflows/deploy.yml. Cada actualización de main instala dependencias con npm ci, verifica contacto, compila, comprueba rutas y publica dist. El resultado figura en Actions y Settings → Pages.

Desde Codex: solicitar actualizar este repositorio con los cambios de 04-WEB, conservando la lista de archivos publicables; comprobar build y workflow antes de declarar éxito. No subir node_modules, dist, archivos .env, capturas, referencias de terceros ni informes internos.

Los originales del proyecto se conservan fuera de este repositorio. El MP4 en public/media y el mapa animation-map.json permiten compilar sin carpetas privadas externas.

## Recursos y atribuciones
Fredoka y Nunito: licencias SIL Open Font License incluidas en public/fonts. Dependencias gratuitas con sus licencias correspondientes. Los recursos visuales fueron aportados y declarados como generados por el titular del proyecto; esto no constituye una comprobación independiente del plan/licencia de la herramienta generadora. No se concede aquí una licencia de redistribución general del modelo o fotografías. Ver ASSET-NOTICES.md.
