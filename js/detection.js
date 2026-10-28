/* Capacidades del detector de presencia usado por el modo tablet. */
export const detectionCapabilities = Object.freeze({
  cameraAccess: true,
  motionDetection: false,
  personDetectionAI: false,
  faceDetectionAI: true,
  faceModel: "@vladmandic/face-api TinyFaceDetector (local)",
  presenceDetection: "rostro visible de forma sostenida; sin identificación",
  imageStorage: false,
  ageEstimation: false,
  stationSelection: "selección manual de sección por el empleado"
});
