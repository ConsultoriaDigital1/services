// ===== Test de automatización — página oculta /test (eventos) =====
// Cuestionario multiple choice → diagnóstico con horas y plata perdidas,
// lead a Formsubmit y lectura personalizada generada por IA.

/* ---------- Constantes a revisar antes de cada evento ---------- */

const VALOR_HORA = 8000;                     // ARS por hora de trabajo — ajustar según el público
const WHATSAPP = '5493794725597';
const FORMSUBMIT = 'https://formsubmit.co/ajax/gonzalo@consultoriadigital.io';
const CHAT_API = window.CD_CHAT_API || 'https://api.consultoriadigital.io/api/chat';
const IA_TIMEOUT = 12000;

/* ---------- Servicios ---------- */

const SERVICIOS = {
  concilia: {
    nombre: 'Conciliación automática',
    url: '/concilia.html',
    que: 'Conectamos tus cuentas y el sistema cruza movimientos, facturas y pagos solo. Vos mirás las excepciones, no las 400 filas.',
  },
  crm: {
    nombre: 'CRM y automatización comercial',
    url: '/crm.html',
    que: 'Cada consulta de WhatsApp entra sola al CRM, con su etapa y su recordatorio. Nadie más se pierde por falta de seguimiento.',
  },
  turneria: {
    nombre: 'Gestión de turnos online',
    url: '/turneria.html',
    que: 'El cliente elige su horario desde un link, con recordatorio automático. Se te libera el teléfono y bajan los ausentes.',
  },
  marketing: {
    nombre: 'Marketing de performance',
    url: '/#marketing',
    que: 'Campañas medidas por resultado, no por likes: sabés cuánto te cuesta cada cliente nuevo y cuánto te deja.',
  },
};

/* ---------- Preguntas ----------
   pts: 0 = todo a mano · 1 = a medias · 2 = resuelto
   hs:  horas por semana que se pierden con esa respuesta
   tag: servicio que resuelve el problema                        */

const PREGUNTAS = [
  {
    q: '¿Cómo conciliás los pagos y cobros?',
    ayuda: 'Cruzar lo que entró al banco con lo que facturaste.',
    o: [
      { t: 'A mano, cruzando el banco con una planilla', pts: 0, hs: 3, tag: 'concilia' },
      { t: 'No llego a conciliar, lo hago cuando puedo', pts: 0, hs: 3.5, tag: 'concilia' },
      { t: 'Mitad planilla, mitad reportes del banco', pts: 1, hs: 1.5, tag: 'concilia' },
      { t: 'Un sistema lo concilia solo', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cómo cargás las facturas?',
    ayuda: 'Las que emitís y las que recibís de proveedores.',
    o: [
      { t: 'Una por una, a mano', pts: 0, hs: 2.5, tag: 'concilia' },
      { t: 'Algunas se importan, otras las cargo yo', pts: 1, hs: 1.2, tag: 'concilia' },
      { t: 'Se cargan y se imputan automáticamente', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cómo vendés y respondés por WhatsApp?',
    ayuda: 'El canal por donde hoy entra la mayoría de las consultas.',
    o: [
      { t: 'Respondo todo yo, desde mi celular', pts: 0, hs: 4, tag: 'crm' },
      { t: 'Somos varios respondiendo, sin un orden claro', pts: 1, hs: 2.5, tag: 'crm' },
      { t: 'Tenemos WhatsApp integrado, con respuestas automáticas', pts: 2, hs: 0 },
      { t: 'Casi no me entran consultas por WhatsApp', pts: 1, hs: 1, tag: 'marketing' },
    ],
  },
  {
    q: '¿Tenés un CRM donde ves a cada cliente y en qué etapa está?',
    ayuda: 'Un lugar único con todos los contactos y su historia.',
    o: [
      { t: 'No: los contactos están en la agenda del teléfono', pts: 0, hs: 2, tag: 'crm' },
      { t: 'Una planilla de Excel que actualizo cuando puedo', pts: 1, hs: 1.5, tag: 'crm' },
      { t: 'Sí, uso un CRM todos los días', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cómo hacés el seguimiento y la postventa?',
    ayuda: 'Volver al que pidió precio y no compró, o al que ya compró.',
    o: [
      { t: 'Cuando me acuerdo', pts: 0, hs: 2, tag: 'crm' },
      { t: 'Me pongo recordatorios yo mismo', pts: 1, hs: 1, tag: 'crm' },
      { t: 'El sistema avisa y dispara los mensajes solo', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cómo coordinás turnos, entregas o visitas?',
    ayuda: 'La agenda del día a día del negocio.',
    o: [
      { t: 'Por WhatsApp o teléfono, uno por uno', pts: 0, hs: 3, tag: 'turneria' },
      { t: 'Con una agenda o calendario compartido', pts: 1, hs: 1.2, tag: 'turneria' },
      { t: 'El cliente se agenda solo, online', pts: 2, hs: 0 },
      { t: 'Mi negocio no maneja turnos ni entregas', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cómo te encuentran hoy los clientes nuevos?',
    ayuda: 'De dónde viene la demanda que entra cada mes.',
    o: [
      { t: 'Boca en boca, nada más', pts: 0, hs: 1, tag: 'marketing' },
      { t: 'Redes que manejo yo cuando tengo un rato', pts: 1, hs: 2, tag: 'marketing' },
      { t: 'Tengo pauta y campañas gestionadas por alguien', pts: 2, hs: 0 },
    ],
  },
  {
    q: '¿Cuántas horas por semana se van en tareas repetitivas?',
    ayuda: 'Copiar, pegar, cargar, recordar, reenviar.',
    o: [
      { t: 'Más de 15 horas', pts: 0, hs: 4 },
      { t: 'Entre 5 y 15 horas', pts: 1, hs: 2 },
      { t: 'Menos de 5 horas', pts: 2, hs: 0.5 },
    ],
  },
];

const NIVELES = [
  {
    max: 39,
    nombre: 'Modo manual',
    txt: 'Tu negocio hoy funciona por tu esfuerzo, no por tu sistema. Cada venta, cada cobro y cada seguimiento dependen de que vos te acuerdes. Eso tiene un techo, y ese techo son tus horas. La buena noticia: casi todo lo que respondiste ya se automatiza con herramientas que existen y funcionan hoy.',
  },
  {
    max: 69,
    nombre: 'Semi-digital',
    txt: 'Diste los primeros pasos, pero las piezas no se hablan entre sí: cargás dos veces la misma información y el sistema no te avisa nada. Ese “mitad y mitad” es el escenario más caro, porque pagás el trabajo manual igual y no cosechás el beneficio de tener todo integrado.',
  },
  {
    max: 100,
    nombre: 'En camino',
    txt: 'Estás bastante ordenado, y eso se nota. Pero justamente por eso las horas que todavía perdés son las más caras: son tuyas, del que dirige. Ahí es donde una automatización bien puesta deja de ahorrarte tiempo y empieza a hacerte crecer.',
  },
];

/* ---------- Estado ---------- */

const respuestas = new Array(PREGUNTAS.length).fill(null);
let actual = 0;
let datos = null;
let diag = null;

/* ---------- Atajos al DOM ---------- */

const $ = sel => document.querySelector(sel);
const pantallas = {
  intro: $('#pantalla-intro'),
  preguntas: $('#pantalla-preguntas'),
  datos: $('#pantalla-datos'),
  resultado: $('#pantalla-resultado'),
};

function mostrar(nombre) {
  Object.entries(pantallas).forEach(([k, el]) => { el.hidden = k !== nombre; });
  window.scrollTo(0, 0);
}

const pesos = n => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(n);

/* ---------- Preguntas ---------- */

function pintarPregunta() {
  const p = PREGUNTAS[actual];
  const pct = Math.round((actual / PREGUNTAS.length) * 100);

  $('#progreso').style.setProperty('--pct', pct + '%');
  $('.quiz-progress').setAttribute('aria-valuenow', pct);
  $('#contador').textContent = `Pregunta ${actual + 1} de ${PREGUNTAS.length}`;
  $('#enunciado').innerHTML = `${p.q}<small>${p.ayuda}</small>`;
  $('#btn-volver').hidden = actual === 0;

  const cont = $('#opciones');
  cont.innerHTML = '';
  p.o.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = op.t;
    if (respuestas[actual] === i) btn.classList.add('elegida');
    btn.addEventListener('click', () => elegir(i));
    cont.appendChild(btn);
  });
}

function elegir(i) {
  respuestas[actual] = i;
  const btns = $('#opciones').querySelectorAll('.quiz-option');
  btns.forEach(b => b.classList.remove('elegida'));
  btns[i].classList.add('elegida');

  // Pequeña pausa para que se vea la selección antes de avanzar.
  setTimeout(() => {
    if (actual < PREGUNTAS.length - 1) {
      actual++;
      pintarPregunta();
    } else {
      mostrar('datos');
    }
  }, 220);
}

/* ---------- Cálculo del diagnóstico ---------- */

function calcular() {
  let pts = 0;
  let hsSemana = 0;
  const porTag = {};

  respuestas.forEach((idx, qi) => {
    const op = PREGUNTAS[qi].o[idx];
    pts += op.pts;
    hsSemana += op.hs;
    if (op.tag && op.pts < 2) porTag[op.tag] = (porTag[op.tag] || 0) + op.hs;
  });

  const score = Math.round((pts / (PREGUNTAS.length * 2)) * 100);
  const hsMes = Math.round(hsSemana * 4.3);
  const nivel = NIVELES.find(n => score <= n.max);

  const ops = Object.entries(porTag)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, hs]) => ({ tag, hs: Math.round(hs * 4.3), ...SERVICIOS[tag] }));

  return { score, hsMes, costoMes: hsMes * VALOR_HORA, nivel, ops };
}

function resumenRespuestas() {
  return respuestas
    .map((idx, qi) => `${qi + 1}. ${PREGUNTAS[qi].q} → ${PREGUNTAS[qi].o[idx].t}`)
    .join('\n');
}

/* ---------- Lead a Formsubmit ---------- */

async function enviarLead() {
  const data = new FormData();
  data.append('nombre', datos.nombre);
  data.append('whatsapp', datos.whatsapp);
  data.append('email', datos.email);
  data.append('empresa', datos.empresa || '—');
  data.append('score', `${diag.score}/100`);
  data.append('nivel', diag.nivel.nombre);
  data.append('horas_perdidas_mes', String(diag.hsMes));
  data.append('costo_estimado_mes', pesos(diag.costoMes));
  data.append('prioridad', diag.ops.length ? diag.ops[0].nombre : 'Sin brechas detectadas');
  data.append('respuestas', resumenRespuestas());
  data.append('origen', 'Test de automatización — evento');
  data.append('_subject', `Test de automatización — ${datos.nombre} (${diag.score}/100)`);
  data.append('_cc', 'smallkeloft@gmail.com');
  data.append('_template', 'table');
  data.append('_captcha', 'false');

  try {
    const res = await fetch(FORMSUBMIT, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (err) {
    // Nunca bloqueamos el resultado por un fallo del envío: la persona está frente a otros.
    console.warn('No se pudo enviar el lead:', err.message);
  }
}

/* ---------- Lectura personalizada con IA ---------- */

function promptDiagnostico() {
  return [
    `Soy ${datos.nombre}${datos.empresa ? `, de ${datos.empresa}` : ''}.`,
    `Hice el test de automatización. Resultado: ${diag.score}/100 (${diag.nivel.nombre}).`,
    `Estimamos que pierdo ${diag.hsMes} horas por mes (${pesos(diag.costoMes)}) en tareas manuales.`,
    diag.ops.length ? `Prioridades detectadas: ${diag.ops.map(o => o.nombre).join(', ')}.` : 'No se detectaron brechas grandes.',
    '',
    'Mis respuestas:',
    resumenRespuestas(),
    '',
    'Escribime una lectura personalizada de mi caso en español rioplatense (tuteo), máximo 160 palabras, en tres párrafos separados por una línea en blanco y sin markdown, sin listas, sin viñetas y sin títulos:',
    '1) qué me está costando hoy concretamente, usando mis horas y mi plata;',
    '2) qué automatizaríamos primero y qué cambia en mi día a día cuando esté funcionando;',
    '3) una invitación directa y cálida a coordinar una reunión con Consultoría Digital.',
    'Hablame de vos a mí, sin saludos de apertura tipo "Hola" y sin firma final.',
  ].join('\n').slice(0, 1490);
}

async function pedirLecturaIA() {
  const txt = $('#ia-txt');
  const load = $('#ia-load');
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), IA_TIMEOUT);

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang: 'es',
        mode: 'diagnostico',
        messages: [{ role: 'user', content: promptDiagnostico() }],
      }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let salida = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const { delta } = JSON.parse(payload);
          if (!delta) continue;
          salida += delta;
          // El bloque de lead del asistente del sitio nunca se muestra acá.
          txt.textContent = salida.replace(/<<<LEAD>>>[\s\S]*?(<<<FIN>>>|$)/, '').trimEnd();
          load.hidden = true;
        } catch {
          /* fragmento incompleto */
        }
      }
    }

    if (!txt.textContent.trim()) throw new Error('respuesta vacía');
  } catch (err) {
    console.warn('Sin lectura de IA:', err.message);
    // El diagnóstico completo se muestra igual: la IA es un plus, no un requisito.
    $('#bloque-ia').hidden = true;
  } finally {
    clearTimeout(reloj);
    load.hidden = true;
  }
}

/* ---------- Resultado ---------- */

function pintarResultado() {
  $('#score-num').textContent = diag.score;
  $('#gauge').style.setProperty('--score', diag.score);
  $('#nivel').textContent = diag.nivel.nombre;
  $('#nivel-txt').textContent = diag.nivel.txt;

  $('#horas').textContent = diag.hsMes;
  $('#plata').textContent = pesos(diag.costoMes);
  $('#perdida-fine').textContent =
    `Estimado sobre tus respuestas, a ${pesos(VALOR_HORA)} la hora de trabajo. Son ${Math.round(diag.hsMes / 8)} jornadas completas por mes.`;

  const cont = $('#oportunidades');
  cont.innerHTML = '';
  if (!diag.ops.length) {
    cont.innerHTML = '<p class="res-op-vacio">Tenés lo esencial resuelto. El próximo salto no es ordenar: es usar esos datos para vender más. De eso también nos ocupamos.</p>';
  }
  diag.ops.forEach((op, i) => {
    const a = document.createElement('a');
    a.className = 'res-op';
    a.href = op.url;
    a.innerHTML =
      `<span class="res-op-n">${i + 1}</span>` +
      `<span class="res-op-body"><strong>${op.nombre}</strong>` +
      `<span class="res-op-hs">recuperás ~${op.hs} h/mes</span>` +
      `<span class="res-op-que">${op.que}</span></span>`;
    cont.appendChild(a);
  });

  const primero = diag.ops.length ? diag.ops[0].nombre : 'tu proceso comercial';
  const resto = diag.ops.slice(1).map(o => o.nombre).join(' y ');
  const plan = [
    ['Semana 1 y 2', `Relevamiento sin costo: nos sentamos con vos, miramos cómo trabajás hoy y ponemos números al ahorro real.`],
    ['Mes 1', `Implementamos ${primero}, que es lo que más horas te está comiendo. Lo dejamos andando y capacitamos a tu equipo.`],
    ['Mes 2 y 3', resto
      ? `Sumamos ${resto} y conectamos todo, para que la información viaje sola de un lado al otro.`
      : `Conectamos las piezas que ya tenés y armamos los tableros para que decidas con datos, no con intuición.`],
  ];
  const ol = $('#plan');
  ol.innerHTML = '';
  plan.forEach(([cuando, que]) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${cuando}</strong><span>${que}</span>`;
    ol.appendChild(li);
  });

  const msg =
    `Hola! Soy ${datos.nombre}. Hice el test de automatización: me dio ${diag.score}/100 (${diag.nivel.nombre}) ` +
    `y estoy perdiendo unas ${diag.hsMes} horas por mes.` +
    (diag.ops.length ? ` Quiero empezar por ${diag.ops[0].nombre}.` : ' Quiero ver cómo dar el próximo paso.');
  $('#cta-wa').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  $('#cta-mail').href =
    `mailto:gonzalo@consultoriadigital.io?subject=${encodeURIComponent('Test de automatización — ' + datos.nombre)}` +
    `&body=${encodeURIComponent(msg)}`;

  mostrar('resultado');
}

/* ---------- Eventos ---------- */

$('#btn-empezar').addEventListener('click', () => {
  mostrar('preguntas');
  pintarPregunta();
});

$('#btn-volver').addEventListener('click', () => {
  if (actual > 0) {
    actual--;
    pintarPregunta();
  }
});

$('#form-datos').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const error = $('#error-datos');

  datos = {
    nombre: f.nombre.value.trim(),
    whatsapp: f.whatsapp.value.trim(),
    email: f.email.value.trim(),
    empresa: f.empresa.value.trim(),
  };

  if (!datos.nombre || !datos.whatsapp || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email)) {
    error.textContent = 'Completá tu nombre, tu WhatsApp y un email válido para ver el resultado.';
    error.hidden = false;
    return;
  }
  error.hidden = true;

  const btn = $('#btn-ver');
  btn.disabled = true;
  btn.textContent = 'Preparando tu diagnóstico…';

  diag = calcular();
  enviarLead();      // en paralelo: el resultado no espera al mail
  pintarResultado();
  pedirLecturaIA();
});
