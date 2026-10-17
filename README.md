# VÉLORA

Edición premium: acceso directo a información y consulta, ocho FAQ, esquema SVG con materiales ilustrativos y un único contacto final configurable (WhatsApp o agenda HTTPS autorizada). Sin analítica externa ni datos médicos. La configuración permanece en modo demo.

Demostración conceptual de una landing odontológica interactiva. No representa una clínica real, no brinda atención odontológica ni confirma reservas.

## Desarrollo
Node.js 22. Ejecutar npm ci y npm run dev. Para producción: npm run build. La salida es dist/ y la base de producción es /velora-dental-demo/.

Se usan Vite y Three.js, fuentes locales Fredoka/Nunito, un modelo GLB, un MP4 silencioso y una ilustración SVG educativa. El modelo y la ilustración son conceptuales.

## Contacto
config.js concentra identidad, canal y modo DEMO/REAL. Se mantiene DEMO con selector de día/hora ilustrativos y resumen local, sin guardar ni enviar información. Para citas reales se necesita una agenda HTTPS autorizada y disponibilidad gestionada por la clínica. WhatsApp sigue disponible como canal alternativo configurable, con número autorizado. No se recopilan datos clínicos ni se conecta un proveedor de analítica.

## Publicación y actualizaciones
GitHub Pages usa .github/workflows/deploy.yml. Cada actualización de main instala dependencias con npm ci, verifica contacto, compila, comprueba rutas y publica dist. El resultado figura en Actions y Settings → Pages.

Desde Codex: solicitar actualizar este repositorio con los cambios de 04-WEB, conservando la lista de archivos publicables; comprobar build y workflow antes de declarar éxito. No subir node_modules, dist, archivos .env, capturas, referencias de terceros ni informes internos.

Los originales del proyecto se conservan. El GLB web conserva geometría/materiales con texturas de 1024 px. El video sigue el scroll también en móvil: no hay autoplay en la configuración activa; ante fallo muestra poster. La explicación anatómica dispone de un tramo sticky de lectura de tres estados. El implante acompaña toda la página, disminuye de tamaño y termina horizontal. Explorar 3D habilita arrastre en dos ejes sin bloquear el desplazamiento fuera del objeto. Con movimiento reducido se utiliza un recorrido estático. El render se detiene cuando no hay cambios.

## Recursos y atribuciones
Fredoka y Nunito: licencias SIL Open Font License incluidas en public/fonts. Dependencias gratuitas con sus licencias correspondientes. Los recursos visuales fueron aportados y declarados como generados por el titular del proyecto; esto no constituye una comprobación independiente del plan/licencia de la herramienta generadora. No se concede aquí una licencia de redistribución general del modelo o fotografías. Ver ASSET-NOTICES.md.
