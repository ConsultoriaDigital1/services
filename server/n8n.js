// ===== Disparo del flujo de n8n =====
// n8n recibe el reporte completo, arma el PDF y lo manda por wasender.
// Un fallo acá nunca puede afectar lo que ve la persona en pantalla: se registra y se sigue.

const TIMEOUT = 10000;
const INTENTOS = 3;

// Normaliza para wasender. Conservador a propósito: si no reconoce el formato,
// devuelve solo los dígitos y que n8n decida (el número crudo también viaja).
function normalizarWhatsapp(crudo) {
  let n = String(crudo || '').replace(/\D/g, '');
  if (!n) return '';
  if (n.startsWith('54')) return n; // ya trae el código de país
  n = n.replace(/^0+/, ''); // 0379... → 379...
  n = n.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2'); // el 15 viejo de los celulares
  return n.length === 10 ? '549' + n : n;
}

function armarPayload(reg) {
  return {
    id: reg.id,
    creado: reg.creado,
    contacto: {
      nombre: reg.contacto.nombre,
      whatsapp: reg.contacto.whatsapp,
      whatsapp_e164: reg.contacto.whatsappE164 || normalizarWhatsapp(reg.contacto.whatsapp),
      email: reg.contacto.email,
      empresa: reg.contacto.empresa,
    },
    resultado: {
      score: reg.resultado.score,
      nivel: reg.resultado.nivel,
      nivel_txt: reg.resultado.nivelTxt,
      horas_mes: reg.resultado.horasMes,
      semanas_mes: reg.resultado.semanasMes,
      costo_mes: reg.resultado.costoMes,
      costo_mes_txt: reg.resultado.costoMesTxt,
      valor_hora: reg.resultado.valorHora,
    },
    oportunidades: reg.oportunidades.map(o => ({
      nombre: o.nombre,
      horas_mes: o.horasMes,
      que: o.que,
      url: o.url,
    })),
    respuestas: reg.respuestas.map(r => ({
      n: r.n,
      pregunta: r.pregunta,
      respuesta: r.respuesta,
      puntos: r.puntos,
      horas_semana: r.horasSemana,
    })),
    plan: reg.plan.map(p => ({ cuando: p.cuando, que: p.que })),
    lectura_ia: reg.lecturaIa || '',
    origen: 'test-automatizacion',
  };
}

async function dispararN8N(reg) {
  const url = process.env.N8N_WEBHOOK_URL;
  const at = () => new Date().toISOString();

  if (!url) {
    console.warn('N8N_WEBHOOK_URL sin definir: el flujo no se dispara');
    return { ok: false, error: 'sin_url', at: at() };
  }

  const cuerpo = JSON.stringify(armarPayload(reg));
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.N8N_WEBHOOK_TOKEN) headers['X-CD-Token'] = process.env.N8N_WEBHOOK_TOKEN;

  let ultimo = '';
  let intento = 0;

  while (intento < INTENTOS) {
    intento++;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: cuerpo,
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (res.ok) return { ok: true, status: res.status, intentos: intento, at: at() };

      ultimo = 'HTTP ' + res.status;
      // Un 4xx no se arregla reintentando; el 429 sí, esperando.
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      ultimo = err.name === 'TimeoutError' ? 'timeout' : err.message;
    }
    if (intento < INTENTOS) await new Promise(r => setTimeout(r, 1000 * intento));
  }

  console.error('n8n no recibió el test', reg.id, '—', ultimo);
  return { ok: false, error: ultimo, intentos: intento, at: at() };
}

module.exports = { dispararN8N, normalizarWhatsapp, armarPayload };
