/* Preguntas compartidas por el formulario, la validación y el panel. */
const BRIEF_SECTIONS = [
  ['Información general', [['empresa', 'Nombre comercial / marca', 'text', true], ['razon', 'Razón social'], ['rubro', 'Rubro / actividad principal'], ['trayectoria', 'Años de trayectoria'], ['ubicacion', 'Ciudad / Provincia / País'], ['responsable', 'Tu nombre', 'text', true], ['email', 'Tu email de seguimiento', 'email', true]]],
  ['Identidad de marca', [['slogan', 'Slogan o frase institucional'], ['descripcion', 'Descripción de la empresa (2–3 líneas)', 'textarea'], ['identidad', 'Colores, tipografías y lineamientos de marca', 'textarea']]],
  ['Misión, visión y valores', [['mision', 'Misión', 'textarea'], ['vision', 'Visión', 'textarea'], ['valores', 'Valores', 'textarea']]],
  ['Servicios / Productos', []],
  ['Diferenciales', [['diferenciales', '¿Qué los hace distintos frente a la competencia?', 'textarea']]],
  ['Público objetivo', [['publico', 'Tipo de cliente', ['Consumidor final', 'Empresas', 'Comercios', 'Profesionales']], ['alcance', 'Zona de alcance'], ['necesidad', 'Principal necesidad del cliente', 'textarea']]],
  ['Datos de contacto para la web', [['telefono', 'Teléfono / WhatsApp principal', 'tel'], ['secundario', 'Teléfono secundario', 'tel'], ['emailPublico', 'Email público de contacto', 'email'], ['direccion', 'Dirección física'], ['horarios', 'Horarios de atención']]],
  ['Correos corporativos', [['dominio', 'Dominio actual o deseado'], ['correos', 'Correos que desean crear (por ejemplo: info@, ventas@)', 'textarea']]],
  ['Redes sociales', [['instagram', 'Instagram', 'url'], ['facebook', 'Facebook', 'url'], ['linkedin', 'LinkedIn', 'url'], ['tiktok', 'TikTok', 'url'], ['youtube', 'YouTube', 'url'], ['otrasRedes', 'Otras redes', 'textarea']]],
  ['Contenidos adicionales', [['contenidos', 'Material disponible', ['Testimonios de clientes', 'Fotos propias', 'Videos institucionales', 'Certificaciones / habilitaciones']], ['materiales', 'Textos, enlaces a videos o carpetas y material que se debe producir', 'textarea']]],
  ['Secciones de la web', [['secciones', 'Secciones necesarias', ['Inicio', 'Nosotros', 'Servicios / Productos', 'Clientes / Casos', 'Blog / Novedades', 'Contacto']], ['otrasSecciones', 'Otras secciones']]],
  ['Sitios de referencia', [['referencias', 'Enlaces de referencia (idealmente 3) y qué te gusta de cada web', 'textarea']]],
  ['Objetivo de la web', [['objetivos', '¿Qué debería lograr la web?', ['Generar consultas', 'Mostrar servicios', 'Vender online', 'Posicionar la marca']], ['otroObjetivo', 'Otro objetivo']]],
  ['Información legal', [['legal', 'Documentos necesarios (si aplica)', ['Política de privacidad', 'Términos y condiciones', 'Aviso legal']], ['legalNotas', 'Textos legales disponibles o pendientes', 'textarea']]],
  ['Observaciones finales', [['observaciones', 'Información adicional para el desarrollo del sitio', 'textarea']]],
];
if (typeof module !== 'undefined') module.exports = BRIEF_SECTIONS;
