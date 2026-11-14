// Worker de módulo: la IA corre aquí para que la página siga respondiendo mientras procesa.
import { removeBackground, preload } from '@imgly/background-removal';
import { fitToLimits } from './fitToLimits';

// El CDN del modelo solo permite 4 h de caché HTTP, y en celular el navegador suele borrar archivos grandes.
// Se guardan en Cache Storage: las URLs llevan la versión y los fragmentos se nombran por hash, así que no cambian.
const MODEL_ORIGIN = 'https://staticimgly.com/';
const MODEL_CACHE = 'imgly-background-removal-1.7.0';
const networkFetch = self.fetch.bind(self);

// Al actualizar la librería, borra los modelos de versiones anteriores
if (typeof caches !== 'undefined') {
  caches.keys()
    .then((keys) => keys
      .filter((k) => k.startsWith('imgly-background-removal-') && k !== MODEL_CACHE)
      .forEach((k) => caches.delete(k)))
    .catch(() => {});
}

self.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input?.url ?? String(input));
  if (!url.startsWith(MODEL_ORIGIN) || typeof caches === 'undefined') return networkFetch(input, init);
  try {
    const cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(url);
    if (hit) return hit;
    const response = await networkFetch(input, init);
    if (response.ok) await cache.put(url, response.clone()).catch(() => {});
    return response;
  } catch {
    return networkFetch(input, init);
  }
};

self.onmessage = async ({ data }) => {
  const { id, type, config } = data;
  try {
    if (type === 'preload') {
      await preload(config);
      return;
    }
    const { source, width, height, downscaled } = await fitToLimits(data.file, data.maxSide, data.maxPixels);
    const blob = await removeBackground(source, {
      ...config,
      progress: (key, current, total) => self.postMessage({ id, type: 'progress', key, current, total }),
    });
    self.postMessage({ id, type: 'done', blob, width, height, downscaled });
  } catch (err) {
    if (type === 'preload') return; // la ejecución real volverá a intentarlo y mostrará el error
    self.postMessage({ id, type: 'error', message: String(err?.message ?? err) });
  }
};

// Avisa que el módulo cargó; si nunca llega, la página usa el hilo principal
self.postMessage({ type: 'ready' });
