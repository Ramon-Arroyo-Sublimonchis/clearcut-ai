import Image from 'next/image';
import Link from 'next/link';
import { APP_VERSION } from '@/content/landing';

export default function SiteHeader() {
  return (
    <nav className="nav-bar">
      <Link href="/" className="brand" aria-label="Sublimonchis Background Remover, inicio">
        {/* Tamaño fijo para no mover el diseño mientras carga */}
        <Image
          src="/logo-elmundolaser.webp"
          alt=""
          width={48}
          height={48}
          className="brand-logo"
          priority
        />
        <span className="logo">
          <span>SUBLIMONCHIS<span className="logo-dot">.</span></span>
          <span>BACKGROUND REMOVER</span>
        </span>
      </Link>
      <div className="badge" aria-label={`Versión ${APP_VERSION}`}>
        <span className="badge-long">VERSIÓN {APP_VERSION}</span>
        <span className="badge-short" aria-hidden="true">V{APP_VERSION}</span>
      </div>
    </nav>
  );
}
