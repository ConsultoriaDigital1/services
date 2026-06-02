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
function enviarConsulta(e) {
  e.preventDefault();
  const f = e.target;
  const nombre = f.nombre.value.trim();
  const contacto = f.contacto.value.trim();
  const servicio = f.servicio.value;
  const mensaje = f.mensaje.value.trim();

  const asunto = `Consulta web — ${servicio}`;
  const cuerpo =
    `Nombre/Empresa: ${nombre}\n` +
    `Contacto: ${contacto}\n` +
    `Servicio de interés: ${servicio}\n\n` +
    `Mensaje:\n${mensaje}`;

  const mailto =
    `mailto:hola@consultoriadigital.com.ar` +
    `?subject=${encodeURIComponent(asunto)}` +
    `&body=${encodeURIComponent(cuerpo)}`;

  window.location.href = mailto;

  const hint = document.getElementById('formHint');
  hint.textContent = '¡Gracias! Abrimos tu correo para enviar la consulta.';
  f.reset();
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
