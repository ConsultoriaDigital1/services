// ===== Panel interno (/admin) =====
// Lee los tests de /test desde la API del VPS. El sitio es estático (GitHub Pages),
// así que acá no hay datos: todo viene del backend y detrás de un token.

const API_BASE = window.CD_API || (
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3060'
    : 'https://api.consultoriadigital.io'
);
const CLAVE_TOKEN = 'cd_admin_token';

/* ---------- Estado ---------- */

let tests = [];
let visibles = [];

/* ---------- Atajos y formato ---------- */

const $ = sel => document.querySelector(sel);

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const pesos = n => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(n || 0);

const fmtFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
});
const fecha = iso => (iso ? fmtFecha.format(new Date(iso)) : '—');

const coma = n => String(n ?? 0).replace('.', ',');
const estadoN8N = t => (t.n8n ? (t.n8n.ok ? 'ok' : 'error') : 'pendiente');
const clasePuntaje = s => (s < 40 ? 'bajo' : s < 70 ? 'medio' : 'alto');
const wa = t => t.contacto.whatsappE164 || String(t.contacto.whatsapp || '').replace(/\D/g, '');

/* ---------- API ---------- */

const token = () => sessionStorage.getItem(CLAVE_TOKEN);

async function api(ruta, opciones = {}) {
  const res = await fetch(API_BASE + ruta, {
    ...opciones,
    headers: { ...opciones.headers, Authorization: `Bearer ${token()}` },
  });

  // Token vencido o panel apagado en el server: de vuelta al login.
  if (res.status === 401 || res.status === 503) {
    salir();
    throw new Error('sesion_vencida');
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res;
}

/* ---------- Login ---------- */

function mostrarLogin() {
  $('#pantalla-login').hidden = false;
  $('#pantalla-panel').hidden = true;
  cerrarDetalle();
  $('#password').focus();
}

function salir() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  tests = [];
  mostrarLogin();
}

$('#form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const error = $('#error-login');
  const btn = $('#btn-entrar');
  const password = $('#password').value;

  if (!password) {
    error.textContent = 'Escribí la contraseña.';
    error.hidden = false;
    return;
  }

  error.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Entrando…';

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.status === 401) throw new Error('Contraseña incorrecta.');
    if (res.status === 503) throw new Error('El panel no está configurado en el servidor.');
    if (!res.ok) throw new Error('No se pudo conectar con el servidor.');

    sessionStorage.setItem(CLAVE_TOKEN, (await res.json()).token);
    $('#password').value = '';
    await abrirPanel();
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

/* ---------- Carga ---------- */

async function abrirPanel() {
  $('#pantalla-login').hidden = true;
  $('#pantalla-panel').hidden = false;
  await cargar();
}

async function cargar() {
  const btn = $('#btn-actualizar');
  const aviso = $('#aviso');
  btn.disabled = true;

  try {
    tests = await (await api('/api/admin/tests')).json();
    aviso.hidden = true;
    pintarKpis();
    pintarNiveles();
    aplicarFiltros();
  } catch (err) {
    if (err.message === 'sesion_vencida') return;
    aviso.textContent = 'No se pudieron cargar los tests. Revisá que la API esté andando.';
    aviso.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Resumen ---------- */

function pintarKpis() {
  const total = tests.length;
  const promedio = (leer) => (total ? Math.round(tests.reduce((a, t) => a + leer(t), 0) / total) : 0);

  const hace7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recientes = tests.filter(t => new Date(t.creado).getTime() >= hace7).length;

  const cuenta = {};
  tests.forEach(t => {
    const top = t.oportunidades[0]?.nombre;
    if (top) cuenta[top] = (cuenta[top] || 0) + 1;
  });
  const [servicio, veces] = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0] || [];

  const kpis = [
    ['Tests completados', total, ''],
    ['Últimos 7 días', recientes, ''],
    ['Score promedio', total ? `${promedio(t => t.resultado.score)}/100` : '—', ''],
    ['Horas perdidas', total ? `${promedio(t => t.resultado.horasMes)} h` : '—', 'promedio por mes'],
    ['Más pedido', servicio || '—', veces ? `${veces} de ${total}` : ''],
  ];

  $('#kpis').innerHTML = kpis.map(([rotulo, valor, pie]) => `
    <dl class="adm-kpi">
      <dt>${esc(rotulo)}</dt>
      <dd>${esc(valor)}${pie ? `<small>${esc(pie)}</small>` : ''}</dd>
    </dl>`).join('');
}

function pintarNiveles() {
  const select = $('#filtro-nivel');
  const elegido = select.value;
  const niveles = [...new Set(tests.map(t => t.resultado.nivel).filter(Boolean))].sort();

  select.innerHTML = '<option value="">Todos los niveles</option>' +
    niveles.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  select.value = niveles.includes(elegido) ? elegido : '';
}

/* ---------- Filtros y tabla ---------- */

function aplicarFiltros() {
  const q = $('#buscar').value.trim().toLowerCase();
  const nivel = $('#filtro-nivel').value;
  const estado = $('#filtro-n8n').value;

  visibles = tests.filter(t => {
    if (nivel && t.resultado.nivel !== nivel) return false;
    if (estado && estadoN8N(t) !== estado) return false;
    if (!q) return true;

    const { nombre, empresa, email } = t.contacto;
    return `${nombre} ${empresa} ${email}`.toLowerCase().includes(q);
  });

  $('#conteo').textContent = visibles.length === tests.length
    ? `${tests.length} test${tests.length === 1 ? '' : 's'}`
    : `${visibles.length} de ${tests.length}`;

  pintarTabla();
}

function pintarTabla() {
  const cuerpo = $('#filas');

  if (!visibles.length) {
    cuerpo.innerHTML = `<tr class="adm-fila-vacia"><td class="adm-vacio" colspan="11">${
      tests.length ? 'Ningún test coincide con el filtro.' : 'Todavía no hay tests completados.'
    }</td></tr>`;
    return;
  }

  cuerpo.innerHTML = visibles.map(t => {
    const estado = estadoN8N(t);
    return `
    <tr data-id="${esc(t.id)}">
      <td>${esc(fecha(t.creado))}</td>
      <td class="adm-nombre">${esc(t.contacto.nombre)}</td>
      <td>${esc(t.contacto.empresa) || '—'}</td>
      <td class="adm-contacto">
        <a href="https://wa.me/${esc(wa(t))}" target="_blank" rel="noopener">${esc(t.contacto.whatsapp)}</a>
        <span class="adm-sub">${esc(t.contacto.email)}</span>
      </td>
      <td class="num"><span class="adm-score ${clasePuntaje(t.resultado.score)}">${t.resultado.score}</span></td>
      <td>${esc(t.resultado.nivel)}</td>
      <td class="num">${t.resultado.horasMes}</td>
      <td class="num">${esc(coma(t.resultado.semanasMes))}</td>
      <td class="num">${esc(pesos(t.resultado.costoMes))}</td>
      <td>${esc(t.oportunidades[0]?.nombre) || '—'}</td>
      <td><span class="adm-pill ${estado}">${estado}</span></td>
    </tr>`;
  }).join('');
}

// Los links de contacto abren WhatsApp o el mail; el resto de la fila abre el detalle.
$('#filas').addEventListener('click', e => {
  if (e.target.closest('a')) return;
  const fila = e.target.closest('tr[data-id]');
  if (fila) abrirDetalle(fila.dataset.id);
});

['#buscar', '#filtro-nivel', '#filtro-n8n'].forEach(sel =>
  $(sel).addEventListener('input', aplicarFiltros)
);

/* ---------- Detalle ---------- */

function abrirDetalle(id) {
  const t = tests.find(x => x.id === id);
  if (!t) return;

  const estado = estadoN8N(t);
  const detalleN8N = t.n8n
    ? `${t.n8n.ok ? 'Enviado' : 'Error: ' + (t.n8n.error || 'desconocido')} · ${fecha(t.n8n.at)}`
    : 'Todavía no se disparó';

  $('#detalle-cuerpo').innerHTML = `
    <h2 class="adm-det-h">${esc(t.contacto.nombre)}</h2>
    <p class="adm-det-sub">${esc(t.contacto.empresa) || 'Sin empresa'} · ${esc(fecha(t.creado))}</p>

    <div class="adm-det-links">
      <a href="https://wa.me/${esc(wa(t))}" target="_blank" rel="noopener">WhatsApp ${esc(t.contacto.whatsapp)}</a>
      <a href="mailto:${esc(t.contacto.email)}">${esc(t.contacto.email)}</a>
    </div>

    <dl class="adm-det-cifras">
      <div><dt>Score</dt><dd>${t.resultado.score}</dd></div>
      <div><dt>Horas/mes</dt><dd>${t.resultado.horasMes}</dd></div>
      <div><dt>Semanas/mes</dt><dd>${esc(coma(t.resultado.semanasMes))}</dd></div>
      <div><dt>Costo/mes</dt><dd>${esc(pesos(t.resultado.costoMes))}</dd></div>
    </dl>

    <section class="adm-det-bloque">
      <h3>Nivel: ${esc(t.resultado.nivel)}</h3>
      <p class="adm-det-texto">${esc(t.resultado.nivelTxt)}</p>
    </section>

    <section class="adm-det-bloque">
      <h3>Lectura de la IA</h3>
      ${t.lecturaIa
        ? `<p class="adm-det-texto">${esc(t.lecturaIa)}</p>`
        : '<p class="adm-det-nada">No se generó (la IA falló o cerraron la pestaña antes).</p>'}
    </section>

    <section class="adm-det-bloque">
      <h3>Oportunidades detectadas</h3>
      ${t.oportunidades.length ? `<ul class="adm-ops">${t.oportunidades.map(o => `
        <li>
          <strong>${esc(o.nombre)}</strong>
          <span>recupera ~${o.horasMes} h/mes</span>
          <p>${esc(o.que)}</p>
        </li>`).join('')}</ul>`
        : '<p class="adm-det-nada">Sin brechas grandes detectadas.</p>'}
    </section>

    <section class="adm-det-bloque">
      <h3>Respuestas</h3>
      <ol class="adm-qa">${t.respuestas.map(r => `
        <li>
          <strong>${r.n}. ${esc(r.pregunta)}</strong>
          <span>${esc(r.respuesta)}</span>
          <em>${r.puntos}/2 · ${esc(coma(r.horasSemana))} h por semana</em>
        </li>`).join('')}</ol>
    </section>

    <section class="adm-det-bloque">
      <h3>Plan propuesto</h3>
      <ol class="adm-qa">${t.plan.map(p => `
        <li><strong>${esc(p.cuando)}</strong><span>${esc(p.que)}</span></li>`).join('')}</ol>
    </section>

    <div class="adm-det-pie">
      <span class="adm-pill ${estado}">n8n: ${estado}</span>
      <span class="adm-sub">${esc(detalleN8N)}</span>
      <button type="button" class="adm-btn" id="btn-reenviar" data-id="${esc(t.id)}">Reenviar a n8n</button>
    </div>`;

  $('#btn-reenviar').addEventListener('click', reenviar);
  $('#detalle').hidden = false;
  $('#velo').hidden = false;
  $('#detalle').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function cerrarDetalle() {
  $('#detalle').hidden = true;
  $('#velo').hidden = true;
  document.body.style.overflow = '';
}

$('#btn-cerrar').addEventListener('click', cerrarDetalle);
$('#velo').addEventListener('click', cerrarDetalle);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#detalle').hidden) cerrarDetalle();
});

/* ---------- Acciones ---------- */

// Vuelve a disparar el flujo: sirve para regenerar el PDF o si n8n estaba caído.
async function reenviar(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;

  btn.disabled = true;
  btn.textContent = 'Reenviando…';

  try {
    const { n8n } = await (await api(`/api/admin/tests/${id}/reenviar`, { method: 'POST' })).json();
    const t = tests.find(x => x.id === id);
    if (t) t.n8n = n8n;
    pintarTabla();
    abrirDetalle(id); // se repinta con el estado nuevo
  } catch (err) {
    if (err.message === 'sesion_vencida') return;
    btn.textContent = 'No se pudo reenviar';
    btn.disabled = false;
  }
}

$('#btn-actualizar').addEventListener('click', cargar);
$('#btn-salir').addEventListener('click', salir);

$('#btn-csv').addEventListener('click', async () => {
  const btn = $('#btn-csv');
  btn.disabled = true;

  try {
    // Va con el token en el header, así que no alcanza con un link: descargamos el blob.
    const url = URL.createObjectURL(await (await api('/api/admin/tests.csv')).blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `tests-consultoria-digital-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); // revocar ya corta la descarga en algunos navegadores
  } catch (err) {
    if (err.message === 'sesion_vencida') return;
    const aviso = $('#aviso');
    aviso.textContent = 'No se pudo exportar el CSV.';
    aviso.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

/* ---------- Arranque ---------- */

if (token()) {
  abrirPanel().catch(mostrarLogin);
} else {
  mostrarLogin();
}
