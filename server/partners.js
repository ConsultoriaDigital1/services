// ===== Inscripciones al encuentro del Programa de Partners TurnerIA (/partners) =====
// Mismo esquema que los tests: JSON-lines append-only, gana la última línea por id.
// Si alguien se anota dos veces con el mismo correo se actualiza su inscripción en vez
// de duplicarla, así el panel cuenta personas y no envíos.

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const auth = require('./auth');
const { normalizarWhatsapp } = require('./n8n');

const DIR = path.resolve(__dirname, process.env.DATA_DIR || './data');
const ARCHIVO = path.join(DIR, 'partners.jsonl');
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const PERFILES = [
  'Visitador médico',
  'Agencia de marketing médico',
  'Proveedor del rubro salud',
  'Consultora o estudio contable',
  'Trabajo en un consultorio, clínica o centro de estética',
  'Otro',
];
const ALCANCES = ['Menos de 5', 'Entre 5 y 15', 'Entre 16 y 40', 'Más de 40'];

const registros = new Map(); // id → inscripción
const porEmail = new Map(); // email → id

function cargar() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(ARCHIVO)) return 0;
  for (const linea of fs.readFileSync(ARCHIVO, 'utf8').split('\n')) {
    if (!linea.trim()) continue;
    try {
      const reg = JSON.parse(linea);
      if (!reg?.id) continue;
      registros.set(reg.id, reg);
      porEmail.set(reg.email, reg.id);
    } catch {
      /* línea cortada por un corte de luz: se saltea */
    }
  }
  return registros.size;
}

const texto = (v, max) => String(v ?? '').trim().slice(0, max);

function validar(body) {
  const datos = {
    nombre: texto(body?.nombre, 120),
    email: texto(body?.email, 160).toLowerCase(),
    whatsapp: texto(body?.tel, 40),
    perfil: texto(body?.perfil, 80),
    ciudad: texto(body?.ciudad, 120),
    empresa: texto(body?.empresa, 160),
    alcance: texto(body?.alcance, 40),
  };
  if (!datos.nombre || !datos.ciudad) return null;
  if (!EMAIL.test(datos.email)) return null;
  if (datos.whatsapp.replace(/\D/g, '').length < 8) return null;
  if (!PERFILES.includes(datos.perfil)) return null;
  if (datos.alcance && !ALCANCES.includes(datos.alcance)) return null;

  datos.whatsappE164 = normalizarWhatsapp(datos.whatsapp);
  return datos;
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
  if (++hit.cuenta > (Number(process.env.MAX_PARTNERS) || 30)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  next();
}

router.post('/partners', limite, express.json({ limit: '16kb' }), async (req, res) => {
  const datos = validar(req.body);
  if (!datos) return res.status(400).json({ error: 'datos_incompletos' });

  const ahora = new Date().toISOString();
  const previo = registros.get(porEmail.get(datos.email));
  const reg = previo
    ? { ...previo, ...datos, actualizado: ahora, envios: (previo.envios || 1) + 1 }
    : { id: crypto.randomUUID(), creado: ahora, ...datos, envios: 1 };
  reg.ip = req.ip;
  reg.ua = texto(req.get('user-agent'), 300);

  try {
    await fsp.mkdir(DIR, { recursive: true });
    await fsp.appendFile(ARCHIVO, JSON.stringify(reg) + '\n', 'utf8');
  } catch (err) {
    console.error('No se pudo guardar la inscripción:', err.message);
    return res.status(500).json({ error: 'no_guardado' });
  }
  registros.set(reg.id, reg);
  porEmail.set(reg.email, reg.id);
  res.status(previo ? 200 : 201).json({ id: reg.id });
});

const listar = () => [...registros.values()].sort((a, b) => b.creado.localeCompare(a.creado));

router.get('/admin/partners', auth.soloAdmin, (_req, res) => res.json(listar()));

const COLUMNAS = [
  ['fecha', r => r.creado],
  ['nombre', r => r.nombre],
  ['email', r => r.email],
  ['whatsapp', r => r.whatsapp],
  ['whatsapp_e164', r => r.whatsappE164],
  ['perfil', r => r.perfil],
  ['ciudad', r => r.ciudad],
  ['empresa', r => r.empresa],
  ['alcance', r => r.alcance],
];
const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

router.get('/admin/partners.csv', auth.soloAdmin, (_req, res) => {
  const filas = [
    COLUMNAS.map(([nombre]) => celda(nombre)).join(','),
    ...listar().map(r => COLUMNAS.map(([, leer]) => celda(leer(r))).join(',')),
  ];
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="inscriptos-partners-turneria.csv"',
  });
  res.send('﻿' + filas.join('\n')); // BOM para que Excel respete los acentos
});

router.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: 'no_procesado' });
});

module.exports = { router, cargar, validar, ARCHIVO };
