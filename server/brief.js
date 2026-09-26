const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const auth = require('./auth');
const sections = require('../brief/schema');
const DIR = path.resolve(__dirname, process.env.DATA_DIR || './data', 'briefs');
const MB = 1024 * 1024;
const UUID = /^[a-f0-9-]{36}$/;

function validar(body) {
  if (!body || body.consent !== true || !UUID.test(body.id || '')) throw Error('Datos incompletos.');
  const respuestas = {};
  for (const [, fields] of sections) for (const [key, label, type, required] of fields) {
    const value = body.respuestas?.[key];
    if (Array.isArray(type)) {
      if (value !== undefined && (!Array.isArray(value) || value.some(v => !type.includes(v)))) throw Error(`Revisá ${label}.`);
      respuestas[key] = [...new Set(value || [])];
    } else {
      if (value !== undefined && typeof value !== 'string') throw Error(`Revisá ${label}.`);
      const text = (value || '').trim();
      if (text.length > 6000 || (required && !text)) throw Error(`Revisá ${label}.`);
      if (text && type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text)) throw Error(`Revisá ${label}.`);
      if (text && type === 'url' && !/^https?:\/\/\S+$/i.test(text)) throw Error(`Revisá ${label}.`);
      respuestas[key] = text;
    }
  }
  if (!Array.isArray(body.servicios) || body.servicios.length > 50) throw Error('Máximo 50 servicios.');
  const servicios = body.servicios.map(s => {
    const out = {};
    for (const k of ['nombre', 'descripcion', 'publico']) {
      if (typeof s?.[k] !== 'string' || s[k].length > 6000) throw Error('Revisá los servicios.');
      out[k] = s[k].trim();
    }
    return out;
  }).filter(s => Object.values(s).some(Boolean));
  if (!Array.isArray(body.archivos) || body.archivos.length > 8) throw Error('Máximo 8 adjuntos.');
  let total = 0;
  const archivos = body.archivos.map(f => {
    if (typeof f?.data !== 'string' || f.data.length > 7 * MB || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.data)) throw Error('Adjunto inválido.');
    const bytes = Buffer.from(f.data, 'base64');
    total += bytes.length;
    if (!bytes.length || bytes.length > 5 * MB || total > 15 * MB) throw Error('Los adjuntos superan el límite.');
    let tipo;
    if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) tipo = 'image/png';
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) tipo = 'image/jpeg';
    else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') tipo = 'image/webp';
    else if (bytes.toString('ascii', 0, 5) === '%PDF-') tipo = 'application/pdf';
    if (!tipo) throw Error('Solo se admiten JPG, PNG, WEBP y PDF.');
    const nombre = String(f.nombre || 'adjunto').replace(/[\x00-\x1f<>:"/\\|?*]/g, '_').slice(0, 160);
    return { nombre, tipo, bytes };
  });
  return { respuestas, servicios, archivos };
}

const router = express.Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const hits = new Map();
setInterval(() => { for (const [ip, v] of hits) if (v.until < Date.now()) hits.delete(ip); }, 60000).unref();
router.post('/brief', (req, res, next) => {
  let hit = hits.get(req.ip);
  if (!hit || hit.until < Date.now()) { hit = { count: 0, until: Date.now() + 3600000 }; hits.set(req.ip, hit); }
  if (++hit.count > 10) return res.status(429).json({ error: 'Demasiados envíos. Intentá más tarde.' });
  next();
}, express.json({ limit: '22mb' }), async (req, res) => {
  let clean;
  try { clean = validar(req.body); } catch (err) { return res.status(400).json({ error: err.message }); }
  // El mismo id permite reintentar un envío sin duplicar sus archivos.
  const target = path.join(DIR, req.body.id);
  const temp = path.join(DIR, '.tmp-' + crypto.randomUUID());
  try {
    await fs.mkdir(DIR, { recursive: true });
    try { await fs.access(path.join(target, 'brief.json')); return res.status(200).json({ id: req.body.id }); } catch (err) { if (err.code !== 'ENOENT') throw err; }
    await fs.mkdir(temp);
    const archivos = [];
    for (const [index, f] of clean.archivos.entries()) {
      await fs.writeFile(path.join(temp, String(index)), f.bytes, { flag: 'wx' });
      archivos.push({ nombre: f.nombre, tipo: f.tipo, size: f.bytes.length });
    }
    const record = { id: req.body.id, creado: new Date().toISOString(), version: 1, consent: true, respuestas: clean.respuestas, servicios: clean.servicios, archivos };
    await fs.writeFile(path.join(temp, 'brief.json'), JSON.stringify(record), { flag: 'wx' });
    try { await fs.rename(temp, target); } catch (err) {
      // Una solicitud concurrente con el mismo id puede haber terminado primero.
      await fs.access(path.join(target, 'brief.json'));
    }
    res.status(201).json({ id: record.id });
  } catch (err) {
    console.error('No se pudo guardar el brief:', err.message);
    res.status(500).json({ error: 'No se pudo guardar. Tus respuestas siguen en pantalla; reintentá.' });
  } finally { await fs.rm(temp, { recursive: true, force: true }).catch(() => {}); }
});
router.get('/admin/briefs', auth.soloAdmin, async (_req, res, next) => {
  try {
    await fs.mkdir(DIR, { recursive: true });
    const records = [];
    for (const name of await fs.readdir(DIR)) if (UUID.test(name)) records.push(JSON.parse(await fs.readFile(path.join(DIR, name, 'brief.json'), 'utf8')));
    res.json(records.sort((a, b) => b.creado.localeCompare(a.creado)));
  } catch (err) { next(err); }
});
router.get('/admin/briefs/:id/archivos/:index', auth.soloAdmin, async (req, res, next) => {
  if (!UUID.test(req.params.id) || !/^[0-7]$/.test(req.params.index)) return res.sendStatus(404);
  try {
    const dir = path.join(DIR, req.params.id);
    const record = JSON.parse(await fs.readFile(path.join(dir, 'brief.json'), 'utf8'));
    const file = record.archivos[Number(req.params.index)];
    if (!file) return res.sendStatus(404);
    res.set('X-Content-Type-Options', 'nosniff');
    res.type(file.tipo).download(path.join(dir, req.params.index), file.nombre);
  } catch (err) { if (err.code === 'ENOENT') return res.sendStatus(404); next(err); }
});
router.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: status === 413 ? 'Los adjuntos superan el límite.' : 'No se pudo procesar el brief.' });
});
module.exports = { router, validar };
