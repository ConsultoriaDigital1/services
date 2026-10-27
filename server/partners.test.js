const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

test('partners: validación, deduplicado por email, panel privado y CSV', async () => {
  const root = path.join(__dirname, 'data');
  await fs.mkdir(root, { recursive: true });
  const temp = await fs.mkdtemp(path.join(root, 'partners-test-'));
  process.env.DATA_DIR = temp;
  process.env.ADMIN_PASSWORD = 'password-solo-prueba';
  const partners = require('./partners');
  const auth = require('./auth');
  const express = require('express');
  const app = express(); app.use('/api', partners.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Authorization: `Bearer ${auth.emitirToken().token}` };
  const datos = { nombre: 'Ana Pérez', email: 'Ana@Example.com', tel: '+54 379 4725597', perfil: 'Visitador médico', ciudad: 'Corrientes', empresa: '', alcance: 'Entre 5 y 15' };
  const post = body => fetch(base + '/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal(partners.validar({ ...datos, email: 'no-es-mail' }), null);
    assert.equal(partners.validar({ ...datos, perfil: '<script>' }), null);
    assert.equal(partners.validar({ ...datos, alcance: 'Mil' }), null);
    assert.equal(partners.validar({ ...datos, tel: '123' }), null);
    assert.equal((await post({ ...datos, ciudad: '' })).status, 400);
    assert.equal((await post(datos)).status, 201);
    assert.equal((await post({ ...datos, email: 'ana@example.com', ciudad: 'Resistencia' })).status, 200);
    assert.equal((await post({ ...datos, email: 'beto@example.com', nombre: 'Beto' })).status, 201);
    assert.equal((await fetch(base + '/admin/partners')).status, 401);
    assert.equal((await fetch(base + '/admin/partners.csv')).status, 401);
    const lista = await (await fetch(base + '/admin/partners', { headers })).json();
    assert.equal(lista.length, 2);
    const ana = lista.find(r => r.email === 'ana@example.com');
    assert.equal(ana.ciudad, 'Resistencia');
    assert.equal(ana.envios, 2);
    assert.equal(ana.whatsappE164, '5493794725597');
    const csv = await (await fetch(base + '/admin/partners.csv', { headers })).text();
    assert.match(csv, /"Ana Pérez"/);
    assert.equal(csv.trim().split('\n').length, 3);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(temp);
    if (!resolved.startsWith(path.resolve(root) + path.sep)) throw Error('Directorio de prueba fuera del workspace');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
