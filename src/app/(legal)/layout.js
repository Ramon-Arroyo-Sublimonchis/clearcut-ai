import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function LegalLayout({ children }) {
  return (
    <div className="main-layout">
      <SiteHeader />
      <main className="legal-page">{children}</main>
      <SiteFooter />
    </div>
  );
}
