'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ADSENSE_CLIENT } from '@/content/landing';

const noopSubscribe = () => () => {};

// true si la consulta de medios se cumple; en el servidor y sin `media`, siempre true
function useMedia(media) {
  return useSyncExternalStore(
    media
      ? (onChange) => {
          const query = window.matchMedia(media);
          query.addEventListener('change', onChange);
          return () => query.removeEventListener('change', onChange);
        }
      : noopSubscribe,
    () => (media ? window.matchMedia(media).matches : true),
    () => !media,
  );
}

// Espacio de anuncio con altura reservada (anti-CLS) y etiqueta "Publicidad".
// format="rectangle" (250 px) por defecto: los horizontales responsivos crecen en celular y mueven el diseño.
// `media` limita el bloque a ciertas pantallas: fuera de ellas no se pide anuncio (AdSense falla con ancho 0).
export default function AdSlot({ slot, className = '', format = 'rectangle', media }) {
  const pushed = useRef(false);
  const visible = useMedia(media);

  useEffect(() => {
    // Un solo push por bloque: AdSense no permite recargar anuncios por programa
    if (!visible || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, [visible]);

  return (
    <aside className={`ad-slot ${className}`} aria-label="Publicidad">
      <span className="ad-label">Publicidad</span>
      <div className="ad-space">
        {visible && (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={format === 'rectangle' ? 'true' : 'false'}
          />
        )}
      </div>
    </aside>
  );
}
