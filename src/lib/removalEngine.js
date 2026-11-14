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
  // En celular: mismo modelo en CPU (WebGPU es inestable en GPUs móviles).
  // No usar isnet_quint8: deja ~9% de residuos del fondo y huecos en el objeto.
  config: { model: 'isnet_fp16', device: 'cpu' },
  maxSide: 4096,
  maxPixels: 16_000_000,
  // Se acepta más porque se reduce antes de procesar (cubre cámaras de 48 y 50 MP)
  maxInputMP: 50,
};

export function getDeviceProfile() {
  const nav = typeof navigator === 'undefined' ? null : navigator;
  const ua = nav?.userAgent ?? '';
  const mobile =
    nav?.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(ua) ||
    // iPadOS se presenta como Mac de escritorio
    (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1);
  return { mobile: Boolean(mobile), ...(mobile ? MOBILE : DESKTOP) };
}

// El worker murió a mitad de un proceso (casi siempre por falta de memoria)
export class WorkerCrashError extends Error {}
export class CancelledError extends Error {}

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
  const key = profile.config.model;
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
  const blob = await removeBackground(source, { ...profile.config, progress: onProgress });
  return { blob, width, height, downscaled };
}

// Detiene el proceso en curso y libera la memoria del worker
export function cancelRemoval() {
  if (jobs.size === 0) return;
  discardWorker(new CancelledError('cancelled'));
}
