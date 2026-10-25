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

### Configuración

No hace falta configurar variables de entorno. Todo está en `src/content/landing.js`:

- Nombre, versión, URLs, textos de la landing y JSON-LD.
- AdSense: `ADSENSE_CLIENT` y `AD_SLOTS`, con los IDs de bloque de cada ubicación:

| Clave | Ubicación |
| --- | --- |
| `top` | Bloque horizontal (90 px) bajo el encabezado, antes de la herramienta. |
| `tool` | Bloque rectangular (250 px) bajo la herramienta; aparece con la primera imagen. |
| `content` | Bloque rectangular (250 px) entre la tabla comparativa y las preguntas frecuentes. |

Hoy los tres usan el mismo bloque (`7636974134`). Para ver informes separados por ubicación, crea bloques nuevos en AdSense y cambia los IDs en `AD_SLOTS`. En `localhost` AdSense no sirve anuncios, así que ahí solo se ve el espacio reservado.

## Licencia

Este proyecto se distribuye bajo la licencia [GNU AGPL-3.0](LICENSE.md), la misma de `@imgly/background-removal`. Si usas o modificas este código en un servicio público, debes publicar también tu código fuente.
