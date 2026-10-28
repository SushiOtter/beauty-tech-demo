import { appState } from "./state.js";
import { $, escapeHTML } from "./utils.js";
import { renderDevices } from "./panels.js?v=33";

let selectedStationId = "";
let adminPin = "";

function currentStation() {
  return appState.stations.get(selectedStationId) || [...appState.stations.values()][0] || null;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderVideoList(videos) {
  const host = $("#media-list");
  if (!videos.length) {
    host.innerHTML = '<p class="media-empty">Aún no hay vídeos en esta sección.</p>';
    return;
  }
  host.innerHTML = videos.map(video => `
    <article class="server-video">
      <div><strong>${escapeHTML(video.name)}</strong><small>${formatSize(video.size)}</small></div>
      <a href="${escapeHTML(video.url)}" target="_blank" rel="noopener noreferrer">Previsualizar</a>
      <button class="button button-quiet" data-delete-video="${escapeHTML(video.id)}" type="button">Eliminar</button>
    </article>`).join("");
}

function setStationVideos(station, videos) {
  station.mediaFiles = videos.map(video => ({
    ...video,
    kind: "video",
    audience: "all"
  }));
  renderDevices();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      adminPin = "";
      $("#media-admin-pin").value = "";
    }
    throw new Error(payload.error || `Error del servidor (${response.status}).`);
  }
  return payload;
}

function getAdminPin() {
  adminPin = $("#media-admin-pin").value.trim();
  if (!adminPin) {
    $("#media-admin-pin").focus();
    throw new Error("Introduce el código de administración que aparece en la ventana del servidor del PC.");
  }
  return adminPin;
}

async function loadStationVideos() {
  const station = currentStation();
  if (!station) return;
  $("#media-status").textContent = `Cargando vídeos de ${station.name} desde el PC…`;
  try {
    const result = await requestJson(`/api/videos?section=${encodeURIComponent(station.id)}`);
    renderVideoList(result.videos);
    setStationVideos(station, result.videos);
    $("#media-status").textContent = `${result.videos.length} vídeo(s) guardado(s) en este PC para ${station.name}.`;
  } catch (error) {
    $("#media-list").innerHTML = "";
    $("#media-status").textContent = `No se pudieron cargar los vídeos: ${error.message}`;
  }
}

async function uploadFiles(files) {
  const station = currentStation();
  if (!station || !files.length) return;
  const pin = getAdminPin();
  const supported = /\.(mp4|webm|ogv|ogg)$/i;
  const rejected = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!supported.test(file.name)) {
      rejected.push(`${file.name}: formato no admitido`);
      continue;
    }
    if (!file.size || file.size > 500 * 1024 * 1024) {
      rejected.push(`${file.name}: tamaño fuera del límite de 500 MB`);
      continue;
    }
    $("#media-status").textContent = `Subiendo ${index + 1}/${files.length}: ${file.name}…`;
    const url = new URL("/api/videos", location.origin);
    url.searchParams.set("section", station.id);
    url.searchParams.set("name", file.name);
    try {
      await requestJson(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pin}`,
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });
    } catch (error) {
      if (error.message.includes("código de administración")) adminPin = "";
      $("#media-status").textContent = `No se pudo subir ${file.name}: ${error.message}`;
      return;
    }
  }
  await loadStationVideos();
  $("#media-status").textContent = rejected.length
    ? `Carga terminada. No se añadieron: ${rejected.join("; ")}.`
    : `Vídeos de ${station.name} guardados en el PC. Ya están disponibles para las tablets.`;
}

async function deleteVideo(videoId) {
  const station = currentStation();
  if (!station) return;
  if (!window.confirm("¿Eliminar este vídeo del servidor del PC?")) return;
  try {
    await requestJson(`/api/videos/${encodeURIComponent(videoId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAdminPin()}` }
    });
    await loadStationVideos();
  } catch (error) {
    $("#media-status").textContent = `No se pudo eliminar el vídeo: ${error.message}`;
  }
}

export function initializeMediaControls() {
  const select = $("#media-station");
  if (!select) return;
  select.innerHTML = [...appState.stations.values()]
    .map(station => `<option value="${escapeHTML(station.id)}">${escapeHTML(station.name)}</option>`)
    .join("");
  selectedStationId = select.value;
  select.addEventListener("change", () => {
    selectedStationId = select.value;
    void loadStationVideos();
  });
  $("#media-slots").innerHTML = `
    <label class="media-admin-code" for="media-admin-pin">
      Código de administración (solo desde el PC del servidor)
      <input id="media-admin-pin" type="password" autocomplete="off" inputmode="text" placeholder="Código mostrado en el PC">
    </label>
    <label class="media-upload" for="media-upload-files">
      <strong>Añadir vídeos desde este PC a la sección</strong>
      <span>Elige uno o varios archivos. MP4, WebM u Ogg · máximo 500 MB por vídeo.</span>
      <input id="media-upload-files" type="file" accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogv,.ogg" multiple>
    </label>
    <div id="media-list" class="server-video-list" aria-live="polite"></div>`;
  $("#media-upload-files").addEventListener("change", event => {
    const files = [...event.target.files];
    event.target.value = "";
    void uploadFiles(files).catch(error => {
      $("#media-status").textContent = error.message;
    });
  });
  $("#media-list").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-video]");
    if (button) void deleteVideo(button.dataset.deleteVideo);
  });
  void loadStationVideos();
}
