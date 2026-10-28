import { appState } from "./state.js";
import { $ } from "./utils.js";
import { startCamera, stopCamera } from "./camera.js?v=33";

let activeStationId = "";
let playlist = [];
let playlistCursor = 0;
let activeVideoIndex = -1;
let presenceActive = false;
let failedVideoIndexes = new Set();

function showVideo(index) {
  const video = $("#kiosk-video");
  if (!presenceActive || !playlist.length) return;
  activeVideoIndex = index % playlist.length;
  const media = playlist[activeVideoIndex];
  playlistCursor = (activeVideoIndex + 1) % playlist.length;
  video.src = media.url;
  video.loop = playlist.length === 1;
  video.setAttribute("aria-label", `Vídeo de ${media.name}`);
  $("#kiosk-player").hidden = false;
  $("#kiosk-attract").hidden = true;
  video.play().then(() => {
    if (presenceActive) $("#kiosk-camera-status").textContent = "Vídeo de la sección en reproducción.";
  }, error => {
    console.error("No se pudo reproducir el vídeo de la tablet:", error);
    $("#kiosk-camera-status").textContent = "No se pudo reproducir este vídeo. Comprueba el formato del archivo.";
  });
}

function nextPlayableIndex(startIndex) {
  for (let offset = 0; offset < playlist.length; offset += 1) {
    const index = (startIndex + offset) % playlist.length;
    if (!failedVideoIndexes.has(index)) return index;
  }
  return -1;
}

async function loadPlaylist(station) {
  try {
    const response = await fetch(`/api/videos?section=${encodeURIComponent(station.id)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Error del servidor (${response.status}).`);
    playlist = result.videos.map(video => ({
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
    $("#kiosk-library-status").textContent = "No se pudo conectar con la biblioteca del PC.";
    $("#kiosk-presence-prompt").textContent = "Comprueba la conexión con el servidor del PC";
    playlist = [];
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
  if (!hasVideos) {
    $("#kiosk-camera-status").textContent = "La tablet está en espera. Sube vídeos a esta sección desde el PC.";
    return;
  }
  const startCameraTask = startCamera();
  const cameraReady = await startCameraTask;
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
  $("#worker-start")?.focus();
}

async function beginPresence() {
  if (!appState.kioskMode || !activeStationId || presenceActive) return;
  presenceActive = true;
  $("#kiosk-camera-status").textContent = "Presencia detectada. Cargando vídeos de la sección…";
  const station = appState.stations.get(activeStationId);
  if (!station || !await loadPlaylist(station) || !presenceActive) {
    presenceActive = false;
    $("#kiosk-camera-status").textContent = "No hay vídeos disponibles. Añádelos desde la administración del PC.";
    return;
  }
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
    if (!presenceActive || playlist.length <= 1) return;
    const nextIndex = nextPlayableIndex(playlistCursor);
    if (nextIndex >= 0) showVideo(nextIndex);
  });
  $("#kiosk-video").addEventListener("error", () => {
    if (!presenceActive || !playlist.length) return;
    failedVideoIndexes.add(activeVideoIndex);
    const nextIndex = nextPlayableIndex(playlistCursor);
    if (nextIndex >= 0) {
      showVideo(nextIndex);
      return;
    }
    $("#kiosk-camera-status").textContent = "No se pudo reproducir el vídeo. Comprueba que sea MP4, WebM u Ogg.";
  });
  $("#kiosk-manual-start").addEventListener("click", () => {
    if (!playlist.length) return;
    presenceActive = true;
    $("#kiosk-camera-status").textContent = "Modo sin cámara: contenido iniciado manualmente.";
    showVideo(playlistCursor);
  });
  $("#kiosk-stop").addEventListener("click", stopKiosk);
}
