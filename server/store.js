// ===== Persistencia de los tests de automatización =====
// Log append-only en JSON-lines: una línea por evento y gana la última por id.
// Así una actualización es un solo appendFile —nunca hay que reescribir el archivo—
// y un corte de luz a lo sumo deja una línea cortada al final, que se saltea al cargar.

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const DIR = path.resolve(__dirname, process.env.DATA_DIR || './data');
const ARCHIVO = path.join(DIR, 'tests.jsonl');

// id → registro. El Map conserva el orden de alta aunque después se actualice.
const registros = new Map();

function cargar() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(ARCHIVO)) return 0;

  let lineas;
  try {
    lineas = fs.readFileSync(ARCHIVO, 'utf8').split('\n');
  } catch (err) {
    console.error('No se pudo leer', ARCHIVO, '—', err.message);
    return 0;
  }

  let rotas = 0;
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    try {
      const reg = JSON.parse(linea);
      if (reg && reg.id) registros.set(reg.id, reg); // la última versión pisa a la anterior
    } catch {
      rotas++;
    }
  }
  if (rotas) console.warn(`${rotas} línea(s) ilegibles en ${ARCHIVO}, salteadas`);
  return registros.size;
}

function escribir(reg) {
  return fsp.appendFile(ARCHIVO, JSON.stringify(reg) + '\n', 'utf8');
}

async function guardar(reg) {
  registros.set(reg.id, reg);
  await escribir(reg);
  return reg;
}

async function actualizar(id, campos) {
  const previo = registros.get(id);
  if (!previo) return null;

  const reg = { ...previo, ...campos };
  registros.set(id, reg);
  await escribir(reg);
  return reg;
}

function obtener(id) {
  return registros.get(id) || null;
}

// Más nuevo primero: en el panel lo último siempre va arriba.
function listar() {
  return [...registros.values()].reverse();
}

module.exports = { cargar, guardar, actualizar, obtener, listar, ARCHIVO };
