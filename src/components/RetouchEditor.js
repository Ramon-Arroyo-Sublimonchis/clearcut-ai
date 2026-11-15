'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  X, Eraser, Paintbrush, Hand, Undo2, ZoomIn, ZoomOut, Maximize, Mouse, Eye, EyeOff, Check,
} from 'lucide-react';

// Pincel para corregir a mano lo que la IA recortó mal: "Borrar" quita restos del fondo
// y "Restaurar" devuelve partes de la foto original que la IA borró.
// Trabaja sobre el PNG en su resolución real; los trazos se guardan para poder deshacer sin copias de la imagen.

// Zoom en píxeles reales de la foto: 1 = 100 % (1:1). El mínimo es lo que cabe en pantalla
const MAX_SCALE = 8;
const ZOOM_STEP = 1.25;
// Sensibilidad de Ctrl + rueda: un paso de rueda (100 px) acerca o aleja ~25 %
const WHEEL_ZOOM_SPEED = 0.0025;
const MIN_BRUSH = 4;
const MAX_BRUSH = 160;

const TOOLS = [
  { id: 'erase', label: 'Borrar', Icon: Eraser },
  { id: 'restore', label: 'Restaurar', Icon: Paintbrush },
  { id: 'pan', label: 'Mover', Icon: Hand },
];

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function setBrush(ctx, engine, mode) {
  if (mode === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = ctx.fillStyle = '#000';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = ctx.fillStyle = engine.pattern;
  }
}

function paintDot(engine, stroke, p) {
  const { ctx } = engine;
  ctx.save();
  setBrush(ctx, engine, stroke.mode);
  ctx.beginPath();
  ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintSegment(engine, stroke, from, to) {
  const { ctx } = engine;
  ctx.save();
  setBrush(ctx, engine, stroke.mode);
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function paintStroke(engine, stroke) {
  const [first, ...rest] = stroke.points;
  paintDot(engine, stroke, first);
  let prev = first;
  for (const p of rest) {
    paintSegment(engine, stroke, prev, p);
    prev = p;
  }
}

export default function RetouchEditor({ original, result, ratio, previewBg, onApply, onClose }) {
  const dialogRef = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const engineRef = useRef(null);
  const strokesRef = useRef([]);
  const activeRef = useRef(null);
  const zoomAnchorRef = useRef(null);
  const scaleRef = useRef(1);
  const limitsRef = useRef({ fitScale: 1, minScale: 1, maxScale: MAX_SCALE });
  const touchesRef = useRef(new Map());
  const pinchRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | saving | failed
  const [tool, setTool] = useState('erase');
  const [brush, setBrushSize] = useState(32);
  const [imageSize, setImageSize] = useState(null);
  // 'fit' sigue ajustada a la pantalla aunque cambie el tamaño de la ventana
  const [zoom, setZoom] = useState('fit');
  const [zoomTick, setZoomTick] = useState(0);
  const [spacePan, setSpacePan] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [fit, setFit] = useState({ width: 0, height: 0 });
  // El editor solo se monta en el navegador, así que se puede leer navigator al iniciar
  const [modKey] = useState(() => (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'));

  const fitScale = imageSize && fit.width ? fit.width / imageSize.width : 1;
  const scale = zoom === 'fit' ? fitScale : zoom;
  const minScale = Math.min(fitScale, 1);
  const maxScale = Math.max(MAX_SCALE, fitScale);
  // Mantener Espacio mueve la foto sin cambiar de herramienta, como en Photoshop
  const activeTool = spacePan ? 'pan' : tool;

  useLayoutEffect(() => {
    scaleRef.current = scale;
    limitsRef.current = { fitScale, minScale, maxScale };
  }, [scale, fitScale, minScale, maxScale]);

  // Abre como modal: bloquea la página de atrás y Esc lo cierra
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  // Prepara el lienzo con el resultado y la original a la misma medida
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [orig, res] = await Promise.all([loadImage(original), loadImage(result)]);
      if (cancelled) return;
      const width = res.naturalWidth;
      const height = res.naturalHeight;
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(res, 0, 0);
      // En celular el resultado puede estar reducido: la original se lleva a la misma medida
      const origCanvas = document.createElement('canvas');
      origCanvas.width = width;
      origCanvas.height = height;
      const octx = origCanvas.getContext('2d');
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(orig, 0, 0, width, height);
      engineRef.current = { ctx, base: res, pattern: ctx.createPattern(origCanvas, 'no-repeat'), width, height };
      setImageSize({ width, height });
      setStatus('ready');
    })().catch((err) => {
      console.error('Retouch load failed:', err);
      if (!cancelled) setStatus('failed');
    });
    return () => {
      cancelled = true;
    };
  }, [original, result]);

  // Tamaño que ocupa la foto completa en pantalla
  useEffect(() => {
    const viewport = viewportRef.current;
    const measure = () => {
      const style = getComputedStyle(viewport);
      const w = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const h = viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const width = Math.max(1, Math.min(w, h * ratio));
      setFit({ width, height: width / ratio });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [ratio]);

  // Tras cada zoom, desplaza la vista para que el punto de la foto bajo el cursor (o el centro) no se mueva
  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    if (!anchor) return;
    zoomAnchorRef.current = null;
    const viewport = viewportRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    viewport.scrollLeft += rect.left + anchor.fx * rect.width - anchor.toX;
    viewport.scrollTop += rect.top + anchor.fy * rect.height - anchor.toY;
  }, [scale, zoomTick]);

  // Cambia el zoom dejando el punto `from` de la pantalla en `to` (por defecto, en el mismo lugar).
  // Se aplica al instante (flushSync) para que la rueda y el pellizco no se desfasen entre eventos.
  const zoomTo = useCallback((next, from, to) => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const { fitScale: fitNow, minScale: min, maxScale: max } = limitsRef.current;
    const target = Math.min(max, Math.max(min, next));
    const box = viewport.getBoundingClientRect();
    const anchorFrom = from ?? { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const anchorTo = to ?? anchorFrom;
    const rect = canvas.getBoundingClientRect();
    zoomAnchorRef.current = {
      fx: (anchorFrom.x - rect.left) / rect.width,
      fy: (anchorFrom.y - rect.top) / rect.height,
      toX: anchorTo.x,
      toY: anchorTo.y,
    };
    scaleRef.current = target;
    flushSync(() => {
      setZoom(Math.abs(target - fitNow) < 1e-3 ? 'fit' : target);
      setZoomTick((t) => t + 1);
    });
  }, []);

  const zoomIn = useCallback(() => zoomTo(scaleRef.current * ZOOM_STEP), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo(scaleRef.current / ZOOM_STEP), [zoomTo]);
  const zoomFit = useCallback(() => zoomTo(limitsRef.current.fitScale), [zoomTo]);

  // Ctrl + rueda (y el pellizco del trackpad, que Chrome y Edge envían como Ctrl + rueda) hace zoom hacia el cursor.
  // Es un listener no pasivo para impedir que el navegador amplíe toda la página.
  useEffect(() => {
    const viewport = viewportRef.current;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const delta = Math.max(-100, Math.min(100, e.deltaY * unit));
      zoomTo(scaleRef.current * Math.exp(-delta * WHEEL_ZOOM_SPEED), { x: e.clientX, y: e.clientY });
    };
    // Safari en Mac envía el pellizco del trackpad como gestos; con dedos en pantalla lo maneja el pellizco táctil
    let gestureBase = 1;
    const onGestureStart = (e) => {
      e.preventDefault();
      gestureBase = scaleRef.current;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      if (touchesRef.current.size) return;
      zoomTo(gestureBase * e.scale, { x: e.clientX, y: e.clientY });
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('gesturestart', onGestureStart);
    viewport.addEventListener('gesturechange', onGestureChange);
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('gesturestart', onGestureStart);
      viewport.removeEventListener('gesturechange', onGestureChange);
    };
  }, [zoomTo]);

  const redraw = useCallback(() => {
    const engine = engineRef.current;
    const { ctx, base, width, height } = engine;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(base, 0, 0);
    strokesRef.current.forEach((stroke) => paintStroke(engine, stroke));
  }, []);

  const undo = useCallback(() => {
    if (!strokesRef.current.length || activeRef.current) return;
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redraw();
  }, [redraw]);

  // Atajos: Ctrl+Z deshacer, Ctrl + / Ctrl - zoom, Ctrl 0 ajustar, Espacio mantenido para mover
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && (key === '+' || key === '=')) {
        e.preventDefault();
        zoomIn();
      } else if (mod && key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (mod && key === '0') {
        e.preventDefault();
        zoomFit();
      } else if (key === ' ' && !mod) {
        e.preventDefault();
        if (!e.repeat) setSpacePan(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        setSpacePan(false);
      }
    };
    const onBlur = () => setSpacePan(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [undo, zoomIn, zoomOut, zoomFit]);

  const toImagePoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const moveCursor = (e) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const rect = canvasRef.current.getBoundingClientRect();
    cursor.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px)`;
    cursor.hidden = false;
  };

  const hideCursor = () => {
    if (cursorRef.current) cursorRef.current.hidden = true;
  };

  const touchPair = () => {
    const [a, b] = [...touchesRef.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  // Al poner el segundo dedo empieza el pellizco; el trazo que llevaba el primero se descarta
  const startPinch = () => {
    const hadStroke = Boolean(activeRef.current?.stroke);
    activeRef.current = null;
    if (hadStroke) redraw();
    hideCursor();
    pinchRef.current = touchPair();
  };

  const onPointerDown = (e) => {
    if (status !== 'ready' || e.button > 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    if (e.pointerType === 'touch') {
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchesRef.current.size === 2) {
        startPinch();
        return;
      }
      if (pinchRef.current || touchesRef.current.size > 2) return;
    }
    if (activeRef.current) return;

    if (activeTool === 'pan') {
      const viewport = viewportRef.current;
      activeRef.current = {
        pointerId: e.pointerId,
        pan: { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop },
      };
      return;
    }

    const canvas = canvasRef.current;
    const toImageScale = canvas.width / canvas.getBoundingClientRect().width;
    const stroke = { mode: activeTool, size: brush * toImageScale, points: [toImagePoint(e)] };
    activeRef.current = { pointerId: e.pointerId, stroke };
    paintDot(engineRef.current, stroke, stroke.points[0]);
    moveCursor(e);
  };

  const onPointerMove = (e) => {
    if (e.pointerType === 'touch' && touchesRef.current.has(e.pointerId)) {
      touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinchRef.current) {
        if (touchesRef.current.size >= 2) {
          const prev = pinchRef.current;
          const next = touchPair();
          // Acerca según la separación de los dedos y sigue el movimiento de su punto medio
          zoomTo(scaleRef.current * (next.dist / prev.dist), prev.mid, next.mid);
          pinchRef.current = next;
        }
        return;
      }
    }

    const active = activeRef.current;
    if (activeTool !== 'pan') moveCursor(e);
    if (!active || active.pointerId !== e.pointerId) return;

    if (active.pan) {
      const viewport = viewportRef.current;
      viewport.scrollLeft = active.pan.left - (e.clientX - active.pan.x);
      viewport.scrollTop = active.pan.top - (e.clientY - active.pan.y);
      return;
    }

    // Los eventos agrupados dan un trazo continuo aunque el dedo se mueva rápido
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const list = events.length ? events : [e.nativeEvent];
    const { stroke } = active;
    for (const ev of list) {
      const point = toImagePoint(ev);
      paintSegment(engineRef.current, stroke, stroke.points[stroke.points.length - 1], point);
      stroke.points.push(point);
    }
  };

  const endStroke = (e) => {
    if (e.pointerType === 'touch') {
      touchesRef.current.delete(e.pointerId);
      if (pinchRef.current) {
        if (touchesRef.current.size < 2) pinchRef.current = null;
        return;
      }
    }
    const active = activeRef.current;
    if (!active || active.pointerId !== e.pointerId) return;
    activeRef.current = null;
    if (e.pointerType !== 'mouse') hideCursor();
    if (active.stroke) {
      strokesRef.current.push(active.stroke);
      setStrokeCount(strokesRef.current.length);
    }
  };

  const requestClose = () => {
    if (strokesRef.current.length && !window.confirm('¿Salir sin guardar los retoques?')) return;
    onClose();
  };

  const apply = () => {
    if (!strokesRef.current.length) {
      onClose();
      return;
    }
    setStatus('saving');
    canvasRef.current.toBlob((blob) => {
      if (blob) onApply(blob);
      else setStatus('failed');
    }, 'image/png');
  };

  const ready = status === 'ready';
  const ghostVisible = showOriginal || tool === 'restore';
  const stageWidth = imageSize ? imageSize.width * scale : fit.width;
  const stageHeight = imageSize ? imageSize.height * scale : fit.height;
  const isFit = zoom === 'fit';
  const isActualSize = Math.abs(scale - 1) < 1e-3;

  return (
    <dialog
      ref={dialogRef}
      className="retouch-dialog"
      aria-label="Retocar recorte"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <div className="retouch-toolbar">
        <div className="retouch-tools" role="group" aria-label="Herramienta">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="tool-chip"
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
              disabled={!ready}
            >
              <Icon className="icon-md" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <label className="retouch-size">
          <span>Tamaño</span>
          <input
            type="range"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={brush}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            disabled={!ready || tool === 'pan'}
          />
        </label>

        <div className="retouch-zoom-group" role="group" aria-label="Zoom">
          <button
            className="icon-button"
            onClick={zoomOut}
            disabled={!ready || scale <= minScale + 1e-3}
            aria-label="Alejar"
            title={`Alejar (${modKey} −)`}
          >
            <ZoomOut className="icon-md" aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            onClick={zoomIn}
            disabled={!ready || scale >= maxScale - 1e-3}
            aria-label="Acercar"
            title={`Acercar (${modKey} +)`}
          >
            <ZoomIn className="icon-md" aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            onClick={zoomFit}
            disabled={!ready}
            aria-pressed={isFit}
            aria-label="Ajustar a la pantalla"
            title={`Ajustar a la pantalla (${modKey} 0)`}
          >
            <Maximize className="icon-md" aria-hidden="true" />
          </button>
          <button
            className="icon-button zoom-actual"
            onClick={() => zoomTo(1)}
            disabled={!ready}
            aria-pressed={isActualSize}
            aria-label="Tamaño real (100 %)"
            title="Tamaño real (100 %)"
          >
            1:1
          </button>
          <span className="retouch-zoom" aria-live="polite">{Math.round(scale * 100)} %</span>
          <span className="zoom-hint" aria-hidden="true">
            <kbd>{modKey}</kbd> + <Mouse className="icon-md" /> Rueda: zoom
          </span>
        </div>

        <div className="retouch-buttons">
          <button
            className="icon-button"
            onClick={() => setShowOriginal((v) => !v)}
            aria-pressed={showOriginal}
            aria-label={showOriginal ? 'Ocultar la foto original' : 'Ver la foto original debajo'}
            title="Ver la original debajo"
            disabled={!ready}
          >
            {showOriginal ? <EyeOff className="icon-md" aria-hidden="true" /> : <Eye className="icon-md" aria-hidden="true" />}
          </button>
          <button
            className="icon-button"
            onClick={undo}
            disabled={!ready || !strokeCount}
            aria-label="Deshacer"
            title={`Deshacer (${modKey} Z)`}
          >
            <Undo2 className="icon-md" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className={`retouch-viewport${activeTool === 'pan' ? ' is-pan' : ''}`}>
        <div className={`retouch-stage preview-bg-${previewBg}`} style={{ width: stageWidth, height: stageHeight }}>
          <img src={original} alt="" className={`retouch-ghost${ghostVisible ? ' is-visible' : ''}`} draggable={false} />
          <canvas
            ref={canvasRef}
            className="retouch-canvas"
            aria-label="Recorte que estás retocando"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse' && !activeRef.current) hideCursor();
            }}
          />
          <div
            ref={cursorRef}
            className="retouch-cursor"
            style={{ width: brush, height: brush, margin: -brush / 2 }}
            hidden
          />
        </div>
        {status === 'loading' && <p className="retouch-status">Preparando el editor…</p>}
        {status === 'failed' && (
          <p className="retouch-status" role="alert">No se pudo abrir el editor. Cierra e inténtalo otra vez.</p>
        )}
      </div>

      <div className="retouch-footer">
        <p className="retouch-hint">
          {tool === 'erase' && 'Pinta sobre los restos del fondo para borrarlos.'}
          {tool === 'restore' && 'Pinta donde la IA borró de más: vuelve la foto original.'}
          {tool === 'pan' && 'Arrastra para moverte por la foto ampliada.'}
          <span className="touch-hint"> Pellizca con dos dedos para acercar o alejar.</span>
          <span className="mouse-hint"> Mantén Espacio para mover la foto.</span>
        </p>
        <div className="retouch-actions">
          <button className="secondary-btn" onClick={requestClose}>
            <X className="icon-md" aria-hidden="true" /> Cancelar
          </button>
          <button className="download-btn" onClick={apply} disabled={status !== 'ready'}>
            <Check className="icon-md" aria-hidden="true" /> {status === 'saving' ? 'Guardando…' : 'Aplicar'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
