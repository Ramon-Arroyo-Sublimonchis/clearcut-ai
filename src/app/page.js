import BackgroundRemover from '@/components/BackgroundRemover';
import AdSlot from '@/components/AdSlot';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  SEO_TITLE,
  SEO_DESCRIPTION,
  H1_TEXT,
  APP_NAME,
  MARQUEE_TEXT,
  STEPS_INTRO,
  STEPS,
  NICHES,
  COMPARISON,
  FAQ,
  jsonLd,
} from '@/content/landing';

export const metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: '/',
    type: 'website',
    // openGraph de la página reemplaza al del layout, así que se repiten estos campos
    siteName: APP_NAME,
    locale: 'es_MX',
  },
};

export default function Home() {
  return (
    <main className="main-layout animate-in">
      {/* WebApplication + FAQPage; va en esta página porque la FAQ visible solo está aquí */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <SiteHeader />

      {/* Compact Header for Typography */}
      <section className="hero-compact">
        <p className="hero-title-compact display-font">
          ELIMINA <span className="highlight">EL</span> FONDO
        </p>
        <h1 className="hero-h1">{H1_TEXT}</h1>
      </section>

      {/* Slot 1: leaderboard antes del área de carga */}
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP} variant="leaderboard" />

      {/* Main Tool Area - Maximized */}
      <section className="tool-section" aria-label="Herramienta para quitar fondos">
        <BackgroundRemover adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL} />
      </section>

      {/* Infinite Marquee Footer: la segunda copia solo existe para el bucle visual */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>{MARQUEE_TEXT}</span>
          <span aria-hidden="true">{MARQUEE_TEXT}</span>
        </div>
      </div>

      <article className="info-section">
        <section aria-labelledby="pasos-titulo">
          <h2 id="pasos-titulo" className="info-title">¿Cómo quitar el fondo de una imagen gratis paso a paso?</h2>
          <p className="info-lead">{STEPS_INTRO}</p>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-num" aria-hidden="true">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="nichos-titulo">
          <h2 id="nichos-titulo" className="info-title">
            El mejor borrador de fondos para Sublimación, DTF y Fotograbado Láser
          </h2>
          <div className="niches">
            {NICHES.map((niche) => (
              <div key={niche.title} className="niche">
                <h3>{niche.title}</h3>
                {niche.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="comparativa-titulo">
          <h2 id="comparativa-titulo" className="info-title">¿Por qué usar un quitafondos que funciona en tu navegador?</h2>
          <div className="table-wrap">
            <table className="compare-table">
              <caption>{COMPARISON.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Característica</th>
                  {COMPARISON.columns.map((col) => (
                    <th key={col} scope="col">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.rows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td className="is-ours">{row.ours}</td>
                    <td>{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="info-lead info-note">{COMPARISON.note}</p>
        </section>

        {/* Slot 3: in-content entre la tabla y la FAQ */}
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} variant="rectangle" />

        <section aria-labelledby="faq-titulo">
          <h2 id="faq-titulo" className="info-title">Preguntas frecuentes</h2>
          <div className="faq">
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
