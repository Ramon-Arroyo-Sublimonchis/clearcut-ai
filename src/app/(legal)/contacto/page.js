import { APP_NAME, CONTACT_URL, MUNDOLASER_URL } from '@/content/landing';

export const metadata = {
  title: 'Contacto',
  description: `Contacta al equipo de ${APP_NAME} y Sublimonchis para dudas, sugerencias o reportar un problema.`,
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <>
      <h1>Contacto</h1>
      <p>
        {APP_NAME} es un proyecto de Sublimonchis. Si tienes dudas, sugerencias, quieres reportar un problema con
        un recorte o hablar de colaboraciones, contáctanos a través de nuestro sitio principal.
      </p>

      <p>
        <a href={CONTACT_URL} target="_blank" rel="noopener" className="download-btn legal-cta">
          Ir a Sublimonchis
        </a>
      </p>

      <h2>Antes de escribirnos</h2>
      <ul>
        <li>
          <strong>Privacidad:</strong> no podemos ver ni recuperar tus imágenes, porque nunca llegan a un servidor.
          Todo el proceso ocurre en tu navegador.
        </li>
        <li>
          <strong>Si un recorte falla:</strong> prueba con otra foto, con mejor iluminación o con el sujeto más
          separado del fondo, y cuéntanos qué navegador y dispositivo usas.
        </li>
        <li>
          <strong>Recursos para láser:</strong> visita{' '}
          <a href={MUNDOLASER_URL} target="_blank" rel="noopener">El Mundo Láser</a>.
        </li>
      </ul>
    </>
  );
}
