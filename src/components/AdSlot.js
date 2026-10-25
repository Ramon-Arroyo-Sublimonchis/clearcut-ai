'use client';

import { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-9446390749680019';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Espacio de anuncio con altura reservada (anti-CLS) y etiqueta "Publicidad".
// variant: 'leaderboard' (90 px) | 'rectangle' (250 px)
export default function AdSlot({ slot, variant = 'leaderboard', className = '' }) {
  const pushed = useRef(false);

  useEffect(() => {
    // Un solo push por bloque: AdSense no permite recargar anuncios por programa
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, [slot]);

  // Sin ID de bloque: en producción no se deja un hueco vacío; en desarrollo se ve el espacio reservado
  if (!slot && !IS_DEV) return null;

  return (
    <aside className={`ad-slot ad-slot-${variant} ${className}`} aria-label="Publicidad">
      <span className="ad-label">Publicidad</span>
      <div className="ad-space">
        {slot ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={slot}
            data-ad-format={variant === 'rectangle' ? 'rectangle' : 'horizontal'}
            data-full-width-responsive="true"
          />
        ) : (
          <span className="ad-placeholder">Espacio reservado · {variant}</span>
        )}
      </div>
    </aside>
  );
}
