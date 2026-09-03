// ===== Acceso al panel /admin =====
// Una contraseña compartida en el .env y un token firmado con HMAC. Sin dependencias:
// el panel muestra datos personales de clientes, así que la puerta tiene que estar cerrada,
// pero para un equipo de esta escala no hace falta más que esto.

const crypto = require('node:crypto');

const PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.ADMIN_SECRET || (PASSWORD && 'cd-admin:' + PASSWORD);
const VIGENCIA_MS = 12 * 60 * 60 * 1000;

// Sin ADMIN_PASSWORD el panel queda apagado: nunca abierto por omisión.
const activo = Boolean(PASSWORD);

const sha256 = v => crypto.createHash('sha256').update(String(v)).digest();

function verificarPassword(input) {
  // Comparamos los hashes: son siempre de 32 bytes, así que timingSafeEqual no se queja
  // ni se filtra el largo real de la contraseña.
  return activo && crypto.timingSafeEqual(sha256(input), sha256(PASSWORD));
}

const firmar = dato => crypto.createHmac('sha256', SECRET).update(dato).digest('base64url');

function emitirToken() {
  const expira = Date.now() + VIGENCIA_MS;
  const cuerpo = Buffer.from(String(expira)).toString('base64url');
  return { token: `${cuerpo}.${firmar(cuerpo)}`, expira };
}

function validarToken(token) {
  if (!activo || typeof token !== 'string') return false;

  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return false;

  const esperada = firmar(cuerpo);
  if (firma.length !== esperada.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return false;

  const expira = Number(Buffer.from(cuerpo, 'base64url').toString());
  return Number.isFinite(expira) && Date.now() < expira;
}

function soloAdmin(req, res, next) {
  if (!activo) return res.status(503).json({ error: 'admin_sin_configurar' });

  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!validarToken(token)) return res.status(401).json({ error: 'no_autorizado' });

  next();
}

module.exports = { activo, verificarPassword, emitirToken, validarToken, soloAdmin };
