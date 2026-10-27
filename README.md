# Beauty Tech Retail Experience

**Versión 34.** Experiencia de tablet por sección, con vídeo local, consentimiento y recomendaciones orientativas procesadas en el navegador.

## Inicio rápido en Windows

1. Extrae el proyecto completo.
2. Ejecuta `INICIAR-DEMO.bat`, o desde PowerShell en esta carpeta: `py .\iniciar_demo.py`.
3. Usa la dirección local que se abre; deja la ventana del servidor activa.

No requiere Node, paquetes Python, claves ni conexión a internet para la detección local y los vídeos incluidos. No abras `index.html` con doble clic: la cámara y los módulos necesitan el servidor local de `127.0.0.1`.

## Recorrido

1. En la pantalla de trabajador, elige la sección asignada a la tablet; la vista previa muestra el contenido de esa sección. Pulsa **Iniciar experiencia**.
2. Se reproduce en bucle el vídeo local de esa sección. La cámara permanece apagada hasta que el cliente lee el aviso y pulsa **Aceptar y comenzar**; también puede continuar sin cámara.
3. Con el consentimiento, la cámara detecta localmente la presencia de un rostro. Tras una presencia sostenida, estima una franja aproximada con diez lecturas y mediana; solo considera personas adultas y no calcula ni guarda una edad exacta.
4. Aparecen sugerencias editoriales de la sección elegida, adaptadas a la franja estimada. Si no se puede estimar o se rechaza la cámara, se muestra contenido general de esa misma sección. La pantalla de cliente solo muestra la sección seleccionada.
5. Cuando la persona se aleja, se apaga la cámara, se oculta la recomendación y vuelve el aviso de consentimiento para el siguiente cliente. También hay un botón para terminar manualmente.

## Funcionalidad

- Cinco estaciones configurables y contenido local de muestra.
- Modos trabajador, administración y presentación a pantalla completa.
- El trabajador asigna una sección desde una vista previa visual; el vídeo de esa sección ocupa el escenario y se reproduce en bucle.
- Consentimiento explícito de cada cliente antes de solicitar acceso a la cámara.
- Detección facial y estimación local con diez lecturas y mediana; backends WebGL y CPU como respaldo.
- Cuatro franjas adultas (18–29, 30–44, 45–59 y 60+) más contenido general para todas las edades. La edad aparente no verifica la edad real.
- Contenido editable por sección y franja en `data/contenido.json`; tras el escaneo solo se muestran recomendaciones de la sección seleccionada.
- Cada franja muestra tres tipos de producto sugeridos para la sección (por ejemplo, máscara LED cosmética o paleta de maquillaje); son ideas editoriales, no un catálogo real de SKU, marcas, precios o disponibilidad.
- **Vídeos locales:** se incluyen 25 clips originales H.264 (uno por cada estación y franja), con 25 pósteres ilustrados sin texto duplicado. Las piezas ilustran la categoría y reproducen el titular, los tags y la descripción editorial de la combinación exacta; no muestran modelos reales ni fingen que la cámara lee la piel, el pelo o la identidad. El inventario y licencia figuran en `CREDITS.md`.
- Modos de simulación manual/guiada sin cámara, claramente identificados como simulación.
- Cinco zonas de cámara configurables, ajuste de confianza y diseño responsive.

## Privacidad y límites

- No se activa la cámara antes de aceptar el aviso. También se puede continuar sin conceder permiso.
- Fotogramas y rango estimado se procesan en memoria local; no se guardan ni se envían a terceros ni a un servidor.
- La edad estimada puede ser inexacta y **no verifica la edad**. La edad no determina las necesidades de la piel. No se presenta ni se usa la salida de género del modelo.
- La detección requiere ver un rostro; no estima edad si solo ve un cuerpo. Tras mostrar las recomendaciones, la cámara sigue activa únicamente para detectar que esa persona se ha alejado; entonces se apaga y solicita nuevo consentimiento antes del siguiente escaneo. No reconoce identidad, mirada, barba o características del cabello.
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
- **Interfaz, versión 33:** la pantalla de preparación muestra una selección explícita de sección y un botón **Comenzar**. El modo de tablet oculta las otras secciones, reproduce el vídeo seleccionado a pantalla completa y solicita consentimiento en el propio dispositivo antes de activar la cámara.
- **Estimador de edad:** con la inferencia facial simulada dentro del módulo local, se obtuvieron diez lecturas de 35 años, progreso 1–10 y la franja 30–44. Esto verifica el muestreo y su integración con las recomendaciones, pero no valida el detector real ni la captura de cámara.
- **Medios locales:** se comprobaron los 25 MP4 y los 25 pósteres; cada combinación apunta a un archivo exclusivo. Los clips se decodifican como H.264 local, y al cambiar la franja cambian tanto el contenido recomendado como el medio mostrado. No hay solicitudes de medios a terceros.
- **Flujo por verificar:** se debe volver a probar con cámara simulada y en navegador limpio que el vídeo cambia con la sección, que solo aparece una sección, que la recomendación usa los tags de esa sección y franja, y que al alejarse se oculta y se vuelve a pedir consentimiento.
- **Pruebas automatizadas actuales:** `node --test tests\\age-content.test.js` (3 pruebas aprobadas).
- **Pendiente:** probar la cámara física, tablet Android real y Chrome/Edge nativos en el dispositivo de tienda. Los vídeos H.264 locales se decodifican en el navegador de prueba, pero no se certifica hardware/tablet no disponibles.
