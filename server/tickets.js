// ===== Tickets de clientes (/tickets) =====
// Cada cliente busca su proyecto, entra con el código que le pasa el equipo y carga
// pedidos (un checklist) con imágenes o archivos. Desde /admin/tickets se crean los
// proyectos y se marcan los pedidos como hechos.
//
// Persistencia igual que el resto: JSON-lines append-only, gana la última línea por id.
// Proyectos y tickets conviven en el mismo archivo, separados por `tipo`. Los archivos
// van a disco en data/tickets/<ticket>/<archivo>, nunca dentro del JSON.

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const auth = require('./auth');

const DIR = path.resolve(__dirname, process.env.DATA_DIR || './data');
const ARCHIVO = path.join(DIR, 'tickets.jsonl');
const ADJUNTOS = path.join(DIR, 'tickets');
const UUID = /^[a-f0-9-]{36}$/;
const MB = 1024 * 1024;
const MAX_BYTES = (Number(process.env.TICKETS_MAX_MB) || 10) * MB;
const MAX_ARCHIVOS = 10; // por ticket
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000; // el cliente entra una vez al mes

// Sin secreto propio se deriva del panel; si tampoco hay contraseña, uno al azar por
// proceso (los clientes tendrían que volver a poner el código después de un reinicio).
const SECRET =
  process.env.TICKETS_SECRET ||
  (process.env.ADMIN_SECRET && 'tickets:' + process.env.ADMIN_SECRET) ||
  (process.env.ADMIN_PASSWORD && 'cd-tickets:' + process.env.ADMIN_PASSWORD) ||
  crypto.randomBytes(32).toString('hex');

const proyectos = new Map(); // id → proyecto
const tickets = new Map(); // id → ticket

function cargar() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(ARCHIVO)) return 0;
  for (const linea of fs.readFileSync(ARCHIVO, 'utf8').split('\n')) {
    if (!linea.trim()) continue;
    try {
      const reg = JSON.parse(linea);
      if (reg?.tipo === 'proyecto' && reg.id) proyectos.set(reg.id, reg);
      else if (reg?.tipo === 'ticket' && reg.id) tickets.set(reg.id, reg);
    } catch {
      /* línea cortada por un corte de luz: se saltea */
    }
  }
  return tickets.size;
}

async function guardar(reg) {
  await fsp.mkdir(DIR, { recursive: true });
  await fsp.appendFile(ARCHIVO, JSON.stringify(reg) + '\n', 'utf8');
  (reg.tipo === 'proyecto' ? proyectos : tickets).set(reg.id, reg);
  return reg;
}

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Para buscar sin que importen mayúsculas ni acentos: "Pino" encuentra "Piñó".
const plano = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Sin caracteres que se confunden (0/O, 1/I/L, 5/S, 2/Z, 8/B): el código se dicta por
// teléfono o se copia a mano de un WhatsApp.
const ALFABETO = '2345679ACDEFGHJKMNPQRTUVWXY';
function nuevoCodigo() {
  return Array.from(crypto.randomBytes(6), b => ALFABETO[b % ALFABETO.length]).join('');
}
const limpiarCodigo = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// ---- Acceso del cliente: token firmado por proyecto ----
// Lleva una huella del código vigente: si el admin lo regenera, los accesos viejos caen.
const huella = codigo => crypto.createHash('sha256').update(codigo).digest('base64url').slice(0, 10);
const firmar = dato => crypto.createHmac('sha256', SECRET).update(dato).digest('base64url');

function emitirAcceso(proyecto) {
  const cuerpo = Buffer.from(JSON.stringify({ p: proyecto.id, h: huella(proyecto.codigo), e: Date.now() + VIGENCIA_MS })).toString('base64url');
  return `${cuerpo}.${firmar(cuerpo)}`;
}

function validarAcceso(token, proyectoId) {
  if (typeof token !== 'string') return false;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return false;
  const esperada = firmar(cuerpo);
  if (firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return false;
  let datos;
  try {
    datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
  } catch {
    return false;
  }
  const proyecto = proyectos.get(proyectoId);
  return Boolean(proyecto && !proyecto.archivado && datos.p === proyectoId && datos.h === huella(proyecto.codigo) && Date.now() < datos.e);
}

function soloCliente(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!validarAcceso(token, req.params.proyecto)) return res.status(401).json({ error: 'sin_acceso' });
  req.proyecto = proyectos.get(req.params.proyecto);
  next();
}

// ---- Archivos ----
// Las imágenes se reconocen por sus primeros bytes (no por lo que dice el navegador) para
// poder mostrarlas en el panel. Todo lo demás se guarda y se descarga como binario.
function tipoReal(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (bytes.toString('ascii', 0, 6) === 'GIF87a' || bytes.toString('ascii', 0, 6) === 'GIF89a') return 'image/gif';
  if (bytes.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return 'application/octet-stream';
}
const nombreSeguro = v => String(v || 'archivo').replace(/[\x00-\x1f<>:"/\\|?*]/g, '_').trim().slice(0, 160) || 'archivo';

async function enviarArchivo(res, ticket, archivoId) {
  const archivo = ticket?.archivos.find(a => a.id === archivoId);
  if (!archivo) return res.sendStatus(404);
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" });
  // Solo imágenes y PDF se abren en el navegador; el resto siempre se descarga.
  const inline = archivo.tipo !== 'application/octet-stream';
  res.type(archivo.tipo);
  res.attachment(archivo.nombre);
  if (inline) res.set('Content-Disposition', res.get('Content-Disposition').replace(/^attachment/, 'inline'));
  res.sendFile(path.join(ADJUNTOS, ticket.id, archivo.id), err => {
    if (err && !res.headersSent) res.sendStatus(err.code === 'ENOENT' ? 404 : 500);
  });
}

// ---- Vistas que salen hacia afuera ----
const proyectoPublico = p => ({ id: p.id, nombre: p.nombre, cliente: p.cliente });
const ticketPublico = t => ({
  id: t.id,
  titulo: t.titulo,
  detalle: t.detalle,
  autor: t.autor,
  creado: t.creado,
  hecho: Boolean(t.hecho),
  hechoEn: t.hechoEn || null,
  nota: t.nota || '',
  archivos: t.archivos.map(({ id, nombre, tipo, size }) => ({ id, nombre, tipo, size })),
});
const ticketsDe = proyectoId =>
  [...tickets.values()].filter(t => t.proyecto === proyectoId && !t.borrado).sort((a, b) => a.creado.localeCompare(b.creado));

// ---- Límites por IP ----
function crearLimite(max) {
  const hits = new Map();
  setInterval(() => {
    for (const [ip, v] of hits) if (v.hasta < Date.now()) hits.delete(ip);
  }, 60000).unref();
  return (req, res, next) => {
    let hit = hits.get(req.ip);
    if (!hit || hit.hasta < Date.now()) {
      hit = { cuenta: 0, hasta: Date.now() + 3600000 };
      hits.set(req.ip, hit);
    }
    if (++hit.cuenta > max) return res.status(429).json({ error: 'rate_limited' });
    next();
  };
}
const limiteBusqueda = crearLimite(Number(process.env.MAX_TICKETS_BUSQUEDAS) || 300);
const limiteAcceso = crearLimite(Number(process.env.MAX_TICKETS_ACCESOS) || 20);
const limiteCarga = crearLimite(Number(process.env.MAX_TICKETS_CARGAS) || 200);

const router = express.Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
const json = express.json({ limit: '64kb' });
const binario = express.raw({ type: () => true, limit: MAX_BYTES });

// ===================== Cliente =====================

// El buscador pide al menos 2 letras y devuelve pocos resultados: la lista completa de
// clientes no queda expuesta, y aunque alguien adivine un nombre necesita el código.
router.get('/tickets/proyectos', limiteBusqueda, (req, res) => {
  const q = plano(texto(req.query.q, 80));
  if (q.length < 2) return res.json([]);
  const encontrados = [...proyectos.values()]
    .filter(p => !p.archivado && (plano(p.nombre).includes(q) || plano(p.cliente).includes(q)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 8)
    .map(proyectoPublico);
  res.json(encontrados);
});

// Solo el nombre, para el link directo (/tickets/?p=<id>) que se le pasa al cliente.
router.get('/tickets/proyectos/:proyecto', limiteBusqueda, (req, res) => {
  const p = proyectos.get(req.params.proyecto);
  if (!p || p.archivado) return res.status(404).json({ error: 'no_encontrado' });
  res.json(proyectoPublico(p));
});

router.post('/tickets/acceso', limiteAcceso, json, (req, res) => {
  const p = proyectos.get(texto(req.body?.proyecto, 40));
  const codigo = limpiarCodigo(req.body?.codigo);
  const ok = p && !p.archivado && codigo.length === p.codigo.length && crypto.timingSafeEqual(Buffer.from(codigo), Buffer.from(p.codigo));
  if (!ok) return res.status(401).json({ error: 'codigo_incorrecto' });
  res.json({ token: emitirAcceso(p), proyecto: proyectoPublico(p) });
});

router.get('/tickets/p/:proyecto', soloCliente, (req, res) => {
  res.json({ proyecto: proyectoPublico(req.proyecto), tickets: ticketsDe(req.proyecto.id).map(ticketPublico) });
});

router.post('/tickets/p/:proyecto/tickets', soloCliente, limiteCarga, json, async (req, res) => {
  const titulo = texto(req.body?.titulo, 200);
  if (!titulo) return res.status(400).json({ error: 'falta_titulo' });
  const ticket = {
    tipo: 'ticket',
    id: crypto.randomUUID(),
    proyecto: req.proyecto.id,
    titulo,
    detalle: texto(req.body?.detalle, 6000),
    autor: texto(req.body?.autor, 120),
    creado: new Date().toISOString(),
    hecho: false,
    archivos: [],
    ip: req.ip,
  };
  try {
    await guardar(ticket);
  } catch (err) {
    console.error('No se pudo guardar el ticket:', err.message);
    return res.status(500).json({ error: 'no_guardado' });
  }
  res.status(201).json(ticketPublico(ticket));
});

// Un archivo por pedido, en crudo (sin base64): así cada subida es chica y si una falla
// se reintenta sola, sin volver a mandar las demás.
router.post('/tickets/p/:proyecto/tickets/:id/archivos', soloCliente, limiteCarga, binario, async (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket || ticket.borrado || ticket.proyecto !== req.proyecto.id) return res.status(404).json({ error: 'no_encontrado' });
  if (ticket.archivos.length >= MAX_ARCHIVOS) return res.status(400).json({ error: 'demasiados_archivos' });
  const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!bytes.length) return res.status(400).json({ error: 'archivo_vacio' });

  const archivo = {
    id: crypto.randomUUID(),
    nombre: nombreSeguro(req.query.nombre),
    tipo: tipoReal(bytes),
    size: bytes.length,
    creado: new Date().toISOString(),
  };
  try {
    await fsp.mkdir(path.join(ADJUNTOS, ticket.id), { recursive: true });
    await fsp.writeFile(path.join(ADJUNTOS, ticket.id, archivo.id), bytes, { flag: 'wx' });
    // Se relee el ticket: otra subida en paralelo pudo haberlo actualizado mientras tanto.
    const actual = tickets.get(ticket.id);
    await guardar({ ...actual, archivos: [...actual.archivos, archivo] });
  } catch (err) {
    console.error('No se pudo guardar el archivo:', err.message);
    return res.status(500).json({ error: 'no_guardado' });
  }
  const { id, nombre, tipo, size } = archivo;
  res.status(201).json({ id, nombre, tipo, size });
});

router.get('/tickets/p/:proyecto/tickets/:id/archivos/:archivo', soloCliente, (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket || ticket.borrado || ticket.proyecto !== req.proyecto.id) return res.sendStatus(404);
  enviarArchivo(res, ticket, req.params.archivo);
});

// ===================== Panel /admin/tickets =====================

router.get('/admin/tickets', auth.soloAdmin, (_req, res) => {
  res.json({
    proyectos: [...proyectos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    tickets: [...tickets.values()].filter(t => !t.borrado).map(t => ({ ...ticketPublico(t), proyecto: t.proyecto })),
  });
});

router.post('/admin/tickets/proyectos', auth.soloAdmin, json, async (req, res) => {
  const nombre = texto(req.body?.nombre, 120);
  if (!nombre) return res.status(400).json({ error: 'falta_nombre' });
  if ([...proyectos.values()].some(p => plano(p.nombre) === plano(nombre))) return res.status(409).json({ error: 'nombre_repetido' });
  const proyecto = {
    tipo: 'proyecto',
    id: crypto.randomUUID(),
    nombre,
    cliente: texto(req.body?.cliente, 120),
    codigo: nuevoCodigo(),
    creado: new Date().toISOString(),
    archivado: false,
  };
  await guardar(proyecto);
  res.status(201).json(proyecto);
});

router.patch('/admin/tickets/proyectos/:id', auth.soloAdmin, json, async (req, res) => {
  const previo = proyectos.get(req.params.id);
  if (!previo) return res.status(404).json({ error: 'no_encontrado' });
  const cambios = {};
  if (req.body?.nombre !== undefined) {
    const nombre = texto(req.body.nombre, 120);
    if (!nombre) return res.status(400).json({ error: 'falta_nombre' });
    if ([...proyectos.values()].some(p => p.id !== previo.id && plano(p.nombre) === plano(nombre))) return res.status(409).json({ error: 'nombre_repetido' });
    cambios.nombre = nombre;
  }
  if (req.body?.cliente !== undefined) cambios.cliente = texto(req.body.cliente, 120);
  if (typeof req.body?.archivado === 'boolean') cambios.archivado = req.body.archivado;
  if (req.body?.nuevoCodigo === true) cambios.codigo = nuevoCodigo();
  res.json(await guardar({ ...previo, ...cambios, actualizado: new Date().toISOString() }));
});

router.patch('/admin/tickets/:id', auth.soloAdmin, json, async (req, res) => {
  const previo = tickets.get(req.params.id);
  if (!previo || previo.borrado) return res.status(404).json({ error: 'no_encontrado' });
  const cambios = {};
  if (typeof req.body?.hecho === 'boolean') {
    cambios.hecho = req.body.hecho;
    cambios.hechoEn = req.body.hecho ? new Date().toISOString() : null;
  }
  if (req.body?.nota !== undefined) cambios.nota = texto(req.body.nota, 2000);
  // Borrado lógico: el ticket desaparece de las listas pero la historia queda en el archivo.
  if (req.body?.borrado === true) cambios.borrado = true;
  const ticket = await guardar({ ...previo, ...cambios, actualizado: new Date().toISOString() });
  res.json({ ...ticketPublico(ticket), proyecto: ticket.proyecto });
});

router.get('/admin/tickets/:id/archivos/:archivo', auth.soloAdmin, (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket || ticket.borrado) return res.sendStatus(404);
  enviarArchivo(res, ticket, req.params.archivo);
});

router.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  if (status === 500) console.error('Error en tickets:', err.message);
  res.status(status).json({ error: status === 413 ? 'archivo_muy_grande' : 'no_procesado' });
});

module.exports = { router, cargar, validarAcceso, emitirAcceso, tipoReal, ARCHIVO, MAX_BYTES, MAX_ARCHIVOS };
