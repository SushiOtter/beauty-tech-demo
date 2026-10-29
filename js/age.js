import { getAgeRange } from "./products.js?v=33";

const FACE_API_URL = new URL("../vendor/face-api/face-api.js", import.meta.url).href;
const MODEL_URL = new URL("../models/face-api/", import.meta.url).href;
const DETECTOR_OPTIONS = { inputSize: 224, scoreThreshold: 0.25 };
const PRESENCE_DETECTOR_OPTIONS = { inputSize: 160, scoreThreshold: 0.25 };

let libraryPromise = null;
let detectorPromise = null;
let modelsPromise = null;
let backendPromise = null;
let presenceWarmupPromise = null;

async function selectInferenceBackend(faceapi) {
  const tf = faceapi.tf;
  if (!tf?.setBackend) return;
  if (!backendPromise) {
    backendPromise = (async () => {
      let webglError;
      try {
        if (await tf.setBackend("webgl")) {
          await tf.ready();
          return "webgl";
        }
      } catch (error) {
        webglError = error;
      }
      try {
        if (await tf.setBackend("cpu")) {
          await tf.ready();
          return "cpu";
        }
      } catch (error) {
        throw new Error(`No se pudo iniciar WebGL ni el backend CPU: ${error.message}`, { cause: error });
      }
      throw new Error(`No se pudo iniciar WebGL ni el backend CPU${webglError ? `: ${webglError.message}` : "."}`);
    })().catch(error => {
      backendPromise = null;
      throw error;
    });
  }
  await backendPromise;
}

function loadFaceApi() {
  if (window.faceapi) return Promise.resolve(window.faceapi);
  if (!libraryPromise) {
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove();
          libraryPromise = null;
          reject(error);
        } else resolve(window.faceapi);
      };
      const timeout = setTimeout(() => finish(new Error("Tiempo agotado al cargar el modelo facial local.")), 10000);
      script.src = FACE_API_URL;
      script.async = true;
      script.onload = () => finish(window.faceapi ? null : new Error("El modelo facial local se cargó, pero no se inicializó."));
      script.onerror = () => finish(new Error("No se pudo cargar el modelo facial local."));
      document.head.appendChild(script);
    });
  }
  return libraryPromise;
}

async function loadDetector(faceapi) {
  if (!detectorPromise) {
    detectorPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).catch(error => {
      detectorPromise = null;
      throw error;
    });
  }
  await detectorPromise;
  return faceapi;
}

export async function loadFaceDetector() {
  const faceapi = await loadFaceApi();
  await selectInferenceBackend(faceapi);
  return loadDetector(faceapi);
}

export async function detectFace(video) {
  const faceapi = await loadFaceDetector();
  const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions(PRESENCE_DETECTOR_OPTIONS));
  if (!result) return null;
  const detection = result.detection || result;
  const { x, y, width, height } = detection.box;
  return {
    bbox: [x, y, width, height],
    score: detection.score,
    kind: "face"
  };
}

export async function warmPresenceDetector() {
  const faceapi = await loadFaceDetector();
  if (!presenceWarmupPromise) {
    const canvas = document.createElement("canvas");
    canvas.width = PRESENCE_DETECTOR_OPTIONS.inputSize;
    canvas.height = PRESENCE_DETECTOR_OPTIONS.inputSize;
    presenceWarmupPromise = faceapi.detectSingleFace(
      canvas,
      new faceapi.TinyFaceDetectorOptions(PRESENCE_DETECTOR_OPTIONS)
    ).then(() => undefined).catch(error => {
      presenceWarmupPromise = null;
      throw error;
    });
  }
  return presenceWarmupPromise;
}

async function ensureAgeModels() {
  const faceapi = await loadFaceApi();
  await loadDetector(faceapi);
  if (!modelsPromise) {
    modelsPromise = faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL).catch(error => {
      modelsPromise = null;
      throw error;
    });
  }
  await modelsPromise;
  return faceapi;
}

export async function estimateAgeRange(video) {
  const faceapi = await ensureAgeModels();
  const options = new faceapi.TinyFaceDetectorOptions(DETECTOR_OPTIONS);
  const deadline = performance.now() + 20000;
  const estimates = [];
  while (estimates.length < 10 && performance.now() < deadline) {
    const results = await faceapi.detectAllFaces(video, options).withAgeAndGender();
    if (results.length > 1) return { range: "all", reason: "multiple-faces", sampleCount: estimates.length };
    if (results.length === 1 && Number.isFinite(results[0].age)) {
      estimates.push(results[0].age);
      window.dispatchEvent(new CustomEvent("beautytech:age-scan-progress", {
        detail: { completed: estimates.length, total: 10 }
      }));
    }
    if (estimates.length < 10) await new Promise(resolve => setTimeout(resolve, 180));
  }

  if (estimates.length < 10 || performance.now() > deadline) {
    return { range: "all", reason: "insufficient-readings", sampleCount: estimates.length };
  }
  estimates.sort((a, b) => a - b);
  const middle = estimates.length / 2;
  const median = (estimates[middle - 1] + estimates[middle]) / 2;
  const range = getAgeRange(median);
  return { range: range || "all", reason: median < 18 ? "under-18" : "median", sampleCount: 10 };
}
