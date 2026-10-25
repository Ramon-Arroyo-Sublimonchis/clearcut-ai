# Sublimonchis Background Remover · Versión 3.0

Herramienta web gratuita para quitar el fondo de imágenes con IA. Todo el proceso ocurre en el navegador del usuario: la imagen nunca se sube a un servidor.

## Cómo funciona

- [Next.js](https://nextjs.org) 16 + React 19.
- El recorte usa [@imgly/background-removal](https://github.com/imgly/background-removal-js) con el modelo ISNet (`isnet_fp16`), ejecutado con ONNX Runtime (WebGPU si está disponible, si no WASM).
- El modelo y los archivos WASM se descargan del CDN de IMG.LY la primera vez y el navegador los guarda en caché.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOP` | Bloque horizontal (90 px) bajo el encabezado, antes de la herramienta. |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOOL` | Bloque rectangular (250 px) bajo la herramienta; aparece con la primera imagen. |
| `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` | Bloque rectangular (250 px) entre la tabla comparativa y las preguntas frecuentes. |

Cada valor es el `data-ad-slot` de un bloque de AdSense. Si falta uno, en producción ese espacio no se muestra (en desarrollo se ve el espacio reservado) y los anuncios automáticos siguen activos.

El nombre, la versión, los textos de la landing y el JSON-LD están en `src/content/landing.js`.

## Licencia

Este proyecto se distribuye bajo la licencia [GNU AGPL-3.0](LICENSE.md), la misma de `@imgly/background-removal`. Si usas o modificas este código en un servicio público, debes publicar también tu código fuente.
