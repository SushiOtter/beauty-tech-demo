# Créditos y licencias

## Recursos gráficos incluidos

Los 25 pósteres JPG de `assets/videos/age-recommendations/` son ilustraciones geométricas originales creadas para Beauty Tech demo a partir del contenido editorial local. Se distribuyen bajo **Creative Commons Attribution 4.0 International (CC BY 4.0)**. Atribución: «Beauty Tech demo — ilustraciones originales, 2026». No se incluyen vídeos de muestra: los vídeos de las tablets se cargan desde la web de administración y se almacenan en el PC de la tienda.

Inter y Cormorant Garamond se sirven desde WOFF2 locales en `assets/fonts/`; sus licencias SIL OFL están incluidas junto a los archivos. Los iconos de `assets/icons/` son SVG originales del proyecto.

## Detector local de presencia

| Recurso | Versión | Licencia | Copia incluida |
|---|---|---|---|
| `@vladmandic/face-api` | 1.7.15 | MIT | `vendor/face-api/LICENSE` |
| TensorFlow.js incluido en el bundle | 4.22.0 | Apache-2.0 | `vendor/face-api/TENSORFLOW-LICENSE` |
| TinyFaceDetector y sus pesos | Incluidos en 1.7.15 | MIT | `models/face-api/` |

El modo tablet carga el detector de presencia local. No carga los antiguos pesos de estimación de edad ni envía imágenes de cámara al PC.

## Vídeos que se añadan

Quien suba un vídeo debe contar con permiso para su uso y exhibición en tienda. Los vídeos no se incluyen en el código fuente: se almacenan en la base de datos local del servidor y en su carpeta de medios.
