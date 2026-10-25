import Link from 'next/link';
import { APP_NAME, APP_VERSION, SOURCE_URL, SUBLIMONCHIS_URL, MUNDOLASER_URL } from '@/content/landing';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="logo footer-logo">SUBLIMONCHIS<span className="logo-dot">.</span>BACKGROUND REMOVER</span>
        <p>Quita el fondo de tus imágenes con IA, gratis y en alta definición, directo en tu navegador.</p>
      </div>

      <nav className="footer-nav" aria-label="Pie de página">
        <div>
          <p className="footer-heading">Sitio</p>
          <ul>
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/privacidad">Política de Privacidad</Link></li>
            <li><Link href="/terminos">Términos de Uso</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <p className="footer-heading">Ecosistema</p>
          <ul>
            <li><a href={SUBLIMONCHIS_URL} target="_blank" rel="noopener">Sublimonchis</a></li>
            <li><a href={MUNDOLASER_URL} target="_blank" rel="noopener">El Mundo Láser</a></li>
          </ul>
        </div>
      </nav>

      <div className="footer-legal">
        <span>© {new Date().getFullYear()} {APP_NAME} · Versión {APP_VERSION}</span>
        <span>
          Recorte con <a href="https://img.ly/background-removal" target="_blank" rel="noopener noreferrer">IMG.LY Background Removal</a>
          {' · '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Código fuente (AGPL-3.0)</a>
        </span>
      </div>
    </footer>
  );
}
