'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { ZoomIn, ZoomOut, Shrink } from 'lucide-react';

// Zoom sincronizado de los dos visores (original y sin fondo).
// Es solo visual: mueve una capa interna con CSS (--pz-s, --pz-x, --pz-y en .dual-view),
// así que el tamaño de los visores, el diseño de la página y el PNG descargado no cambian.
// La vista se guarda en un ref y solo la barra se vuelve a dibujar; el resto de la herramienta no se entera.

const STEP = 1.5;
const WHEEL_SPEED = 0.0025;
// Tope de acercamiento en píxeles reales de la foto (800 %)
const MAX_REAL = 8;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const IDLE = { percent: 0, zoomed: false, canIn: false, canActual: false, isActual: false };

function frameOf(target) {
  // Los botones encima de la foto (ampliar) no inician gestos
  if (!target?.closest || target.closest('button')) return null;
  return target.closest('.photo-frame');
}

function pointIn(frame, clientX, clientY) {
  const r = frame.getBoundingClientRect();
  return { fx: (clientX - r.left) / r.width, fy: (clientY - r.top) / r.height, w: r.width, h: r.height };
}

/**
 * @param containerRef ref de .dual-view (los dos visores heredan sus variables CSS)
 * @param enabled solo con el resultado listo
 * @param imageWidth ancho real del PNG, para 1:1 y el porcentaje
 * @param resetKey al cambiar (otra imagen, retoque aplicado) vuelve a "Ajustar"
 */
export function usePreviewZoom(containerRef, { enabled, imageWidth, resetKey }) {
  // s = escala respecto al ajuste (1 = foto completa); x, y = desplazamiento en fracción del marco
  const viewRef = useRef({ s: 1, x: 0, y: 0 });
  const optsRef = useRef({ imageWidth });
  const listenersRef = useRef(new Set());
  const snapshotRef = useRef(IDLE);

  useEffect(() => {
    optsRef.current = { imageWidth };
  }, [imageWidth]);

  const controls = useMemo(() => {
    const frameWidth = () =>
      containerRef.current?.querySelector('.view-result .photo-frame')?.getBoundingClientRect().width || 0;

    const limits = () => {
      const fw = frameWidth();
      const iw = optsRef.current.imageWidth || 0;
      // actual = escala en la que 1 píxel de la foto ocupa 1 píxel de pantalla
      const actual = fw && iw ? iw / fw : 1;
      return { actual, max: Math.max(4, actual * MAX_REAL), fw, iw };
    };

    const emit = () => {
      const { s } = viewRef.current;
      const { actual, max, fw, iw } = limits();
      const next = {
        percent: fw && iw ? Math.round((s / actual) * 100) : Math.round(s * 100),
        zoomed: s > 1.001,
        canIn: s < max - 0.001,
        canActual: actual > 1.001,
        isActual: Math.abs(s - actual) < 0.001,
      };
      const prev = snapshotRef.current;
      if (Object.keys(next).some((k) => next[k] !== prev[k])) {
        snapshotRef.current = next;
        listenersRef.current.forEach((fn) => fn());
      }
    };

    const apply = (next) => {
      const s = clamp(next.s, 1, limits().max);
      // La capa nunca deja ver el fondo del visor: cubre el marco completo en cualquier zoom
      const view = { s, x: clamp(next.x, 1 - s, 0), y: clamp(next.y, 1 - s, 0) };
      viewRef.current = view;
      const el = containerRef.current;
      if (el) {
        el.style.setProperty('--pz-s', String(view.s));
        el.style.setProperty('--pz-x', String(view.x));
        el.style.setProperty('--pz-y', String(view.y));
        el.dataset.zoomed = view.s > 1.001 ? 'true' : 'false';
      }
      emit();
    };

    // Acerca o aleja dejando fijo el punto (fx, fy) del marco
    const zoomAt = (scale, fx = 0.5, fy = 0.5) => {
      const v = viewRef.current;
      const s = clamp(scale, 1, limits().max);
      const u = (fx - v.x) / v.s;
      const w = (fy - v.y) / v.s;
      apply({ s, x: fx - u * s, y: fy - w * s });
    };

    return {
      subscribe: (fn) => {
        listenersRef.current.add(fn);
        return () => listenersRef.current.delete(fn);
      },
      getSnapshot: () => snapshotRef.current,
      getServerSnapshot: () => IDLE,
      apply,
      zoomAt,
      emit,
      view: () => viewRef.current,
      zoomIn: () => zoomAt(viewRef.current.s * STEP),
      zoomOut: () => zoomAt(viewRef.current.s / STEP),
      fit: () => apply({ s: 1, x: 0, y: 0 }),
      actual: () => zoomAt(limits().actual),
    };
  }, [containerRef]);

  // Otra imagen, retoque aplicado o resultado aún no listo: vuelve a la foto completa
  useEffect(() => {
    controls.fit();
  }, [controls, resetKey, enabled]);

  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || !el) return;

    // Ctrl/⌘ + rueda (y el gesto de pellizco del trackpad, que llega igual) solo sobre una foto
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const frame = frameOf(e.target);
      if (!frame) return;
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const { fx, fy } = pointIn(frame, e.clientX, e.clientY);
      controls.zoomAt(controls.view().s * Math.exp(-delta * WHEEL_SPEED), fx, fy);
    };

    // Arrastre con mouse o lápiz cuando hay zoom
    let drag = null;
    const onPointerDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || controls.view().s <= 1.001) return;
      const frame = frameOf(e.target);
      if (!frame) return;
      e.preventDefault();
      drag = { id: e.pointerId, frame, x: e.clientX, y: e.clientY };
      // Si el puntero ya no está activo no se captura, pero el arrastre sigue dentro del marco
      try {
        frame.setPointerCapture(e.pointerId);
      } catch {}
      el.dataset.dragging = 'true';
    };
    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const r = drag.frame.getBoundingClientRect();
      const v = controls.view();
      controls.apply({ s: v.s, x: v.x + (e.clientX - drag.x) / r.width, y: v.y + (e.clientY - drag.y) / r.height });
      drag.x = e.clientX;
      drag.y = e.clientY;
    };
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      delete el.dataset.dragging;
    };

    // Táctil: con la foto completa un dedo sigue moviendo la página; dos dedos acercan;
    // con zoom un dedo mueve la foto. "Ajustar" devuelve el desplazamiento de la página.
    let pinch = null;
    let touchDrag = null;
    const startPinch = (frame, a, b) => {
      const pa = pointIn(frame, a.clientX, a.clientY);
      const pb = pointIn(frame, b.clientX, b.clientY);
      const v = controls.view();
      pinch = {
        frame,
        dist: Math.hypot((pa.fx - pb.fx) * pa.w, (pa.fy - pb.fy) * pa.h) || 1,
        // Punto de la foto bajo el centro de los dedos
        u: ((pa.fx + pb.fx) / 2 - v.x) / v.s,
        w: ((pa.fy + pb.fy) / 2 - v.y) / v.s,
        s: v.s,
      };
    };
    const onTouchStart = (e) => {
      const frame = frameOf(e.target);
      if (!frame) return;
      if (e.touches.length >= 2) {
        e.preventDefault();
        touchDrag = null;
        startPinch(frame, e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1 && controls.view().s > 1.001) {
        // Sin preventDefault aquí para no romper el toque y el doble toque
        const t = e.touches[0];
        touchDrag = { frame, x: t.clientX, y: t.clientY };
      }
    };
    const onTouchMove = (e) => {
      if (pinch && e.touches.length >= 2) {
        e.preventDefault();
        const [a, b] = e.touches;
        const pa = pointIn(pinch.frame, a.clientX, a.clientY);
        const pb = pointIn(pinch.frame, b.clientX, b.clientY);
        const dist = Math.hypot((pa.fx - pb.fx) * pa.w, (pa.fy - pb.fy) * pa.h) || 1;
        const s = clamp(pinch.s * (dist / pinch.dist), 1, Infinity);
        const mx = (pa.fx + pb.fx) / 2;
        const my = (pa.fy + pb.fy) / 2;
        controls.apply({ s, x: mx - pinch.u * s, y: my - pinch.w * s });
      } else if (touchDrag && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        const r = touchDrag.frame.getBoundingClientRect();
        const v = controls.view();
        controls.apply({ s: v.s, x: v.x + (t.clientX - touchDrag.x) / r.width, y: v.y + (t.clientY - touchDrag.y) / r.height });
        touchDrag.x = t.clientX;
        touchDrag.y = t.clientY;
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length >= 2 && pinch) {
        startPinch(pinch.frame, e.touches[0], e.touches[1]);
        return;
      }
      const frame = pinch?.frame ?? touchDrag?.frame;
      pinch = null;
      touchDrag = null;
      // Al soltar un dedo del pellizco, el que queda sigue moviendo la foto
      if (e.touches.length === 1 && frame && controls.view().s > 1.001) {
        const t = e.touches[0];
        touchDrag = { frame, x: t.clientX, y: t.clientY };
      }
    };

    // Safari en Mac (trackpad) e iOS mandan gestos propios; en iOS el pellizco ya lo manejan los toques
    let gestureBase = null;
    const onGestureStart = (e) => {
      const frame = frameOf(e.target);
      if (!frame) return;
      e.preventDefault();
      gestureBase = { s: controls.view().s, frame };
    };
    const onGestureChange = (e) => {
      if (!gestureBase) return;
      e.preventDefault();
      if (pinch) return;
      const { fx, fy } = pointIn(gestureBase.frame, e.clientX, e.clientY);
      controls.zoomAt(gestureBase.s * e.scale, fx, fy);
    };
    const onGestureEnd = () => {
      gestureBase = null;
    };

    // El porcentaje depende del ancho del marco
    const resize = new ResizeObserver(() => controls.emit());
    resize.observe(el);

    const active = { passive: false };
    el.addEventListener('wheel', onWheel, active);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('touchstart', onTouchStart, active);
    el.addEventListener('touchmove', onTouchMove, active);
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('gesturestart', onGestureStart, active);
    el.addEventListener('gesturechange', onGestureChange, active);
    el.addEventListener('gestureend', onGestureEnd);
    return () => {
      resize.disconnect();
      el.removeEventListener('wheel', onWheel, active);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('touchstart', onTouchStart, active);
      el.removeEventListener('touchmove', onTouchMove, active);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('gesturestart', onGestureStart, active);
      el.removeEventListener('gesturechange', onGestureChange, active);
      el.removeEventListener('gestureend', onGestureEnd);
      delete el.dataset.dragging;
    };
  }, [containerRef, controls, enabled]);

  return controls;
}

// Barra bajo el resultado; solo ella se actualiza al hacer zoom
export function ZoomBar({ zoom }) {
  const state = useSyncExternalStore(zoom.subscribe, zoom.getSnapshot, zoom.getServerSnapshot);
  return (
    <div className="preview-zoom-bar" role="toolbar" aria-label="Zoom de la vista previa">
      <button type="button" className="icon-button" onClick={zoom.zoomOut} disabled={!state.zoomed} aria-label="Alejar">
        <ZoomOut className="icon-md" aria-hidden="true" />
      </button>
      <span className="preview-zoom-value" title="También con Ctrl + rueda del mouse o pellizcando con dos dedos">
        {state.percent} %
      </span>
      <button type="button" className="icon-button" onClick={zoom.zoomIn} disabled={!state.canIn} aria-label="Acercar">
        <ZoomIn className="icon-md" aria-hidden="true" />
      </button>
      <button type="button" className="icon-button" onClick={zoom.fit} disabled={!state.zoomed} aria-label="Ajustar a la vista">
        <Shrink className="icon-md" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button preview-zoom-actual"
        onClick={zoom.actual}
        disabled={!state.canActual || state.isActual}
        aria-label="Tamaño real (1:1)"
      >
        1:1
      </button>
    </div>
  );
}
