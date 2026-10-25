import Link from 'next/link';
import { APP_VERSION } from '@/content/landing';

export default function SiteHeader() {
  return (
    <nav className="nav-bar">
      <Link href="/" className="logo" aria-label="Sublimonchis Background Remover, inicio">
        <span>SUBLIMONCHIS<span className="logo-dot">.</span></span>
        <span>BACKGROUND REMOVER</span>
      </Link>
      <div className="badge">VERSIÓN {APP_VERSION}</div>
    </nav>
  );
}
