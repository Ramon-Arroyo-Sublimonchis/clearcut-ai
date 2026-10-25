'use client';

import { useState } from 'react';

const KEY_STEP = 5;

// Muestra el resultado a la izquierda del divisor y la original a la derecha.
// El marco toma la proporción de la foto, así el fondo de vista previa y el divisor cubren solo la imagen.
export default function CompareSlider({ original, processed, previewBg, ratio, onExpand }) {
  const [position, setPosition] = useState(50);

  const handleKeyDown = (e) => {
    const delta = { ArrowLeft: -KEY_STEP, ArrowDown: -KEY_STEP, ArrowRight: KEY_STEP, ArrowUp: KEY_STEP }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    setPosition((p) => Math.min(100, Math.max(0, p + delta)));
  };

  return (
    <div
      className="compare"
      style={{ '--pos': `${position}%`, '--ratio': ratio }}
      onDoubleClick={onExpand}
    >
      <img src={original} alt="Imagen original" className="compare-img" draggable={false} />
      <div className={`compare-top preview-bg-${previewBg}`}>
        <img src={processed} alt="Imagen sin fondo" className="compare-img" draggable={false} />
      </div>
      <div className="compare-handle" aria-hidden="true">
        <span className="compare-knob">⇆</span>
      </div>
      <span className="compare-tag compare-tag-left" aria-hidden="true">Sin fondo</span>
      <span className="compare-tag compare-tag-right" aria-hidden="true">Original</span>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        onKeyDown={handleKeyDown}
        className="compare-range"
        aria-label="Comparar original y resultado"
      />
    </div>
  );
}
