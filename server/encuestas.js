// ===== Encuestas para clientes (/encuestas/<cliente>/) =====
// Mismo esquema que partners: JSON-lines append-only, gana la última línea por id.
// El id lo genera el navegador y lo recuerda: si el cliente vuelve y corrige, se
// actualiza su respuesta en vez de duplicarla.

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const auth = require('./auth');
const { ENCUESTAS, OTRO } = require('../encuestas/schema');

const DIR = path.resolve(__dirname, process.env.DATA_DIR || './data');
const ARCHIVO = path.join(DIR, 'encuestas.jsonl');
const UUID = /^[a-f0-9-]{36}$/;

const registros = new Map(); // id → respuesta

function cargar() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(ARCHIVO)) return 0;
  for (const linea of fs.readFileSync(ARCHIVO, 'utf8').split('\n')) {
    if (!linea.trim()) continue;
    try {
      const reg = JSON.parse(linea);
      if (reg?.id) registros.set(reg.id, reg);
    } catch {
      /* línea cortada por un corte de luz: se saltea */
    }
  }
  return registros.size;
}

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const preguntasDe = encuesta => encuesta.secciones.flatMap(([, preguntas]) => preguntas);

/** Las respuestas limpias, o null si falta algo o trae opciones que no existen. */
function validar(slug, body) {
  const encuesta = ENCUESTAS[slug];
  if (!encuesta || !UUID.test(body?.id || '')) return null;
  const nombre = texto(body.nombre, 120);
  if (!nombre) return null;
  const respuestas = {};
  for (const pregunta of preguntasDe(encuesta)) {
    const dada = body.respuestas?.[pregunta.id];
    const elegidas = Array.isArray(dada?.elegidas) ? [...new Set(dada.elegidas)] : [];
    const otro = texto(dada?.otro, 2000);
    if (!elegidas.length || elegidas.some(v => v !== OTRO && !pregunta.opciones.includes(v))) return null;
    if (!pregunta.multiple && elegidas.length > 1) return null;
    if (elegidas.includes(OTRO) && !otro) return null;
    respuestas[pregunta.id] = { elegidas, otro: elegidas.includes(OTRO) ? otro : '' };
  }
  return { id: body.id, encuesta: slug, nombre, respuestas, comentarios: texto(body.comentarios, 6000) };
}

const router = express.Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const hits = new Map();
setInterval(() => {
  for (const [ip, v] of hits) if (v.hasta < Date.now()) hits.delete(ip);
}, 60000).unref();

function limite(req, res, next) {
  let hit = hits.get(req.ip);
  if (!hit || hit.hasta < Date.now()) {
    hit = { cuenta: 0, hasta: Date.now() + 3600000 };
    hits.set(req.ip, hit);
  }
  if (++hit.cuenta > (Number(process.env.MAX_ENCUESTAS) || 30)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  next();
}

router.post('/encuestas/:slug', limite, express.json({ limit: '64kb' }), async (req, res) => {
  const datos = validar(req.params.slug, req.body);
  if (!datos) return res.status(400).json({ error: 'datos_incompletos' });

  const ahora = new Date().toISOString();
  const previo = registros.get(datos.id);
  if (previo && previo.encuesta !== datos.encuesta) return res.status(400).json({ error: 'datos_incompletos' });
  const reg = previo
    ? { ...previo, ...datos, actualizado: ahora, envios: (previo.envios || 1) + 1 }
    : { creado: ahora, ...datos, envios: 1 };
  reg.ip = req.ip;
  reg.ua = texto(req.get('user-agent'), 300);

  try {
    await fsp.mkdir(DIR, { recursive: true });
    await fsp.appendFile(ARCHIVO, JSON.stringify(reg) + '\n', 'utf8');
  } catch (err) {
    console.error('No se pudo guardar la encuesta:', err.message);
    return res.status(500).json({ error: 'no_guardado' });
  }
  registros.set(reg.id, reg);
  res.status(previo ? 200 : 201).json({ id: reg.id });
});

const listar = slug => [...registros.values()]
  .filter(r => !slug || r.encuesta === slug)
  .sort((a, b) => (b.actualizado || b.creado).localeCompare(a.actualizado || a.creado));

router.get('/admin/encuestas', auth.soloAdmin, (_req, res) => res.json(listar()));

const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
const leida = r => [...r.elegidas.filter(v => v !== OTRO), ...(r.otro ? [`Otro: ${r.otro}`] : [])].join(' · ');

router.get('/admin/encuestas/:slug.csv', auth.soloAdmin, (req, res) => {
  const encuesta = ENCUESTAS[req.params.slug];
  if (!encuesta) return res.status(404).json({ error: 'no_existe' });
  const preguntas = preguntasDe(encuesta);
  const filas = [
    ['fecha', 'nombre', ...preguntas.map(p => p.texto), 'comentarios'].map(celda).join(','),
    ...listar(req.params.slug).map(r => [r.actualizado || r.creado, r.nombre, ...preguntas.map(p => (r.respuestas[p.id] ? leida(r.respuestas[p.id]) : '')), r.comentarios].map(celda).join(',')),
  ];
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="encuesta-${req.params.slug}.csv"`,
  });
  res.send('﻿' + filas.join('\n')); // BOM para que Excel respete los acentos
});

router.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: 'no_procesado' });
});

module.exports = { router, cargar, validar, ARCHIVO };
