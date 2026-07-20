// ===== Proxy de DeepSeek para el asistente de Consultoría Digital =====
// La API key vive solo acá (en .env), nunca en el navegador.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { systemPrompt } = require('./knowledge');

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
const MAX_REQUESTS = 40;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  entry.count++;
  next();
}

// Limpieza periódica del mapa de IPs
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (now > entry.reset) hits.delete(ip);
}, WINDOW_MS).unref();

// ---- Validación del cuerpo del pedido ----
const MAX_TURNS = 20;
const MAX_CHARS = 1500;

function sanitize(body) {
  const lang = ['es', 'en', 'pt'].includes(body.lang) ? body.lang : 'es';
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  return { lang, messages: clean };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.post('/api/chat', rateLimit, async (req, res) => {
  const { lang, messages } = sanitize(req.body || {});
  if (!messages.length) return res.status(400).json({ error: 'sin_mensajes' });

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
        messages: [{ role: 'system', content: systemPrompt(lang) }, ...messages],
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

app.listen(PORT, () => console.log(`cd-chat-api escuchando en el puerto ${PORT}`));
