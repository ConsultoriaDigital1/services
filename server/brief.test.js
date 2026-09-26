const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

test('brief: validación, persistencia, aislamiento y descarga privada', async () => {
  const root = path.join(__dirname, 'data');
  await fs.mkdir(root, { recursive: true });
  const temp = await fs.mkdtemp(path.join(root, 'brief-test-'));
  process.env.DATA_DIR = temp;
  process.env.ADMIN_PASSWORD = 'password-solo-prueba';
  const { router, validar } = require('./brief');
  const auth = require('./auth');
  const express = require('express');
  const app = express(); app.use('/api', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Authorization: `Bearer ${auth.emitirToken().token}` };
  const payload = { id: crypto.randomUUID(), consent: true, respuestas: { empresa: 'Empresa A', responsable: 'Ana', email: 'ana@example.com' }, servicios: [{ nombre: 'Consultoría', descripcion: 'Detalle', publico: 'Empresas' }], archivos: [{ nombre: '../logo.png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=' }] };
  const post = body => fetch(base + '/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.throws(() => validar({ ...payload, consent: false }));
    assert.throws(() => validar({ ...payload, archivos: [{ nombre: 'fake.png', data: Buffer.from('<script>alert(1)</script>').toString('base64') }] }));
    assert.throws(() => validar({ ...payload, archivos: Array(9).fill(payload.archivos[0]) }));
    assert.throws(() => validar({ ...payload, respuestas: { ...payload.respuestas, publico: ['inválido'] } }));
    assert.equal((await post(payload)).status, 201);
    assert.equal((await post(payload)).status, 200);
    const second = { ...payload, id: crypto.randomUUID(), respuestas: { ...payload.respuestas, empresa: 'Empresa B' }, archivos: [] };
    assert.equal((await post(second)).status, 201);
    assert.equal((await fetch(base + '/admin/briefs')).status, 401);
    assert.equal((await fetch(`${base}/admin/briefs/${payload.id}/archivos/0`)).status, 401);
    const records = await (await fetch(base + '/admin/briefs', { headers })).json();
    assert.equal(records.length, 2);
    const saved = JSON.parse(await fs.readFile(path.join(temp, 'briefs', payload.id, 'brief.json'), 'utf8'));
    assert.equal(saved.respuestas.empresa, 'Empresa A');
    assert.equal(saved.archivos[0].nombre, '.._logo.png');
    const file = await fetch(`${base}/admin/briefs/${payload.id}/archivos/0`, { headers });
    assert.equal(file.status, 200);
    assert.match(file.headers.get('content-disposition'), /^attachment/);
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(payload.archivos[0].data, 'base64'));
    assert.equal((await fetch(`${base}/admin/briefs/${second.id}/archivos/0`, { headers })).status, 404);
    assert.equal((await fetch(`${base}/admin/briefs/${payload.id}/archivos/99`, { headers })).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(temp);
    if (!resolved.startsWith(path.resolve(root) + path.sep)) throw Error('Directorio de prueba fuera del workspace');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
