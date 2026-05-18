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
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9446390749680019"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {/* SubliRemover_Inferior_Download */}
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-9446390749680019"
           data-ad-slot="9481093753"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
