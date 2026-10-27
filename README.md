# Beauty Tech Retail Experience

**Versión 32.** Demostración local con cinco estaciones, un sensor, franjas de edad orientativas y procesamiento de cámara en el navegador.

## Inicio rápido en Windows

1. Extrae el proyecto completo.
2. Ejecuta `INICIAR-DEMO.bat`, o desde PowerShell en esta carpeta: `py .\iniciar_demo.py`.
3. Usa la dirección local que se abre; deja la ventana del servidor activa.

No requiere Node, paquetes Python, claves ni conexión a internet para la detección local y los vídeos incluidos. No abras `index.html` con doble clic: la cámara y los módulos necesitan el servidor local de `127.0.0.1`.

## Recorrido

1. Pulsa **Descubre tu selección** y lee el aviso de privacidad.
2. **Activar cámara** solicita permiso y abre un escaneo de hasta 20 segundos; **Prefiero no usar la cámara** continúa sin estimar edad.
3. Con una persona visible, el modelo local toma diez lecturas y usa la mediana. Solo muestra una franja amplia, nunca una edad exacta. Varias personas, una estimación inferior a 18, falta de lecturas o tiempo agotado llevan a **Todas las edades**.
4. El resultado muestra las cinco estaciones y el sensor en una cuadrícula 3×2. La cámara se detiene al terminar el escaneo; la franja se puede corregir desde el panel o los controles de demostración del sensor.
5. **Explorar** amplía una estación. Tras dos minutos sin interacción, la experiencia vuelve al inicio. Cancelar detiene la cámara.

## Funcionalidad

- Cinco estaciones configurables y contenido local de muestra.
- Modos trabajador, administración y presentación a pantalla completa.
- Consentimiento explícito antes de solicitar el acceso a la cámara.
- Detección facial y estimación local con diez lecturas y mediana; backends WebGL y CPU como respaldo.
- Cuatro franjas adultas (18–29, 30–44, 45–59 y 60+) más contenido general para todas las edades. La edad aparente no verifica la edad real.
- Contenido editable por estación y franja en `data/contenido.json`; cada tarjeta usa el póster correcto y el reproductor amplía el vídeo local de esa misma franja.
- Recomendaciones de ejemplo generales por rango; no son diagnóstico ni valoración de la piel.
- **Vídeos locales:** se incluyen 25 clips originales H.264 (uno por cada estación y franja), con 25 pósteres ilustrados sin texto duplicado. Las piezas ilustran la categoría y reproducen el titular, los tags y la descripción editorial de la combinación exacta; no muestran modelos reales ni fingen que la cámara lee la piel, el pelo o la identidad. El inventario y licencia figuran en `CREDITS.md`.
- Modos de simulación manual/guiada sin cámara, claramente identificados como simulación.
- Cinco zonas de cámara configurables, ajuste de confianza y diseño responsive.

## Privacidad y límites

- No se activa la cámara antes de aceptar el aviso. También se puede continuar sin conceder permiso.
- Fotogramas y rango estimado se procesan en memoria local; no se guardan ni se envían a terceros ni a un servidor.
- La edad estimada puede ser inexacta y **no verifica la edad**. La edad no determina las necesidades de la piel. No se presenta ni se usa la salida de género del modelo.
- La detección requiere ver un rostro; no estima edad si solo ve un cuerpo. No reconoce identidad, mirada, barba o características del cabello.
- Los vídeos originales son ilustraciones de demostración, no imágenes de productos reales ni una evaluación cosmética. Sus licencias y atribución están documentadas en `CREDITS.md`.
- Inter y Cormorant Garamond se sirven desde WOFF2 locales en `assets/fonts/`; sus licencias OFL también están incluidas. Los iconos son SVG incluidos en `assets/icons/`.
- En Administración se puede introducir voluntariamente una URL externa de vídeo. Ese uso opcional contacta al host elegido y necesita internet; no es necesario para la demo y nunca recibe imágenes de cámara.
- No se ha probado una cámara física ni una tablet Android real. El comportamiento de GPU, permisos y codecs debe confirmarse en el dispositivo de destino.
- El servidor Python enlaza solo a `127.0.0.1`. En Android, una web servida por HTTP desde otro equipo de la red normalmente no es un origen seguro para cámara; usa un origen HTTPS de confianza o ejecuta el servicio localmente en la tablet.
- Para un despliegue en tienda, revisa accesibilidad, rendimiento, consentimiento, privacidad, obligaciones legales y los derechos de cualquier contenido que añadas.

## Recursos y licencias

| Recurso | Versión | Licencia | Descarga y copia incluida | Alternativas evaluadas / elección |
|---|---|---|---|---|
| `@vladmandic/face-api` (detección y estimación) | 1.7.15 | MIT; copia de `LICENSE` junto a la biblioteca | Paquete oficial del autor en [npm 1.7.15](https://www.npmjs.com/package/@vladmandic/face-api/v/1.7.15); `vendor/face-api/face-api.js` | Se descargaron e inspeccionaron `face-api.js` 0.22.2 (MIT) y `@vladmandic/human` 3.3.6 (MIT). El paquete antiguo no incluía pesos de modelo; Human era más grande y no empaquetaba un modelo de edad listo para este flujo. Se eligió el bundle compacto y se probó su carga desde disco. |
| TensorFlow.js (incluido en el bundle del navegador) | 4.22.0 | Apache-2.0; copia local | Código incluido en el bundle oficial anterior; [licencia del repositorio oficial `tensorflow/tfjs`](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/LICENSE); `vendor/face-api/TENSORFLOW-LICENSE` | Se mantiene local, junto con el bundle de inferencia; no se carga desde CDN. |
| TinyFaceDetector y AgeGenderNet (pesos) | Incluidos en 1.7.15 | MIT, distribuidos dentro del paquete anterior | Manifiestos y pesos del mismo paquete npm; `models/face-api/` | Las alternativas inspeccionadas no proporcionaban aquí pesos de edad listos para uso local. |
| Recomendaciones y contenido por edad | 25 | Textos originales del proyecto | `js/products.js` y `data/contenido.json`; sin descarga externa | Reglas y títulos locales editables. La edad es aproximada y no se usa para verificar identidad. |
| Inter | 5.3.0 | SIL OFL 1.1; licencia incluida | Paquete oficial `@fontsource/inter` en npm; `assets/fonts/inter-latin-*.woff2` | Fuente local, sin solicitudes a Google Fonts ni a un CDN. |
| Cormorant Garamond | 5.3.0 | SIL OFL 1.1; licencia incluida | Paquete oficial `@fontsource/cormorant-garamond` en npm; `assets/fonts/cormorant-garamond-latin-*.woff2` | Fuente local para titulares; no depende del sistema. |
| Vídeos por sección y franja | 25 MP4 H.264 + 25 pósteres JPG | Originales del proyecto, CC BY 4.0 | Generados localmente desde `data/contenido.json`; `assets/videos/age-recommendations/` | Cada franja enlaza a su propio vídeo de la sección escaneada/seleccionada. No se cargan imágenes de cámara ni recursos remotos. |
| `sharp` (herramienta de generación opcional) | 0.35.5 | Apache-2.0 | Paquete oficial npm; solo lo usa `tools/generate-demo-videos.mjs` | Rasteriza las ilustraciones propias; no es necesario para ejecutar la demo. |
| `ffmpeg-static` / FFmpeg (herramienta de generación opcional) | 5.3.0 / 6.1.1 | GPL-3.0-or-later | Paquete oficial npm; binario local solo para generar los MP4 | Codifica los vídeos H.264; no se distribuye ni se invoca durante la experiencia. |
| Muestra genérica de cosmética | AV1 MP4 + VP8 WebM | CC BY-SA 4.0 | Sha'Boris, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cosmetics.webmhd.webm); `assets/videos/` | Se conserva solo como recurso de referencia y **no se usa** en ninguna recomendación por franja. La fecha de descarga original no quedó registrada; detalles en `CREDITS.md`. |
| Muestra genérica de cabello | AV1 MP4 + VP8 WebM | CC0 1.0 | Blackgirlmighty, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hair_cutting_in_Botswana.webm); `assets/videos/` | Se conserva solo como recurso de referencia y **no se usa** en ninguna recomendación por franja. La fecha de descarga original no quedó registrada; detalles en `CREDITS.md`. |
| Ilustraciones en reposo e iconos | CSS y SVG del proyecto | Originales del proyecto | `css/experience.css` y `assets/icons/`; sin descarga externa | Decoración de las tarjetas; las tarjetas y el reproductor tienen además sus vídeos/pósteres propios. |

La licencia MIT del paquete está en `vendor/face-api/LICENSE`; la licencia Apache-2.0 del componente TensorFlow.js incluido está en `vendor/face-api/TENSORFLOW-LICENSE`. El servidor local admite rangos HTTP. Las dos muestras genéricas existentes se mantienen solo como referencias opcionales; no se usan en las recomendaciones automáticas.

## Diagnóstico y pruebas

- Si la cámara no inicia, revisa permisos del navegador, conexión física de la cámara y cierra aplicaciones que la estén usando. Si rechazas el permiso, puedes volver al inicio o usar la simulación sin cámara.
- Si no carga el modelo local, comprueba que `vendor/face-api/` y `models/face-api/` estén incluidos en la carpeta.
- Los modelos y vídeos incluidos no usan CDN. Solo un enlace externo añadido manualmente puede generar solicitudes de red.
- **Pruebas anteriores (flujo anterior):** en Windows con Chromium integrado de Electron (Chrome 150) se verificaron la carga local del detector, la cámara simulada, AV1, el permiso denegado y la simulación guiada. También se validaron respuestas HTTP 206/416 y una inferencia de 27 ms tras cargar el modelo. El reproductor WebM/VP8 no se pudo certificar en ese Chromium.
- **Interfaz actual, versión 31:** se comprobó el recorrido sin cámara, el permiso denegado y la transición desde ambos estados al resultado; consentimiento y aviso de error quedan ocultos. Se revisó la cuadrícula en 1280×800 y 390×844: sin desbordamiento horizontal y con los botones dentro de sus tarjetas. También se probaron las cinco franjas, **Explorar**, el cierre del reproductor y el retorno al inicio.
- **Estimador de edad:** con la inferencia facial simulada dentro del módulo local, se obtuvieron diez lecturas de 35 años, progreso 1–10 y la franja 30–44. Esto verifica el muestreo y su integración con las recomendaciones, pero no valida el detector real ni la captura de cámara.
- **Medios locales:** se comprobaron los 25 MP4 y los 25 pósteres; cada combinación apunta a un archivo exclusivo. Los clips se decodifican como H.264 local, y al cambiar la franja cambian tanto el contenido recomendado como el medio mostrado. No hay solicitudes de medios a terceros.
- **Permiso de cámara:** al denegarlo, el aviso ofrece continuar sin cámara; esa opción muestra recomendaciones generales, declara que no estimó la edad y confirma que la cámara está apagada. En esta prueba no se enviaron solicitudes a orígenes externos y no hubo errores ni avisos de consola.
- **Pruebas automatizadas actuales:** `node --test tests\\age-content.test.js` (3 pruebas aprobadas).
- **Pendiente:** probar la cámara física, tablet Android real y Chrome/Edge nativos en el dispositivo de tienda. Los vídeos H.264 locales se decodifican en el navegador de prueba, pero no se certifica hardware/tablet no disponibles.
