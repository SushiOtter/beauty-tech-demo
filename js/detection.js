/* Capacidades reales del prototipo actual. */
export const detectionCapabilities = Object.freeze({
  cameraAccess: true,
  motionDetection: false,
  personDetectionAI: false,
  faceDetectionAI: true,
  faceModel: "@vladmandic/face-api TinyFaceDetector (local)",
  proximity: "estimación aproximada por tamaño de detección",
  orientation: false,
  gaze: false,
  attentionInference: "presencia sostenida en una zona; no equivale a atención real",
  ageEstimation: "rango aproximado en el navegador mediante @vladmandic/face-api (local)",
  stationSelection: "asignación manual de zonas por el empleado"
});
