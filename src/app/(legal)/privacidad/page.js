import Link from 'next/link';
import { APP_NAME, SITE_URL, CONTACT_URL } from '@/content/landing';

export const metadata = {
  title: 'Política de Privacidad',
  description: `Cómo ${APP_NAME} trata tus datos: las imágenes se procesan solo en tu navegador y nunca se suben a un servidor. Uso de cookies y Google AdSense.`,
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p className="legal-updated">Última actualización: 24 de octubre de 2026</p>

      <p>
        Esta política explica qué información se trata cuando usas {APP_NAME} ({SITE_URL}). La herramienta
        está pensada para que tus imágenes sigan siendo tuyas: no las vemos, no las guardamos y no las enviamos a
        ningún servidor.
      </p>

      <h2>1. Tus imágenes nunca se suben a un servidor</h2>
      <p>
        La eliminación del fondo se hace con inteligencia artificial que se ejecuta dentro de tu navegador
        (WebAssembly y, si tu equipo lo permite, WebGPU). La foto que eliges se lee en la memoria local de tu
        dispositivo, se procesa ahí mismo y el resultado se descarga directamente a tu equipo. Ninguna imagen,
        original ni recortada, se transmite, almacena ni comparte con nosotros ni con terceros.
      </p>
      <p>
        Para funcionar, el navegador descarga el modelo de IA y sus archivos desde la red de distribución de
        IMG.LY (staticimgly.com). Esa descarga contiene solo el programa; no incluye tus imágenes. Como con
        cualquier solicitud web, ese servidor puede registrar datos técnicos como tu dirección IP y el tipo de
        navegador.
      </p>

      <h2>2. Cookies y publicidad de Google AdSense</h2>
      <p>
        Este sitio se financia con anuncios de Google AdSense. Google y sus socios, como proveedores externos,
        utilizan cookies para mostrar anuncios basados en tus visitas anteriores a este y otros sitios web. La
        cookie de publicidad permite a Google y a sus socios mostrarte anuncios según tu navegación.
      </p>
      <ul>
        <li>
          Puedes desactivar la publicidad personalizada en la{' '}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Configuración de anuncios de Google</a>.
        </li>
        <li>
          También puedes desactivar las cookies de otros proveedores en{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
        </li>
        <li>
          Más información sobre cómo usa Google los datos:{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            Cómo utiliza Google la información de sitios que usan sus servicios
          </a>.
        </li>
      </ul>
      <p>
        Si visitas el sitio desde el Espacio Económico Europeo, el Reino Unido o Suiza, se te pedirá tu
        consentimiento antes de usar cookies publicitarias.
      </p>

      <h2>3. Otros datos técnicos</h2>
      <p>
        Nuestro proveedor de alojamiento puede registrar datos técnicos de cada visita (dirección IP, fecha,
        página solicitada y navegador) para mantener el sitio seguro y funcionando. No usamos esos datos para
        identificarte. El sitio también carga fuentes tipográficas servidas desde el propio dominio.
      </p>

      <h2>4. Menores de edad</h2>
      <p>
        El sitio no está dirigido a menores de 13 años y no recopilamos a sabiendas información de ellos.
      </p>

      <h2>5. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de
        actualización.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Si tienes dudas sobre esta política, escríbenos desde{' '}
        <a href={CONTACT_URL} target="_blank" rel="noopener">Sublimonchis</a> o visita nuestra{' '}
        <Link href="/contacto">página de contacto</Link>.
      </p>
    </>
  );
}
