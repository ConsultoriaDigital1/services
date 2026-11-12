// ===== Lo que comparten /tickets y /admin/tickets =====
// Los archivos están detrás de un token, así que no se pueden poner en un <img src>:
// se bajan con fetch y se muestran desde un blob local.
(() => {
  const API = window.CD_API || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3060' : 'https://api.consultoriadigital.io');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const peso = n => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const fecha = iso => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const reloj = seg => (Number.isFinite(seg) ? `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}` : '0:00');
  const MAX_MB = 50;
  const MAX_ARCHIVOS = 10;
  const PARTE = 4 * 1024 * 1024; // el servidor acepta hasta 5 MB por parte
  const BARRAS = 44;

  const blobs = new Map(); // url → objectURL, para no bajar dos veces lo mismo
  async function blob(url, token) {
    if (blobs.has(url)) return blobs.get(url);
    const pedido = fetch(API + url, { headers: { Authorization: `Bearer ${token()}` } }).then(async res => {
      if (!res.ok) throw Error('No se pudo abrir el archivo.');
      return URL.createObjectURL(await res.blob());
    });
    blobs.set(url, pedido);
    pedido.catch(() => blobs.delete(url));
    return pedido;
  }

  // ---------- Onda de un audio ----------
  const ondas = new Map(); // src → { picos, duracion }
  /** Picos normalizados (0–1) del audio, para dibujar la onda como en WhatsApp. */
  async function ondaDe(src) {
    if (ondas.has(src)) return ondas.get(src);
    let onda = { picos: Array(BARRAS).fill(0.25), duracion: null };
    try {
      const datos = await (await fetch(src)).arrayBuffer();
      const Contexto = window.AudioContext || window.webkitAudioContext;
      const ctx = new Contexto();
      const audio = await new Promise((ok, mal) => ctx.decodeAudioData(datos, ok, mal));
      ctx.close();
      const canal = audio.getChannelData(0);
      const tramo = Math.max(1, Math.floor(canal.length / BARRAS));
      const picos = Array.from({ length: BARRAS }, (_, i) => {
        let max = 0;
        for (let j = i * tramo; j < Math.min((i + 1) * tramo, canal.length); j += 8) max = Math.max(max, Math.abs(canal[j]));
        return max;
      });
      const tope = Math.max(...picos, 0.01);
      onda = { picos: picos.map(p => p / tope), duracion: audio.duration };
    } catch { /* formato que el navegador no decodifica: queda la onda plana */ }
    ondas.set(src, onda);
    return onda;
  }

  function dibujarOnda(canvas, picos, avance = 0, colorHecho, colorResto) {
    const escala = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth || 160;
    const alto = canvas.clientHeight || 32;
    if (canvas.width !== Math.round(ancho * escala)) { canvas.width = Math.round(ancho * escala); canvas.height = Math.round(alto * escala); }
    const g = canvas.getContext('2d');
    g.setTransform(escala, 0, 0, escala, 0, 0);
    g.clearRect(0, 0, ancho, alto);
    const paso = ancho / picos.length;
    const barra = Math.max(2, paso * 0.6);
    picos.forEach((p, i) => {
      const h = Math.max(3, p * (alto - 4));
      g.fillStyle = (i + 0.5) / picos.length <= avance ? colorHecho : colorResto;
      const x = i * paso + (paso - barra) / 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, (alto - h) / 2, barra, h, barra / 2); else g.rect(x, (alto - h) / 2, barra, h);
      g.fill();
    });
  }
  const colores = () => {
    const css = getComputedStyle(document.documentElement);
    return [css.getPropertyValue('--lime').trim() || '#c5ed1b', '#5b6573'];
  };

  // ---------- Reproductor tipo WhatsApp ----------
  let sonando = null; // un solo audio a la vez
  /** Convierte `contenedor` en un reproductor: play/pausa, onda que se pinta al avanzar y tiempo. */
  function reproductor(contenedor, src, conocida) {
    contenedor.classList.add('tk-player');
    contenedor.innerHTML = '<button type="button" class="tk-play" aria-label="Reproducir audio"><span aria-hidden="true">▶</span></button><canvas class="tk-onda" aria-hidden="true"></canvas><span class="tk-tiempo">0:00</span>';
    const [boton, canvas, tiempo] = contenedor.children;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = src;
    let onda = conocida || { picos: Array(BARRAS).fill(0.25), duracion: null };
    const [hecho, resto] = colores();
    const duracion = () => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : onda.duracion || 0);
    const pintar = () => {
      const total = duracion();
      dibujarOnda(canvas, onda.picos, total ? audio.currentTime / total : 0, hecho, resto);
      tiempo.textContent = reloj(audio.paused && !audio.currentTime ? total : audio.currentTime);
    };
    if (!conocida) ondaDe(src).then(o => { onda = o; pintar(); });
    // Chrome no sabe la duración de los WebM grabados hasta leerlos enteros: se fuerza.
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration === Infinity && audio.paused) {
        audio.currentTime = 1e9;
        audio.addEventListener('durationchange', function listo() { audio.removeEventListener('durationchange', listo); audio.currentTime = 0; pintar(); });
      }
      pintar();
    });
    audio.addEventListener('timeupdate', pintar);
    audio.addEventListener('play', () => { boton.firstChild.textContent = '❚❚'; boton.setAttribute('aria-label', 'Pausar audio'); });
    audio.addEventListener('pause', () => { boton.firstChild.textContent = '▶'; boton.setAttribute('aria-label', 'Reproducir audio'); });
    audio.addEventListener('ended', () => { audio.currentTime = 0; pintar(); });
    boton.onclick = () => {
      if (!audio.paused) return audio.pause();
      if (sonando && sonando !== audio) sonando.pause();
      sonando = audio;
      audio.play().catch(() => { tiempo.textContent = 'No se puede reproducir'; });
    };
    canvas.onclick = e => {
      const total = duracion();
      if (!total) return;
      audio.currentTime = ((e.clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth) * total;
      pintar();
    };
    setTimeout(pintar);
    new ResizeObserver(pintar).observe(canvas);
    return audio;
  }

  // ---------- Grabador ----------
  const FORMATOS = [['audio/webm;codecs=opus', 'webm'], ['audio/mp4', 'm4a'], ['audio/ogg;codecs=opus', 'ogg'], ['audio/webm', 'webm']];
  const formato = () => (window.MediaRecorder?.isTypeSupported ? FORMATOS.find(([t]) => MediaRecorder.isTypeSupported(t)) : null) || (window.MediaRecorder ? ['', 'webm'] : null);
  const puedeGrabar = () => Boolean(navigator.mediaDevices?.getUserMedia && formato());

  /**
   * Botón "Grabar audio". Mientras graba muestra el tiempo y la onda en vivo (como WhatsApp),
   * con botones para descartar o terminar. Al terminar llama a `alTerminar(file, onda)`.
   */
  function grabador(contenedor, { alTerminar, maxSegundos = 15 * 60 }) {
    if (!puedeGrabar()) { contenedor.hidden = true; return; }
    const reposo = () => {
      contenedor.className = 'tk-grabador';
      contenedor.innerHTML = '<button type="button" class="secondary tk-grabar"><span aria-hidden="true">🎤</span> Grabar audio</button><span class="tk-grabar-aviso" role="status"></span>';
      contenedor.querySelector('button').onclick = empezar;
    };
    async function empezar() {
      const aviso = contenedor.querySelector('.tk-grabar-aviso');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        aviso.textContent = 'No pudimos usar el micrófono. Revisá que el navegador tenga permiso.';
        return;
      }
      const [tipo, extension] = formato();
      const recorder = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const trozos = [];
      recorder.ondataavailable = e => { if (e.data.size) trozos.push(e.data); };

      const Contexto = window.AudioContext || window.webkitAudioContext;
      const ctx = new Contexto();
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analizador);
      const muestra = new Uint8Array(analizador.fftSize);
      const niveles = [];

      contenedor.className = 'tk-grabador grabando';
      contenedor.innerHTML = '<button type="button" class="tk-rec-borrar" aria-label="Descartar grabación">🗑</button><span class="tk-rec-punto" aria-hidden="true"></span><span class="tk-rec-tiempo" role="timer">0:00</span><canvas class="tk-onda tk-onda-vivo" aria-hidden="true"></canvas><button type="button" class="tk-rec-listo" aria-label="Terminar grabación">✓</button>';
      const [borrar, , tiempo, canvas, listo] = contenedor.children;
      const [color] = colores();
      const inicio = performance.now();
      let cancelado = false;

      // Con un temporizador y no requestAnimationFrame: si el cliente cambia de pestaña
      // mientras graba, el reloj y el corte automático siguen andando.
      const medir = () => {
        const seg = (performance.now() - inicio) / 1000;
        tiempo.textContent = reloj(seg);
        analizador.getByteTimeDomainData(muestra);
        let suma = 0;
        for (const v of muestra) suma += ((v - 128) / 128) ** 2;
        niveles.push(Math.min(1, Math.sqrt(suma / muestra.length) * 4));
        const visibles = Math.max(10, Math.floor((canvas.clientWidth || 200) / 5));
        const ultimos = niveles.slice(-visibles);
        dibujarOnda(canvas, [...Array(visibles - ultimos.length).fill(0), ...ultimos], 1, color, color);
        if (seg >= maxSegundos) terminar();
      };
      const reloj$ = setInterval(medir, 70); // ~14 barras por segundo, como el ritmo de WhatsApp

      const cerrar = () => {
        clearInterval(reloj$);
        stream.getTracks().forEach(t => t.stop());
        ctx.close().catch(() => {});
      };
      function terminar() {
        if (recorder.state !== 'inactive') recorder.stop();
      }
      recorder.onstop = () => {
        cerrar();
        const duracion = (performance.now() - inicio) / 1000;
        reposo();
        if (cancelado || !trozos.length) return;
        // La onda de la vista previa sale de lo que se midió mientras grababa.
        const tramo = Math.max(1, niveles.length / BARRAS);
        const picos = Array.from({ length: Math.min(BARRAS, niveles.length) }, (_, i) => Math.max(...niveles.slice(Math.floor(i * tramo), Math.floor((i + 1) * tramo)), 0));
        const tope = Math.max(...picos, 0.01);
        const sello = new Date().toLocaleString('sv-SE').replace(/[: ]/g, '-').slice(0, 16);
        const archivo = new File(trozos, `audio-${sello}.${extension}`, { type: (recorder.mimeType || tipo || 'audio/webm').split(';')[0] });
        alTerminar(archivo, { picos: picos.map(p => p / tope), duracion });
      };
      borrar.onclick = () => { cancelado = true; terminar(); };
      listo.onclick = terminar;
      recorder.start(1000);
    }
    reposo();
  }

  // ---------- Adjuntos de un ticket ----------
  /** Miniatura si es imagen, reproductor si es audio, botón si es otra cosa. */
  function adjuntos(archivos, base) {
    if (!archivos.length) return '';
    return `<ul class="tk-adjuntos">${archivos.map(a => {
      const url = esc(base + a.id);
      if (a.tipo.startsWith('image/')) return `<li><button type="button" class="tk-mini" data-archivo="${url}" data-nombre="${esc(a.nombre)}" data-abrir data-imagen title="${esc(a.nombre)}"><img alt="${esc(a.nombre)}"></button></li>`;
      if (a.tipo.startsWith('audio/')) return `<li class="tk-li-audio"><div data-audio="${url}"><span class="tk-tiempo">Cargando audio…</span></div><button type="button" class="tk-bajar" data-archivo="${url}" data-nombre="${esc(a.nombre)}" aria-label="Descargar ${esc(a.nombre)}" title="Descargar">⬇</button></li>`;
      const abrir = a.tipo.startsWith('video/') || a.tipo === 'application/pdf' ? ' data-abrir' : '';
      const icono = a.tipo.startsWith('video/') ? '🎬' : '📎';
      return `<li><button type="button" class="tk-file" data-archivo="${url}" data-nombre="${esc(a.nombre)}"${abrir}>${icono} ${esc(a.nombre)} <small>${peso(a.size)}</small></button></li>`;
    }).join('')}</ul>`;
  }

  /** Carga miniaturas y audios dentro de `raiz` y engancha los clics para abrir/descargar. */
  function activarAdjuntos(raiz, token) {
    for (const boton of raiz.querySelectorAll('[data-imagen]')) {
      const img = boton.querySelector('img');
      if (img.src) continue;
      blob(boton.dataset.archivo, token).then(u => { img.src = u; }).catch(() => { boton.classList.add('tk-roto'); });
    }
    for (const caja of raiz.querySelectorAll('[data-audio]:not(.tk-player)')) {
      blob(caja.dataset.audio, token).then(u => reproductor(caja, u)).catch(() => { caja.textContent = 'No se pudo cargar el audio.'; });
    }
    if (raiz.dataset.tkAdjuntos) return; // el listener se engancha una sola vez por contenedor
    raiz.dataset.tkAdjuntos = '1';
    raiz.addEventListener('click', async e => {
      const boton = e.target.closest('[data-archivo]');
      if (!boton || !raiz.contains(boton)) return;
      try {
        const u = await blob(boton.dataset.archivo, token);
        if (boton.hasAttribute('data-abrir')) return void window.open(u, '_blank', 'noopener');
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

  /**
   * Sube los archivos de a uno y cada uno en partes de 4 MB; cada parte se reintenta hasta
   * 3 veces. Avisa el avance con `progreso(i, total, archivo, porcentaje)`.
   */
  async function subir(lista, url, token, progreso = () => {}) {
    const subidos = [];
    for (const [i, f] of lista.entries()) {
      const partes = Math.max(1, Math.ceil(f.size / PARTE));
      const subida = crypto.randomUUID();
      let res;
      for (let p = 0; p < partes; p++) {
        progreso(i + 1, lista.length, f, Math.round((p / partes) * 100));
        const query = new URLSearchParams({ nombre: f.name, subida, parte: p, partes, total: f.size });
        res = null;
        for (let intento = 0; intento < 3; intento++) {
          try {
            res = await fetch(`${API}${url}?${query}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/octet-stream' },
              body: f.slice(p * PARTE, (p + 1) * PARTE),
            });
            if (res.ok || res.status < 500) break;
          } catch { /* corte de red: se reintenta */ }
          await new Promise(r => setTimeout(r, 1000 * (intento + 1)));
        }
        if (!res?.ok) break;
      }
      if (!res?.ok) {
        const motivo = res?.status === 413 ? `“${f.name}” es demasiado grande.` : `No se pudo subir “${f.name}”.`;
        throw Object.assign(Error(motivo), { subidos });
      }
      progreso(i + 1, lista.length, f, 100);
      subidos.push(await res.json());
    }
    return subidos;
  }

  window.TK = { API, esc, peso, fecha, adjuntos, activarAdjuntos, revisarArchivos, subir, reproductor, grabador, puedeGrabar, MAX_ARCHIVOS, MAX_MB };
})();
