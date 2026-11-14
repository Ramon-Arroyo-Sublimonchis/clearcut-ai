// Ejecuta la eliminación de fondo en un Web Worker y, si no se puede, en el hilo principal.
import { fitToLimits } from './fitToLimits';

const DESKTOP = {
  // isnet_fp16 pesa la mitad que isnet con casi la misma calidad; 'gpu' usa WebGPU y si no hay, WASM
  config: { model: 'isnet_fp16', device: 'gpu' },
  maxSide: 0,
  maxPixels: 0,
  maxInputMP: 40,
};
const MOBILE = {
  // En celular se intenta WebGPU (unas 4 veces más rápido que la CPU) y si falla se repite en CPU.
  // No usar isnet_quint8: deja ~9% de residuos del fondo y huecos en el objeto.
  config: { model: 'isnet_fp16', device: 'gpu' },
  maxSide: 4096,
  maxPixels: 16_000_000,
  // Se acepta más porque se reduce antes de procesar (cubre cámaras de 48 y 50 MP)
  maxInputMP: 50,
};

// Recuerda si la GPU de este celular funciona. 'trying' que sobrevive a una recarga significa
// que la pestaña se cerró o se cayó durante el intento con GPU, y se trata como falla.
const GPU_STATE_KEY = 'bgr-mobile-gpu';
const GPU_RETRY_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // los navegadores se actualizan; volver a probar
// Si la GPU tarda más que esto en la inferencia, se da por colgada y se pasa a CPU
const GPU_INFERENCE_TIMEOUT_MS = 60_000;

function readGpuState() {
  try {
    return JSON.parse(localStorage.getItem(GPU_STATE_KEY)) ?? null;
  } catch {
    return null;
  }
}

function writeGpuState(state) {
  try {
    if (state) localStorage.setItem(GPU_STATE_KEY, JSON.stringify({ state, at: Date.now() }));
    else localStorage.removeItem(GPU_STATE_KEY);
  } catch {
    // Sin almacenamiento solo se pierde la memoria del resultado
  }
}

function mobileGpuAllowed(nav) {
  if (!nav || !('gpu' in nav)) return false;
  const saved = readGpuState();
  if (!saved || saved.state === 'ok') return true;
  return Date.now() - saved.at > GPU_RETRY_AFTER_MS;
}

export function getDeviceProfile() {
  const nav = typeof navigator === 'undefined' ? null : navigator;
  const ua = nav?.userAgent ?? '';
  const mobile =
    nav?.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(ua) ||
    // iPadOS se presenta como Mac de escritorio
    (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1);
  if (!mobile) return { mobile: false, ...DESKTOP };
  const device = mobileGpuAllowed(nav) ? 'gpu' : 'cpu';
  return { mobile: true, ...MOBILE, config: { ...MOBILE.config, device } };
}

// El worker murió a mitad de un proceso (casi siempre por falta de memoria)
export class WorkerCrashError extends Error {}
export class CancelledError extends Error {}
class GpuTimeoutError extends Error {}

const READY_TIMEOUT_MS = 15_000;

let worker = null;
let workerReady = null; // Promise<boolean>
let workerBroken = false; // no carga en este navegador: usar el hilo principal
let nextId = 0;
const jobs = new Map();
const preloaded = new Set();

function discardWorker(error) {
  worker?.terminate();
  preloaded.clear();
  worker = null;
  workerReady = null;
  for (const job of jobs.values()) job.reject(error);
  jobs.clear();
}

function getWorker() {
  if (workerBroken || typeof Worker === 'undefined') return Promise.resolve(null);
  if (workerReady) return workerReady.then((ok) => (ok ? worker : null));

  try {
    worker = new Worker(new URL('./removal.worker.js', import.meta.url), { type: 'module' });
  } catch {
    workerBroken = true;
    return Promise.resolve(null);
  }

  let ready = false;
  workerReady = new Promise((resolve) => {
    const giveUp = () => {
      workerBroken = true;
      discardWorker(new WorkerCrashError('worker failed to start'));
      resolve(false);
    };
    const timer = setTimeout(giveUp, READY_TIMEOUT_MS);

    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        ready = true;
        clearTimeout(timer);
        resolve(true);
        return;
      }
      const job = jobs.get(data.id);
      if (!job) return;
      if (data.type === 'progress') {
        job.onProgress?.(data.key, data.current, data.total);
        return;
      }
      jobs.delete(data.id);
      if (data.type === 'done') job.resolve(data);
      else {
        job.reject(new Error(data.message));
        // La librería memoriza un modelo que falló al cargar; un worker nuevo empieza limpio
        discardWorker(new WorkerCrashError('worker reset'));
      }
    };

    worker.onerror = (event) => {
      event.preventDefault();
      clearTimeout(timer);
      if (!ready) giveUp();
      else discardWorker(new WorkerCrashError(event.message || 'worker crashed'));
    };
  });

  return workerReady.then((ok) => (ok ? worker : null));
}

// Hilo principal: solo si el navegador no puede usar el worker de módulo
let mainLib = null;
const loadMainLib = () => (mainLib ??= import('@imgly/background-removal'));

export function preloadRemoval(profile) {
  const key = `${profile.config.model}:${profile.config.device}`;
  if (preloaded.has(key)) return;
  preloaded.add(key);
  getWorker()
    .then((w) => {
      if (w) w.postMessage({ type: 'preload', config: profile.config });
      else return loadMainLib().then((lib) => lib.preload(profile.config));
    })
    .catch(() => preloaded.delete(key));
}

export async function removeBg(file, profile, onProgress) {
  const gpuOnMobile = profile.mobile && profile.config.device === 'gpu';
  if (!gpuOnMobile) return runOnce(file, profile, onProgress);

  const previous = readGpuState()?.state ?? null;
  writeGpuState('trying');
  let timer = null;
  try {
    const result = await new Promise((resolve, reject) => {
      const tracked = (key, current, total) => {
        // El reloj corre desde que empieza la inferencia, para no castigar una descarga lenta
        if (key === 'compute:inference' && !timer) {
          timer = setTimeout(() => reject(new GpuTimeoutError('gpu timeout')), GPU_INFERENCE_TIMEOUT_MS);
        }
        onProgress(key, current, total);
      };
      runOnce(file, profile, tracked).then(resolve, reject);
    });
    writeGpuState('ok');
    return result;
  } catch (err) {
    if (err instanceof CancelledError) {
      writeGpuState(previous);
      throw err;
    }
    console.warn('WebGPU falló en este celular; se repite en CPU:', err);
    writeGpuState('failed');
    // ONNX Runtime queda cargado en su versión WebGPU; un worker nuevo carga la de CPU
    discardWorker(new WorkerCrashError('gpu fallback'));
    return runOnce(file, { ...profile, config: { ...profile.config, device: 'cpu' } }, onProgress);
  } finally {
    clearTimeout(timer);
  }
}

async function runOnce(file, profile, onProgress) {
  const w = await getWorker();
  if (w) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      jobs.set(id, { resolve, reject, onProgress });
      w.postMessage({
        id,
        type: 'run',
        file,
        config: profile.config,
        maxSide: profile.maxSide,
        maxPixels: profile.maxPixels,
      });
    });
  }

  const { source, width, height, downscaled } = await fitToLimits(file, profile.maxSide, profile.maxPixels);
  const { removeBackground } = await loadMainLib();
  // En el hilo principal no se puede reiniciar ONNX Runtime para cambiar de GPU a CPU: el celular va directo a CPU
  const config = profile.mobile ? { ...profile.config, device: 'cpu' } : profile.config;
  const blob = await removeBackground(source, { ...config, progress: onProgress });
  return { blob, width, height, downscaled };
}

// Detiene el proceso en curso y libera la memoria del worker
export function cancelRemoval() {
  if (jobs.size === 0) return;
  discardWorker(new CancelledError('cancelled'));
}
