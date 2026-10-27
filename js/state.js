export const stationStates = Object.freeze({
  IDLE: "idle", ATTENTION: "attention", PLAYING: "playing",
  COOLDOWN: "cooldown", DISABLED: "disabled", ERROR: "error"
});
export const appState = {
  mode: "admin", presentationMode: false, presentationStationId: "",
  returnToWorker: true,
  demoProfile: null,
  ageGroup: "all",
  ageGroupSource: "default",
  sessionActive: false, sessionTimer: null, stations: new Map(), config: null
};
