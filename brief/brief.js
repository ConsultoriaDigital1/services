const API = window.CD_API || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3060' : 'https://api.consultoriadigital.io');
const form = document.querySelector('#brief-form');
const draftKey = 'cd_brief_draft_v1';
let files = [];
const submissionId = crypto.randomUUID();
let serviceId = 0;
function field([key, label, type = 'text', required = false]) {
  if (Array.isArray(type)) return `<fieldset class="choices field wide"><legend>${label}</legend>${type.map(v => `<label class="check"><input name="${key}" type="checkbox" value="${v}">${v}</label>`).join('')}</fieldset>`;
  return `<label class="field ${type === 'textarea' ? 'wide' : ''}"><span>${label}${required ? ' *' : ''}</span>${type === 'textarea' ? `<textarea name="${key}" maxlength="6000"></textarea>` : `<input name="${key}" type="${type}" maxlength="6000" ${required ? 'required' : ''}>`}</label>`;
}
document.querySelector('#sections').innerHTML = BRIEF_SECTIONS.map(([title, fields], i) => `<section class="card"><h2>${String(i + 1).padStart(2, '0')}. ${title}</h2><div class="fields">${fields.map(field).join('')}</div>${i === 3 ? '<div id="services"></div><button type="button" class="secondary" id="add-service">+ Agregar servicio / producto</button>' : ''}${i === 1 ? '<p>Podés adjuntar el logo al final del formulario.</p>' : ''}</section>`).join('');
function addService(value = {}) {
  const row = document.createElement('div');
  row.className = 'service';
  const prefix = `service-${serviceId++}-`;
  row.innerHTML = `<div class="fields">${field([prefix + 'nombre', 'Nombre del servicio / producto'])}${field([prefix + 'publico', 'Dirigido a'])}${field([prefix + 'descripcion', 'Descripción', 'textarea'])}</div><button class="secondary" type="button">Quitar servicio</button>`;
  for (const key of ['nombre', 'publico', 'descripcion']) row.querySelector(`[name="${prefix + key}"]`).value = value[key] || '';
  row.querySelector('button').onclick = () => { row.remove(); saveDraft(); };
  document.querySelector('#services').append(row);
}
document.querySelector('#add-service').onclick = () => {
  if (document.querySelectorAll('.service').length >= 50) return;
  addService(); saveDraft();
};
function values() {
  const data = new FormData(form);
  const respuestas = {};
  for (const [, fields] of BRIEF_SECTIONS) for (const [key, , type] of fields) respuestas[key] = Array.isArray(type) ? data.getAll(key) : data.get(key) || '';
  const servicios = [...document.querySelectorAll('.service')].map(row => Object.fromEntries(['nombre', 'descripcion', 'publico'].map(key => [key, row.querySelector(`[name$="-${key}"]`).value])));
  return { respuestas, servicios };
}
function saveDraft() {
  try {
    if (document.querySelector('#save-draft').checked) {
      localStorage.setItem(draftKey, JSON.stringify(values()));
      document.querySelector('#draft-status').textContent = 'Respuestas guardadas en este dispositivo. Los adjuntos deben seleccionarse nuevamente al volver.';
    } else { localStorage.removeItem(draftKey); document.querySelector('#draft-status').textContent = ''; }
  } catch { document.querySelector('#draft-status').textContent = 'El navegador no permite guardar el borrador. Mantené esta pestaña abierta.'; }
}
try {
  const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
  if (draft) {
    for (const [, fields] of BRIEF_SECTIONS) for (const [key, , type] of fields) {
      for (const input of form.querySelectorAll(`[name="${key}"]`)) {
        if (Array.isArray(type)) input.checked = (draft.respuestas?.[key] || []).includes(input.value);
        else input.value = draft.respuestas?.[key] || '';
      }
    }
    (draft.servicios || []).slice(0, 50).forEach(addService);
    document.querySelector('#save-draft').checked = true;
    document.querySelector('#draft-status').textContent = 'Borrador recuperado. Volvé a seleccionar los adjuntos.';
  }
} catch { /* Un borrador inválido no impide completar el formulario. */ }
if (!document.querySelector('.service')) addService();
form.addEventListener('input', saveDraft);
const previews = [];
function renderFiles() {
  previews.splice(0).forEach(url => URL.revokeObjectURL(url));
  const list = document.querySelector('#file-list');
  list.replaceChildren();
  files.forEach((file, index) => {
    const li = document.createElement('li');
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file); previews.push(img.src); img.alt = ''; li.append(img);
    }
    const name = document.createElement('span'); name.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`; li.append(name);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary'; remove.textContent = 'Quitar'; remove.setAttribute('aria-label', `Quitar ${file.name}`);
    remove.onclick = () => { files.splice(index, 1); renderFiles(); }; li.append(remove); list.append(li);
  });
}
document.querySelector('#files').onchange = e => {
  const next = [...files, ...e.target.files];
  const error = document.querySelector('#file-error');
  error.textContent = '';
  if (next.length > 8 || next.some(f => !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type) || f.size > 5 * 1024 * 1024 || !f.size) || next.reduce((n, f) => n + f.size, 0) > 15 * 1024 * 1024) error.textContent = 'Revisá los archivos: JPG, PNG, WEBP o PDF; máximo 8, hasta 5 MB cada uno y 15 MB en total.';
  else { files = next; renderFiles(); }
  e.target.value = '';
};
const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onerror = () => reject(new Error('No se pudo leer un adjunto. Volvé a seleccionarlo.'));
  reader.onload = () => resolve({ nombre: file.name, data: reader.result.split(',')[1] }); reader.readAsDataURL(file);
});
form.onsubmit = async e => {
  e.preventDefault();
  const button = document.querySelector('#submit');
  if (button.disabled) return;
  const status = document.querySelector('#status');
  button.disabled = true; status.className = ''; status.textContent = 'Enviando respuestas y adjuntos…';
  try {
    const payload = { ...values(), id: submissionId, consent: document.querySelector('#consent').checked, archivos: await Promise.all(files.map(readFile)) };
    const response = await fetch(`${API}/api/brief`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(120000) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(result.error || 'No se pudo enviar. Intentá nuevamente.');
    try { localStorage.removeItem(draftKey); } catch { /* Envío confirmado por el servidor. */ }
    form.hidden = true; document.querySelector('#success').hidden = false;
    document.querySelector('#receipt').textContent = `Referencia de tu envío: ${result.id}`;
    document.querySelector('#success').scrollIntoView();
  } catch (err) { status.className = 'error'; status.textContent = `No se confirmó el envío. ${err.message} Tus respuestas siguen acá; podés reintentar.`; }
  finally { button.disabled = false; }
};
