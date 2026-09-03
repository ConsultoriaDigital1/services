// ===== Consultoría Digital — multi-idioma (ES / EN / PT) =====
// Los textos se marcan en el HTML con data-i18n="clave" y se traducen sin recargar.
// Para atributos: data-i18n-placeholder, data-i18n-aria-label, data-i18n-title, data-i18n-content.

const LANGS = {
  es: {
    label: 'Español',
    code: 'ES',
    flag: '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#74ACDF"/><rect y="5.33" width="24" height="5.34" fill="#fff"/><circle cx="12" cy="8" r="2" fill="#F6B40E"/></svg>',
  },
  en: {
    label: 'English',
    code: 'EN',
    flag: '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#fff"/><g fill="#B22234"><rect width="24" height="2.46"/><rect y="4.92" width="24" height="2.46"/><rect y="9.85" width="24" height="2.46"/><rect y="13.54" width="24" height="2.46"/></g><rect width="10" height="8.62" fill="#3C3B6E"/></svg>',
  },
  pt: {
    label: 'Português',
    code: 'PT',
    flag: '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#009B3A"/><path d="M12 2 22 8 12 14 2 8Z" fill="#FEDF00"/><circle cx="12" cy="8" r="3.1" fill="#002776"/></svg>',
  },
};

const I18N = {
  /* ============================ ESPAÑOL ============================ */
  es: {
    'lang.aria': 'Cambiar idioma',
    'brand.aria': 'Consultoría Digital — inicio',
    'nav.aria': 'Navegación principal',
    'nav.toggle': 'Abrir menú',
    'nav.servicios': 'Servicios',
    'nav.marketing': 'Marketing',
    'nav.desarrollo': 'Desarrollo',
    'nav.equipo': 'Equipo',
    'nav.contacto': 'Contacto',
    'nav.hablemos': 'Hablemos',

    'meta.title': 'Consultoría Digital — Impulsamos tu Crecimiento Digital',
    'meta.desc': 'Marketing de performance, gestión de redes, pauta en Meta y desarrollo de software con IA: CRM, conciliación bancaria y gestión de turnos. Cerebros jóvenes, ideas poderosas.',

    'hero.eyebrow': 'Cerebros jóvenes, ideas poderosas',
    'hero.h1': 'Marketing Performance y <span class="grad-text">Desarrollo de Software con IA</span>',
    'hero.lead': 'Somos una consultora que combina <strong>marketing de performance</strong> y <strong>desarrollo de software con IA</strong>. Te conseguimos clientes, ordenamos tu proceso comercial y automatizamos lo que hoy te quita tiempo.',
    'hero.cta1': 'Ver servicios',
    'hero.cta2': 'Agendar reunión',
    'hero.stat1n': '5',
    'hero.stat1': 'servicios integrales',
    'hero.stat2n': '+7',
    'hero.stat2': 'especialistas en el equipo',
    'hero.stat3n': 'Socios',
    'hero.stat3': 'oficiales de Kommo CRM',
    'hero.stat4n': 'Factura A',
    'hero.stat4': 'y pauta por transferencia',

    'serv.kicker': 'Qué hacemos',
    'serv.h2': 'Todo lo que ofrecemos, en un solo lugar',
    'serv.sub': 'Dos grandes áreas que trabajan juntas: el <strong>Marketing</strong> que atrae y convierte, y el <strong>Desarrollo</strong> que ordena y automatiza tu operación con inteligencia artificial.',
    'pil1.h3': 'Marketing de Performance',
    'pil1.p': 'Contenido, gestión de redes y pauta publicitaria pensada para generar resultados reales y medibles.',
    'pil1.link': 'Ver servicios de marketing →',
    'pil2.h3': 'Desarrollo & Automatización',
    'pil2.p': 'CRM, conciliación bancaria con IA y gestión de turnos por WhatsApp, integrados a tus sistemas.',
    'pil2.link': 'Ver servicios de desarrollo →',

    'mkt.kicker': 'Marketing',
    'mkt.h2': 'Atraé, conectá y convertí',
    'mkt.sub': 'Producción de contenido y campañas que ponen tu marca frente a las personas correctas.',
    'tag.mkt': 'Marketing',
    'tag.dev': 'Desarrollo',
    'tag.devia': 'Desarrollo · IA',
    'card.cta': 'Quiero este servicio',
    'card.more': 'Ver más info →',

    'rrss.h3': 'Gestión de Redes Sociales',
    'rrss.p': 'Producción integral de contenidos: ideamos, planificamos, guionamos, grabamos, editamos y publicamos. Vos te desentendés de la tarea.',
    'rrss.li1': 'Planificación mensual para Facebook e Instagram',
    'rrss.li2': 'Producción y edición de reels (baja/media complejidad)',
    'rrss.li3': 'Diseño de piezas gráficas',
    'rrss.li4': 'Contacto diario por grupo de WhatsApp',

    'meta.h3': 'Pauta Publicitaria en Meta',
    'meta.p': 'Campañas en Facebook e Instagram optimizadas para visitas, consultas por WhatsApp y leads. Con <strong>línea de crédito propia</strong>: pagás por transferencia y recibís Factura A.',
    'meta.li1': 'Creación de anuncios y seguimiento de resultados',
    'meta.li2': 'Gestión <strong>bonificada</strong> al contratar Gestión de RRSS',
    'meta.li3': 'Crédito en Meta por transferencia con Factura A',
    'meta.li4': 'Reportes de resultados',

    'dev.kicker': 'Desarrollo & IA',
    'dev.h2': 'Ordená y automatizá tu operación',
    'dev.sub': 'Software a medida e inteligencia artificial integrados a los sistemas que ya usás.',

    'crm.h3': 'Automatización con CRM',
    'crm.p': 'Instalamos Kommo CRM para centralizar consultas de Instagram, TikTok, web, WhatsApp y Facebook. Con automatizaciones, ningún lead se queda sin respuesta.',
    'crm.li1': 'Setup y puesta en marcha de Kommo CRM',
    'crm.li2': 'Diseño del proceso comercial con tu equipo',
    'crm.li3': 'Automatizaciones y salesbot',
    'crm.li4': 'Capacitación y soporte mensual',

    'con.h3': 'ConciliA — Conciliación Bancaria con IA',
    'con.p': 'Software de conciliación bancaria con IA. Reduce drásticamente la carga de comprobar pagos y cotejarlos con tu ERP y el banco. Personalizado y vinculado a tu sistema.',
    'con.li1': 'Implementación 100% a medida de tu proceso',
    'con.li2': 'Vínculo con tu sistema de gestión (ERP)',
    'con.li3': 'Capacitación a tu equipo',
    'con.li4': 'Estructura (VPS, n8n) + asistencia mensual',

    'tur.h3': 'TurnerIA — Gestión de Turnos para Salud',
    'tur.p': 'Asistente de turnos con IA por WhatsApp, 100% adaptado a tu consultorio o clínica. Atiende 24/7, toma, reprograma y cancela turnos, y envía recordatorios automáticos.',
    'tur.li1': 'Agente de IA para WhatsApp 24/7',
    'tur.li2': 'Toma, reprogramación y cancelación de turnos',
    'tur.li3': 'Recordatorios automáticos a pacientes',
    'tur.li4': 'Integración con tu sistema de gestión',

    'proc.kicker': 'Cómo trabajamos',
    'proc.h2': 'De la primera charla a los resultados',
    'proc.s1h': 'Reunión & diagnóstico',
    'proc.s1p': 'Entendemos tu negocio, tus objetivos y dónde estás perdiendo oportunidades.',
    'proc.s2h': 'Propuesta a medida',
    'proc.s2p': 'Armamos el plan de marketing y/o automatización que mejor se ajusta a vos.',
    'proc.s3h': 'Implementación',
    'proc.s3p': 'Producimos, configuramos e integramos todo con tus sistemas actuales.',
    'proc.s4h': 'Optimización continua',
    'proc.s4p': 'Medimos, reportamos y ajustamos mes a mes para seguir creciendo.',

    'team.kicker': 'Nuestro equipo',
    'team.h2': 'Las personas detrás de Consultoría Digital',
    'team.sub': 'Un equipo joven, multidisciplinario y obsesionado con los resultados de nuestros clientes.',
    'role.director': 'Director',
    'role.lider': 'Líder de Equipo',
    'role.redes': 'Redes Sociales',
    'role.contenido': 'Creación de Contenido',
    'role.admin': 'Administración',
    'role.proyectos': 'Gestión de Proyectos',
    'role.dev': 'Desarrollador',
    'role.ing': 'Ingeniero en Sistemas',

    'cta.kicker': 'Hablemos',
    'cta.h2': '¿Listo para impulsar tu crecimiento digital?',
    'cta.p': 'Contanos qué necesitás y armamos una propuesta a tu medida. Sin compromiso.',
    'cta.dir': 'RN12 3400, W3400 Corrientes — Parque Tecnológico',
    'cta.mapAria': 'Ver ubicación en Google Maps',
    'cta.mapTitle': 'Ubicación: Parque Tecnológico, RN12 3400, Corrientes',

    'form.nombre': 'Nombre',
    'form.nombrePh': 'Tu nombre o empresa',
    'form.email': 'Email',
    'form.emailPh': 'tunombre@empresa.com',
    'form.telefono': 'Teléfono / WhatsApp',
    'form.telefonoPh': '+54 9 379 400-0000',
    'form.interes': '¿Qué te interesa?',
    'form.op1': 'Gestión de Redes Sociales',
    'form.op2': 'Pauta en Meta',
    'form.op3': 'Automatización con CRM',
    'form.op4': 'ConciliA (Conciliación con IA)',
    'form.op5': 'TurnerIA (Turnos con IA)',
    'form.op6': 'No estoy seguro / Otro',
    'form.op7': 'Software a medida',
    'form.op8': 'Gestoría (ERP)',
    'form.mensaje': 'Mensaje',
    'form.mensajePh': 'Contanos brevemente tu necesidad',
    'form.enviar': 'Enviar consulta',
    'form.enviando': 'Enviando…',
    'form.ok': '¡Gracias! Recibimos tu consulta y te respondemos a la brevedad.',
    'form.error': 'No pudimos enviar la consulta. Escribinos a gonzalo@consultoriadigital.io o por WhatsApp.',
    'form.subject': 'Consulta web',

    'footer.tag': 'Cerebros jóvenes, ideas poderosas.',
    'footer.copy': '© {year} Consultoría Digital. Todos los derechos reservados.',
    'wa.aria': 'Escribinos por WhatsApp',

    'chat.open': 'Abrir el asistente con IA',
    'chat.fab': 'Agendá con IA',
    'chat.title': 'Asistente de Consultoría Digital',
    'chat.subtitle': 'Te ayudo a agendar tu reunión',
    'chat.close': 'Cerrar el asistente',
    'chat.ph': 'Escribí tu consulta…',
    'chat.send': 'Enviar mensaje',
    'chat.greeting': '¡Hola! Soy el asistente de Consultoría Digital. Contame qué necesitás para tu negocio y coordinamos una reunión de diagnóstico sin costo.',
    'chat.q1': 'Quiero agendar una reunión',
    'chat.q2': '¿Qué servicios ofrecen?',
    'chat.q3': 'Necesito más clientes',
    'chat.error': 'No pude responder en este momento. Probá de nuevo o escribinos por WhatsApp.',
    'chat.leadOk': '✅ Listo, pasamos tus datos al equipo. Te contactamos a la brevedad.',
    'chat.leadErr': 'No pudimos registrar tus datos. Escribinos a gonzalo@consultoriadigital.io o por WhatsApp.',
    'chat.leadSubject': 'Reunión solicitada desde el asistente IA',

    'lb.title': 'Vista de captura',
    'lb.close': 'Cerrar',
    'lb.prev': 'Anterior',
    'lb.next': 'Siguiente',

    /* --- Páginas de detalle --- */
    'detail.back': '← Volver a servicios',
    'detail.incluye': 'Qué incluye',
    'detail.cta': 'Quiero este servicio',
    'detail.agendar': 'Agendar una reunión',

    'crmp.title': 'Automatización con CRM (Kommo) — Consultoría Digital',
    'crmp.desc': 'Instalamos y configuramos Kommo CRM para centralizar tus consultas de Instagram, TikTok, web, WhatsApp y Facebook, con automatizaciones y salesbot para que ningún lead se quede sin respuesta.',
    'crmp.h1': 'Automatización con CRM',
    'crmp.lead': 'Centralizamos <strong>todas tus consultas</strong> —Instagram, TikTok, web, WhatsApp y Facebook— en <strong>Kommo CRM</strong>. Con automatizaciones y salesbot, ningún lead se queda sin respuesta y tu equipo trabaja ordenado, viendo el estado de cada oportunidad en un solo lugar.',
    'crmp.h2': 'Un proceso comercial ordenado, de punta a punta',
    'crmp.f1h': 'Setup y puesta en marcha',
    'crmp.f1p': 'Conectamos tus canales (Instagram, TikTok, WhatsApp, Facebook y web) a Kommo y dejamos todo listo para operar.',
    'crmp.f2h': 'Diseño del proceso comercial',
    'crmp.f2p': 'Definimos junto a tu equipo las etapas del embudo, responsables y reglas para no perder ninguna oportunidad.',
    'crmp.f3h': 'Automatizaciones y salesbot',
    'crmp.f3p': 'Respuestas automáticas, asignación de leads, recordatorios y un bot que atiende los primeros mensajes 24/7.',
    'crmp.f4h': 'Capacitación y soporte',
    'crmp.f4p': 'Entrenamos a tu equipo para que aproveche el CRM y te acompañamos con asistencia mensual.',

    'conp.title': 'ConciliA — Conciliación Bancaria con IA — Consultoría Digital',
    'conp.desc': 'Software de conciliación bancaria con IA, personalizado a tu proceso y vinculado a tu ERP. Menos horas cruzando comprobantes a mano.',
    'conp.h1': 'ConciliA — Conciliación Bancaria con IA',
    'conp.lead': 'Software de <strong>conciliación bancaria con IA</strong> que reduce drásticamente la carga de comprobar pagos y cotejarlos con tu <strong>ERP</strong> y el <strong>banco</strong>. Personalizado a tu proceso y vinculado a tu sistema de gestión, para que tu equipo deje de perder horas cruzando comprobantes a mano.',
    'conp.h2': 'Conciliación automática, a la medida de tu operación',
    'conp.f1h': 'Implementación 100% a medida',
    'conp.f1p': 'Adaptamos ConciliA exactamente a cómo cobrás, facturás y registrás los pagos hoy.',
    'conp.f2h': 'Vínculo con tu ERP',
    'conp.f2p': 'Se integra con tu sistema de gestión para cotejar movimientos del banco contra tus comprobantes.',
    'conp.f3h': 'IA que cruza los datos',
    'conp.f3p': 'La inteligencia artificial identifica coincidencias, detecta diferencias y marca lo que requiere revisión.',
    'conp.f4h': 'Estructura y soporte',
    'conp.f4p': 'Montamos la infraestructura (VPS, n8n), capacitamos a tu equipo y te damos asistencia mensual.',

    'turp.title': 'TurnerIA — Gestión de Turnos para Salud — Consultoría Digital',
    'turp.desc': 'Asistente de turnos con IA por WhatsApp para consultorios y clínicas: atiende 24/7, toma y reprograma turnos y envía recordatorios automáticos.',
    'turp.h1': 'TurnerIA — Gestión de Turnos para Salud',
    'turp.lead': 'Asistente de turnos con <strong>IA por WhatsApp</strong>, 100% adaptado a tu consultorio o clínica. Atiende <strong>24/7</strong>: toma, reprograma y cancela turnos, y envía recordatorios automáticos a tus pacientes. Menos ausentismo, menos llamadas y una agenda siempre ordenada.',
    'turp.h2': 'Una recepcionista con IA que nunca se toma franco',
    'turp.f1h': 'Agente de IA en WhatsApp 24/7',
    'turp.f1p': 'Responde a tus pacientes en lenguaje natural a cualquier hora, sin que tu equipo tenga que estar pendiente.',
    'turp.f2h': 'Toma, reprograma y cancela',
    'turp.f2p': 'Gestiona la agenda completa: agenda nuevos turnos, los mueve o los cancela según la disponibilidad real.',
    'turp.f3h': 'Recordatorios automáticos',
    'turp.f3p': 'Envía recordatorios a los pacientes para reducir el ausentismo y los turnos perdidos.',
    'turp.f4h': 'Integrado a tu sistema',
    'turp.f4p': 'Se conecta con tu sistema de gestión para que la agenda esté siempre sincronizada y al día.',
  },

  /* ============================ ENGLISH ============================ */
  en: {
    'lang.aria': 'Change language',
    'brand.aria': 'Consultoría Digital — home',
    'nav.aria': 'Main navigation',
    'nav.toggle': 'Open menu',
    'nav.servicios': 'Services',
    'nav.marketing': 'Marketing',
    'nav.desarrollo': 'Development',
    'nav.equipo': 'Team',
    'nav.contacto': 'Contact',
    'nav.hablemos': "Let's talk",

    'meta.title': 'Consultoría Digital — We Drive Your Digital Growth',
    'meta.desc': 'Performance marketing, social media management, Meta ads and AI software development: CRM, bank reconciliation and appointment management. Young minds, powerful ideas.',

    'hero.eyebrow': 'Young minds, powerful ideas',
    'hero.h1': 'Performance Marketing and <span class="grad-text">AI Software Development</span>',
    'hero.lead': 'We are a consultancy that combines <strong>performance marketing</strong> and <strong>AI software development</strong>. We bring you customers, organize your sales process and automate whatever is eating up your time.',
    'hero.cta1': 'See services',
    'hero.cta2': 'Book a meeting',
    'hero.stat1n': '5',
    'hero.stat1': 'end-to-end services',
    'hero.stat2n': '+7',
    'hero.stat2': 'specialists on the team',
    'hero.stat3n': 'Official',
    'hero.stat3': 'Kommo CRM partners',
    'hero.stat4n': 'Invoicing',
    'hero.stat4': 'and ad spend by bank transfer',

    'serv.kicker': 'What we do',
    'serv.h2': 'Everything we offer, in one place',
    'serv.sub': 'Two major areas working together: <strong>Marketing</strong> that attracts and converts, and <strong>Development</strong> that organizes and automates your operation with artificial intelligence.',
    'pil1.h3': 'Performance Marketing',
    'pil1.p': 'Content, social media management and advertising designed to generate real, measurable results.',
    'pil1.link': 'See marketing services →',
    'pil2.h3': 'Development & Automation',
    'pil2.p': 'CRM, AI-powered bank reconciliation and WhatsApp appointment management, integrated with your systems.',
    'pil2.link': 'See development services →',

    'mkt.kicker': 'Marketing',
    'mkt.h2': 'Attract, connect and convert',
    'mkt.sub': 'Content production and campaigns that put your brand in front of the right people.',
    'tag.mkt': 'Marketing',
    'tag.dev': 'Development',
    'tag.devia': 'Development · AI',
    'card.cta': 'I want this service',
    'card.more': 'See more info →',

    'rrss.h3': 'Social Media Management',
    'rrss.p': 'End-to-end content production: we ideate, plan, script, shoot, edit and publish. You forget about the task.',
    'rrss.li1': 'Monthly planning for Facebook and Instagram',
    'rrss.li2': 'Reel production and editing (low/medium complexity)',
    'rrss.li3': 'Graphic design pieces',
    'rrss.li4': 'Daily contact through a WhatsApp group',

    'meta.h3': 'Meta Advertising',
    'meta.p': 'Facebook and Instagram campaigns optimized for visits, WhatsApp inquiries and leads. With <strong>our own credit line</strong>: you pay by bank transfer and receive an invoice.',
    'meta.li1': 'Ad creation and results tracking',
    'meta.li2': 'Management <strong>free of charge</strong> when you hire Social Media Management',
    'meta.li3': 'Meta credit by bank transfer with invoice',
    'meta.li4': 'Results reporting',

    'dev.kicker': 'Development & AI',
    'dev.h2': 'Organize and automate your operation',
    'dev.sub': 'Custom software and artificial intelligence integrated with the systems you already use.',

    'crm.h3': 'CRM Automation',
    'crm.p': 'We set up Kommo CRM to centralize inquiries from Instagram, TikTok, web, WhatsApp and Facebook. With automations, no lead goes unanswered.',
    'crm.li1': 'Kommo CRM setup and rollout',
    'crm.li2': 'Sales process design with your team',
    'crm.li3': 'Automations and salesbot',
    'crm.li4': 'Training and monthly support',

    'con.h3': 'ConciliA — AI Bank Reconciliation',
    'con.p': 'AI-powered bank reconciliation software. Drastically reduces the workload of verifying payments and matching them against your ERP and bank. Customized and linked to your system.',
    'con.li1': '100% custom implementation for your process',
    'con.li2': 'Link with your management system (ERP)',
    'con.li3': 'Training for your team',
    'con.li4': 'Infrastructure (VPS, n8n) + monthly support',

    'tur.h3': 'TurnerIA — Appointment Management for Healthcare',
    'tur.p': 'AI appointment assistant on WhatsApp, 100% adapted to your practice or clinic. Available 24/7: books, reschedules and cancels appointments, and sends automatic reminders.',
    'tur.li1': 'AI agent on WhatsApp 24/7',
    'tur.li2': 'Booking, rescheduling and cancellation',
    'tur.li3': 'Automatic reminders for patients',
    'tur.li4': 'Integration with your management system',

    'proc.kicker': 'How we work',
    'proc.h2': 'From the first conversation to results',
    'proc.s1h': 'Meeting & diagnosis',
    'proc.s1p': 'We understand your business, your goals and where you are losing opportunities.',
    'proc.s2h': 'Tailored proposal',
    'proc.s2p': 'We build the marketing and/or automation plan that best fits you.',
    'proc.s3h': 'Implementation',
    'proc.s3p': 'We produce, configure and integrate everything with your current systems.',
    'proc.s4h': 'Continuous optimization',
    'proc.s4p': 'We measure, report and adjust month by month to keep growing.',

    'team.kicker': 'Our team',
    'team.h2': 'The people behind Consultoría Digital',
    'team.sub': 'A young, multidisciplinary team obsessed with our clients’ results.',
    'role.director': 'Director',
    'role.lider': 'Team Lead',
    'role.redes': 'Social Media',
    'role.contenido': 'Content Creation',
    'role.admin': 'Administration',
    'role.proyectos': 'Project Management',
    'role.dev': 'Developer',
    'role.ing': 'Systems Engineer',

    'cta.kicker': "Let's talk",
    'cta.h2': 'Ready to boost your digital growth?',
    'cta.p': 'Tell us what you need and we will build a proposal tailored to you. No strings attached.',
    'cta.dir': 'RN12 3400, W3400 Corrientes — Technology Park',
    'cta.mapAria': 'View location on Google Maps',
    'cta.mapTitle': 'Location: Technology Park, RN12 3400, Corrientes',

    'form.nombre': 'Name',
    'form.nombrePh': 'Your name or company',
    'form.email': 'Email',
    'form.emailPh': 'yourname@company.com',
    'form.telefono': 'Phone / WhatsApp',
    'form.telefonoPh': '+54 9 379 400-0000',
    'form.interes': 'What are you interested in?',
    'form.op1': 'Social Media Management',
    'form.op2': 'Meta Advertising',
    'form.op3': 'CRM Automation',
    'form.op4': 'ConciliA (AI Reconciliation)',
    'form.op5': 'TurnerIA (AI Appointments)',
    'form.op6': 'Not sure / Other',
    'form.op7': 'Custom software',
    'form.op8': 'Gestoría (ERP)',
    'form.mensaje': 'Message',
    'form.mensajePh': 'Briefly tell us what you need',
    'form.enviar': 'Send inquiry',
    'form.enviando': 'Sending…',
    'form.ok': 'Thank you! We received your inquiry and will reply shortly.',
    'form.error': 'We could not send your inquiry. Write to gonzalo@consultoriadigital.io or via WhatsApp.',
    'form.subject': 'Website inquiry',

    'footer.tag': 'Young minds, powerful ideas.',
    'footer.copy': '© {year} Consultoría Digital. All rights reserved.',
    'wa.aria': 'Message us on WhatsApp',

    'chat.open': 'Open the AI assistant',
    'chat.fab': 'Book with AI',
    'chat.title': 'Consultoría Digital Assistant',
    'chat.subtitle': 'I help you book your meeting',
    'chat.close': 'Close the assistant',
    'chat.ph': 'Type your question…',
    'chat.send': 'Send message',
    'chat.greeting': 'Hi! I am the Consultoría Digital assistant. Tell me what your business needs and we will set up a free diagnostic meeting.',
    'chat.q1': 'I want to book a meeting',
    'chat.q2': 'What services do you offer?',
    'chat.q3': 'I need more customers',
    'chat.error': 'I could not reply right now. Please try again or message us on WhatsApp.',
    'chat.leadOk': '✅ Done, we passed your details to the team. We will contact you shortly.',
    'chat.leadErr': 'We could not save your details. Write to gonzalo@consultoriadigital.io or via WhatsApp.',
    'chat.leadSubject': 'Meeting requested from the AI assistant',

    'lb.title': 'Screenshot view',
    'lb.close': 'Close',
    'lb.prev': 'Previous',
    'lb.next': 'Next',

    'detail.back': '← Back to services',
    'detail.incluye': 'What it includes',
    'detail.cta': 'I want this service',
    'detail.agendar': 'Book a meeting',

    'crmp.title': 'CRM Automation (Kommo) — Consultoría Digital',
    'crmp.desc': 'We install and configure Kommo CRM to centralize your inquiries from Instagram, TikTok, web, WhatsApp and Facebook, with automations and a salesbot so no lead goes unanswered.',
    'crmp.h1': 'CRM Automation',
    'crmp.lead': 'We centralize <strong>all your inquiries</strong> —Instagram, TikTok, web, WhatsApp and Facebook— in <strong>Kommo CRM</strong>. With automations and a salesbot, no lead goes unanswered and your team works in an organized way, seeing the status of every opportunity in one place.',
    'crmp.h2': 'An organized sales process, end to end',
    'crmp.f1h': 'Setup and rollout',
    'crmp.f1p': 'We connect your channels (Instagram, TikTok, WhatsApp, Facebook and web) to Kommo and leave everything ready to operate.',
    'crmp.f2h': 'Sales process design',
    'crmp.f2p': 'Together with your team we define funnel stages, owners and rules so no opportunity is lost.',
    'crmp.f3h': 'Automations and salesbot',
    'crmp.f3p': 'Automatic replies, lead assignment, reminders and a bot that handles the first messages 24/7.',
    'crmp.f4h': 'Training and support',
    'crmp.f4p': 'We train your team to get the most out of the CRM and support you with monthly assistance.',

    'conp.title': 'ConciliA — AI Bank Reconciliation — Consultoría Digital',
    'conp.desc': 'AI-powered bank reconciliation software, customized to your process and linked to your ERP. Fewer hours matching receipts by hand.',
    'conp.h1': 'ConciliA — AI Bank Reconciliation',
    'conp.lead': '<strong>AI-powered bank reconciliation</strong> software that drastically reduces the workload of verifying payments and matching them against your <strong>ERP</strong> and your <strong>bank</strong>. Customized to your process and linked to your management system, so your team stops losing hours matching receipts by hand.',
    'conp.h2': 'Automatic reconciliation, tailored to your operation',
    'conp.f1h': '100% custom implementation',
    'conp.f1p': 'We adapt ConciliA exactly to how you charge, invoice and record payments today.',
    'conp.f2h': 'Link with your ERP',
    'conp.f2p': 'It integrates with your management system to match bank movements against your receipts.',
    'conp.f3h': 'AI that cross-checks the data',
    'conp.f3p': 'Artificial intelligence identifies matches, detects discrepancies and flags whatever needs review.',
    'conp.f4h': 'Infrastructure and support',
    'conp.f4p': 'We set up the infrastructure (VPS, n8n), train your team and provide monthly assistance.',

    'turp.title': 'TurnerIA — Appointment Management for Healthcare — Consultoría Digital',
    'turp.desc': 'AI appointment assistant on WhatsApp for practices and clinics: available 24/7, books and reschedules appointments and sends automatic reminders.',
    'turp.h1': 'TurnerIA — Appointment Management for Healthcare',
    'turp.lead': 'Appointment assistant with <strong>AI on WhatsApp</strong>, 100% adapted to your practice or clinic. Available <strong>24/7</strong>: it books, reschedules and cancels appointments, and sends automatic reminders to your patients. Fewer no-shows, fewer calls and an always-organized schedule.',
    'turp.h2': 'An AI receptionist that never takes a day off',
    'turp.f1h': 'AI agent on WhatsApp 24/7',
    'turp.f1p': 'It answers your patients in natural language at any hour, without your team having to keep watch.',
    'turp.f2h': 'Books, reschedules and cancels',
    'turp.f2p': 'It manages the full schedule: books new appointments, moves them or cancels them based on real availability.',
    'turp.f3h': 'Automatic reminders',
    'turp.f3p': 'It sends reminders to patients to reduce no-shows and lost appointments.',
    'turp.f4h': 'Integrated with your system',
    'turp.f4p': 'It connects with your management system so the schedule is always synced and up to date.',
  },

  /* =========================== PORTUGUÊS =========================== */
  pt: {
    'lang.aria': 'Mudar idioma',
    'brand.aria': 'Consultoría Digital — início',
    'nav.aria': 'Navegação principal',
    'nav.toggle': 'Abrir menu',
    'nav.servicios': 'Serviços',
    'nav.marketing': 'Marketing',
    'nav.desarrollo': 'Desenvolvimento',
    'nav.equipo': 'Equipe',
    'nav.contacto': 'Contato',
    'nav.hablemos': 'Vamos conversar',

    'meta.title': 'Consultoría Digital — Impulsionamos seu Crescimento Digital',
    'meta.desc': 'Marketing de performance, gestão de redes sociais, anúncios na Meta e desenvolvimento de software com IA: CRM, conciliação bancária e gestão de agendamentos. Mentes jovens, ideias poderosas.',

    'hero.eyebrow': 'Mentes jovens, ideias poderosas',
    'hero.h1': 'Marketing de Performance e <span class="grad-text">Desenvolvimento de Software com IA</span>',
    'hero.lead': 'Somos uma consultoria que combina <strong>marketing de performance</strong> e <strong>desenvolvimento de software com IA</strong>. Conseguimos clientes para você, organizamos seu processo comercial e automatizamos o que hoje toma seu tempo.',
    'hero.cta1': 'Ver serviços',
    'hero.cta2': 'Agendar reunião',
    'hero.stat1n': '5',
    'hero.stat1': 'serviços integrais',
    'hero.stat2n': '+7',
    'hero.stat2': 'especialistas na equipe',
    'hero.stat3n': 'Parceiros',
    'hero.stat3': 'oficiais do Kommo CRM',
    'hero.stat4n': 'Nota fiscal',
    'hero.stat4': 'e anúncios por transferência',

    'serv.kicker': 'O que fazemos',
    'serv.h2': 'Tudo o que oferecemos, em um só lugar',
    'serv.sub': 'Duas grandes áreas que trabalham juntas: o <strong>Marketing</strong> que atrai e converte, e o <strong>Desenvolvimento</strong> que organiza e automatiza sua operação com inteligência artificial.',
    'pil1.h3': 'Marketing de Performance',
    'pil1.p': 'Conteúdo, gestão de redes sociais e anúncios pensados para gerar resultados reais e mensuráveis.',
    'pil1.link': 'Ver serviços de marketing →',
    'pil2.h3': 'Desenvolvimento & Automação',
    'pil2.p': 'CRM, conciliação bancária com IA e gestão de agendamentos por WhatsApp, integrados aos seus sistemas.',
    'pil2.link': 'Ver serviços de desenvolvimento →',

    'mkt.kicker': 'Marketing',
    'mkt.h2': 'Atraia, conecte e converta',
    'mkt.sub': 'Produção de conteúdo e campanhas que colocam sua marca diante das pessoas certas.',
    'tag.mkt': 'Marketing',
    'tag.dev': 'Desenvolvimento',
    'tag.devia': 'Desenvolvimento · IA',
    'card.cta': 'Quero este serviço',
    'card.more': 'Ver mais informações →',

    'rrss.h3': 'Gestão de Redes Sociais',
    'rrss.p': 'Produção integral de conteúdo: idealizamos, planejamos, roteirizamos, gravamos, editamos e publicamos. Você não se preocupa com nada.',
    'rrss.li1': 'Planejamento mensal para Facebook e Instagram',
    'rrss.li2': 'Produção e edição de reels (baixa/média complexidade)',
    'rrss.li3': 'Design de peças gráficas',
    'rrss.li4': 'Contato diário por grupo de WhatsApp',

    'meta.h3': 'Anúncios na Meta',
    'meta.p': 'Campanhas no Facebook e Instagram otimizadas para visitas, contatos por WhatsApp e leads. Com <strong>linha de crédito própria</strong>: você paga por transferência e recebe nota fiscal.',
    'meta.li1': 'Criação de anúncios e acompanhamento de resultados',
    'meta.li2': 'Gestão <strong>bonificada</strong> ao contratar a Gestão de Redes',
    'meta.li3': 'Crédito na Meta por transferência com nota fiscal',
    'meta.li4': 'Relatórios de resultados',

    'dev.kicker': 'Desenvolvimento & IA',
    'dev.h2': 'Organize e automatize sua operação',
    'dev.sub': 'Software sob medida e inteligência artificial integrados aos sistemas que você já usa.',

    'crm.h3': 'Automação com CRM',
    'crm.p': 'Instalamos o Kommo CRM para centralizar contatos do Instagram, TikTok, site, WhatsApp e Facebook. Com automações, nenhum lead fica sem resposta.',
    'crm.li1': 'Setup e implantação do Kommo CRM',
    'crm.li2': 'Desenho do processo comercial com sua equipe',
    'crm.li3': 'Automações e salesbot',
    'crm.li4': 'Treinamento e suporte mensal',

    'con.h3': 'ConciliA — Conciliação Bancária com IA',
    'con.p': 'Software de conciliação bancária com IA. Reduz drasticamente o trabalho de conferir pagamentos e cruzá-los com seu ERP e o banco. Personalizado e vinculado ao seu sistema.',
    'con.li1': 'Implementação 100% sob medida para o seu processo',
    'con.li2': 'Integração com seu sistema de gestão (ERP)',
    'con.li3': 'Treinamento para sua equipe',
    'con.li4': 'Infraestrutura (VPS, n8n) + suporte mensal',

    'tur.h3': 'TurnerIA — Gestão de Agendamentos para Saúde',
    'tur.p': 'Assistente de agendamentos com IA por WhatsApp, 100% adaptado ao seu consultório ou clínica. Atende 24/7, agenda, remarca e cancela consultas e envia lembretes automáticos.',
    'tur.li1': 'Agente de IA no WhatsApp 24/7',
    'tur.li2': 'Agendamento, remarcação e cancelamento',
    'tur.li3': 'Lembretes automáticos para pacientes',
    'tur.li4': 'Integração com seu sistema de gestão',

    'proc.kicker': 'Como trabalhamos',
    'proc.h2': 'Da primeira conversa aos resultados',
    'proc.s1h': 'Reunião & diagnóstico',
    'proc.s1p': 'Entendemos seu negócio, seus objetivos e onde você está perdendo oportunidades.',
    'proc.s2h': 'Proposta sob medida',
    'proc.s2p': 'Montamos o plano de marketing e/ou automação que melhor se ajusta a você.',
    'proc.s3h': 'Implementação',
    'proc.s3p': 'Produzimos, configuramos e integramos tudo aos seus sistemas atuais.',
    'proc.s4h': 'Otimização contínua',
    'proc.s4p': 'Medimos, reportamos e ajustamos mês a mês para continuar crescendo.',

    'team.kicker': 'Nossa equipe',
    'team.h2': 'As pessoas por trás da Consultoría Digital',
    'team.sub': 'Uma equipe jovem, multidisciplinar e obcecada pelos resultados dos nossos clientes.',
    'role.director': 'Diretor',
    'role.lider': 'Líder de Equipe',
    'role.redes': 'Redes Sociais',
    'role.contenido': 'Criação de Conteúdo',
    'role.admin': 'Administração',
    'role.proyectos': 'Gestão de Projetos',
    'role.dev': 'Desenvolvedor',
    'role.ing': 'Engenheiro de Sistemas',

    'cta.kicker': 'Vamos conversar',
    'cta.h2': 'Pronto para impulsionar seu crescimento digital?',
    'cta.p': 'Conte o que você precisa e montamos uma proposta sob medida. Sem compromisso.',
    'cta.dir': 'RN12 3400, W3400 Corrientes — Parque Tecnológico',
    'cta.mapAria': 'Ver localização no Google Maps',
    'cta.mapTitle': 'Localização: Parque Tecnológico, RN12 3400, Corrientes',

    'form.nombre': 'Nome',
    'form.nombrePh': 'Seu nome ou empresa',
    'form.email': 'E-mail',
    'form.emailPh': 'seunome@empresa.com',
    'form.telefono': 'Telefone / WhatsApp',
    'form.telefonoPh': '+54 9 379 400-0000',
    'form.interes': 'O que te interessa?',
    'form.op1': 'Gestão de Redes Sociais',
    'form.op2': 'Anúncios na Meta',
    'form.op3': 'Automação com CRM',
    'form.op4': 'ConciliA (Conciliação com IA)',
    'form.op5': 'TurnerIA (Agendamentos com IA)',
    'form.op6': 'Não tenho certeza / Outro',
    'form.op7': 'Software sob medida',
    'form.op8': 'Gestoría (ERP)',
    'form.mensaje': 'Mensagem',
    'form.mensajePh': 'Conte brevemente sua necessidade',
    'form.enviar': 'Enviar mensagem',
    'form.enviando': 'Enviando…',
    'form.ok': 'Obrigado! Recebemos sua mensagem e responderemos em breve.',
    'form.error': 'Não conseguimos enviar sua mensagem. Escreva para gonzalo@consultoriadigital.io ou pelo WhatsApp.',
    'form.subject': 'Contato pelo site',

    'footer.tag': 'Mentes jovens, ideias poderosas.',
    'footer.copy': '© {year} Consultoría Digital. Todos os direitos reservados.',
    'wa.aria': 'Fale conosco pelo WhatsApp',

    'chat.open': 'Abrir o assistente com IA',
    'chat.fab': 'Agende com IA',
    'chat.title': 'Assistente da Consultoría Digital',
    'chat.subtitle': 'Ajudo você a agendar sua reunião',
    'chat.close': 'Fechar o assistente',
    'chat.ph': 'Escreva sua dúvida…',
    'chat.send': 'Enviar mensagem',
    'chat.greeting': 'Olá! Sou o assistente da Consultoría Digital. Conte o que seu negócio precisa e marcamos uma reunião de diagnóstico sem custo.',
    'chat.q1': 'Quero agendar uma reunião',
    'chat.q2': 'Quais serviços vocês oferecem?',
    'chat.q3': 'Preciso de mais clientes',
    'chat.error': 'Não consegui responder agora. Tente de novo ou fale conosco pelo WhatsApp.',
    'chat.leadOk': '✅ Pronto, encaminhamos seus dados para a equipe. Entraremos em contato em breve.',
    'chat.leadErr': 'Não conseguimos registrar seus dados. Escreva para gonzalo@consultoriadigital.io ou pelo WhatsApp.',
    'chat.leadSubject': 'Reunião solicitada pelo assistente de IA',

    'lb.title': 'Visualização da captura',
    'lb.close': 'Fechar',
    'lb.prev': 'Anterior',
    'lb.next': 'Próxima',

    'detail.back': '← Voltar aos serviços',
    'detail.incluye': 'O que inclui',
    'detail.cta': 'Quero este serviço',
    'detail.agendar': 'Agendar uma reunião',

    'crmp.title': 'Automação com CRM (Kommo) — Consultoría Digital',
    'crmp.desc': 'Instalamos e configuramos o Kommo CRM para centralizar seus contatos do Instagram, TikTok, site, WhatsApp e Facebook, com automações e salesbot para que nenhum lead fique sem resposta.',
    'crmp.h1': 'Automação com CRM',
    'crmp.lead': 'Centralizamos <strong>todos os seus contatos</strong> —Instagram, TikTok, site, WhatsApp e Facebook— no <strong>Kommo CRM</strong>. Com automações e salesbot, nenhum lead fica sem resposta e sua equipe trabalha organizada, vendo o status de cada oportunidade em um só lugar.',
    'crmp.h2': 'Um processo comercial organizado, de ponta a ponta',
    'crmp.f1h': 'Setup e implantação',
    'crmp.f1p': 'Conectamos seus canais (Instagram, TikTok, WhatsApp, Facebook e site) ao Kommo e deixamos tudo pronto para operar.',
    'crmp.f2h': 'Desenho do processo comercial',
    'crmp.f2p': 'Definimos junto com sua equipe as etapas do funil, responsáveis e regras para não perder nenhuma oportunidade.',
    'crmp.f3h': 'Automações e salesbot',
    'crmp.f3p': 'Respostas automáticas, distribuição de leads, lembretes e um bot que atende as primeiras mensagens 24/7.',
    'crmp.f4h': 'Treinamento e suporte',
    'crmp.f4p': 'Treinamos sua equipe para aproveitar o CRM e acompanhamos você com suporte mensal.',

    'conp.title': 'ConciliA — Conciliação Bancária com IA — Consultoría Digital',
    'conp.desc': 'Software de conciliação bancária com IA, personalizado ao seu processo e vinculado ao seu ERP. Menos horas cruzando comprovantes manualmente.',
    'conp.h1': 'ConciliA — Conciliação Bancária com IA',
    'conp.lead': 'Software de <strong>conciliação bancária com IA</strong> que reduz drasticamente o trabalho de conferir pagamentos e cruzá-los com seu <strong>ERP</strong> e o <strong>banco</strong>. Personalizado ao seu processo e vinculado ao seu sistema de gestão, para que sua equipe pare de perder horas cruzando comprovantes manualmente.',
    'conp.h2': 'Conciliação automática, sob medida para sua operação',
    'conp.f1h': 'Implementação 100% sob medida',
    'conp.f1p': 'Adaptamos o ConciliA exatamente à forma como você cobra, fatura e registra os pagamentos hoje.',
    'conp.f2h': 'Integração com seu ERP',
    'conp.f2p': 'Integra-se ao seu sistema de gestão para cruzar movimentações bancárias com seus comprovantes.',
    'conp.f3h': 'IA que cruza os dados',
    'conp.f3p': 'A inteligência artificial identifica correspondências, detecta diferenças e sinaliza o que precisa de revisão.',
    'conp.f4h': 'Infraestrutura e suporte',
    'conp.f4p': 'Montamos a infraestrutura (VPS, n8n), treinamos sua equipe e oferecemos suporte mensal.',

    'turp.title': 'TurnerIA — Gestão de Agendamentos para Saúde — Consultoría Digital',
    'turp.desc': 'Assistente de agendamentos com IA por WhatsApp para consultórios e clínicas: atende 24/7, agenda e remarca consultas e envia lembretes automáticos.',
    'turp.h1': 'TurnerIA — Gestão de Agendamentos para Saúde',
    'turp.lead': 'Assistente de agendamentos com <strong>IA por WhatsApp</strong>, 100% adaptado ao seu consultório ou clínica. Atende <strong>24/7</strong>: agenda, remarca e cancela consultas, e envia lembretes automáticos aos seus pacientes. Menos faltas, menos ligações e uma agenda sempre organizada.',
    'turp.h2': 'Uma recepcionista com IA que nunca tira folga',
    'turp.f1h': 'Agente de IA no WhatsApp 24/7',
    'turp.f1p': 'Responde aos seus pacientes em linguagem natural a qualquer hora, sem que sua equipe precise ficar de plantão.',
    'turp.f2h': 'Agenda, remarca e cancela',
    'turp.f2p': 'Gerencia a agenda completa: marca novas consultas, remaneja ou cancela conforme a disponibilidade real.',
    'turp.f3h': 'Lembretes automáticos',
    'turp.f3p': 'Envia lembretes aos pacientes para reduzir faltas e consultas perdidas.',
    'turp.f4h': 'Integrado ao seu sistema',
    'turp.f4p': 'Conecta-se ao seu sistema de gestão para que a agenda esteja sempre sincronizada e em dia.',
  },
};

const STORAGE_KEY = 'cd-lang';
const DEFAULT_LANG = 'es';

function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : DEFAULT_LANG;
}

let currentLang = DEFAULT_LANG;

// Traduce una clave en el idioma activo (con fallback a español).
function t(key) {
  return I18N[currentLang][key] ?? I18N[DEFAULT_LANG][key] ?? key;
}

const ATTR_MAP = {
  'data-i18n-placeholder': 'placeholder',
  'data-i18n-aria-label': 'aria-label',
  'data-i18n-title': 'title',
  'data-i18n-content': 'content',
};

function applyTranslations() {
  const year = new Date().getFullYear();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const value = t(el.dataset.i18n).replace('{year}', year);
    if (value.includes('<')) el.innerHTML = value;
    else el.textContent = value;
  });

  Object.entries(ATTR_MAP).forEach(([dataAttr, attr]) => {
    document.querySelectorAll(`[${dataAttr}]`).forEach(el =>
      el.setAttribute(attr, t(el.getAttribute(dataAttr)))
    );
  });

  document.documentElement.lang = currentLang;
}

function buildSwitcher(host) {
  const globe =
    '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>';
  const chevron =
    '<svg class="lang-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  host.innerHTML = `
    <button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false">
      ${globe}
      <span class="flag-frame" data-current-flag></span>
      <span class="lang-code" data-current-code></span>
      ${chevron}
    </button>
    <div class="lang-menu" role="menu">
      ${Object.entries(LANGS)
        .map(
          ([code, l]) => `
        <button type="button" role="menuitem" class="lang-option" data-set-lang="${code}">
          <span class="flag-frame">${l.flag}</span>${l.label}
        </button>`
        )
        .join('')}
    </div>`;

  const btn = host.querySelector('.lang-btn');
  const menu = host.querySelector('.lang-menu');

  const closeMenu = () => {
    host.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = host.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('[data-set-lang]').forEach(opt =>
    opt.addEventListener('click', () => {
      setLang(opt.dataset.setLang);
      closeMenu();
    })
  );
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
}

function syncSwitcher() {
  document.querySelectorAll('[data-lang-switch]').forEach(host => {
    host.querySelector('[data-current-flag]').innerHTML = LANGS[currentLang].flag;
    host.querySelector('[data-current-code]').textContent = LANGS[currentLang].code;
    host.querySelector('.lang-btn').setAttribute('aria-label', t('lang.aria'));
    host.querySelectorAll('[data-set-lang]').forEach(opt =>
      opt.classList.toggle('active', opt.dataset.setLang === currentLang)
    );
  });
}

function setLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations();
  syncSwitcher();
  document.dispatchEvent(new CustomEvent('cd:langchange', { detail: { lang } }));
}

currentLang = detectLang();
document.querySelectorAll('[data-lang-switch]').forEach(buildSwitcher);
applyTranslations();
syncSwitcher();
