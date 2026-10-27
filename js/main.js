import { appState, stationStates } from "./state.js";
import { loadConfiguration, renderConfigs } from "./configuration.js?v=32";
import { renderDevices } from "./panels.js?v=32";
import { initializeEventEngine } from "./events.js?v=32";
import { initializeAdmin } from "./admin.js?v=32";
import { detectionCapabilities } from "./detection.js";
import { $ } from "./utils.js";
import { initializeMediaControls } from "./media.js?v=32";

async function boot() {
 try {
  const config = await loadConfiguration();
    config.stations.forEach(station => appState.stations.set(station.id, { ...station, enabled: station.enabled ?? true, state: station.enabled === false ? stationStates.DISABLED : stationStates.IDLE }));
  renderConfigs();
  renderDevices();
  initializeEventEngine();
  initializeAdmin();
  initializeMediaControls();
  $("#system-status").textContent = "Sistema preparado";
  console.info("Capacidades del prototipo:", detectionCapabilities);
 } catch (error) {
  $("#system-status").textContent = "Error de configuración";
  console.error(error);
  const host = $("#station-configs");
  host.innerHTML = `<p role="alert">No se pudo cargar la configuración. Comprueba que el servidor local está activo y que <code>data/contenido.json</code> existe. ${error.message}</p>`;
 }
}
boot();
