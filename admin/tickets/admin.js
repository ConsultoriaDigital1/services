// ===== Panel de tickets de clientes (/admin/tickets) =====
// Comparte el token con el resto del panel: si ya entraste en /admin, acá no pide contraseña.
const { API, esc, fecha, adjuntos, activarAdjuntos } = window.TK;
const $ = s => document.querySelector(s);
const key = 'cd_admin_token';
const token = () => sessionStorage.getItem(key) || '';
let proyectos = [];
let tickets = [];
const borradores = new Map(); // id de ticket → nota sin guardar, para no perderla al repintar

function logout() { sessionStorage.removeItem(key); proyectos = []; tickets = []; $('#proyectos').replaceChildren(); $('#panel').hidden = true; $('#login').hidden = false; }
async function api(path, opciones = {}) {
  const res = await fetch(API + path, {
    ...opciones,
    headers: { Authorization: `Bearer ${token()}`, ...(opciones.body ? { 'Content-Type': 'application/json' } : {}) },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  if (res.status === 401 || res.status === 503) { logout(); throw Error('Ingresá con la contraseña del panel.'); }
  if (res.status === 409) throw Error('Ya existe un proyecto con ese nombre.');
  if (!res.ok) throw Error('No se pudo completar la acción.');
  return res.json();
}

const linkDe = p => `${location.origin}/tickets/?p=${p.id}`;
const mensajeDe = p => `¡Hola! Para cargar pedidos y seguir el avance de *${p.nombre}* entrá a ${linkDe(p)}\nTu código de acceso es: *${p.codigo}*`;

function ticketHtml(t) {
  const nota = borradores.has(t.id) ? borradores.get(t.id) : t.nota;
  return `<li class="tk-item${t.hecho ? ' hecho' : ''}" data-ticket="${esc(t.id)}">
    <input type="checkbox" class="tk-toggle" data-hecho ${t.hecho ? 'checked' : ''} aria-label="Marcar “${esc(t.titulo)}” como hecho">
    <div class="tk-cuerpo">
      <div class="tk-linea"><strong class="tk-titulo">${esc(t.titulo)}</strong><span class="tk-estado">${t.hecho ? 'Hecho' : 'Pendiente'}</span></div>
      ${t.detalle ? `<p class="tk-detalle">${esc(t.detalle)}</p>` : ''}
      <p class="tk-meta">${t.autor ? `${esc(t.autor)} · ` : ''}${esc(fecha(t.creado))}${t.hecho && t.hechoEn ? ` · hecho el ${esc(fecha(t.hechoEn))}` : ''}</p>
      ${adjuntos(t.archivos, `/api/admin/tickets/${t.id}/archivos/`)}
      <div class="tk-nota-edit"><textarea data-nota maxlength="2000" placeholder="Respuesta para el cliente (opcional)">${esc(nota)}</textarea><button type="button" class="secondary" data-guardar-nota>Guardar nota</button></div>
      <button type="button" class="secondary tk-borrar" data-borrar>Eliminar pedido</button>
    </div>
  </li>`;
}

function render() {
  const q = $('#buscar').value.trim().toLowerCase();
  const filtroProyecto = $('#filtro-proyecto').value;
  const estado = $('#filtro-estado').value;
  const verArchivados = $('#ver-archivados').checked;

  const opciones = proyectos.filter(p => verArchivados || !p.archivado);
  $('#filtro-proyecto').innerHTML = `<option value="">Todos los proyectos</option>${opciones.map(p => `<option value="${esc(p.id)}"${p.id === filtroProyecto ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('')}`;

  const coincide = t => !q || [t.titulo, t.detalle, t.autor, t.nota].some(v => (v || '').toLowerCase().includes(q));
  const html = opciones.filter(p => !filtroProyecto || p.id === filtroProyecto).map(p => {
    const suyos = tickets.filter(t => t.proyecto === p.id);
    const hechos = suyos.filter(t => t.hecho).length;
    const delProyecto = !q || [p.nombre, p.cliente].some(v => (v || '').toLowerCase().includes(q));
    const visibles = suyos
      .filter(t => (estado === 'pendientes' ? !t.hecho : estado === 'hechos' ? t.hecho : true))
      .filter(t => delProyecto || coincide(t))
      .sort((a, b) => (a.hecho - b.hecho) || a.creado.localeCompare(b.creado));
    if (q && !delProyecto && !visibles.length) return '';
    return `<section class="card tk-adm-proyecto${p.archivado ? ' archivado' : ''}" data-proyecto="${esc(p.id)}">
      <header>
        <div><h2>${esc(p.nombre)}${p.archivado ? ' <small>(archivado)</small>' : ''}</h2>
          <p>${p.cliente ? `${esc(p.cliente)} · ` : ''}${suyos.length - hechos} pendientes · ${hechos} hechos</p>
          <p>Código: <span class="tk-codigo-ver">${esc(p.codigo)}</span></p></div>
        <div class="tk-adm-acciones">
          <button type="button" class="secondary" data-copiar>Copiar mensaje para el cliente</button>
          <a class="secondary" href="${esc(linkDe(p))}" target="_blank" rel="noopener">Abrir como cliente</a>
          <button type="button" class="secondary" data-codigo>Nuevo código</button>
          <button type="button" class="secondary" data-renombrar>Renombrar</button>
          <button type="button" class="secondary" data-archivar>${p.archivado ? 'Reactivar' : 'Archivar'}</button>
        </div>
      </header>
      ${visibles.length ? `<ul class="tk-lista">${visibles.map(ticketHtml).join('')}</ul>` : `<p>${suyos.length ? 'No hay pedidos con este filtro.' : 'El cliente todavía no cargó pedidos.'}</p>`}
    </section>`;
  }).join('');
  $('#proyectos').innerHTML = html || `<p>${proyectos.length ? 'No hay resultados con este filtro.' : 'Todavía no hay proyectos. Creá el primero arriba.'}</p>`;
  activarAdjuntos($('#proyectos'), token);
}

async function load() {
  $('#status').textContent = 'Cargando…';
  try {
    ({ proyectos, tickets } = await api('/api/admin/tickets'));
    $('#login').hidden = true; $('#panel').hidden = false; render();
    const pendientes = tickets.filter(t => !t.hecho && !proyectos.find(p => p.id === t.proyecto)?.archivado).length;
    $('#status').textContent = `${pendientes} ${pendientes === 1 ? 'pedido pendiente' : 'pedidos pendientes'} en ${proyectos.filter(p => !p.archivado).length} proyectos activos`;
  } catch (err) { $('#status').textContent = err.message; }
}

$('#login').onsubmit = async e => {
  e.preventDefault();
  try {
    const res = await fetch(API + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#password').value }) });
    if (!res.ok) throw Error('No se pudo ingresar. Revisá la contraseña o intentá más tarde.');
    sessionStorage.setItem(key, (await res.json()).token); $('#password').value = ''; await load();
  } catch (err) { $('#status').textContent = err.message; }
};

$('#nuevo').onsubmit = async e => {
  e.preventDefault();
  const estado = $('#nuevo-estado');
  try {
    const p = await api('/api/admin/tickets/proyectos', { method: 'POST', body: { nombre: $('#nuevo-nombre').value, cliente: $('#nuevo-cliente').value } });
    proyectos.push(p); proyectos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    $('#nuevo').reset();
    estado.textContent = `Proyecto creado. Código: ${p.codigo}. Usá “Copiar mensaje para el cliente” para mandárselo.`;
    render(); // primero aparece en el selector, después se lo deja elegido
    $('#filtro-proyecto').value = p.id; render();
  } catch (err) { estado.textContent = err.message; }
};

const actualizarTicket = t => { tickets = tickets.map(x => (x.id === t.id ? t : x)); };
const actualizarProyecto = p => { proyectos = proyectos.map(x => (x.id === p.id ? p : x)); };

$('#proyectos').addEventListener('input', e => {
  if (e.target.matches('[data-nota]')) borradores.set(e.target.closest('[data-ticket]').dataset.ticket, e.target.value);
});

$('#proyectos').addEventListener('change', async e => {
  if (!e.target.matches('[data-hecho]')) return;
  const caja = e.target;
  const id = caja.closest('[data-ticket]').dataset.ticket;
  caja.disabled = true;
  try { actualizarTicket(await api(`/api/admin/tickets/${id}`, { method: 'PATCH', body: { hecho: caja.checked } })); render(); }
  catch (err) { caja.checked = !caja.checked; caja.disabled = false; $('#status').textContent = err.message; }
});

$('#proyectos').addEventListener('click', async e => {
  const boton = e.target.closest('button');
  if (!boton) return;
  const idTicket = boton.closest('[data-ticket]')?.dataset.ticket;
  const p = proyectos.find(x => x.id === boton.closest('[data-proyecto]')?.dataset.proyecto);
  try {
    if (boton.matches('[data-guardar-nota]')) {
      boton.disabled = true;
      const nota = boton.parentElement.querySelector('textarea').value;
      actualizarTicket(await api(`/api/admin/tickets/${idTicket}`, { method: 'PATCH', body: { nota } }));
      borradores.delete(idTicket); render();
      $('#status').textContent = 'Nota guardada: el cliente la ve en su checklist.';
    } else if (boton.matches('[data-borrar]')) {
      if (!confirm('¿Eliminar este pedido? El cliente deja de verlo.')) return;
      await api(`/api/admin/tickets/${idTicket}`, { method: 'PATCH', body: { borrado: true } });
      tickets = tickets.filter(t => t.id !== idTicket); render();
    } else if (boton.matches('[data-copiar]')) {
      await navigator.clipboard.writeText(mensajeDe(p));
      boton.textContent = '¡Copiado!'; setTimeout(() => { boton.textContent = 'Copiar mensaje para el cliente'; }, 1800);
    } else if (boton.matches('[data-codigo]')) {
      if (!confirm(`¿Generar un código nuevo para “${p.nombre}”? El actual deja de funcionar y el cliente tendrá que ingresar el nuevo.`)) return;
      actualizarProyecto(await api(`/api/admin/tickets/proyectos/${p.id}`, { method: 'PATCH', body: { nuevoCodigo: true } })); render();
    } else if (boton.matches('[data-renombrar]')) {
      const nombre = prompt('Nombre del proyecto', p.nombre);
      if (nombre === null) return;
      const cliente = prompt('Cliente / empresa', p.cliente || '');
      if (cliente === null) return;
      actualizarProyecto(await api(`/api/admin/tickets/proyectos/${p.id}`, { method: 'PATCH', body: { nombre, cliente } })); render();
    } else if (boton.matches('[data-archivar]')) {
      if (!p.archivado && !confirm(`¿Archivar “${p.nombre}”? El cliente ya no podrá entrar ni encontrarlo en el buscador.`)) return;
      actualizarProyecto(await api(`/api/admin/tickets/proyectos/${p.id}`, { method: 'PATCH', body: { archivado: !p.archivado } })); render();
    }
  } catch (err) { $('#status').textContent = err.message; boton.disabled = false; }
});

for (const id of ['#buscar', '#filtro-proyecto', '#filtro-estado', '#ver-archivados']) $(id).addEventListener('input', render);
$('#reload').onclick = load; $('#logout').onclick = logout;
if (token()) load(); else logout();
