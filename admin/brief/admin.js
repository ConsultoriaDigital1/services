const API = window.CD_API || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3060' : 'https://api.consultoriadigital.io');
const $ = s => document.querySelector(s);
const key = 'cd_admin_token';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let records = [];
function logout() { sessionStorage.removeItem(key); records = []; $('#records').replaceChildren(); $('#panel').hidden = true; $('#login').hidden = false; }
async function api(path) {
  const res = await fetch(API + path, { headers: { Authorization: `Bearer ${sessionStorage.getItem(key) || ''}` } });
  if (res.status === 401 || res.status === 503) { logout(); throw Error('Ingresá con la contraseña del panel.'); }
  if (!res.ok) throw Error('No se pudo cargar la información.');
  return res;
}
function render() {
  const query = $('#search').value.toLowerCase();
  const visible = records.filter(r => [r.respuestas.empresa, r.respuestas.responsable, r.respuestas.email].some(v => v.toLowerCase().includes(query)));
  $('#records').innerHTML = visible.map(r => `<details class="card brief-record"><summary>${esc(r.respuestas.empresa)} · ${esc(new Date(r.creado).toLocaleString('es-AR'))}</summary><p>${esc(r.respuestas.responsable)} · ${esc(r.respuestas.email)}</p><p>Referencia: ${esc(r.id)}</p>${BRIEF_SECTIONS.map(([title, fields], i) => `<h2>${esc(title)}</h2><dl>${fields.map(([k, label]) => `<dt>${esc(label)}</dt><dd>${esc(Array.isArray(r.respuestas[k]) ? r.respuestas[k].join(', ') : r.respuestas[k]) || '—'}</dd>`).join('')}</dl>${i === 3 ? r.servicios.map(s => `<p><strong>${esc(s.nombre)}</strong><br>${esc(s.descripcion)}<br>Dirigido a: ${esc(s.publico)}</p>`).join('') : ''}`).join('')}<h2>Adjuntos</h2>${r.archivos.map((f, i) => `<button class="secondary" data-id="${esc(r.id)}" data-index="${i}">${esc(f.nombre)}</button>`).join('') || '<p>Sin adjuntos</p>'}</details>`).join('') || '<p>No hay briefs para mostrar.</p>';
}
async function load() {
  $('#status').textContent = 'Cargando…';
  try { records = await (await api('/api/admin/briefs')).json(); $('#login').hidden = true; $('#panel').hidden = false; render(); $('#status').textContent = `${records.length} briefs recibidos`; }
  catch (err) { $('#status').textContent = err.message; }
}
$('#login').onsubmit = async e => {
  e.preventDefault();
  try {
    const res = await fetch(API + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#password').value }) });
    if (!res.ok) throw Error('No se pudo ingresar. Revisá la contraseña o intentá más tarde.');
    sessionStorage.setItem(key, (await res.json()).token); $('#password').value = ''; await load();
  } catch (err) { $('#status').textContent = err.message; }
};
$('#records').onclick = async e => {
  const button = e.target.closest('[data-id]'); if (!button) return;
  button.disabled = true;
  try {
    const res = await api(`/api/admin/briefs/${button.dataset.id}/archivos/${button.dataset.index}`);
    const url = URL.createObjectURL(await res.blob()); const link = document.createElement('a');
    link.href = url; link.download = button.textContent; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) { $('#status').textContent = err.message; } finally { button.disabled = false; }
};
$('#search').oninput = render; $('#reload').onclick = load; $('#logout').onclick = logout;
if (sessionStorage.getItem(key)) load(); else logout();
