// ===== Tickets de clientes (/tickets) =====
// 1) el cliente busca su proyecto, 2) pone el código que le pasamos, 3) carga pedidos con
// archivos y ve cuáles ya marcamos como hechos. El acceso queda guardado en su navegador.
const { API, esc, fecha, adjuntos, activarAdjuntos, revisarArchivos, subir, MAX_ARCHIVOS } = window.TK;
const $ = s => document.querySelector(s);
const CLAVE_ACCESOS = 'cd_tickets_accesos';
const CLAVE_ULTIMO = 'cd_tickets_ultimo';
const CLAVE_AUTOR = 'cd_tickets_autor';

const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; } };
const escribir = (clave, valor) => { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* modo privado: dura lo que la pestaña */ } };
const memoria = { accesos: leer(CLAVE_ACCESOS, {}) };
const tokenDe = id => memoria.accesos[id] || '';
function guardarAcceso(id, token) {
  if (token) memoria.accesos[id] = token; else delete memoria.accesos[id];
  escribir(CLAVE_ACCESOS, memoria.accesos);
}

let proyecto = null; // { id, nombre }
let tickets = [];
let nuevos = []; // archivos elegidos para el pedido nuevo
const token = () => tokenDe(proyecto?.id);

function mostrar(paso) {
  for (const id of ['paso-buscar', 'paso-codigo', 'paso-proyecto']) $('#' + id).hidden = id !== paso;
}

// ---------- 1. Buscador ----------
let busqueda = 0;
let espera;
$('#buscar').addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(buscar, 220);
});
async function buscar() {
  const q = $('#buscar').value.trim();
  const turno = ++busqueda;
  if (q.length < 2) { $('#resultados').replaceChildren(); $('#buscar-ayuda').textContent = 'Escribí al menos 2 letras.'; return; }
  try {
    const res = await fetch(`${API}/api/tickets/proyectos?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw Error(res.status === 429 ? 'Demasiadas búsquedas. Esperá unos minutos.' : 'No se pudo buscar.');
    const lista = await res.json();
    if (turno !== busqueda) return; // llegó tarde: ya se escribió otra cosa
    $('#buscar-ayuda').textContent = lista.length ? 'Elegí tu proyecto:' : 'No encontramos proyectos con ese nombre. Probá con otra palabra o consultá al equipo.';
    $('#resultados').innerHTML = lista.map(p => `<li><button type="button" class="tk-resultado" data-id="${esc(p.id)}" data-nombre="${esc(p.nombre)}"><strong>${esc(p.nombre)}</strong>${p.cliente ? `<small>${esc(p.cliente)}</small>` : ''}</button></li>`).join('');
  } catch (err) { $('#buscar-ayuda').textContent = err.message; }
}
$('#resultados').onclick = e => {
  const b = e.target.closest('[data-id]');
  if (b) elegir({ id: b.dataset.id, nombre: b.dataset.nombre });
};

// ---------- 2. Código ----------
function elegir(p) {
  proyecto = p;
  history.replaceState(null, '', `?p=${encodeURIComponent(p.id)}`);
  if (tokenDe(p.id)) return abrir();
  $('#codigo-titulo').innerHTML = `Entrá a <span>${esc(p.nombre)}</span>`;
  $('#codigo').value = ''; $('#codigo-estado').textContent = '';
  mostrar('paso-codigo');
  $('#codigo').focus();
}
$('#form-codigo').onsubmit = async e => {
  e.preventDefault();
  const boton = $('#btn-entrar'); boton.disabled = true;
  $('#codigo-estado').textContent = 'Verificando…';
  try {
    const res = await fetch(`${API}/api/tickets/acceso`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proyecto: proyecto.id, codigo: $('#codigo').value }) });
    if (res.status === 401) throw Error('El código no es correcto. Revisalo o pedíselo al equipo.');
    if (res.status === 429) throw Error('Demasiados intentos. Probá de nuevo en una hora.');
    if (!res.ok) throw Error('No se pudo entrar. Intentá de nuevo.');
    const datos = await res.json();
    guardarAcceso(proyecto.id, datos.token);
    proyecto = datos.proyecto;
    await abrir();
  } catch (err) { $('#codigo-estado').textContent = err.message; }
  finally { boton.disabled = false; }
};
$('#otro-proyecto').onclick = volverAlBuscador;
$('#salir').onclick = volverAlBuscador;
function volverAlBuscador() {
  proyecto = null; tickets = [];
  try { localStorage.removeItem(CLAVE_ULTIMO); } catch { /* nada */ }
  history.replaceState(null, '', location.pathname);
  $('#buscar').value = ''; $('#resultados').replaceChildren(); $('#buscar-ayuda').textContent = 'Escribí al menos 2 letras.';
  mostrar('paso-buscar');
  $('#buscar').focus();
}

// ---------- 3. Checklist ----------
async function cargar() {
  const res = await fetch(`${API}/api/tickets/p/${encodeURIComponent(proyecto.id)}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (res.status === 401) {
    // Código regenerado, proyecto archivado o acceso vencido: se vuelve a pedir el código.
    guardarAcceso(proyecto.id, null);
    throw Object.assign(Error('Tu acceso venció. Volvé a ingresar el código.'), { sinAcceso: true });
  }
  if (!res.ok) throw Error('No se pudo cargar el proyecto.');
  const datos = await res.json();
  proyecto = datos.proyecto; tickets = datos.tickets;
}

async function abrir() {
  try {
    await cargar();
  } catch (err) {
    if (err.sinAcceso) { elegir(proyecto); $('#codigo-estado').textContent = err.message; return; }
    mostrar('paso-proyecto'); $('#lista-estado').textContent = err.message; return;
  }
  escribir(CLAVE_ULTIMO, proyecto);
  $('#proyecto-nombre').innerHTML = `<span>${esc(proyecto.nombre)}</span>`;
  document.title = `Tickets · ${proyecto.nombre} — Consultoría Digital`;
  $('#autor').value = leer(CLAVE_AUTOR, '');
  mostrar('paso-proyecto');
  pintar();
}

function pintar() {
  const hechos = tickets.filter(t => t.hecho).length;
  $('#barra').style.width = tickets.length ? `${(hechos / tickets.length) * 100}%` : '0';
  $('#avance-txt').textContent = tickets.length ? `${hechos} de ${tickets.length} hechos` : 'Sin pedidos todavía';
  $('#lista-estado').textContent = tickets.length ? '' : 'Todavía no hay pedidos. Cargá el primero con el formulario de arriba.';
  // Pendientes primero (el más viejo arriba), después los hechos (el último hecho arriba).
  const orden = [...tickets.filter(t => !t.hecho), ...tickets.filter(t => t.hecho).sort((a, b) => (b.hechoEn || '').localeCompare(a.hechoEn || ''))];
  $('#tickets').innerHTML = orden.map(t => `
    <li class="tk-item${t.hecho ? ' hecho' : ''}" data-id="${esc(t.id)}">
      <span class="tk-check" aria-hidden="true">${t.hecho ? '✓' : ''}</span>
      <div class="tk-cuerpo">
        <div class="tk-linea"><strong class="tk-titulo">${esc(t.titulo)}</strong><span class="tk-estado">${t.hecho ? 'Hecho' : 'Pendiente'}</span></div>
        ${t.detalle ? `<p class="tk-detalle">${esc(t.detalle)}</p>` : ''}
        <p class="tk-meta">${t.autor ? `${esc(t.autor)} · ` : ''}${esc(fecha(t.creado))}${t.hecho && t.hechoEn ? ` · hecho el ${esc(fecha(t.hechoEn))}` : ''}</p>
        ${t.nota ? `<p class="tk-nota"><b>Respuesta del equipo:</b> ${esc(t.nota)}</p>` : ''}
        ${adjuntos(t.archivos, `/api/tickets/p/${proyecto.id}/tickets/${t.id}/archivos/`)}
        ${!t.hecho && t.archivos.length < MAX_ARCHIVOS ? `<label class="secondary tk-agregar">+ Agregar archivos<input type="file" multiple data-agregar="${esc(t.id)}" hidden></label><span class="tk-agregar-estado" role="status"></span>` : ''}
      </div>
    </li>`).join('');
  activarAdjuntos($('#tickets'), token);
}

// Agregar archivos a un pedido que ya existe.
$('#tickets').addEventListener('change', async e => {
  const input = e.target.closest('[data-agregar]');
  if (!input) return;
  const t = tickets.find(x => x.id === input.dataset.agregar);
  const estado = input.closest('.tk-cuerpo').querySelector('.tk-agregar-estado');
  const lista = [...input.files];
  input.value = '';
  const problema = revisarArchivos(lista, t.archivos.length);
  if (problema) { estado.textContent = problema; return; }
  try {
    await subir(lista, `/api/tickets/p/${proyecto.id}/tickets/${t.id}/archivos`, token, (i, n) => { estado.textContent = `Subiendo ${i} de ${n}…`; });
    await cargar(); pintar();
  } catch (err) {
    estado.textContent = err.message;
    if (err.subidos?.length) { await cargar().catch(() => {}); pintar(); }
  }
});

// ---------- Pedido nuevo ----------
function pintarNuevos() {
  $('#lista-archivos').innerHTML = nuevos.map((f, i) => `<li><span>${esc(f.name)} · ${TK.peso(f.size)}</span><button type="button" class="secondary" data-quitar="${i}" aria-label="Quitar ${esc(f.name)}">Quitar</button></li>`).join('');
}
$('#archivos').onchange = e => {
  const lista = [...nuevos, ...e.target.files];
  e.target.value = '';
  const problema = revisarArchivos(lista);
  $('#archivos-error').textContent = problema || '';
  if (!problema) { nuevos = lista; pintarNuevos(); }
};
$('#lista-archivos').onclick = e => {
  const b = e.target.closest('[data-quitar]');
  if (b) { nuevos.splice(Number(b.dataset.quitar), 1); pintarNuevos(); }
};

$('#form-ticket').onsubmit = async e => {
  e.preventDefault();
  const boton = $('#btn-enviar'); boton.disabled = true;
  const estado = $('#ticket-estado'); estado.className = ''; estado.textContent = 'Guardando el pedido…';
  const autor = $('#autor').value.trim();
  escribir(CLAVE_AUTOR, autor);
  try {
    const res = await fetch(`${API}/api/tickets/p/${proyecto.id}/tickets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: $('#titulo').value, detalle: $('#detalle').value, autor }),
    });
    if (res.status === 401) { guardarAcceso(proyecto.id, null); return elegir(proyecto); }
    if (!res.ok) throw Error('No se pudo guardar el pedido. Revisá tu conexión y probá de nuevo.');
    const ticket = await res.json();
    // El pedido ya existe: si falla un archivo, no se pierde lo escrito y se puede agregar después.
    $('#titulo').value = ''; $('#detalle').value = '';
    const lista = nuevos; nuevos = []; pintarNuevos();
    try {
      if (lista.length) await subir(lista, `/api/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos`, token, (i, n) => { estado.textContent = `Subiendo archivo ${i} de ${n}…`; });
      estado.textContent = '¡Listo! Tu pedido quedó cargado.';
    } catch (err) {
      estado.className = 'tk-error';
      estado.textContent = `El pedido se cargó, pero ${err.message.charAt(0).toLowerCase() + err.message.slice(1)} Podés agregarlo desde “+ Agregar archivos”.`;
    }
    await cargar(); pintar();
  } catch (err) { estado.className = 'tk-error'; estado.textContent = err.message; }
  finally { boton.disabled = false; }
};

// ---------- Arranque ----------
(async () => {
  const id = new URLSearchParams(location.search).get('p');
  if (id) {
    try {
      const res = await fetch(`${API}/api/tickets/proyectos/${encodeURIComponent(id)}`);
      if (res.ok) return elegir(await res.json());
    } catch { /* sin conexión: cae al buscador */ }
  } else {
    const ultimo = leer(CLAVE_ULTIMO, null);
    if (ultimo?.id && tokenDe(ultimo.id)) { proyecto = ultimo; return abrir(); }
  }
  mostrar('paso-buscar');
})();
