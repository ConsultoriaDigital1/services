// ===== Test de automatización — página oculta /test (eventos) =====
// Cuestionario multiple choice → diagnóstico con horas y plata perdidas,
// lead a Formsubmit y lectura personalizada generada por IA.

/* ---------- Constantes a revisar antes de cada evento ---------- */

const VALOR_HORA = 8000;                     // ARS por hora de trabajo — ajustar según el público
const HS_SEMANA = 40;                        // una semana de trabajo, para expresar la pérdida
const WHATSAPP = '5493794725597';
const FORMSUBMIT = 'https://formsubmit.co/ajax/gonzalo@consultoriadigital.io';
const API_BASE = window.CD_API || (
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3060'
    : 'https://api.consultoriadigital.io'
);
const CHAT_API = window.CD_CHAT_API || `${API_BASE}/api/chat`;
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
let registroPromesa = null;   // resuelve con el id que devuelve el backend

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

  return {
    score,
    hsMes,
    semanasMes: +(hsMes / HS_SEMANA).toFixed(1),
    costoMes: hsMes * VALOR_HORA,
    nivel,
    ops,
  };
}

function resumenRespuestas() {
  return respuestas
    .map((idx, qi) => `${qi + 1}. ${PREGUNTAS[qi].q} → ${PREGUNTAS[qi].o[idx].t}`)
    .join('\n');
}

// El mismo plan se pinta en pantalla y viaja al reporte: el PDF dice lo que la persona vio.
function construirPlan(d) {
  const primero = d.ops.length ? d.ops[0].nombre : 'tu proceso comercial';
  const resto = d.ops.slice(1).map(o => o.nombre).join(' y ');

  return [
    { cuando: 'Semana 1 y 2', que: 'Relevamiento sin costo: nos sentamos con vos, miramos cómo trabajás hoy y ponemos números al ahorro real.' },
    { cuando: 'Mes 1', que: `Implementamos ${primero}, que es lo que más horas te está comiendo. Lo dejamos andando y capacitamos a tu equipo.` },
    { cuando: 'Mes 2 y 3', que: resto
      ? `Sumamos ${resto} y conectamos todo, para que la información viaje sola de un lado al otro.`
      : 'Conectamos las piezas que ya tenés y armamos los tableros para que decidas con datos, no con intuición.' },
  ];
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

/* ---------- Registro en el backend (panel /admin + flujo de n8n) ---------- */

// El server guarda el test y después dispara n8n, que arma el PDF y lo manda por wasender.
async function enviarTest() {
  const cuerpo = {
    contacto: datos,
    resultado: {
      score: diag.score,
      nivel: diag.nivel.nombre,
      nivelTxt: diag.nivel.txt,
      horasMes: diag.hsMes,
      semanasMes: diag.semanasMes,
      costoMes: diag.costoMes,
      costoMesTxt: pesos(diag.costoMes),
      valorHora: VALOR_HORA,
    },
    oportunidades: diag.ops.map(o => ({ nombre: o.nombre, horasMes: o.hs, que: o.que, url: o.url })),
    respuestas: respuestas.map((idx, qi) => ({
      pregunta: PREGUNTAS[qi].q,
      respuesta: PREGUNTAS[qi].o[idx].t,
      puntos: PREGUNTAS[qi].o[idx].pts,
      horasSemana: PREGUNTAS[qi].o[idx].hs,
    })),
    plan: construirPlan(diag),
  };

  try {
    const res = await fetch(`${API_BASE}/api/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()).id;
  } catch (err) {
    console.warn('No se pudo registrar el test:', err.message);
    return null;
  }
}

// El server espera este aviso para disparar n8n con la lectura ya incluida.
// Se manda igual cuando la IA falla (lectura null), así no espera al pedo.
async function avisarLectura(lectura) {
  const id = await registroPromesa;
  if (!id) return;

  try {
    await fetch(`${API_BASE}/api/test/${id}/lectura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lectura }),
      keepalive: true,
    });
  } catch (err) {
    console.warn('No se pudo enviar la lectura:', err.message);
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
  let lectura = null;

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
    lectura = txt.textContent.trim();
  } catch (err) {
    console.warn('Sin lectura de IA:', err.message);
    // El diagnóstico completo se muestra igual: la IA es un plus, no un requisito.
    $('#bloque-ia').hidden = true;
  } finally {
    clearTimeout(reloj);
    load.hidden = true;
    // Un texto cortado a la mitad no sirve para el PDF: si falló, va null y n8n dispara igual.
    avisarLectura(lectura);
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
  const semanas = diag.semanasMes === 1
    ? '1 semana de trabajo perdida'
    : `${String(diag.semanasMes).replace('.', ',')} semanas de trabajo perdidas`;
  $('#perdida-fine').textContent =
    `Estimado sobre tus respuestas, a ${pesos(VALOR_HORA)} la hora de trabajo. Son ${semanas} por mes.`;

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

  const ol = $('#plan');
  ol.innerHTML = '';
  construirPlan(diag).forEach(({ cuando, que }) => {
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
  enviarLead();                       // en paralelo: el resultado no espera al mail
  registroPromesa = enviarTest();     // ni al registro en el backend
  pintarResultado();
  pedirLecturaIA();
});
