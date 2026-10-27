import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentPath = path.join(root, "data", "contenido.json");
const outputDirectory = path.join(root, "assets", "videos", "age-recommendations");
const ageBands = {
  "18-29": "18–29 · orientación",
  "30-44": "30–44 · orientación",
  "45-59": "45–59 · orientación",
  "60+": "60+ · orientación",
  all: "Todas las edades"
};
const palettes = {
  "18-29": ["#f3e5e0", "#c77d76", "#6f4a47", "#e7b6a4"],
  "30-44": ["#eee4dd", "#b87970", "#6d4a47", "#dab69a"],
  "45-59": ["#eee9df", "#a68a64", "#5a5143", "#d0b38b"],
  "60+": ["#e8e9e1", "#8d9a83", "#4d5b50", "#c6ac87"],
  all: ["#eee6db", "#a18469", "#51463c", "#d0b18a"]
};
const icons = {
  apparatology: `
    <circle cx="244" cy="248" r="118" fill="none" stroke="#fff" stroke-opacity=".72"/>
    <circle cx="244" cy="248" r="90" fill="none" stroke="var(--accent)" stroke-opacity=".72"/>
    <circle cx="244" cy="248" r="62" fill="none" stroke="var(--accent)" stroke-opacity=".45"/>
    <g transform="rotate(-24 250 250)">
      <rect x="221" y="185" width="57" height="174" rx="26" fill="url(#metal)" stroke="#fff" stroke-width="2"/>
      <rect x="226" y="163" width="47" height="46" rx="19" fill="var(--deep)"/>
      <circle cx="249.5" cy="184" r="11" fill="#fff2d6" fill-opacity=".92"/>
      <rect x="233" y="255" width="33" height="46" rx="14" fill="#fff" fill-opacity=".36"/>
    </g>
    <circle cx="344" cy="154" r="5" fill="var(--accent)"/>
    <circle cx="148" cy="343" r="4" fill="var(--deep)"/>`,
  makeup: `
    <circle cx="238" cy="247" r="116" fill="#fff" fill-opacity=".48" stroke="#fff" stroke-width="2"/>
    <circle cx="238" cy="247" r="85" fill="none" stroke="var(--accent)" stroke-opacity=".42" stroke-width="2"/>
    <g transform="rotate(-18 238 247)">
      <rect x="159" y="190" width="158" height="116" rx="24" fill="#fff" fill-opacity=".74" stroke="#fff" stroke-width="3"/>
      <circle cx="195" cy="228" r="22" fill="#bd7773"/><circle cx="247" cy="228" r="22" fill="#d2a090"/>
      <circle cx="299" cy="228" r="22" fill="#92716a"/><circle cx="195" cy="276" r="16" fill="#e1c4a8"/>
      <circle cx="247" cy="276" r="16" fill="#c5867d"/><circle cx="299" cy="276" r="16" fill="#ad9a87"/>
    </g>
    <path d="M321 336l61-109" stroke="var(--deep)" stroke-width="10" stroke-linecap="round"/>
    <path d="M373 217l15-27 4 33z" fill="#c5867d"/>
    <circle cx="149" cy="155" r="5" fill="var(--accent)"/>`,
  haircare: `
    <path d="M93 185C148 112 173 321 232 232s77-99 139-22" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="8"/>
    <path d="M96 215C151 142 175 351 235 262s77-99 139-22" fill="none" stroke="var(--accent)" stroke-opacity=".72" stroke-width="5"/>
    <path d="M100 245C155 172 179 381 239 292s77-99 139-22" fill="none" stroke="var(--deep)" stroke-opacity=".46" stroke-width="3"/>
    <g transform="rotate(8 275 254)">
      <rect x="243" y="174" width="77" height="174" rx="22" fill="url(#glass)" stroke="#fff" stroke-width="3"/>
      <rect x="253" y="147" width="57" height="35" rx="8" fill="var(--deep)"/>
      <rect x="270" y="132" width="24" height="18" rx="4" fill="#fff" fill-opacity=".8"/>
      <rect x="253" y="237" width="57" height="6" rx="3" fill="var(--accent)"/>
      <circle cx="281" cy="271" r="15" fill="#fff" fill-opacity=".48"/>
    </g>
    <circle cx="353" cy="154" r="5" fill="var(--accent)"/>`,
  newness: `
    <ellipse cx="242" cy="361" rx="139" ry="18" fill="var(--deep)" fill-opacity=".11"/>
    <path d="M117 319h248l-24 42H141z" fill="#fff" fill-opacity=".8" stroke="#fff" stroke-width="2"/>
    <path d="M139 313h204v11H139z" fill="var(--accent)" fill-opacity=".7"/>
    <g transform="translate(0 -8)">
      <rect x="183" y="184" width="68" height="139" rx="18" fill="url(#glass)" stroke="#fff" stroke-width="3"/>
      <rect x="199" y="165" width="36" height="26" rx="6" fill="var(--deep)"/>
      <rect x="279" y="211" width="58" height="111" rx="18" fill="#fff" fill-opacity=".68" stroke="#fff" stroke-width="3"/>
      <rect x="293" y="193" width="30" height="23" rx="5" fill="var(--accent)"/>
    </g>
    <path d="M242 121l7 19 20 1-15 12 5 20-17-11-17 11 5-20-15-12 20-1z" fill="#fff" fill-opacity=".78"/>
    <circle cx="127" cy="192" r="4" fill="var(--deep)"/><circle cx="352" cy="154" r="5" fill="var(--accent)"/>`,
  haircolor: `
    <circle cx="240" cy="246" r="122" fill="#fff" fill-opacity=".28" stroke="#fff" stroke-width="2"/>
    <path d="M103 182C181 110 196 326 273 229s82-75 121-37" fill="none" stroke="#c6a2a3" stroke-width="22" stroke-linecap="round"/>
    <path d="M91 214C169 142 184 358 261 261s82-75 121-37" fill="none" stroke="#b37f5d" stroke-width="19" stroke-linecap="round"/>
    <path d="M96 247C174 175 189 391 266 294s82-75 121-37" fill="none" stroke="#806d5d" stroke-width="16" stroke-linecap="round"/>
    <path d="M113 275C191 203 206 419 283 322s82-75 121-37" fill="none" stroke="#ddd1bb" stroke-width="13" stroke-linecap="round"/>
    <rect x="159" y="154" width="172" height="171" rx="28" fill="#fff" fill-opacity=".13" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
    <circle cx="188" cy="184" r="13" fill="#c6a2a3"/><circle cx="222" cy="184" r="13" fill="#b37f5d"/>
    <circle cx="256" cy="184" r="13" fill="#806d5d"/><circle cx="290" cy="184" r="13" fill="#ddd1bb"/>
    <circle cx="352" cy="145" r="5" fill="var(--accent)"/>`
};

function xml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[character]);
}

function wrapped(value, maximumCharacters) {
  const words = String(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > maximumCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(value, x, y, maxCharacters, lineHeight, className) {
  return wrapped(value, maxCharacters).map((line, index) =>
    `<text class="${className}" x="${x}" y="${y + index * lineHeight}">${xml(line)}</text>`
  ).join("");
}

function renderFrame(station, range, frame, totalFrames, poster = false) {
  const [paper, accent, deep, highlight] = palettes[range];
  const phase = frame / totalFrames * Math.PI * 2;
  const drift = Math.sin(phase) * 7;
  const turn = Math.sin(phase) * 3;
  const art = icons[station.icon] || icons.newness;
  const content = station.ageContent[range];
  const tags = content.tags.slice(0, 3);
  const tagMarkup = tags.map((tag, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 490 + column * 208;
    const y = 415 + row * 42;
    const width = Math.min(196, Math.max(108, tag.length * 9 + 32));
    return `<g><rect x="${x}" y="${y}" width="${width}" height="30" rx="15" fill="#fff" fill-opacity=".64" stroke="${accent}" stroke-opacity=".42"/><circle cx="${x + 13}" cy="${y + 15}" r="3" fill="${accent}"/><text class="tag" x="${x + 24}" y="${y + 19}">${xml(tag)}</text></g>`;
  }).join("");
  const titleMarkup = textLines(content.headline, 492, 180, 22, 46, "title");
  const copyMarkup = textLines(content.copy, 492, 306, 43, 26, "copy");
  const foot = ageBands[range];
  const glowY = 252 + drift;

  const viewBox = poster ? "25 85 430 360" : "0 0 960 540";
  const dimensions = poster ? 'width="640" height="536"' : 'width="960" height="540"';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${dimensions} viewBox="${viewBox}">
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${paper}"/><stop offset="1" stop-color="#faf7f1"/></linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${deep}"/><stop offset=".46" stop-color="${highlight}"/><stop offset="1" stop-color="#fff5df"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="${accent}" stop-opacity=".88"/></linearGradient>
      <radialGradient id="halo"><stop stop-color="${highlight}" stop-opacity=".55"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></radialGradient>
      <style>
        text{font-family:Inter,"Segoe UI",Arial,sans-serif;fill:${deep}}
        .eyebrow{font-size:13px;font-weight:600;letter-spacing:3px}
        .brand{font-size:15px;font-weight:700;letter-spacing:3px}
        .title{font-family:"Cormorant Garamond",Georgia,serif;font-size:39px;font-weight:500;fill:#241f1b}
        .copy{font-size:18px;fill:#665c52}
        .tag{font-size:12px;font-weight:500}
        .caption{font-size:11px;letter-spacing:1.6px}
      </style>
    </defs>
    <rect width="960" height="540" fill="url(#paper)"/>
    <circle cx="246" cy="${glowY}" r="225" fill="url(#halo)"/>
    <circle cx="246" cy="${glowY}" r="177" fill="none" stroke="#fff" stroke-opacity=".55"/>
    <circle cx="246" cy="${glowY}" r="153" fill="none" stroke="${accent}" stroke-opacity=".18"/>
    <path d="M0 455C180 423 332 490 491 451s319-24 469 7v82H0z" fill="#fff" fill-opacity=".26"/>
    <text class="brand" x="48" y="48">BEAUTY TECH</text>
    <circle cx="210" cy="43" r="3" fill="${accent}"/>
    <text class="eyebrow" x="48" y="77">${xml(station.name.toUpperCase())} · ${xml(foot.toUpperCase())}</text>
    <g transform="translate(0 ${drift.toFixed(2)}) rotate(${turn.toFixed(2)} 244 246)">${art}</g>
    <path d="M445 110v325" stroke="${accent}" stroke-opacity=".45"/>
    <text class="eyebrow" x="492" y="139">UNA SELECCIÓN ORIENTATIVA</text>
    ${titleMarkup}
    ${copyMarkup}
    <text class="caption" x="492" y="390">IDEAS PARA DESCUBRIR</text>
    ${tagMarkup}
    <path d="M48 478h864" stroke="${deep}" stroke-opacity=".16"/>
    <text class="caption" x="48" y="508">BEAUTY TECH · CUIDADO A TU MANERA</text>
    <text class="caption" x="912" y="508" text-anchor="end">${xml(foot.toUpperCase())}</text>
  </svg>`;
}

function encode(ffmpeg, inputPattern, videoPath) {
  const videoOutput = spawnSync(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-framerate", "15", "-start_number", "0", "-i", inputPattern,
    "-frames:v", "60", "-vf", "scale=960:540:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
    "-profile:v", "baseline", "-level", "3.1", "-movflags", "+faststart",
    "-an", videoPath
  ], { encoding: "utf8", windowsHide: true });
  if (videoOutput.status !== 0) throw new Error(`No se pudo crear ${path.basename(videoPath)}: ${videoOutput.stderr}`);
}

async function main() {
  const ffmpeg = process.env.FFMPEG_PATH || ffmpegStatic;
  if (!ffmpeg) throw new Error("No se encontró FFmpeg. Instala las dependencias de tools/ o define FFMPEG_PATH.");
  const configuration = JSON.parse(await readFile(contentPath, "utf8"));
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "beauty-tech-video-"));
  await mkdir(outputDirectory, { recursive: true });
  let generated = 0;
  try {
    for (const station of configuration.stations) {
      for (const range of Object.keys(station.ageContent)) {
        const key = range === "all" ? "all" : range.replace("+", "plus");
        const baseName = `${station.id}-${key}`;
        const clipDirectory = path.join(temporaryDirectory, baseName);
        const posterPath = path.join(outputDirectory, `${baseName}.jpg`);
        await mkdir(clipDirectory);
        for (let frame = 0; frame < 60; frame += 1) {
          const svg = renderFrame(station, range, frame, 60);
          const framePath = path.join(clipDirectory, `frame-${String(frame).padStart(3, "0")}.png`);
          await sharp(Buffer.from(svg)).png().toFile(framePath);
          if (frame === 12) {
            const poster = renderFrame(station, range, frame, 60, true);
            await sharp(Buffer.from(poster)).jpeg({ quality: 84 }).toFile(posterPath);
          }
        }
        const videoPath = path.join(outputDirectory, `${baseName}.mp4`);
        encode(ffmpeg, path.join(clipDirectory, "frame-%03d.png"), videoPath);
        station.video[range] = path.relative(root, videoPath).replaceAll(path.sep, "/");
        station.posterByAge[range] = path.relative(root, posterPath).replaceAll(path.sep, "/");
        generated += 1;
        console.log(`${generated}/25 ${station.name} · ${range}: ${path.basename(videoPath)}`);
      }
    }
    await writeFile(contentPath, `${JSON.stringify(configuration, null, 2)}\n`);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  console.log(`Generados ${generated} vídeos originales y sus pósteres; se actualizaron las rutas locales de data/contenido.json.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
