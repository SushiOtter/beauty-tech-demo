# Créditos y licencias audiovisuales

Fecha de generación y revisión: 2026-10-27.

## Vídeos originales por estación y franja

Se incluyen **25 vídeos MP4 H.264** y sus 25 pósteres JPG en `assets/videos/age-recommendations/`. Cada combinación tiene su propio archivo de cuatro segundos, 960 × 540, 15 fps, H.264/yuv420p sin audio. El contenido se crea a partir del titular, la descripción y las etiquetas de esa estación y franja de `data/contenido.json`; el vídeo se selecciona con el mismo rango que usan las recomendaciones locales.

Los pósteres se generan con un encuadre exclusivo de la ilustración, sin repetir el titular ni el texto editorial que ya aparece en cada tarjeta.

Las ilustraciones geométricas y animaciones son obras originales generadas por `tools/generate-demo-videos.mjs`; no contienen metraje de personas, imágenes descargadas, logos comerciales ni afirmaciones de respaldo por marcas. Su licencia es **Creative Commons Attribution 4.0 International (CC BY 4.0)**, compatible con uso comercial y modificación ([texto de la licencia](https://creativecommons.org/licenses/by/4.0/)). Atribución: «Beauty Tech demo — ilustraciones audiovisuales originales, 2026».

| # | Estación | Franja | Vídeo MP4 | Póster |
|---:|---|---|---|---|
| 1 | Aparatología | 18–29 | `apparatology-18-29.mp4` | `apparatology-18-29.jpg` |
| 2 | Aparatología | 30–44 | `apparatology-30-44.mp4` | `apparatology-30-44.jpg` |
| 3 | Aparatología | 45–59 | `apparatology-45-59.mp4` | `apparatology-45-59.jpg` |
| 4 | Aparatología | 60+ | `apparatology-60plus.mp4` | `apparatology-60plus.jpg` |
| 5 | Aparatología | Todas las edades | `apparatology-all.mp4` | `apparatology-all.jpg` |
| 6 | Maquillaje | 18–29 | `makeup-18-29.mp4` | `makeup-18-29.jpg` |
| 7 | Maquillaje | 30–44 | `makeup-30-44.mp4` | `makeup-30-44.jpg` |
| 8 | Maquillaje | 45–59 | `makeup-45-59.mp4` | `makeup-45-59.jpg` |
| 9 | Maquillaje | 60+ | `makeup-60plus.mp4` | `makeup-60plus.jpg` |
| 10 | Maquillaje | Todas las edades | `makeup-all.mp4` | `makeup-all.jpg` |
| 11 | Tratamientos capilares | 18–29 | `haircare-18-29.mp4` | `haircare-18-29.jpg` |
| 12 | Tratamientos capilares | 30–44 | `haircare-30-44.mp4` | `haircare-30-44.jpg` |
| 13 | Tratamientos capilares | 45–59 | `haircare-45-59.mp4` | `haircare-45-59.jpg` |
| 14 | Tratamientos capilares | 60+ | `haircare-60plus.mp4` | `haircare-60plus.jpg` |
| 15 | Tratamientos capilares | Todas las edades | `haircare-all.mp4` | `haircare-all.jpg` |
| 16 | Novedades | 18–29 | `newness-18-29.mp4` | `newness-18-29.jpg` |
| 17 | Novedades | 30–44 | `newness-30-44.mp4` | `newness-30-44.jpg` |
| 18 | Novedades | 45–59 | `newness-45-59.mp4` | `newness-45-59.jpg` |
| 19 | Novedades | 60+ | `newness-60plus.mp4` | `newness-60plus.jpg` |
| 20 | Novedades | Todas las edades | `newness-all.mp4` | `newness-all.jpg` |
| 21 | Color de pelo | 18–29 | `haircolor-18-29.mp4` | `haircolor-18-29.jpg` |
| 22 | Color de pelo | 30–44 | `haircolor-30-44.mp4` | `haircolor-30-44.jpg` |
| 23 | Color de pelo | 45–59 | `haircolor-45-59.mp4` | `haircolor-45-59.jpg` |
| 24 | Color de pelo | 60+ | `haircolor-60plus.mp4` | `haircolor-60plus.jpg` |
| 25 | Color de pelo | Todas las edades | `haircolor-all.mp4` | `haircolor-all.jpg` |

Ruta base de los archivos: `assets/videos/age-recommendations/`. Los textos y las etiquetas de cada combinación se pueden editar en `data/contenido.json`; después hay que volver a generar los medios para mantenerlos sincronizados.

## Generación y licencias de herramientas

El generador opcional usa [`sharp` 0.35.5](https://www.npmjs.com/package/sharp/v/0.35.5) (Apache-2.0) para rasterizar ilustraciones originales y [FFmpeg 6.1.1 mediante `ffmpeg-static` 5.3.0](https://www.npmjs.com/package/ffmpeg-static/v/5.3.0) (GPL-3.0-or-later) para codificar MP4 con libx264. Estas son herramientas de generación, **no dependencias de ejecución** de la demo. Sus versiones exactas están fijadas en `tools/package.json` y `tools/package-lock.json`; la GPL permite el uso comercial. Los binarios de las herramientas no se incluyen en la experiencia publicada.

Para regenerar los clips en Windows:

```powershell
npm.cmd install --prefix .\tools
npm.cmd --prefix .\tools install-scripts approve ffmpeg-static
npm.cmd --prefix .\tools rebuild ffmpeg-static
npm.cmd --prefix .\tools run generate
```

La demo normal no necesita Node, npm, conexión ni instalación adicional: todos los vídeos y pósteres son locales.

## Muestras genéricas conservadas; no asignadas

| Archivo | Origen | Autor | Licencia | Fecha de descarga original | Revisión |
|---|---|---|---|---|---|
| `assets/videos/cosmetics-demo.mp4` y `.webm` | [Wikimedia Commons: Cosmetics.webmhd.webm](https://commons.wikimedia.org/wiki/File:Cosmetics.webmhd.webm) | Sha'Boris | CC BY-SA 4.0; la conversión conserva esos términos | No registrada en el historial disponible | Referencia genérica; no se usa en las recomendaciones. |
| `assets/videos/haircare-demo.mp4` y `.webm` | [Wikimedia Commons: Hair cutting in Botswana.webm](https://commons.wikimedia.org/wiki/File:Hair_cutting_in_Botswana.webm) | Blackgirlmighty | CC0 1.0 | No registrada en el historial disponible | Referencia genérica; no se usa en las recomendaciones. |

Ninguna persona representada en esas muestras respalda Beauty Tech ni la marca de la demo; no se mezclan con los vídeos originales por edad.
