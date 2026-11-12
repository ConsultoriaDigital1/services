// ===== Lo que comparten /tickets y /admin/tickets =====
// Los archivos están detrás de un token, así que no se pueden poner en un <img src>:
// se bajan con fetch y se muestran desde un blob local.
(() => {
  const API = window.CD_API || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3060' : 'https://api.consultoriadigital.io');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const peso = n => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const fecha = iso => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const MAX_MB = 10;
  const MAX_ARCHIVOS = 10;

  const blobs = new Map(); // url → objectURL, para no bajar dos veces lo mismo
  async function blob(url, token) {
    if (blobs.has(url)) return blobs.get(url);
    const res = await fetch(API + url, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) throw Error('No se pudo abrir el archivo.');
    const local = URL.createObjectURL(await res.blob());
    blobs.set(url, local);
    return local;
  }

  /** Pinta los adjuntos de un ticket: miniatura si es imagen, botón si no. */
  function adjuntos(archivos, base) {
    if (!archivos.length) return '';
    return `<ul class="tk-adjuntos">${archivos.map(a => `<li>${a.tipo.startsWith('image/')
      ? `<button type="button" class="tk-mini" data-archivo="${esc(base + a.id)}" data-nombre="${esc(a.nombre)}" data-imagen title="${esc(a.nombre)}"><img alt="${esc(a.nombre)}"></button>`
      : `<button type="button" class="tk-file" data-archivo="${esc(base + a.id)}" data-nombre="${esc(a.nombre)}">📎 ${esc(a.nombre)} <small>${peso(a.size)}</small></button>`}</li>`).join('')}</ul>`;
  }

  /** Carga las miniaturas que haya dentro de `raiz` y engancha los clics para abrir/descargar. */
  function activarAdjuntos(raiz, token) {
    for (const boton of raiz.querySelectorAll('[data-imagen]')) {
      const img = boton.querySelector('img');
      if (img.src) continue;
      blob(boton.dataset.archivo, token).then(u => { img.src = u; }).catch(() => { boton.classList.add('tk-roto'); });
    }
    if (raiz.dataset.tkAdjuntos) return; // el listener se engancha una sola vez por contenedor
    raiz.dataset.tkAdjuntos = '1';
    raiz.addEventListener('click', async e => {
      const boton = e.target.closest('[data-archivo]');
      if (!boton || !raiz.contains(boton)) return;
      try {
        const u = await blob(boton.dataset.archivo, token);
        if (boton.hasAttribute('data-imagen')) return void window.open(u, '_blank', 'noopener');
        const link = Object.assign(document.createElement('a'), { href: u, download: boton.dataset.nombre });
        document.body.append(link); link.click(); link.remove();
      } catch (err) { alert(err.message); }
    });
  }

  /** null si los archivos están bien; si no, el motivo para mostrar. */
  function revisarArchivos(lista, yaSubidos = 0) {
    if (lista.length + yaSubidos > MAX_ARCHIVOS) return `Máximo ${MAX_ARCHIVOS} archivos por pedido.`;
    const grande = lista.find(f => f.size > MAX_MB * 1024 * 1024);
    if (grande) return `“${grande.name}” pesa más de ${MAX_MB} MB.`;
    if (lista.some(f => !f.size)) return 'Hay un archivo vacío.';
    return null;
  }

  /** Sube los archivos de a uno; avisa el avance con `progreso(i, total)`. */
  async function subir(lista, url, token, progreso = () => {}) {
    const subidos = [];
    for (const [i, f] of lista.entries()) {
      progreso(i + 1, lista.length, f);
      let res;
      for (let intento = 0; intento < 2; intento++) {
        try {
          res = await fetch(`${API}${url}?nombre=${encodeURIComponent(f.name)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/octet-stream' },
            body: f,
          });
          if (res.ok || res.status < 500) break;
        } catch { /* corte de red: se reintenta una vez */ }
      }
      if (!res?.ok) {
        const motivo = res?.status === 413 ? `“${f.name}” es demasiado grande.` : `No se pudo subir “${f.name}”.`;
        throw Object.assign(Error(motivo), { subidos });
      }
      subidos.push(await res.json());
    }
    return subidos;
  }

  window.TK = { API, esc, peso, fecha, adjuntos, activarAdjuntos, revisarArchivos, subir, MAX_ARCHIVOS, MAX_MB };
})();
