const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

test('encuestas: validación contra el esquema, corrección sin duplicar, panel privado y CSV', async () => {
  const root = path.join(__dirname, 'data');
  await fs.mkdir(root, { recursive: true });
  const temp = await fs.mkdtemp(path.join(root, 'encuestas-test-'));
  process.env.DATA_DIR = temp;
  process.env.ADMIN_PASSWORD = 'password-solo-prueba';
  const encuestas = require('./encuestas');
  const { ENCUESTAS, OTRO } = require('../encuestas/schema');
  const auth = require('./auth');
  const express = require('express');
  const app = express(); app.use('/api', encuestas.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Authorization: `Bearer ${auth.emitirToken().token}` };
  const preguntas = ENCUESTAS.pinosoluciones.secciones.flatMap(([, lista]) => lista);
  const respuestas = Object.fromEntries(preguntas.map(p => [p.id, { elegidas: [p.opciones[0]], otro: '' }]));
  const datos = { id: crypto.randomUUID(), nombre: 'Fer', respuestas, comentarios: '' };
  const post = (body, slug = 'pinosoluciones') => fetch(`${base}/encuestas/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal(encuestas.validar('no-existe', datos), null);
    assert.equal(encuestas.validar('pinosoluciones', { ...datos, nombre: ' ' }), null);
    // Una opción inventada, dos en una pregunta de opción única, o "Otro" sin texto, no.
    assert.equal(encuestas.validar('pinosoluciones', { ...datos, respuestas: { ...respuestas, iva: { elegidas: ['<script>'] } } }), null);
    assert.equal(encuestas.validar('pinosoluciones', { ...datos, respuestas: { ...respuestas, iva: { elegidas: preguntas[0].opciones.slice(0, 2) } } }), null);
    assert.equal(encuestas.validar('pinosoluciones', { ...datos, respuestas: { ...respuestas, iva: { elegidas: [OTRO], otro: '' } } }), null);
    // Falta una pregunta.
    const { clientes, ...incompletas } = respuestas;
    assert.ok(clientes);
    assert.equal((await post({ ...datos, respuestas: incompletas })).status, 400);

    assert.equal((await post(datos)).status, 201);
    // Vuelve y corrige: misma respuesta, no otra.
    const corregida = { ...respuestas, ret_sufridas: { elegidas: ['Ganancias', 'Ingresos Brutos'], otro: '' }, iva: { elegidas: [OTRO], otro: 'Depende del contador' } };
    assert.equal((await post({ ...datos, respuestas: corregida })).status, 200);

    assert.equal((await fetch(base + '/admin/encuestas')).status, 401);
    assert.equal((await fetch(base + '/admin/encuestas/pinosoluciones.csv')).status, 401);
    const lista = await (await fetch(base + '/admin/encuestas', { headers })).json();
    assert.equal(lista.length, 1);
    assert.equal(lista[0].envios, 2);
    assert.deepEqual(lista[0].respuestas.ret_sufridas.elegidas, ['Ganancias', 'Ingresos Brutos']);
    const csv = await (await fetch(base + '/admin/encuestas/pinosoluciones.csv', { headers })).text();
    assert.match(csv, /"Otro: Depende del contador"/);
    assert.match(csv, /"Ganancias · Ingresos Brutos"/);
    assert.equal(csv.trim().split('\n').length, 2);
    assert.equal((await fetch(base + '/admin/encuestas/no-existe.csv', { headers })).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(temp);
    if (!resolved.startsWith(path.resolve(root) + path.sep)) throw Error('Directorio de prueba fuera del workspace');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
