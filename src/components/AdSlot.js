'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT } from '@/content/landing';

// Espacio de anuncio con altura reservada (anti-CLS) y etiqueta "Publicidad".
// variant: 'leaderboard' (90 px) | 'rectangle' (250 px)
export default function AdSlot({ slot, variant = 'leaderboard', className = '' }) {
  const pushed = useRef(false);

  useEffect(() => {
    // Un solo push por bloque: AdSense no permite recargar anuncios por programa
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, []);

  return (
    <aside className={`ad-slot ad-slot-${variant} ${className}`} aria-label="Publicidad">
      <span className="ad-label">Publicidad</span>
      <div className="ad-space">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={variant === 'rectangle' ? 'rectangle' : 'horizontal'}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
