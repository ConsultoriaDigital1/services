const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

test('tickets: proyectos con código, pedidos con archivos y checklist del admin', async () => {
  const root = path.join(__dirname, 'data');
  await fs.mkdir(root, { recursive: true });
  const temp = await fs.mkdtemp(path.join(root, 'tickets-test-'));
  process.env.DATA_DIR = temp;
  process.env.ADMIN_PASSWORD = 'password-solo-prueba';
  const tickets = require('./tickets');
  const auth = require('./auth');
  const express = require('express');
  const app = express(); app.use('/api', tickets.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const admin = { Authorization: `Bearer ${auth.emitirToken().token}`, 'Content-Type': 'application/json' };
  const json = (url, method, body, headers = { 'Content-Type': 'application/json' }) => fetch(base + url, { method, headers, body: JSON.stringify(body) });
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32)]);
  try {
    // Sin token de admin no se crean proyectos.
    assert.equal((await json('/admin/tickets/proyectos', 'POST', { nombre: 'X' })).status, 401);
    const crear = await json('/admin/tickets/proyectos', 'POST', { nombre: 'Web Piñó', cliente: 'Pino Soluciones' }, admin);
    assert.equal(crear.status, 201);
    const proyecto = await crear.json();
    assert.match(proyecto.codigo, /^[2345679ACDEFGHJKMNPQRTUVWXY]{6}$/);
    assert.equal((await json('/admin/tickets/proyectos', 'POST', { nombre: 'web pino' }, admin)).status, 409);

    // El buscador no lista nada con menos de 2 letras, ignora acentos y nunca muestra el código.
    assert.deepEqual(await (await fetch(`${base}/tickets/proyectos?q=w`)).json(), []);
    const encontrados = await (await fetch(`${base}/tickets/proyectos?q=PINO`)).json();
    assert.deepEqual(encontrados, [{ id: proyecto.id, nombre: 'Web Piñó', cliente: 'Pino Soluciones' }]);

    // Código equivocado no entra; el correcto (en minúsculas y con espacios) sí.
    assert.equal((await json('/tickets/acceso', 'POST', { proyecto: proyecto.id, codigo: 'AAAAAA' })).status, 401);
    const acceso = await (await json('/tickets/acceso', 'POST', { proyecto: proyecto.id, codigo: ` ${proyecto.codigo.toLowerCase()} ` })).json();
    const cliente = { Authorization: `Bearer ${acceso.token}`, 'Content-Type': 'application/json' };
    assert.equal((await fetch(`${base}/tickets/p/${proyecto.id}`)).status, 401);

    // El token de un proyecto no abre otro.
    const otro = await (await json('/admin/tickets/proyectos', 'POST', { nombre: 'Otro' }, admin)).json();
    assert.equal((await fetch(`${base}/tickets/p/${otro.id}`, { headers: cliente })).status, 401);

    assert.equal((await json(`/tickets/p/${proyecto.id}/tickets`, 'POST', { titulo: '  ' }, cliente)).status, 400);
    const ticket = await (await json(`/tickets/p/${proyecto.id}/tickets`, 'POST', { titulo: 'Cambiar portada', detalle: 'La foto nueva', autor: 'Fer' }, cliente)).json();
    assert.equal(ticket.hecho, false);

    // Archivos: la imagen se reconoce por sus bytes, lo demás queda como binario descargable.
    const subir = (bytes, nombre) => fetch(`${base}/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos?nombre=${encodeURIComponent(nombre)}`, { method: 'POST', headers: { Authorization: cliente.Authorization, 'Content-Type': 'application/octet-stream' }, body: bytes });
    const foto = await (await subir(png, 'portada.png')).json();
    assert.equal(foto.tipo, 'image/png');
    const html = await (await subir(Buffer.from('<script>alert(1)</script>'), '../../x.html')).json();
    assert.equal(html.tipo, 'application/octet-stream');
    assert.equal(html.nombre, '.._.._x.html');
    assert.equal((await subir(Buffer.alloc(0), 'vacio.txt')).status, 400);

    // Archivo grande en partes: un reintento de una parte ya recibida no la duplica y una
    // parte salteada se rechaza.
    const subida = crypto.randomUUID();
    const audio = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), crypto.randomBytes(25)]);
    const trozos = [audio.subarray(0, 10), audio.subarray(10, 20), audio.subarray(20)];
    const parte = (i, cuerpo = trozos[i]) => fetch(`${base}/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos?nombre=audio-nota.webm&subida=${subida}&parte=${i}&partes=3&total=${audio.length}`, { method: 'POST', headers: { Authorization: cliente.Authorization, 'Content-Type': 'application/octet-stream' }, body: cuerpo });
    assert.equal((await parte(0)).status, 202);
    assert.equal((await parte(0)).status, 202);
    assert.equal((await parte(2)).status, 409);
    assert.equal((await parte(1)).status, 202);
    const nota = await (await parte(2)).json();
    assert.equal(nota.tipo, 'audio/webm');
    assert.equal(nota.size, audio.length);
    const oida = await fetch(`${base}/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos/${nota.id}`, { headers: cliente });
    assert.match(oida.headers.get('content-disposition'), /^inline/);
    assert.deepEqual(Buffer.from(await oida.arrayBuffer()), audio);
    // Más que el máximo no se acepta, aunque venga en partes chicas.
    const enorme = await fetch(`${base}/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos?nombre=x.bin&subida=${crypto.randomUUID()}&parte=0&partes=20&total=${tickets.MAX_BYTES + 1}`, { method: 'POST', headers: { Authorization: cliente.Authorization }, body: Buffer.alloc(10) });
    assert.equal(enorme.status, 413);
    assert.equal(tickets.tipoReal(audio, 'video-obra.webm'), 'video/webm');
    assert.equal(tickets.tipoReal(Buffer.from('ID3\x04\x00'), 'tema.mp3'), 'audio/mpeg');

    const descarga = await fetch(`${base}/tickets/p/${proyecto.id}/tickets/${ticket.id}/archivos/${html.id}`, { headers: cliente });
    assert.equal(descarga.status, 200);
    assert.match(descarga.headers.get('content-disposition'), /^attachment/);
    assert.equal(descarga.headers.get('x-content-type-options'), 'nosniff');
    const imagen = await fetch(`${base}/admin/tickets/${ticket.id}/archivos/${foto.id}`, { headers: admin });
    assert.deepEqual(Buffer.from(await imagen.arrayBuffer()), png);

    // El admin lo marca como hecho con una nota y el cliente lo ve.
    const hecho = await (await json(`/admin/tickets/${ticket.id}`, 'PATCH', { hecho: true, nota: 'Listo, ya está online' }, admin)).json();
    assert.equal(hecho.hecho, true);
    assert.ok(hecho.hechoEn);
    const vista = await (await fetch(`${base}/tickets/p/${proyecto.id}`, { headers: cliente })).json();
    assert.equal(vista.tickets.length, 1);
    assert.equal(vista.tickets[0].nota, 'Listo, ya está online');
    assert.equal(vista.tickets[0].archivos.length, 3);
    assert.equal(vista.proyecto.codigo, undefined);

    // Persistencia: lo que se recarga del archivo es lo último que se escribió.
    const lineas = (await fs.readFile(tickets.ARCHIVO, 'utf8')).trim().split('\n').map(l => JSON.parse(l));
    assert.equal(lineas.filter(l => l.id === ticket.id).at(-1).hecho, true);

    // Un código nuevo deja afuera los accesos viejos.
    await json(`/admin/tickets/proyectos/${proyecto.id}`, 'PATCH', { nuevoCodigo: true }, admin);
    assert.equal((await fetch(`${base}/tickets/p/${proyecto.id}`, { headers: cliente })).status, 401);

    // Archivado: no aparece en el buscador.
    await json(`/admin/tickets/proyectos/${proyecto.id}`, 'PATCH', { archivado: true }, admin);
    assert.deepEqual(await (await fetch(`${base}/tickets/proyectos?q=pino`)).json(), []);
  } finally {
    server.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
});
