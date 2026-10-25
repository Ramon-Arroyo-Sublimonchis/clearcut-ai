'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Upload, X, Download, Image as ImageIcon, RotateCcw, AlertTriangle, Maximize2, Columns2, MoreHorizontal, ExternalLink,
} from 'lucide-react';
import CompareSlider from './CompareSlider';
import PhotoFrame from './PhotoFrame';
import AdSlot from './AdSlot';
import { ECOSYSTEM_LINKS } from '@/content/landing';

// isnet_fp16 pesa la mitad que isnet con casi la misma calidad; 'gpu' usa WebGPU y si no hay, WASM
const REMOVAL_CONFIG = {
  model: 'isnet_fp16',
  device: 'gpu',
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_MB = 20;
const MAX_MEGAPIXELS = 40;

const PREVIEW_BACKGROUNDS = [
  { id: 'checker', label: 'Cuadrícula' },
  { id: 'white', label: 'Blanco' },
  { id: 'black', label: 'Negro' },
];

// La librería (~onnx + wasm) se carga solo cuando hace falta, fuera del bundle inicial
let removalLib = null;
const loadRemovalLib = () => {
  removalLib ??= import('@imgly/background-removal');
  return removalLib;
};

let preloadStarted = false;
const preloadModel = () => {
  if (preloadStarted) return;
  preloadStarted = true;
  loadRemovalLib()
    .then((lib) => lib.preload(REMOVAL_CONFIG))
    .catch(() => {
      preloadStarted = false;
    });
};

const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

// Devuelve { problem } si la imagen no sirve, o { width, height } si se puede procesar
async function inspectFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { problem: 'Formato no compatible. Usa PNG, JPG o WebP.' };
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return { problem: `La imagen pesa más de ${MAX_FILE_MB} MB. Prueba con una más ligera.` };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    const megapixels = (width * height) / 1_000_000;
    if (megapixels > MAX_MEGAPIXELS) {
      return { problem: `La imagen es muy grande (${Math.round(megapixels)} MP). El máximo es ${MAX_MEGAPIXELS} MP.` };
    }
    return { width, height };
  } catch {
    return { problem: 'No se pudo leer la imagen. Puede estar dañada.' };
  }
}

export default function BackgroundRemover({ adSlot }) {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  // idle | download | process | done | error
  const [phase, setPhase] = useState('idle');
  const [download, setDownload] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewBg, setPreviewBg] = useState('checker');
  const [meta, setMeta] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const fileInputRef = useRef(null);
  const dialogRef = useRef(null);
  const urlsRef = useRef([]);

  const trackUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    return url;
  }, []);

  const releaseUrls = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
  }, []);

  useEffect(() => releaseUrls, [releaseUrls]);

  const runRemoval = useCallback(async (source) => {
    setError(null);
    setProcessedImage(null);
    setDownload({ current: 0, total: 0 });
    // Se queda en 'download' hasta que la librería empieza a calcular (claves compute:*)
    setPhase('download');

    const fetches = {};
    try {
      const { removeBackground } = await loadRemovalLib();
      const blob = await removeBackground(source, {
        ...REMOVAL_CONFIG,
        progress: (key, current, total) => {
          if (key.startsWith('fetch:')) {
            fetches[key] = { current, total };
            const all = Object.values(fetches);
            const sum = all.reduce((acc, f) => acc + f.current, 0);
            const size = all.reduce((acc, f) => acc + f.total, 0);
            setDownload({ current: sum, total: size });
          } else {
            setPhase('process');
          }
        },
      });
      setProcessedImage(trackUrl(blob));
      setMeta((m) => ({ ...m, resultSize: blob.size }));
      setPhase('done');
    } catch (err) {
      console.error('Removal failed:', err);
      setError('No pudimos quitar el fondo de esta imagen. Revisa tu conexión e inténtalo otra vez.');
      setPhase('error');
    }
  }, [trackUrl]);

  const handleFile = useCallback(async (selected) => {
    if (!selected) return;
    const { problem, width, height } = await inspectFile(selected);
    releaseUrls();
    setFile(selected);
    setMeta(problem ? null : { width, height });
    if (problem) {
      setImage(null);
      setProcessedImage(null);
      setError(problem);
      setPhase('error');
      return;
    }
    setImage(trackUrl(selected));
    setHasStarted(true);
    runRemoval(selected);
  }, [releaseUrls, trackUrl, runRemoval]);

  const busy = phase === 'download' || phase === 'process';

  // Pegar una imagen con Ctrl+V / Cmd+V
  useEffect(() => {
    const onPaste = (e) => {
      if (busy) return;
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
      if (item) handleFile(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [busy, handleFile]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!busy) handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    releaseUrls();
    setFile(null);
    setImage(null);
    setProcessedImage(null);
    setError(null);
    setMeta(null);
    setMoreOpen(false);
    setPhase('idle');
  };

  const openExpanded = () => dialogRef.current?.showModal();
  const closeExpanded = () => dialogRef.current?.close();

  const saveImage = () => {
    const baseName = (file?.name ?? 'imagen').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-');
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `sublimonchis-${baseName}-sin-fondo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPercent = download.total ? Math.round((download.current / download.total) * 100) : 0;
  const statusText =
    phase === 'download'
      ? download.total
        ? `Descargando modelo de IA: ${formatMB(download.current)} de ${formatMB(download.total)} MB`
        : 'Preparando el modelo de IA…'
      : phase === 'process'
        ? 'Quitando el fondo…'
        : phase === 'done'
          ? 'Listo. Fondo eliminado.'
          : '';

  const showUploader = !image && phase !== 'error';
  const ratio = meta ? meta.width / meta.height : 1;
  const done = phase === 'done';
  const metaText = meta
    ? [`${meta.width} × ${meta.height} px`, meta.resultSize && `PNG ${formatMB(meta.resultSize)} MB`].filter(Boolean).join(' · ')
    : '';

  const bgSwitch = (
    <div className="bg-switch" role="group" aria-label="Fondo de vista previa">
      {PREVIEW_BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          className={`bg-chip preview-bg-${bg.id}`}
          aria-pressed={previewBg === bg.id}
          onClick={() => setPreviewBg(bg.id)}
          disabled={!done}
        >
          {bg.label}
        </button>
      ))}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="remover-container"
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <p className="sr-only" aria-live="polite">{statusText || error}</p>

        <input
          type="file"
          id="bg-file-input"
          className="hidden-input"
          ref={fileInputRef}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          accept={ACCEPTED_TYPES.join(',')}
        />

        <AnimatePresence mode="wait">
          {showUploader ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <label
                htmlFor="bg-file-input"
                className={`uploader-card${isDragging ? ' is-dragging' : ''}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                // Precarga solo con intención de uso, para no gastar datos de quien solo visita
                onPointerEnter={preloadModel}
                onFocus={preloadModel}
              >
                <span className="icon-box">
                  <Upload className="icon-lg" aria-hidden="true" />
                </span>
                <span className="uploader-title display-font">
                  {isDragging ? 'Suelta la imagen' : 'Subir imagen'}
                </span>
                <span className="uploader-desc">
                  Haz clic, arrastra un archivo o pégalo con Ctrl+V
                </span>
                <span className="uploader-hint">PNG, JPG o WebP · hasta {MAX_FILE_MB} MB</span>
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="preview-card"
            >
              <div className="preview-header">
                <div className="header-title">
                  <ImageIcon className="icon-md" aria-hidden="true" />
                  <span className="header-text">
                    <span>{phase === 'error' ? 'Error' : busy ? 'Procesando' : 'Resultado'}</span>
                    {metaText && <span className="header-meta">{metaText}</span>}
                  </span>
                </div>

                {phase !== 'error' && (
                  <div className="header-actions">
                    {bgSwitch}
                    <button className="secondary-btn" onClick={openExpanded} disabled={!done}>
                      <Columns2 className="icon-md" aria-hidden="true" /> Comparar
                    </button>
                    <button className="secondary-btn" onClick={reset}>
                      <Upload className="icon-md" aria-hidden="true" /> Otra imagen
                    </button>
                    <button onClick={saveImage} className="download-btn" disabled={!done}>
                      <Download className="icon-md" aria-hidden="true" />
                      Descargar PNG en HD
                    </button>
                  </div>
                )}

                <button onClick={reset} className="icon-button header-close" aria-label="Cerrar y subir otra imagen">
                  <X className="icon-md" aria-hidden="true" />
                </button>
              </div>

              {phase === 'error' ? (
                <div className="error-state" role="alert">
                  <AlertTriangle className="icon-lg" aria-hidden="true" />
                  <p>{error}</p>
                  <div className="error-actions">
                    {image && (
                      <button className="secondary-btn" onClick={() => runRemoval(file)}>
                        <RotateCcw className="icon-md" aria-hidden="true" /> Intentar otra vez
                      </button>
                    )}
                    <button className="secondary-btn" onClick={reset}>
                      <Upload className="icon-md" aria-hidden="true" /> Elegir otra imagen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dual-view">
                    <div className="image-box view-original">
                      <PhotoFrame src={image} alt="Imagen original" label="Original" ratio={ratio} />
                    </div>

                    <div className="image-box view-result">
                      {done ? (
                        <PhotoFrame
                          src={processedImage}
                          alt="Imagen sin fondo"
                          label="Sin fondo"
                          ratio={ratio}
                          previewBg={previewBg}
                          onDoubleClick={openExpanded}
                        >
                          <button className="icon-button frame-expand" onClick={openExpanded} aria-label="Ampliar y comparar">
                            <Maximize2 className="icon-md" aria-hidden="true" />
                          </button>
                        </PhotoFrame>
                      ) : (
                        <PhotoFrame src={image} alt="" label="Sin fondo" ratio={ratio} dimmed>
                          <div className="processing-state">
                            {phase === 'download' && download.total > 0 ? (
                              <>
                                <div className="progress-text">{downloadPercent}%</div>
                                <div className="progress-bar-bg">
                                  <motion.div
                                    className="progress-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${downloadPercent}%` }}
                                  />
                                </div>
                                <p className="progress-label">{statusText}</p>
                                <p className="progress-note">Normalmente solo la primera vez; luego el navegador lo reutiliza.</p>
                              </>
                            ) : (
                              <>
                                <div className="progress-bar-bg">
                                  <div className="progress-bar-indeterminate" />
                                </div>
                                <p className="progress-label">{statusText}</p>
                                <p className="progress-note">Todo ocurre en tu dispositivo; la imagen no se sube.</p>
                              </>
                            )}
                          </div>
                        </PhotoFrame>
                      )}
                    </div>
                  </div>

                  {done && (
                    <section className="ecosystem" aria-labelledby="ecosystem-title">
                      <p id="ecosystem-title" className="ecosystem-title">¿Qué sigue con tu diseño?</p>
                      <div className="ecosystem-links">
                        {ECOSYSTEM_LINKS.map((link) => (
                          <a key={link.href} href={link.href} target="_blank" rel="noopener" className="ecosystem-card">
                            <span className="ecosystem-card-title">
                              {link.title} <ExternalLink className="icon-sm" aria-hidden="true" />
                            </span>
                            <span className="ecosystem-card-text">{link.text}</span>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Móvil: acciones fijas abajo para descargar sin desplazarse */}
                  <div className="mobile-actions">
                    {moreOpen && (
                      <div className="mobile-more" id="mobile-more">
                        {bgSwitch}
                        <div className="mobile-more-row">
                          <button className="secondary-btn" onClick={openExpanded} disabled={!done}>
                            <Columns2 className="icon-md" aria-hidden="true" /> Comparar
                          </button>
                          <button className="secondary-btn" onClick={reset}>
                            <Upload className="icon-md" aria-hidden="true" /> Otra imagen
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mobile-actions-row">
                      <button onClick={saveImage} className="download-btn" disabled={!done}>
                        <Download className="icon-md" aria-hidden="true" />
                        Descargar PNG en HD
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => setMoreOpen((o) => !o)}
                        aria-expanded={moreOpen}
                        aria-controls="mobile-more"
                      >
                        <MoreHorizontal className="icon-md" aria-hidden="true" /> Más
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vista ampliada para revisar bordes; Esc o clic fuera la cierran */}
        <dialog
          ref={dialogRef}
          className="expand-dialog"
          aria-label="Vista ampliada"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeExpanded();
          }}
        >
          {phase === 'done' && (
            <>
              <button onClick={closeExpanded} className="icon-button dialog-close" aria-label="Cerrar vista ampliada">
                <X className="icon-md" aria-hidden="true" />
              </button>
              <div className="image-box dialog-box">
                <CompareSlider original={image} processed={processedImage} previewBg={previewBg} ratio={ratio} />
              </div>
            </>
          )}
        </dialog>
      </div>

      {/* Slot 2: se monta con la primera imagen y no se desmonta, para no recargar el anuncio ni mover el diseño */}
      {hasStarted && <AdSlot slot={adSlot} variant="rectangle" className="ad-slot-tool" />}
    </MotionConfig>
  );
}
