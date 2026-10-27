// ===== Panel de inscriptos al Programa de Partners (/admin/partners) =====
// Comparte el token con el panel de tests: si ya entraste en /admin, acá no pide contraseña.

const API_BASE = window.CD_API || (
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3060'
    : 'https://api.consultoriadigital.io'
);
const CLAVE_TOKEN = 'cd_admin_token';

let inscriptos = [];
let visibles = [];

const $ = sel => document.querySelector(sel);

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const fmtFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
});
const fecha = iso => (iso ? fmtFecha.format(new Date(iso)) : '—');
const wa = r => r.whatsappE164 || String(r.whatsapp || '').replace(/\D/g, '');

/* ---------- API ---------- */

const token = () => sessionStorage.getItem(CLAVE_TOKEN);

async function api(ruta) {
  const res = await fetch(API_BASE + ruta, { headers: { Authorization: `Bearer ${token()}` } });
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
  $('#password').focus();
}

function salir() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  inscriptos = [];
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
    inscriptos = await (await api('/api/admin/partners')).json();
    aviso.hidden = true;
    pintarKpis();
    pintarPerfiles();
    aplicarFiltros();
  } catch (err) {
    if (err.message === 'sesion_vencida') return;
    aviso.textContent = 'No se pudieron cargar los inscriptos. Revisá que la API esté andando.';
    aviso.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Resumen ---------- */

function masRepetido(leer) {
  const cuenta = {};
  inscriptos.forEach(r => {
    const v = leer(r);
    if (v) cuenta[v] = (cuenta[v] || 0) + 1;
  });
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0] || [];
}

function pintarKpis() {
  const total = inscriptos.length;
  const hace7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recientes = inscriptos.filter(r => new Date(r.creado).getTime() >= hace7).length;
  const [perfil, vecesPerfil] = masRepetido(r => r.perfil);
  const [ciudad, vecesCiudad] = masRepetido(r => r.ciudad.trim().toLowerCase());

  const kpis = [
    ['Inscriptos', total, ''],
    ['Últimos 7 días', recientes, ''],
    ['Perfil más común', perfil || '—', vecesPerfil ? `${vecesPerfil} de ${total}` : ''],
    ['Ciudad más común', ciudad ? ciudad.replace(/(^|\s)\S/g, l => l.toUpperCase()) : '—', vecesCiudad ? `${vecesCiudad} de ${total}` : ''],
  ];

  $('#kpis').innerHTML = kpis.map(([rotulo, valor, pie]) => `
    <dl class="adm-kpi">
      <dt>${esc(rotulo)}</dt>
      <dd>${esc(valor)}${pie ? `<small>${esc(pie)}</small>` : ''}</dd>
    </dl>`).join('');
}

function pintarPerfiles() {
  const select = $('#filtro-perfil');
  const elegido = select.value;
  const perfiles = [...new Set(inscriptos.map(r => r.perfil).filter(Boolean))].sort();

  select.innerHTML = '<option value="">Todos los perfiles</option>' +
    perfiles.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  select.value = perfiles.includes(elegido) ? elegido : '';
}

/* ---------- Filtros y tabla ---------- */

function aplicarFiltros() {
  const q = $('#buscar').value.trim().toLowerCase();
  const perfil = $('#filtro-perfil').value;

  visibles = inscriptos.filter(r => {
    if (perfil && r.perfil !== perfil) return false;
    if (!q) return true;
    return `${r.nombre} ${r.email} ${r.ciudad} ${r.empresa} ${r.whatsapp}`.toLowerCase().includes(q);
  });

  $('#conteo').textContent = visibles.length === inscriptos.length
    ? `${inscriptos.length} inscripto${inscriptos.length === 1 ? '' : 's'}`
    : `${visibles.length} de ${inscriptos.length}`;

  pintarTabla();
}

function pintarTabla() {
  const cuerpo = $('#filas');

  if (!visibles.length) {
    cuerpo.innerHTML = `<tr class="adm-fila-vacia"><td class="adm-vacio" colspan="7">${
      inscriptos.length ? 'Ningún inscripto coincide con el filtro.' : 'Todavía no hay inscriptos.'
    }</td></tr>`;
    return;
  }

  cuerpo.innerHTML = visibles.map(r => `
    <tr>
      <td>${esc(fecha(r.creado))}</td>
      <td class="adm-nombre">${esc(r.nombre)}</td>
      <td class="adm-contacto">
        <a href="https://wa.me/${esc(wa(r))}" target="_blank" rel="noopener">${esc(r.whatsapp)}</a>
        <a class="adm-sub" href="mailto:${esc(r.email)}">${esc(r.email)}</a>
      </td>
      <td>${esc(r.perfil)}</td>
      <td>${esc(r.ciudad)}</td>
      <td>${esc(r.empresa) || '—'}</td>
      <td>${esc(r.alcance) || '—'}</td>
    </tr>`).join('');
}

['#buscar', '#filtro-perfil'].forEach(sel => $(sel).addEventListener('input', aplicarFiltros));

/* ---------- Acciones ---------- */

$('#btn-actualizar').addEventListener('click', cargar);
$('#btn-salir').addEventListener('click', salir);

$('#btn-csv').addEventListener('click', async () => {
  const btn = $('#btn-csv');
  btn.disabled = true;

  try {
    // Va con el token en el header, así que no alcanza con un link: descargamos el blob.
    const url = URL.createObjectURL(await (await api('/api/admin/partners.csv')).blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscriptos-partners-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
