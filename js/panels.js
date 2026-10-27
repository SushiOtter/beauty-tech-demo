import { appState, stationStates } from "./state.js";
import { $, escapeHTML } from "./utils.js";
import { iconSVG } from "./configuration.js?v=32";
import { ageProfiles } from "./products.js?v=32";

function deviceMarkup(station, index, withVideo = false, publicMode = false) {
 const playing = station.state === stationStates.PLAYING || station.state === stationStates.ATTENTION;
 const disabled = !station.enabled;
 const ageContent = station.ageContent?.[appState.ageGroup] || station.ageContent?.all;
 const stateLabel = disabled ? "DESACTIVADA" : station.state === stationStates.ATTENTION ? "INTERÉS DETECTADO" :
   station.state === stationStates.PLAYING ? "RECOMENDACIÓN ACTIVA" : station.state === stationStates.COOLDOWN ? "EN ESPERA" : "EN REPOSO";
 const clip = ageContent ? null : station.currentClip;
 const title = clip ? clip.title : ageContent?.headline || station.headline;
 const subtitle = clip ? clip.subtitle : ageContent?.copy || station.copy;
 const campaign = clip ? `SELECCIÓN ${Math.min((station.clipIndex || 0) + 1, 2)} DE 2` : `${station.contentType || "Campaña"} · ${station.family}`;
 const tags = clip ? (clip.tags || []).slice(0,3).join(" · ") : (ageContent?.tags || station.tags || []).join(" · ");
 const mediaSlot = station.mediaSlot === null ? -1 : station.mediaSlot ?? station.clipIndex;
 const selectedMedia = withVideo && playing && mediaSlot >= 0 ? station.mediaFiles?.[mediaSlot] : null;
 const media = selectedMedia && (selectedMedia.audience === appState.ageGroup || selectedMedia.audience === "all" && appState.ageGroup === "all")
  ? selectedMedia
  : null;
 const posterUrl = publicMode && !media ? station.posterByAge?.[appState.ageGroup] : "";
 const posterMarkup = posterUrl
  ? `<img class="device-poster" src="${escapeHTML(posterUrl)}" alt="" aria-hidden="true" loading="lazy">`
  : "";
 const mediaSources = media
  ? [{ url: media.url, type: media.type }, ...(media.fallbacks || [])]
    .map(source => `<source src="${escapeHTML(source.url)}"${source.type ? ` type="${escapeHTML(source.type)}"` : ""}>`)
    .join("")
  : "";
 const mediaMarkup = media?.kind === "external"
   ? `<a class="media-external-link" href="${escapeHTML(media.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir vídeo de ${escapeHTML(station.name)} en ${escapeHTML(media.provider)}"><span class="media-external-provider">${escapeHTML(media.provider)}</span><span class="media-external-title">Ver vídeo</span><span class="media-external-hint">Se abrirá fuera de la experiencia</span></a>`
   : media?.failed
     ? `<a class="media-external-link" href="${escapeHTML(media.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir vídeo de ${escapeHTML(station.name)} en una pestaña nueva"><span class="media-external-provider">Vídeo no disponible aquí</span><span class="media-external-title">Abrir enlace</span><span class="media-external-hint">Comprueba el acceso o el formato en el sitio original</span></a>`
     : media ? `<video class="device-video" data-station="${station.id}" data-slot="${mediaSlot || 0}" data-media-url="${escapeHTML(media.url)}"${media.poster ? ` poster="${escapeHTML(media.poster)}"` : ""} muted autoplay loop playsinline aria-label="Vídeo de ${escapeHTML(station.name)}">${mediaSources}</video>` : "";
 return `<article class="device ${playing?"is-playing":""} ${!station.enabled?"is-disabled":""}" data-station-id="${escapeHTML(station.id)}" data-age-range="${escapeHTML(appState.ageGroup)}" style="--device-accent:${station.tint};--device-deep:${station.deep}" aria-label="${escapeHTML(station.name)}: ${stateLabel}">
  <div class="device-screen ${media ? "has-video" : ""} ${posterUrl ? "has-poster" : ""}">
  ${posterMarkup}
  ${mediaMarkup}
  <div class="device-top"><span class="device-icon">${iconSVG(station.icon)}</span>${publicMode ? "" : `<span class="device-index">BT / 0${index+1}</span>`}</div>
   <div class="device-content">
    <p class="device-kicker">${escapeHTML(playing ? campaign : ageContent ? `${station.family} · ${ageProfiles[appState.ageGroup]?.label || "Todas las edades"}` : station.family)}</p>
    <h3 class="device-title">${escapeHTML(title)}</h3>
    <p class="device-copy">${escapeHTML(subtitle)}</p>
    ${playing ? `<div class="clip-meta"><span class="clip-dot"></span><span>${escapeHTML(tags)}</span></div>` : appState.presentationMode ? `<div class="clip-meta"><span class="clip-dot"></span><span>${escapeHTML((ageContent?.tags || station.tags || []).join(" · "))}</span></div><p class="visual-fallback-label">ANIMACIÓN DE DEMOSTRACIÓN · ${escapeHTML(ageProfiles[appState.ageGroup]?.label || "TODAS LAS EDADES")}</p>` : ""}
    ${posterUrl ? "" : '<div class="product-orbit" aria-hidden="true"></div><div class="product-shape" aria-hidden="true"></div>'}
   </div>
   <div class="device-bottom"><span>${stateLabel}</span>${publicMode ? `<button class="station-open-button" type="button" data-open-station="${escapeHTML(station.id)}">Explorar</button>` : `<span aria-hidden="true">${playing ? `${Math.min((station.clipIndex || 0)+1,2)}/2` : "↗"}</span>`}</div>
  </div>
 </article>`;
}
function sensorMarkup() {
 const profile = ageProfiles[appState.ageGroup];
 const controls = appState.mode === "public"
  ? `<div class="sensor-age-controls" aria-label="Simulación manual de franja de edad">${[
    ["18-29", "18–29"], ["30-44", "30–44"], ["45-59", "45–59"], ["60+", "60+"], ["all", "Todas"]
   ].map(([range, label]) => `<button class="sensor-age-button" type="button" data-demo-age-range="${range}" aria-pressed="${appState.ageGroup === range}">${label}</button>`).join("")}</div>`
  : "";
 const sensorCopy = appState.ageGroupSource === "camera"
  ? appState.ageGroup === "all" ? "Contenido general · no se asigna una franja individual." : "Franja orientativa estimada en este dispositivo."
  : "Vista de demostración · puedes cambiar la franja.";
 return `<article class="device sensor-device" aria-label="Sensor de entrada"><div class="device-screen sensor-screen"><div class="device-top"><span class="device-icon">${iconSVG("sensor")}</span><span class="device-index">BT / 06</span></div><div class="device-content"><p class="device-kicker">SENSOR DE ENTRADA</p><h3 class="device-title">${escapeHTML(profile?.label || "Todas las edades")}</h3><p class="device-copy">${escapeHTML(sensorCopy)}</p>${controls}<div class="sensor-radar" aria-hidden="true"></div></div><div class="device-bottom"><span>${appState.sessionActive?"SESIÓN ACTIVA":"DEMOSTRACIÓN"}</span><span aria-hidden="true">⌁</span></div></div></article>`;
}
let lastPlayerTrigger = null;
function closeStationPlayer() {
 const player = $("#station-player");
 if (!player) return;
 const video = player.querySelector("video");
 video?.pause();
 player.hidden = true;
 $("#station-player-content").replaceChildren();
 lastPlayerTrigger?.focus();
 lastPlayerTrigger = null;
}

function openStationPlayer(station) {
 const player = $("#station-player");
 const content = station.ageContent?.[appState.ageGroup] || station.ageContent?.all;
 if (!player || !content) return;
 lastPlayerTrigger = document.activeElement;
 const mappedVideo = station.video?.[appState.ageGroup];
 const mappedPoster = station.posterByAge?.[appState.ageGroup];
 const localMedia = station.mediaFiles?.find(media => media?.audience === appState.ageGroup && media.kind === "video" && !media.failed);
 const candidateVideoUrl = mappedVideo || localMedia?.url || "";
 const videoUrl = candidateVideoUrl && new URL(candidateVideoUrl, document.baseURI).origin === location.origin ? candidateVideoUrl : "";
 const posterUrl = mappedPoster || localMedia?.poster || "";
 const media = videoUrl
  ? `<video class="station-player-video" ${posterUrl ? `poster="${escapeHTML(posterUrl)}"` : ""} muted autoplay loop playsinline aria-label="Vídeo de ${escapeHTML(station.name)}"><source src="${escapeHTML(new URL(videoUrl, document.baseURI).href)}"></video>`
  : `<div class="station-player-art" style="--player-accent:${escapeHTML(station.tint)};--player-deep:${escapeHTML(station.deep)}" aria-hidden="true"><span>${iconSVG(station.icon)}</span><i></i><b></b></div>`;
 $("#station-player-content").innerHTML = `${media}<div class="station-player-copy"><p class="eyebrow">${escapeHTML(station.name)} · ${escapeHTML(ageProfiles[appState.ageGroup]?.label || "Todas las edades")}</p><h2 id="station-player-title">${escapeHTML(content.headline)}</h2><p>${escapeHTML(content.copy)}</p><ul>${content.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join("")}</ul>${videoUrl ? "" : '<small>Visual animado provisional · falta integrar el vídeo verificado de esta franja.</small>'}</div>`;
 const video = player.querySelector("video");
 video?.addEventListener("error", () => {
  video.remove();
  const art = document.createElement("div");
  art.className = "station-player-art";
  art.innerHTML = `<span>${iconSVG(station.icon)}</span><i></i><b></b>`;
  $("#station-player-content").prepend(art);
  const notice = document.createElement("small");
  notice.textContent = "Este vídeo no se pudo reproducir; se muestra la composición visual de reserva.";
  $("#station-player-content").append(notice);
 }, { once: true });
 player.hidden = false;
 player.querySelector(".station-player-dismiss")?.focus();
}

let playerHandlersReady = false;
export function renderDevices() {
 const stations = [...appState.stations.values()];
 const admin = $("#device-grid"), pub = $("#public-grid");
 if (admin) admin.innerHTML = stations.map((s,i)=>deviceMarkup(s,i, appState.mode !== "public")).join("") + sensorMarkup();
 if (pub) {
  const visibleStations = stations;
  pub.innerHTML = visibleStations.map((s,i)=>deviceMarkup(s,i, true, true)).join("") + sensorMarkup();
 }
 document.querySelectorAll("[data-open-station]").forEach(button => button.addEventListener("click", () => {
  const station = appState.stations.get(button.dataset.openStation);
  if (station) openStationPlayer(station);
 }));
 if (!playerHandlersReady) {
  $("#station-player .station-player-dismiss")?.addEventListener("click", closeStationPlayer);
  $("#station-player")?.addEventListener("click", event => {
   if (event.target.id === "station-player") closeStationPlayer();
  });
  document.addEventListener("keydown", event => {
   const player = $("#station-player");
   if (event.key === "Escape" && player && !player.hidden) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeStationPlayer();
   }
  });
  playerHandlersReady = true;
 }
 document.querySelectorAll("[data-demo-age-range]").forEach(button => button.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("beautytech:age-estimated", {
   detail: { ageGroup: button.dataset.demoAgeRange, source: "manual-range-selection" }
  }));
 }));
 document.querySelectorAll(".device-video").forEach(video => {
  video.addEventListener("ended", () => {
   window.dispatchEvent(new CustomEvent("beautytech:media-ended", { detail: { stationId: video.dataset.station, slot: Number(video.dataset.slot), url: video.dataset.mediaUrl } }));
  }, { once: true });
  video.addEventListener("error", () => {
   const station = appState.stations.get(video.dataset.station);
   const slot = Number(video.dataset.slot);
   if (!station || station.mediaFiles?.[slot]?.url !== video.dataset.mediaUrl) return;
   const media = station.mediaFiles[slot];
   if (media.sourceUrl) media.failed = true;
   else station.mediaFiles[slot] = null;
   const status = $("#media-status");
   if (status) status.textContent = `No se pudo reproducir el vídeo de ${station.name}. Revisa el enlace, los permisos y el formato; puedes abrirlo desde la pantalla o sustituirlo.`;
   window.dispatchEvent(new CustomEvent("beautytech:media-error", { detail: { stationId: station.id, slot, url: video.dataset.mediaUrl } }));
   renderDevices();
  }, { once: true });
 });
}
