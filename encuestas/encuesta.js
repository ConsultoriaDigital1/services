// ===== Encuesta para un cliente (/encuestas/<cliente>/) =====
// Arma el formulario desde encuestas/schema.js. Lo que se va completando queda en
// este navegador, junto con el id de la respuesta: si el cliente vuelve y la
// corrige, el servidor actualiza la misma en vez de sumar otra.

const API = window.CD_API || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3060' : 'https://api.consultoriadigital.io');
const slug = document.body.dataset.encuesta;
const encuesta = ENCUESTAS[slug];
const $ = sel => document.querySelector(sel);
const form = $('#encuesta-form');
const claveBorrador = `cd_encuesta_${slug}_v1`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const preguntas = encuesta.secciones.flatMap(([, lista]) => lista);

let guardado = {};
try { guardado = JSON.parse(localStorage.getItem(claveBorrador) || '{}') || {}; } catch { /* sin borrador */ }
const id = guardado.id || crypto.randomUUID();

document.title = `${encuesta.titulo} — ${encuesta.cliente}`;
$('#titulo').textContent = encuesta.titulo;
$('#cliente').textContent = encuesta.cliente;
$('#intro').textContent = encuesta.intro;

let numero = 0;
function pregunta(p) {
  numero += 1;
  const tipo = p.multiple ? 'checkbox' : 'radio';
  const opciones = [...p.opciones, OTRO].map(op => `<label class="opcion"><input type="${tipo}" name="${p.id}" value="${esc(op)}"><span>${op === OTRO ? 'Otro' : esc(op)}</span></label>`).join('');
  return `<fieldset class="pregunta" data-id="${p.id}"><legend><b>${numero}.</b> ${esc(p.texto)}</legend>${p.ayuda ? `<p class="ayuda">${esc(p.ayuda)}</p>` : ''}
    <div class="opciones">${opciones}</div>
    <label class="otro" hidden><span class="sr-only">Escribí tu respuesta</span><textarea name="${p.id}__otro" maxlength="2000" rows="2" placeholder="Escribí tu respuesta…"></textarea></label>
    <p class="falta" hidden>Elegí una opción${p.multiple ? ' o más' : ''}.</p></fieldset>`;
}
$('#secciones').innerHTML = encuesta.secciones.map(([titulo, lista]) => `<section class="card"><h2>${esc(titulo)}</h2>${lista.map(pregunta).join('')}</section>`).join('');

/** Muestra el texto de "Otro" sólo cuando está elegido. */
function mostrarOtro(fieldset) {
  const elegido = fieldset.querySelector(`input[value="${OTRO}"]`).checked;
  const caja = fieldset.querySelector('.otro');
  caja.hidden = !elegido;
  caja.querySelector('textarea').required = elegido;
}

function valores() {
  const data = new FormData(form);
  const respuestas = Object.fromEntries(preguntas.map(p => [p.id, { elegidas: data.getAll(p.id), otro: String(data.get(`${p.id}__otro`) || '') }]));
  return { id, nombre: String(data.get('nombre') || ''), respuestas, comentarios: String(data.get('comentarios') || '') };
}

function avance() {
  const { respuestas } = valores();
  const listas = preguntas.filter(p => respuestas[p.id].elegidas.length).length;
  $('#avance').textContent = `${listas} de ${preguntas.length} respondidas`;
  $('#barra').style.width = `${(listas / preguntas.length) * 100}%`;
}

function guardar() {
  try { localStorage.setItem(claveBorrador, JSON.stringify(valores())); } catch { /* sin almacenamiento: se completa igual */ }
}

// Lo que ya se había completado en este dispositivo.
if (guardado.respuestas) {
  form.elements.nombre.value = guardado.nombre || '';
  form.elements.comentarios.value = guardado.comentarios || '';
  for (const p of preguntas) {
    const dada = guardado.respuestas[p.id] || {};
    for (const input of form.querySelectorAll(`input[name="${p.id}"]`)) input.checked = (dada.elegidas || []).includes(input.value);
    form.elements[`${p.id}__otro`].value = dada.otro || '';
  }
  if (guardado.enviada) $('#ya-enviada').hidden = false;
}
form.querySelectorAll('.pregunta').forEach(mostrarOtro);
avance();

form.addEventListener('change', e => {
  const fieldset = e.target.closest('.pregunta');
  if (fieldset) { mostrarOtro(fieldset); fieldset.querySelector('.falta').hidden = true; fieldset.classList.remove('incompleta'); }
  if (!form.querySelector('.incompleta')) $('#estado').textContent = '';
  avance(); guardar();
});
form.addEventListener('input', guardar);

form.onsubmit = async e => {
  e.preventDefault();
  const boton = $('#enviar');
  if (boton.disabled) return;
  const estado = $('#estado');
  const datos = valores();

  // Cada pregunta necesita una opción; "Otro", además, el texto.
  let primera = null;
  for (const p of preguntas) {
    const fieldset = form.querySelector(`.pregunta[data-id="${p.id}"]`);
    const r = datos.respuestas[p.id];
    const falta = !r.elegidas.length || (r.elegidas.includes(OTRO) && !r.otro.trim());
    fieldset.querySelector('.falta').hidden = !falta;
    fieldset.querySelector('.falta').textContent = r.elegidas.length ? 'Escribí tu respuesta en «Otro».' : `Elegí una opción${p.multiple ? ' o más' : ''}.`;
    fieldset.classList.toggle('incompleta', falta);
    if (falta && !primera) primera = fieldset;
  }
  if (!datos.nombre.trim()) primera ??= form.elements.nombre;
  if (primera) {
    estado.className = 'error';
    estado.textContent = 'Faltan respuestas: están marcadas en rojo.';
    primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  boton.disabled = true; estado.className = ''; estado.textContent = 'Enviando…';
  try {
    const res = await fetch(`${API}/api/encuestas/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos), signal: AbortSignal.timeout(30000) });
    if (res.status === 429) throw Error('Hubo demasiados envíos seguidos. Probá en un rato.');
    if (!res.ok) throw Error('No se pudo enviar. Revisá las respuestas y probá de nuevo.');
    try { localStorage.setItem(claveBorrador, JSON.stringify({ ...datos, enviada: true })); } catch { /* ya está en el servidor */ }
    form.hidden = true; $('#gracias').hidden = false; $('#gracias').scrollIntoView();
  } catch (err) {
    estado.className = 'error';
    estado.textContent = err.name === 'TimeoutError' ? 'El servidor no respondió. Tus respuestas siguen acá: probá de nuevo.' : err.message;
  } finally { boton.disabled = false; }
};

$('#corregir').onclick = () => { $('#gracias').hidden = true; form.hidden = false; $('#ya-enviada').hidden = false; window.scrollTo(0, 0); };
