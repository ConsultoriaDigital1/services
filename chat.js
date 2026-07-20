// ===== Asistente de agendamiento con IA (DeepSeek) =====
// El navegador nunca ve la API key: habla con el proxy del VPS.

// 👇 CAMBIAR por el dominio real de la API (tiene que ser https, si no el navegador la bloquea)
const CHAT_API = window.CD_CHAT_API || 'https://api.consultoriadigital.io/api/chat';

const LEAD_RE = /<<<LEAD>>>([\s\S]*?)<<<FIN>>>/;
const FORMSUBMIT = 'https://formsubmit.co/ajax/gonzalo@consultoriadigital.io';

const history = [];
let sending = false;

/* ---------- Construcción del widget ---------- */

const sparkles =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 2.5 13.7 8 19 9.8l-5.3 1.7L12 17l-1.7-5.5L5 9.8 10.3 8 12 2.5Z"/>' +
  '<path d="M18.5 14.5l.85 2.65L22 18l-2.65.85-.85 2.65-.85-2.65L15 18l2.65-.85.85-2.65Z"/></svg>';

const closeIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const sendIcon =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z"/></svg>';

const widget = document.createElement('div');
widget.className = 'ai-widget';
widget.innerHTML = `
  <button type="button" class="ai-fab" data-i18n-aria-label="chat.open" aria-expanded="false">
    <span class="ai-fab-icon">${sparkles}</span>
    <span class="ai-fab-label" data-i18n="chat.fab">Agendá con IA</span>
  </button>

  <section class="ai-panel" role="dialog" aria-modal="false" data-i18n-aria-label="chat.title" hidden>
    <header class="ai-head">
      <span class="ai-avatar" aria-hidden="true">${sparkles}</span>
      <div class="ai-head-txt">
        <strong data-i18n="chat.title">Asistente de Consultoría Digital</strong>
        <span data-i18n="chat.subtitle">Te ayudo a agendar tu reunión</span>
      </div>
      <button type="button" class="ai-close" data-i18n-aria-label="chat.close">${closeIcon}</button>
    </header>

    <div class="ai-log" role="log" aria-live="polite"></div>

    <div class="ai-chips">
      <button type="button" class="ai-chip" data-i18n="chat.q1">Quiero agendar una reunión</button>
      <button type="button" class="ai-chip" data-i18n="chat.q2">¿Qué servicios ofrecen?</button>
      <button type="button" class="ai-chip" data-i18n="chat.q3">Necesito más clientes</button>
    </div>

    <form class="ai-form">
      <input type="text" class="ai-input" autocomplete="off" maxlength="1500"
             data-i18n-placeholder="chat.ph" placeholder="Escribí tu consulta…" />
      <button type="submit" class="ai-send" data-i18n-aria-label="chat.send">${sendIcon}</button>
    </form>
  </section>`;

document.body.appendChild(widget);

const fab = widget.querySelector('.ai-fab');
const panel = widget.querySelector('.ai-panel');
const log = widget.querySelector('.ai-log');
const chips = widget.querySelector('.ai-chips');
const form = widget.querySelector('.ai-form');
const input = widget.querySelector('.ai-input');

/* ---------- Burbujas ---------- */

function bubble(role, text = '') {
  const el = document.createElement('div');
  el.className = `ai-msg ai-${role}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function typing() {
  const el = bubble('bot');
  el.classList.add('ai-typing');
  el.innerHTML = '<span></span><span></span><span></span>';
  return el;
}

function greet() {
  log.innerHTML = '';
  bubble('bot', t('chat.greeting'));
  chips.hidden = false;
}

/* ---------- Envío del lead por mail ---------- */

async function enviarLead(raw) {
  let lead;
  try {
    lead = JSON.parse(raw);
  } catch {
    return; // si el modelo devolvió algo mal formado, no rompemos la charla
  }

  const data = new FormData();
  data.append('nombre', lead.nombre || '');
  data.append('contacto', lead.contacto || '');
  data.append('servicio', lead.servicio || 'No estoy seguro / Otro');
  data.append('mensaje', lead.mensaje || '');
  data.append('origen', 'Asistente IA del sitio');
  data.append('_subject', `${t('chat.leadSubject')} — ${lead.servicio || ''}`);
  data.append('_cc', 'smallkeloft@gmail.com');
  data.append('_template', 'table');
  data.append('_captcha', 'false');

  try {
    const res = await fetch(FORMSUBMIT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    bubble('note', t('chat.leadOk'));
  } catch {
    bubble('note', t('chat.leadErr'));
  }
}

/* ---------- Conversación ---------- */

async function preguntar(texto) {
  if (sending || !texto.trim()) return;
  sending = true;
  chips.hidden = true;
  input.value = '';

  bubble('user', texto);
  history.push({ role: 'user', content: texto });
  const dots = typing();

  let answer = '';
  let bot = null;

  const paint = () => {
    // El bloque del lead es interno: nunca se muestra al visitante.
    const visible = answer.replace(LEAD_RE, '').trimEnd();
    if (!bot) {
      dots.remove();
      bot = bubble('bot');
    }
    bot.textContent = visible;
    log.scrollTop = log.scrollHeight;
  };

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: document.documentElement.lang || 'es', messages: history }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
          if (delta) {
            answer += delta;
            paint();
          }
        } catch {
          /* fragmento incompleto */
        }
      }
    }

    if (!answer) throw new Error('respuesta vacía');
    history.push({ role: 'assistant', content: answer });

    const lead = answer.match(LEAD_RE);
    if (lead) await enviarLead(lead[1]);
  } catch (err) {
    dots.remove();
    if (bot) bot.remove();
    bubble('note', t('chat.error'));
  } finally {
    sending = false;
    input.focus();
  }
}

/* ---------- Eventos ---------- */

function abrir(open) {
  panel.hidden = !open;
  widget.classList.toggle('open', open);
  fab.setAttribute('aria-expanded', open);
  if (open) {
    if (!log.children.length) greet();
    input.focus();
  }
}

fab.addEventListener('click', () => abrir(panel.hidden));
widget.querySelector('.ai-close').addEventListener('click', () => abrir(false));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !panel.hidden) abrir(false);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  preguntar(input.value);
});
chips.querySelectorAll('.ai-chip').forEach(chip =>
  chip.addEventListener('click', () => preguntar(chip.textContent))
);

// Al cambiar de idioma, se reinicia la charla para no mezclar idiomas.
document.addEventListener('cd:langchange', () => {
  history.length = 0;
  if (log.children.length) greet();
});

applyTranslations();
