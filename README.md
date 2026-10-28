# Beauty Tech Retail Experience

**Versión 36.** Prototipo web de biblioteca central de vídeos por sección y reproducción por presencia.

## Inicio rápido en Windows

1. Ejecuta `INICIAR-DEMO.bat`, o desde PowerShell: `py .\iniciar_demo.py`.
2. Deja abierta la ventana del servidor. Abre en el PC la dirección local que muestra.
3. En una tablet conectada a la misma Wi-Fi, abre la dirección de red que muestra el servidor. Si Windows Firewall pregunta, permite el acceso solo en la red privada de la tienda.
4. En el PC, abre **Administración → Vídeos por sección**, elige una categoría, selecciona uno o varios vídeos y escribe el código de 32 caracteres que aparece en la consola.
5. En cada tablet, el trabajador elige su sección y pulsa **Iniciar experiencia**. La cámara solicita permiso al navegador; al detectar presencia, la tablet consulta la biblioteca del PC y reproduce solo vídeos de esa sección. Al irse la persona, el reproductor se detiene y la tablet espera la siguiente; **Salir** detiene también la cámara.

Requiere Python 3.10 o posterior; no necesita Node ni paquetes externos. Los vídeos que suba la encargada se guardan en la base SQLite y la carpeta de medios dentro de `%LOCALAPPDATA%\BeautyTech` (Windows). Esa carpeta es el dato persistente que habría que respaldar o migrar si el prototipo se sustituye por otra base de datos. El código de administración aleatorio se renueva cada vez que se reinicia el servidor.

## Qué hace este prototipo

- Incluye cinco secciones configurables: aparatología, maquillaje, cuidado del cabello, coloración y novedades.
- El PC sirve de biblioteca central para todas las tablets que puedan alcanzar su dirección en la red local. Los archivos admitidos son MP4, WebM y Ogg, con un máximo de 500 MB por archivo.
- Cada tablet puede elegir una sección de forma sencilla. Al detectar presencia, consulta otra vez la base de datos del PC y reproduce en orden los vídeos asignados; cuando la persona se aleja, detiene el vídeo y vuelve a la espera. Si aún no hay vídeos, espera sin activar la cámara.
- Los cambios de nombre y otras preferencias visuales todavía se guardan en el navegador donde se hicieron; los archivos de vídeo sí se guardan en el PC.
- La encargada administra desde el navegador del propio PC. Las cargas y eliminaciones requieren el código de administración, procedencia local y un origen coincidente; cinco códigos incorrectos bloquean nuevos intentos durante un minuto. Las tablets solo pueden consultar y reproducir los vídeos.
- No se incluyen vídeos de muestra en `assets/videos`; todas las películas de las tablets deben subirse a su sección desde la web de administración.

## Cámara, red y privacidad

- El detector incluido solo localiza un rostro para determinar presencia. No estima edad, no identifica a la persona y no analiza rasgos. Los fotogramas se procesan en el navegador de la tablet y no se almacenan ni se envían al servidor.
- La cámara se activa cuando el trabajador inicia la experiencia y concede permiso al navegador. La pantalla informa del detector local; si la cámara no funciona se ofrece reproducción manual. La cámara sigue activa entre clientes para detectar la siguiente presencia; solo se detiene al salir de la experiencia.
- **Seguridad de red:** el servidor de demostración HTTP no cifra el tráfico de vídeo ni el código de página. Úsalo solo en una Wi-Fi privada de pruebas, no en redes públicas ni expuesto a Internet. Para tablets con cámara y uso real, configura un certificado HTTPS confiable para los dispositivos: define `BEAUTY_TECH_TLS_CERT` y `BEAUTY_TECH_TLS_KEY` antes de iniciar. La CA/certificado debe ser de confianza en las tablets e incluir `127.0.0.1` para la administración local y el nombre DNS de la tienda para las tablets; define también `BEAUTY_TECH_TABLET_URL` con esa URL HTTPS y haz que resuelva al PC.
- Las cargas y eliminaciones se rechazan salvo que vengan del propio PC con origen web coincidente. El servidor aplica límite de intentos, restringe tipos de archivo y firmas básicas de contenedor, limita cada archivo a 500 MB y no permite descargar código Python, pruebas, Git ni listados de carpetas. Esto protege el prototipo en una LAN privada, pero no sustituye un despliegue revisado profesionalmente. Varias tiendas remotas requieren VPN/red corporativa, TLS y autenticación de empresa.
- Antes de usarlo con clientes reales, revisa permisos de cámara, señalización visible, privacidad, seguridad y obligaciones legales con la responsable correspondiente.
- El PC debe permanecer encendido y conectado para que las tablets puedan acceder a los vídeos. La carpeta `%LOCALAPPDATA%\BeautyTech` contiene la base de datos y los vídeos subidos; incluye esa carpeta en las copias de seguridad.

## Contenido de demostración y licencias

Se han retirado los vídeos incluidos como demostración. Las imágenes de póster restantes solo se usan en las vistas de administración; no se reproducen en las tablets. Los vídeos que se suban deben contar con permiso de uso. Las licencias de dependencias y recursos gráficos están documentadas en `CREDITS.md`.

## Recursos y licencias

| Recurso | Versión | Licencia | Descarga y copia incluida | Alternativas evaluadas / elección |
|---|---|---|---|---|
| `@vladmandic/face-api` (detección local de presencia) | 1.7.15 | MIT; copia de `LICENSE` junto a la biblioteca | Paquete oficial del autor en [npm 1.7.15](https://www.npmjs.com/package/@vladmandic/face-api/v/1.7.15); `vendor/face-api/face-api.js` | El modo tablet carga únicamente TinyFaceDetector para detectar presencia; no invoca estimación de edad ni identidad. |
| TensorFlow.js (incluido en el bundle del navegador) | 4.22.0 | Apache-2.0; copia local | Código incluido en el bundle oficial anterior; [licencia del repositorio oficial `tensorflow/tfjs`](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/LICENSE); `vendor/face-api/TENSORFLOW-LICENSE` | Se mantiene local, junto con el bundle de inferencia; no se carga desde CDN. |
| TinyFaceDetector (pesos) | Incluidos en 1.7.15 | MIT, distribuidos dentro del paquete anterior | Manifiestos y pesos del mismo paquete npm; `models/face-api/` | El paquete también incluye pesos AgeGenderNet de una versión anterior del prototipo; el modo tablet actual no los carga ni los usa. |
| Textos de recomendación de muestra | 25 | Textos originales del proyecto | `js/products.js` y `data/contenido.json`; sin descarga externa | Se mantienen para vistas de demostración anteriores; el modo tablet reproduce los vídeos de la sección y no usa datos de edad. |
| Inter | 5.3.0 | SIL OFL 1.1; licencia incluida | Paquete oficial `@fontsource/inter` en npm; `assets/fonts/inter-latin-*.woff2` | Fuente local, sin solicitudes a Google Fonts ni a un CDN. |
| Cormorant Garamond | 5.3.0 | SIL OFL 1.1; licencia incluida | Paquete oficial `@fontsource/cormorant-garamond` en npm; `assets/fonts/cormorant-garamond-latin-*.woff2` | Fuente local para titulares; no depende del sistema. |
| `sharp` (herramienta de generación opcional) | 0.35.5 | Apache-2.0 | Paquete oficial npm; solo lo usa `tools/generate-demo-videos.mjs` | Rasteriza las ilustraciones propias; no es necesario para ejecutar la demo. |
| `ffmpeg-static` / FFmpeg (herramienta de generación opcional) | 5.3.0 / 6.1.1 | GPL-3.0-or-later | Paquete oficial npm; binario local solo para generar los MP4 | Codifica los vídeos H.264; no se distribuye ni se invoca durante la experiencia. |
| Ilustraciones en reposo e iconos | CSS y SVG del proyecto | Originales del proyecto | `css/experience.css` y `assets/icons/`; sin descarga externa | Decoración visual; las tablets reproducen exclusivamente los vídeos subidos a la biblioteca del PC. |

La licencia MIT del paquete está en `vendor/face-api/LICENSE`; la licencia Apache-2.0 del componente TensorFlow.js incluido está en `vendor/face-api/TENSORFLOW-LICENSE`. El servidor local admite rangos HTTP para transmitir los vídeos subidos. No quedan vídeos de muestra en el proyecto.

## Diagnóstico y pruebas

- Si la cámara no inicia, comprueba el permiso del navegador y que haya una cámara conectada. Las tablets requieren HTTPS de confianza para la detección; **Mostrar contenido sin cámara** permite reproducir sin detección.
- Si no carga el modelo local, comprueba que `vendor/face-api/` y `models/face-api/` estén incluidos en la carpeta.
- Los modelos de presencia y vídeos incluidos no usan CDN. Los vídeos subidos se sirven desde el propio PC.
- **Validación del flujo actual:** el navegador integrado verificó la carga de un vídeo MP4 desde la interfaz, su persistencia en la lista central y la reproducción en modo tablet. No había una cámara física disponible; por tanto, no se verificó la detección física ni una tablet Android.
- **Pruebas automatizadas:** `python -m unittest discover -s tests -p test_server_api.py -v` verifica la autorización, carga, listado, transmisión por rangos y eliminación. `node --test tests\\age-content.test.js` conserva tres pruebas de contenido legado.
