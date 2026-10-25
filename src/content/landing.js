// Fuente única de nombre, URLs y textos de la landing: la usan la página, el JSON-LD, el pie y los legales.

export const APP_NAME = 'Sublimonchis Background Remover';
export const APP_VERSION = '3.0';
export const SITE_URL = 'https://remover.sublimonchis.com';
export const SOURCE_URL = 'https://github.com/Ramon-Arroyo-Sublimonchis/clearcut-ai';
export const SUBLIMONCHIS_URL = 'https://sublimonchis.com/';
export const MUNDOLASER_URL = 'https://elmundolaser.com/';
// sublimonchis.com aún no tiene página de contacto; se enlaza la portada
export const CONTACT_URL = SUBLIMONCHIS_URL;

// Los IDs de AdSense son públicos (salen en el HTML), por eso viven aquí y no en variables de entorno.
export const ADSENSE_CLIENT = 'ca-pub-9446390749680019';
// Mismo bloque que lightburntosvg.elmundolaser.com; se puede cambiar por bloques propios por ubicación
export const AD_SLOTS = {
  top: '7636974134',
  tool: '7636974134',
  content: '7636974134',
};

export const SEO_TITLE = `Quitar Fondo a una Imagen Gratis en HD (IA Ilimitada) | ${APP_NAME}`;
export const SEO_DESCRIPTION =
  'Elimina el fondo de tus fotos e imágenes online, 100% gratis y en alta definición. Ideal para sublimación, DTF y fotograbado láser. Sin marcas de agua ni registros.';

export const H1_TEXT = 'Eliminador de Fondos de Imágenes con IA (Gratis y en Alta Definición)';

export const MARQUEE_TEXT =
  'PROCESAMIENTO LOCAL • NUNCA SE SUBE A SERVIDORES • CERO COSTO • EXPORTACIONES ILIMITADAS • RECORTES EN ALTA DEFINICIÓN • ';

export const STEPS_INTRO =
  'Quitar el fondo de una foto ya no requiere Photoshop ni horas de recorte con la pluma. Con esta herramienta lo haces en tres pasos y en segundos, desde la computadora o el celular, sin instalar programas ni crear una cuenta.';

export const STEPS = [
  {
    title: 'Sube tu imagen',
    text: 'Arrastra tu foto a la zona de carga, pégala con Ctrl+V o elige un archivo PNG, JPG o WebP desde tu computadora o celular.',
  },
  {
    title: 'La IA quita el fondo en tu navegador',
    text: 'El modelo de inteligencia artificial detecta a la persona, producto u objeto y borra el fondo en segundos. Todo ocurre en tu dispositivo: la imagen nunca se sube a ningún servidor.',
  },
  {
    title: 'Descarga el PNG en HD',
    text: 'Revisa el resultado sobre cuadrícula, blanco o negro, compara con la original y descarga tu PNG transparente en la misma resolución de la foto original.',
  },
];

export const NICHES = [
  {
    title: 'Preparación de fotos para Grabado Láser en Metal y Madera',
    paragraphs: [
      'En el fotograbado láser, el fondo de una foto se convierte en ruido: el láser lo interpreta como puntos que queman la madera o marcan el metal sin aportar nada al diseño. Al eliminarlo, la máquina se concentra solo en el rostro, la mascota o el producto, y el grabado queda limpio y con mejor contraste.',
      'Un fondo transparente también facilita el tramado (dithering). Programas como LightBurn, EZCAD o CorelDRAW calculan mejor los puntos de Jarvis, Stucki o Floyd-Steinberg cuando la imagen no tiene degradados de fondo, y puedes ajustar brillo y contraste sin que el fondo se vuelva una mancha gris. Importa el PNG, convierte a escala de grises y ajusta la potencia según el material.',
    ],
  },
  {
    title: 'Diseños en PNG transparente listos para Sublimar, DTF y Vinil',
    paragraphs: [
      'Para sublimar tazas, playeras, termos o rompecabezas necesitas un PNG sin fondo que se acomode sobre cualquier color. Nuestra herramienta exporta el recorte en la resolución original de tu foto, sin reducirla, sin marcas de agua y sin los bordes blancos que delatan un recorte mal hecho.',
      'En DTF y vinil textil el borde es lo que más se nota: un halo blanco se imprime y arruina la prenda. Revisa el resultado sobre fondo negro antes de descargar para detectar residuos, y lleva el archivo a tu programa de diseño para agregar textos, marcos o efectos antes de imprimir o cortar.',
    ],
  },
];

export const COMPARISON = {
  caption: `Comparativa: ${APP_NAME} frente a otras herramientas online para quitar fondos`,
  note: 'La diferencia está en dónde trabaja la inteligencia artificial. Al ejecutarse en tu propio navegador, no hay costos de servidor que cobrar por imagen, así que podemos ofrecer descargas en HD sin límite y sin pedirte datos. Además, tus fotos de clientes, productos o familia nunca salen de tu dispositivo.',
  columns: [APP_NAME, 'Otras herramientas online'],
  rows: [
    {
      feature: 'Calidad de descarga (HD)',
      ours: '100% gratis en la resolución original',
      others: 'Con frecuencia de pago; gratis solo en baja calidad',
    },
    {
      feature: 'Límite de uso',
      ours: 'Ilimitado',
      others: 'Suelen dar de 1 a 3 créditos gratuitos',
    },
    {
      feature: 'Privacidad de archivos',
      ours: '100% local en tu navegador (WebAssembly)',
      others: 'Por lo general se suben a servidores externos',
    },
    {
      feature: 'Registro',
      ours: 'No requiere cuenta',
      others: 'Muchas piden iniciar sesión',
    },
  ],
};

export const FAQ = [
  {
    q: '¿Es realmente gratis descargar las imágenes en alta definición?',
    a: `Sí. ${APP_NAME} es 100% gratis y descarga tu PNG en la misma resolución que la foto original, sin marcas de agua ni límite de imágenes. El sitio se mantiene con publicidad, así que no necesitas pagar créditos ni suscripciones.`,
  },
  {
    q: '¿Mis fotos se suben a algún servidor?',
    a: 'No. La inteligencia artificial se ejecuta dentro de tu navegador con WebAssembly, así que la imagen nunca sale de tu dispositivo. Lo único que se descarga es el modelo de IA, y el navegador suele guardarlo en caché para que las siguientes veces sea más rápido.',
  },
  {
    q: '¿Qué formatos de imagen acepta y cuál entrega?',
    a: 'Acepta imágenes PNG, JPG y WebP de hasta 20 MB y 40 megapíxeles. Entrega siempre un PNG con fondo transparente, el formato que necesitan la sublimación, el DTF, el vinil y los programas de grabado láser.',
  },
  {
    q: '¿Puedo usar los recortes con fines comerciales?',
    a: 'Sí, el recorte es tuyo y puedes usarlo en productos que vendas, como tazas, playeras, grabados o diseños para clientes. Solo asegúrate de tener los derechos de la foto original que subes; la herramienta no reclama ningún derecho sobre tus imágenes.',
  },
];

export const ECOSYSTEM_LINKS = [
  {
    href: SUBLIMONCHIS_URL,
    title: 'Plantillas y tutoriales de sublimación',
    text: 'Diseños gratis, plantillas para tazas y playeras, y cursos en Sublimonchis.',
  },
  {
    href: MUNDOLASER_URL,
    title: 'Recursos y vectores para láser',
    text: 'Archivos vectoriales, guías de LightBurn y proyectos en El Mundo Láser.',
  },
];

export const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: APP_NAME,
      url: `${SITE_URL}/`,
      description: SEO_DESCRIPTION,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Cualquiera (navegador web)',
      browserRequirements: 'Requiere un navegador moderno con WebAssembly',
      softwareVersion: APP_VERSION,
      inLanguage: 'es',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'USD' },
      featureList: [
        'Eliminación de fondo con IA procesada localmente en el navegador',
        'Descarga en PNG transparente en la resolución original (HD)',
        'Sin registro, sin marcas de agua y sin límite de uso',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
};
