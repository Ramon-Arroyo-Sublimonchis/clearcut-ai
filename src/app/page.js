import BackgroundRemover from '@/components/BackgroundRemover';
import AdSenseBanner from '@/components/AdSenseBanner';

export const metadata = {
  title: 'ClearCut AI - Eliminador de Fondos Profesional',
  description: 'Elimina fondos de imágenes al instante usando IA avanzada en tu navegador. Rápido, seguro y sin límites.',
};

export default function Home() {
  return (
    <main className="main-layout animate-in">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="logo">SUBLIMONCHIS<span className="logo-dot">.</span>REMOVER</div>
        <div className="badge" style={{ marginBottom: 0 }}>BETA v1.0</div>
      </nav>

      {/* Compact Header for Typography */}
      <section className="hero-compact">
        <h1 className="hero-title-compact">
          ELIMINA <span className="highlight">EL</span> FONDO
        </h1>
        <p className="hero-subtitle-compact">
          Modelos de IA locales Optimizados para navegador. Tus imágenes sin límites y nunca salen de tu Dispositivo.
        </p>
      </section>

      {/* AdSense Unit */}
      <AdSenseBanner />

      {/* Main Tool Area - Maximized */}
      <section className="tool-section">
        <BackgroundRemover />
      </section>



      {/* Infinite Marquee Footer */}
      <div className="marquee-container">
        <div className="marquee-content">
          PROCESAMIENTO LOCAL • NUNCA SE SUBE A SERVIDORES • CERO COSTO • EXPORTACIONES ILIMITADAS • RECORTES EN ALTA DEFINICIÓN • PROCESAMIENTO LOCAL • NUNCA SE SUBE A SERVIDORES • CERO COSTO • EXPORTACIONES ILIMITADAS • RECORTES EN ALTA DEFINICIÓN •
        </div>
      </div>
    </main>
  );
}
