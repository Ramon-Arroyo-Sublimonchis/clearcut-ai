'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function AdSenseBanner() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, []);

  return (
    <div className="ads-container" style={{ margin: '2rem auto', width: '100%', maxWidth: '800px', overflow: 'hidden', textAlign: 'center' }}>
  <!-- Anuncios Automaticos Adsense Remover -->
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9446390749680019"
     crossorigin="anonymous"></script>
       
    </div>
  );
}
