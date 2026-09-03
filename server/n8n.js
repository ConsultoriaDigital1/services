// ===== Disparo del flujo de n8n =====
// n8n recibe el reporte completo, arma el PDF y lo manda por wasender.
// Un fallo acá nunca puede afectar lo que ve la persona en pantalla: se registra y se sigue.

const TIMEOUT = 10000;
const INTENTOS = 3;

// Normaliza para wasender. La gente escribe el número de mil formas, así que en vez de
// confiar en lo que vino lo desarmamos en partes y lo rearmamos. Conservador a propósito:
// si no llegamos a un móvil argentino, devolvemos los dígitos y que n8n decida
// (el número crudo también viaja en el payload).
function normalizarWhatsapp(crudo) {
  let n = String(crudo || '').replace(/\D/g, '');
  if (!n) return '';

  n = n.replace(/^00/, ''); // 0054... escrito a la europea

  // El país se saca y se vuelve a poner al final: si nos quedábamos con el 54 de entrada,
  // a quien escribe "+54 379 4725597" le faltaba el 9 y WhatsApp no lo entrega.
  const tenia54 = n.startsWith('54');
  if (tenia54) n = n.slice(2);

  n = n.replace(/^0/, ''); // 0 de larga distancia: 0379...
  if (n.length > 10 && n.startsWith('9')) n = n.slice(1); // 9 de celular

  // El 15 viejo, pero solo si lo que queda es un móvil argentino de 10 dígitos: sin esa
  // condición le come dígitos a números de otros países que traen un 15 en esa posición.
  n = n.replace(/^(\d{2,4})15(\d{6,8})$/, (m, area, num) =>
    (area + num).length === 10 ? area + num : m);

  // Un móvil argentino son 10 dígitos: característica + número. Recién ahí lo armamos bien.
  if (n.length === 10) return '549' + n;

  return tenia54 ? '54' + n : n; // otro país, o número incompleto
}

function armarPayload(reg) {
  return {
    id: reg.id,
    creado: reg.creado,
    contacto: {
      nombre: reg.contacto.nombre,
      whatsapp: reg.contacto.whatsapp,
      // Se recalcula siempre, no se lee el guardado: así "Reenviar a n8n" repara los
      // registros viejos que quedaron con un número mal normalizado.
      whatsapp_e164: normalizarWhatsapp(reg.contacto.whatsapp),
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
