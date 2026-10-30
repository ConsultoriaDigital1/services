// ===== Panel de encuestas de clientes (/admin/encuestas) =====
// Comparte el token con el panel de tests: si ya entraste en /admin, acá no pide contraseña.
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
const answer = r => r ? [...r.elegidas.filter(v => v !== OTRO).map(esc), ...(r.otro ? [`<em>Otro:</em> ${esc(r.otro)}`] : [])].join('<br>') : '—';
function record(r, encuesta) {
  const when = new Date(r.actualizado || r.creado).toLocaleString('es-AR');
  const body = encuesta.secciones.map(([title, questions]) => `<h3>${esc(title)}</h3><dl>${questions.map(q => `<dt>${esc(q.texto)}</dt><dd>${answer(r.respuestas[q.id])}</dd>`).join('')}</dl>`).join('');
  return `<details class="card brief-record"><summary>${esc(r.nombre)} · ${esc(when)}${r.envios > 1 ? ` · corregida ${r.envios - 1} ${r.envios === 2 ? 'vez' : 'veces'}` : ''}</summary>${body}${r.comentarios ? `<h3>Comentarios</h3><p>${esc(r.comentarios)}</p>` : ''}</details>`;
}
function render() {
  $('#records').innerHTML = Object.entries(ENCUESTAS).map(([slug, encuesta]) => {
    const mine = records.filter(r => r.encuesta === slug);
    return `<section><h2 style="margin-top:34px">${esc(encuesta.cliente)} · ${esc(encuesta.titulo)}</h2>
      <p><a href="../../encuestas/${slug}/" target="_blank" rel="noopener">Ver la encuesta</a> · ${mine.length} ${mine.length === 1 ? 'respuesta' : 'respuestas'}
      ${mine.length ? ` · <button type="button" class="secondary" data-csv="${slug}">Exportar CSV</button>` : ''}</p>
      ${mine.map(r => record(r, encuesta)).join('')}</section>`;
  }).join('');
}
async function load() {
  $('#status').textContent = 'Cargando…';
  try { records = await (await api('/api/admin/encuestas')).json(); $('#login').hidden = true; $('#panel').hidden = false; render(); $('#status').textContent = ''; }
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
  const button = e.target.closest('[data-csv]'); if (!button) return;
  button.disabled = true;
  try {
    const url = URL.createObjectURL(await (await api(`/api/admin/encuestas/${button.dataset.csv}.csv`)).blob());
    const link = document.createElement('a');
    link.href = url; link.download = `encuesta-${button.dataset.csv}.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) { $('#status').textContent = err.message; } finally { button.disabled = false; }
};
$('#reload').onclick = load; $('#logout').onclick = logout;
if (sessionStorage.getItem(key)) load(); else logout();
