import Link from 'next/link';
import { APP_NAME, SOURCE_URL } from '@/content/landing';

export const metadata = {
  title: 'Términos de Uso',
  description: `Condiciones para usar ${APP_NAME}, la herramienta gratuita para quitar el fondo de imágenes con IA en tu navegador.`,
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <>
      <h1>Términos de Uso</h1>
      <p className="legal-updated">Última actualización: 24 de octubre de 2026</p>

      <p>
        Al usar {APP_NAME} aceptas estos términos. Si no estás de acuerdo con ellos, no uses la herramienta.
      </p>

      <h2>1. El servicio</h2>
      <p>
        {APP_NAME} es una herramienta gratuita que elimina el fondo de imágenes con inteligencia artificial
        ejecutada en tu propio navegador. No requiere registro y no tiene límite de uso. Podemos modificar,
        suspender o dejar de ofrecer el servicio en cualquier momento.
      </p>

      <h2>2. Tus imágenes y tus derechos</h2>
      <p>
        Las imágenes que procesas son tuyas y no reclamamos ningún derecho sobre ellas ni sobre los recortes.
        Eres responsable de tener los permisos necesarios para usar, modificar y comercializar las fotos que
        procesas, incluidas las imágenes de personas, marcas o personajes protegidos.
      </p>

      <h2>3. Uso aceptable</h2>
      <p>
        No uses la herramienta para crear contenido ilegal, que infrinja derechos de terceros o que suplante a otras
        personas. Tampoco intentes interferir con el funcionamiento del sitio ni con sus anuncios.
      </p>

      <h2>4. Sin garantía</h2>
      <p>
        La herramienta se ofrece &quot;tal cual&quot;. El resultado depende de cada imagen y puede requerir
        retoques. No garantizamos que el servicio esté libre de errores ni disponible en todo momento, y no somos
        responsables de pérdidas derivadas de su uso. Revisa siempre el resultado antes de imprimir, sublimar o
        grabar.
      </p>

      <h2>5. Software de código abierto</h2>
      <p>
        El recorte usa la biblioteca IMG.LY Background Removal, distribuida bajo la licencia GNU AGPL-3.0. El código
        fuente de esta aplicación está disponible en{' '}
        <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">GitHub</a> bajo la misma licencia.
      </p>

      <h2>6. Publicidad y privacidad</h2>
      <p>
        El sitio muestra anuncios de Google AdSense. El tratamiento de datos y cookies se describe en la{' '}
        <Link href="/privacidad">Política de Privacidad</Link>.
      </p>

      <h2>7. Cambios</h2>
      <p>
        Podemos actualizar estos términos. La versión vigente siempre estará publicada en esta página.
      </p>
    </>
  );
}
