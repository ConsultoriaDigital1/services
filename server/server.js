// ===== Proxy de DeepSeek para el asistente de Consultoría Digital =====
// La API key vive solo acá (en .env), nunca en el navegador.

require('dotenv').config();
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { systemPrompt, diagnosticPrompt } = require('./knowledge');
const store = require('./store');
const auth = require('./auth');
const { dispararN8N, normalizarWhatsapp } = require('./n8n');

const PORT = process.env.PORT || 3060;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://consultoriadigital.io')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

if (!API_KEY) {
  console.error('Falta DEEPSEEK_API_KEY en el archivo .env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // detrás de nginx
app.use(express.json({ limit: '64kb' }));
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('Origen no permitido')),
  })
);

// ---- Límite de uso por IP (protege el crédito de la API) ----
const WINDOW_MS = 60 * 60 * 1000; // 1 hora
// En eventos presenciales todos comparten la IP pública del WiFi: subir MAX_REQUESTS en el .env.
const MAX_REQUESTS = Number(process.env.MAX_REQUESTS) || 40;

// Cada límite lleva su propio contador: si el chat y los envíos del test compartieran
// uno solo, en un evento un visitante charlatán le comería el cupo de envío a otro.
function crearRateLimit(max) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (now > entry.reset) hits.delete(ip);
  }, WINDOW_MS).unref();

  return function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.reset) {
      hits.set(ip, { count: 1, reset: now + WINDOW_MS });
      return next();
    }
    if (entry.count >= max) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    entry.count++;
    next();
  };
}

const limiteChat = crearRateLimit(MAX_REQUESTS);
const limiteTest = crearRateLimit(Number(process.env.MAX_TESTS) || 60);
const limiteLogin = crearRateLimit(Number(process.env.MAX_LOGINS) || 20);

// ---- Validación del cuerpo del pedido ----
const MAX_TURNS = 20;
const MAX_CHARS = 1500;

function sanitize(body) {
  const lang = ['es', 'en', 'pt'].includes(body.lang) ? body.lang : 'es';
  const mode = body.mode === 'diagnostico' ? 'diagnostico' : 'chat';
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  return { lang, mode, messages: clean };
}

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    model: MODEL,
    admin: auth.activo,
    n8n: Boolean(process.env.N8N_WEBHOOK_URL),
    tests: store.listar().length,
  })
);

app.post('/api/chat', limiteChat, async (req, res) => {
  const { lang, mode, messages } = sanitize(req.body || {});
  if (!messages.length) return res.status(400).json({ error: 'sin_mensajes' });

  // El test de automatización (/test) usa otro rol: devuelve un diagnóstico, no conversa.
  const system = mode === 'diagnostico' ? diagnosticPrompt(lang) : systemPrompt(lang);

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  let upstream;
  try {
    upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.6,
        max_tokens: 700,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
  } catch (err) {
    if (controller.signal.aborted) return;
    console.error('DeepSeek inalcanzable:', err.message);
    return res.status(502).json({ error: 'upstream_no_disponible' });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    console.error('DeepSeek respondió', upstream.status, detail.slice(0, 300));
    return res.status(502).json({ error: 'upstream_error' });
  }

  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // que nginx no bufferee el stream
  });
  res.flushHeaders();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // la última puede estar incompleta

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();

        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        } catch {
          /* fragmento no parseable: lo ignoramos */
        }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (!controller.signal.aborted) console.error('Error leyendo el stream:', err.message);
    res.end();
  }
});

// ===================== Test de automatización (/test) =====================

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ESPERA_IA = Number(process.env.N8N_ESPERA_IA_MS) || 25000;

const texto = (v, max) => String(v ?? '').trim().slice(0, max);
const numero = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : 0;
};
const entero = (v, min, max) => Math.round(numero(v, min, max));
const lista = (v, max, fn) => (Array.isArray(v) ? v.filter(Boolean).slice(0, max).map(fn) : []);

// Nada de lo que llega del navegador se guarda tal cual: todo acotado en tipo y largo.
function sanitizarTest(body) {
  const c = body.contacto || {};
  const r = body.resultado || {};

  const contacto = {
    nombre: texto(c.nombre, 120),
    whatsapp: texto(c.whatsapp, 40),
    email: texto(c.email, 160),
    empresa: texto(c.empresa, 160),
  };
  if (!contacto.nombre || !contacto.whatsapp || !EMAIL.test(contacto.email)) return null;

  // Se normaliza una sola vez acá para que el panel y n8n usen exactamente el mismo número.
  contacto.whatsappE164 = normalizarWhatsapp(contacto.whatsapp);

  return {
    contacto,
    resultado: {
      score: entero(r.score, 0, 100),
      nivel: texto(r.nivel, 60),
      nivelTxt: texto(r.nivelTxt, 900),
      horasMes: entero(r.horasMes, 0, 10000),
      semanasMes: numero(r.semanasMes, 0, 1000),
      costoMes: entero(r.costoMes, 0, 1e12),
      costoMesTxt: texto(r.costoMesTxt, 40),
      valorHora: entero(r.valorHora, 0, 1e9),
    },
    oportunidades: lista(body.oportunidades, 5, o => ({
      nombre: texto(o.nombre, 80),
      horasMes: entero(o.horasMes, 0, 10000),
      que: texto(o.que, 400),
      url: texto(o.url, 200),
    })),
    respuestas: lista(body.respuestas, 20, (a, i) => ({
      n: i + 1,
      pregunta: texto(a.pregunta, 200),
      respuesta: texto(a.respuesta, 200),
      puntos: entero(a.puntos, 0, 10),
      horasSemana: numero(a.horasSemana, 0, 100),
    })),
    plan: lista(body.plan, 6, p => ({ cuando: texto(p.cuando, 60), que: texto(p.que, 600) })),
  };
}

// Disparos a n8n que están esperando la lectura de IA, por id.
const esperando = new Map();

async function dispararYGuardar(id) {
  const timer = esperando.get(id);
  if (timer) {
    clearTimeout(timer);
    esperando.delete(id);
  }

  const reg = store.obtener(id);
  if (!reg || reg.n8n?.ok) return null;

  const n8n = await dispararN8N(reg);
  return store.actualizar(id, { n8n });
}

// La lectura de IA llega por streaming después de pintar el resultado, así que esperamos
// a que termine para que el PDF salga completo. El tope cubre a quien cierra la pestaña.
function programarDisparo(id) {
  const timer = setTimeout(() => {
    dispararYGuardar(id).catch(err => console.error('Disparo diferido falló:', err.message));
  }, ESPERA_IA);
  timer.unref();
  esperando.set(id, timer);
}

app.post('/api/test', limiteTest, async (req, res) => {
  const limpio = sanitizarTest(req.body || {});
  if (!limpio) return res.status(400).json({ error: 'datos_incompletos' });

  const reg = {
    id: crypto.randomUUID(),
    creado: new Date().toISOString(),
    ip: req.ip,
    ua: texto(req.get('user-agent'), 300),
    ...limpio,
    lecturaIa: null,
    n8n: null,
  };

  try {
    await store.guardar(reg);
  } catch (err) {
    console.error('No se pudo guardar el test:', err.message);
    return res.status(500).json({ error: 'no_guardado' });
  }

  programarDisparo(reg.id);
  res.status(201).json({ id: reg.id });
});

app.post('/api/test/:id/lectura', limiteTest, async (req, res) => {
  if (!store.obtener(req.params.id)) return res.status(404).json({ error: 'no_encontrado' });

  const lectura = texto(req.body?.lectura, 4000);
  try {
    await store.actualizar(req.params.id, { lecturaIa: lectura || null });
  } catch (err) {
    console.error('No se pudo guardar la lectura:', err.message);
  }

  // El navegador no espera al webhook: ya mostró el resultado y se puede ir.
  res.json({ ok: true });
  dispararYGuardar(req.params.id).catch(err => console.error('Disparo falló:', err.message));
});

// ===================== Panel /admin =====================

app.post('/api/admin/login', limiteLogin, (req, res) => {
  if (!auth.activo) return res.status(503).json({ error: 'admin_sin_configurar' });
  if (!auth.verificarPassword(req.body?.password || '')) {
    return res.status(401).json({ error: 'password_incorrecta' });
  }
  res.json(auth.emitirToken());
});

app.get('/api/admin/tests', auth.soloAdmin, (_req, res) => res.json(store.listar()));

app.post('/api/admin/tests/:id/reenviar', auth.soloAdmin, async (req, res) => {
  const reg = store.obtener(req.params.id);
  if (!reg) return res.status(404).json({ error: 'no_encontrado' });

  const n8n = await dispararN8N(reg);
  await store.actualizar(reg.id, { n8n });
  res.json({ n8n });
});

const COLUMNAS = [
  ['fecha', r => r.creado],
  ['nombre', r => r.contacto.nombre],
  ['empresa', r => r.contacto.empresa],
  ['whatsapp', r => r.contacto.whatsapp],
  ['email', r => r.contacto.email],
  ['score', r => r.resultado.score],
  ['nivel', r => r.resultado.nivel],
  ['horas_mes', r => r.resultado.horasMes],
  ['semanas_mes', r => r.resultado.semanasMes],
  ['costo_mes', r => r.resultado.costoMes],
  ['prioridad', r => r.oportunidades[0]?.nombre || ''],
  ['n8n', r => (r.n8n ? (r.n8n.ok ? 'ok' : 'error') : 'pendiente')],
];

const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

app.get('/api/admin/tests.csv', auth.soloAdmin, (_req, res) => {
  const filas = [
    COLUMNAS.map(([nombre]) => celda(nombre)).join(','),
    ...store.listar().map(r => COLUMNAS.map(([, leer]) => celda(leer(r))).join(',')),
  ];

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="tests-consultoria-digital.csv"',
  });
  res.send('﻿' + filas.join('\n')); // BOM para que Excel respete los acentos
});

const cargados = store.cargar();
console.log(`${cargados} test(s) en ${store.ARCHIVO}`);
if (!auth.activo) console.warn('Sin ADMIN_PASSWORD: el panel /admin queda deshabilitado');

app.listen(PORT, () => console.log(`cd-chat-api escuchando en el puerto ${PORT}`));
