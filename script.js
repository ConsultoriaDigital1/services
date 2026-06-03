// ===== Consultoría Digital — interacciones =====

// Año dinámico en el footer
document.getElementById('year').textContent = new Date().getFullYear();

// Menú móvil
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
// Cerrar el menú al hacer clic en un enlace (móvil)
links.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  })
);

// Header: logo blanco sobre el hero, oscuro al hacer scroll
const header = document.querySelector('.site-header');
const heroH = () => document.querySelector('.hero').offsetHeight - 72;
function syncHeader() {
  // (reservado para efectos futuros de scroll)
}
window.addEventListener('scroll', syncHeader, { passive: true });

// Formulario de contacto (demo: abre el cliente de correo con los datos)
async function enviarConsulta(e) {
  e.preventDefault();
  const f = e.target;
  const hint = document.getElementById('formHint');
  const btn = f.querySelector('button[type="submit"]');

  const data = new FormData(f);
  data.append('_subject', `Consulta web — ${f.servicio.value}`);
  data.append('_cc', 'smallkeloft@gmail.com');   // copia al segundo correo
  data.append('_template', 'table');             // email prolijo en formato tabla
  data.append('_captcha', 'false');

  btn.disabled = true;
  hint.textContent = 'Enviando…';

  try {
    const res = await fetch('https://formsubmit.co/ajax/gonzalo@consultoriadigital.io', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    hint.textContent = '¡Gracias! Recibimos tu consulta y te respondemos a la brevedad.';
    f.reset();
  } catch (err) {
    hint.textContent =
      'No pudimos enviar la consulta. Escribinos a gonzalo@consultoriadigital.io o por WhatsApp.';
  } finally {
    btn.disabled = false;
  }
  return false;
}

// Resaltar la sección activa en la navegación
const sections = [...document.querySelectorAll('section[id]')];
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const io = new IntersectionObserver(
  entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navAnchors.forEach(a =>
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`)
        );
      }
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
sections.forEach(s => io.observe(s));

// ===== Slideshow del fondo difuminado (páginas de detalle) =====
(() => {
  const bg = document.querySelector('.detail-hero-bg');
  if (!bg) return;
  // Las imágenes pueden venir de un data-slides (separado por comas) o de la galería.
  const srcs = (bg.dataset.slides
    ? bg.dataset.slides.split(',').map(s => s.trim())
    : [...document.querySelectorAll('.detail-gallery img')].map(i => i.getAttribute('src'))
  ).filter(Boolean);
  if (srcs.length < 2) return; // con una sola imagen, deja el fondo estático

  const slides = srcs.map((src, i) => {
    const el = document.createElement('div');
    el.className = 'dhb-slide' + (i === 0 ? ' active' : '');
    el.style.backgroundImage = `url("${src}")`;
    bg.appendChild(el);
    return el;
  });

  let idx = 0;
  setInterval(() => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 5000);
})();

// ===== Lightbox de capturas (galerías de las cards) =====
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg = document.getElementById('lightboxImg');
  const btnClose = lb.querySelector('.lightbox-close');
  const btnPrev = lb.querySelector('.lightbox-prev');
  const btnNext = lb.querySelector('.lightbox-next');

  let group = [];
  let index = 0;

  function show(i) {
    index = (i + group.length) % group.length;
    const img = group[index];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
  }
  function open(img) {
    group = [...img.closest('.card-gallery, .detail-gallery').querySelectorAll('img')];
    show(group.indexOf(img));
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.card-gallery img, .detail-gallery img').forEach(img =>
    img.addEventListener('click', () => open(img))
  );
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(index - 1));
  btnNext.addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
})();
