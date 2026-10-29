import { appState } from "./state.js";
import { $ } from "./utils.js";
import { startCamera, stopCamera } from "./camera.js?v=36";
import { listVideos } from "./supabase.js";

let activeStationId = "";
let playlist = [];
let playlistCursor = 0;
let activeVideoIndex = -1;
let presenceActive = false;
let failedVideoIndexes = new Set();

function playAttractVideo() {
  const video = $("#kiosk-attract-video");
  if (!playlist.length) return;
  video.src = playlist[0].url;
  video.load();
  video.play().catch(error => {
    console.warn("No se pudo reproducir el vídeo de espera de la tablet:", error);
  });
}

function stopAttractVideo() {
  const video = $("#kiosk-attract-video");
  video.pause();
}

function showVideo(index) {
  const video = $("#kiosk-video");
  if (!presenceActive || !playlist.length) return;
  stopAttractVideo();
  const videoIndex = index % playlist.length;
  activeVideoIndex = videoIndex;
  const media = playlist[videoIndex];
  playlistCursor = (activeVideoIndex + 1) % playlist.length;
  video.src = media.url;
  video.loop = false;
  video.setAttribute("aria-label", `Vídeo de ${media.name}`);
  $("#kiosk-player").hidden = false;
  $("#kiosk-attract").hidden = true;
  video.play().then(() => {
    if (presenceActive && activeVideoIndex === videoIndex) $("#kiosk-camera-status").textContent = "Vídeo de la sección en reproducción.";
  }, error => {
    handleVideoFailure(videoIndex, error);
  });
}

function nextPlayableIndex(startIndex) {
  for (let offset = 0; offset < playlist.length; offset += 1) {
    const index = (startIndex + offset) % playlist.length;
    if (!failedVideoIndexes.has(index)) return index;
  }
  return -1;
}

function handleVideoFailure(index, error) {
  if (!presenceActive || index !== activeVideoIndex || failedVideoIndexes.has(index)) return;
  console.error("No se pudo reproducir el vídeo de la tablet:", error);
  failedVideoIndexes.add(index);
  const nextIndex = nextPlayableIndex(playlistCursor);
  if (nextIndex >= 0) {
    showVideo(nextIndex);
    return;
  }
  presenceActive = false;
  const video = $("#kiosk-video");
  video.pause();
  video.currentTime = 0;
  $("#kiosk-player").hidden = true;
  $("#kiosk-attract").hidden = false;
  playAttractVideo();
  $("#kiosk-camera-status").textContent = "No se pudieron reproducir los vídeos. La cámara sigue detectando presencia.";
}

async function loadPlaylist(station) {
  try {
    playlist = (await listVideos(station.id)).map(video => ({
      name: video.name,
      url: video.url
    }));
    $("#kiosk-library-status").textContent = playlist.length
      ? `${playlist.length} vídeo(s) disponibles en esta sección.`
      : "Esta sección todavía no tiene vídeos subidos.";
    $("#kiosk-presence-prompt").textContent = playlist.length
      ? "Acércate para ver nuestros productos"
      : "Añade vídeos a esta sección desde la administración del PC";
    playlistCursor = 0;
    activeVideoIndex = -1;
    failedVideoIndexes = new Set();
    return playlist.length > 0;
  } catch (error) {
    console.error("No se pudo consultar la biblioteca de vídeos del PC:", error);
    $("#kiosk-library-status").textContent = "No se pudo conectar con la biblioteca de Supabase.";
    $("#kiosk-presence-prompt").textContent = "Comprueba la conexión con la biblioteca online";
    playlist = [];
    failedVideoIndexes = new Set();
    return false;
  }
}

async function startKiosk(stationId) {
  const station = appState.stations.get(stationId);
  if (!station?.enabled) {
    $("#toast").textContent = "Selecciona una sección activa antes de iniciar.";
    return;
  }
  activeStationId = stationId;
  playlist = [];
  playlistCursor = 0;
  activeVideoIndex = -1;
  failedVideoIndexes = new Set();
  presenceActive = false;
  appState.kioskMode = true;
  appState.mode = "public";
  appState.presentationMode = false;
  appState.presentationStationId = stationId;
  appState.returnToWorker = true;
  $("#camera-station").value = stationId;
  $("#worker-view").hidden = true;
  $("#admin-view").hidden = true;
  $("#public-view").hidden = false;
  $("#tablet-kiosk").hidden = false;
  $("#admin-lock").hidden = true;
  $("#presentation-exit").hidden = true;
  $("#kiosk-attract").hidden = false;
  $("#kiosk-player").hidden = true;
  $("#kiosk-category").textContent = station.name;
  $("#kiosk-copy").textContent = station.copy || "Descubre nuestros productos y novedades.";
  $("#kiosk-camera-status").textContent = "Solicitando permiso para detectar presencia en este dispositivo…";
  $("#kiosk-manual-start").hidden = true;
  document.body.classList.add("tablet-mode");
  const hasVideos = await loadPlaylist(station);
  if (!appState.kioskMode || activeStationId !== stationId) return;
  playAttractVideo();
  if (!hasVideos) {
    $("#kiosk-camera-status").textContent = "La tablet está en espera. Añade vídeos a esta sección desde Administración.";
    return;
  }
  const cameraReady = await startCamera();
  if (!appState.kioskMode || activeStationId !== stationId) return;
  if (!cameraReady) {
    $("#kiosk-manual-start").hidden = false;
    $("#kiosk-manual-start").focus();
  }
}

function stopKiosk() {
  presenceActive = false;
  appState.kioskMode = false;
  stopCamera();
  const video = $("#kiosk-video");
  video.pause();
  video.removeAttribute("src");
  video.load();
  stopAttractVideo();
  $("#tablet-kiosk").hidden = true;
  $("#public-view").hidden = true;
  $("#worker-view").hidden = false;
  $("#admin-view").hidden = true;
  $("#admin-lock").hidden = false;
  document.body.classList.remove("tablet-mode");
  appState.mode = "admin";
  appState.presentationMode = false;
  appState.presentationStationId = "";
  activeStationId = "";
  playlist = [];
  failedVideoIndexes = new Set();
  $("#worker-start")?.focus();
}

function beginPresence() {
  if (!appState.kioskMode || !activeStationId || presenceActive) return;
  presenceActive = true;
  playlistCursor = 0;
  activeVideoIndex = -1;
  failedVideoIndexes = new Set();
  $("#kiosk-camera-status").textContent = "Presencia detectada. Reproduciendo contenido de la sección.";
  showVideo(playlistCursor);
}

function endPresence() {
  if (!presenceActive) return;
  presenceActive = false;
  const video = $("#kiosk-video");
  video.pause();
  video.currentTime = 0;
  $("#kiosk-player").hidden = true;
  $("#kiosk-attract").hidden = false;
  playAttractVideo();
  playlistCursor = 0;
  activeVideoIndex = -1;
  failedVideoIndexes = new Set();
  $("#kiosk-camera-status").textContent = "Esperando a la siguiente persona. El detector local sigue activo.";
}

export function initializeKiosk() {
  window.addEventListener("beautytech:kiosk-start-requested", event => {
    void startKiosk(event.detail?.stationId);
  });
  window.addEventListener("beautytech:kiosk-stop-requested", stopKiosk);
  window.addEventListener("beautytech:presence-detected", beginPresence);
  window.addEventListener("beautytech:presence-lost", endPresence);
  $("#kiosk-video").addEventListener("ended", () => {
    if (!presenceActive || activeVideoIndex < 0) return;
    const nextIndex = nextPlayableIndex(playlistCursor);
    if (nextIndex >= 0) showVideo(nextIndex);
  });
  $("#kiosk-video").addEventListener("error", () => {
    if (!presenceActive || !playlist.length) return;
    handleVideoFailure(activeVideoIndex, new Error("Error de carga o reproducción del vídeo."));
  });
  $("#kiosk-manual-start").addEventListener("click", () => {
    if (!playlist.length || presenceActive) return;
    presenceActive = true;
    playlistCursor = 0;
    activeVideoIndex = -1;
    failedVideoIndexes = new Set();
    $("#kiosk-camera-status").textContent = "Modo sin cámara: contenido iniciado manualmente.";
    showVideo(playlistCursor);
  });
  $("#kiosk-stop").addEventListener("click", stopKiosk);
}
