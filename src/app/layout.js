import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { APP_NAME, SITE_URL, SEO_TITLE, SEO_DESCRIPTION } from "@/content/landing";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: SEO_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
  },
};

export const viewport = {
  themeColor: "#0B0A1A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmMono.variable}`}>
      <head>
        {/* Script global de AdSense: carga los anuncios automáticos y los bloques <ins> */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9446390749680019"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
