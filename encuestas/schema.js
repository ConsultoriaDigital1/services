/*
 * Las encuestas para clientes (/encuestas/<cliente>/). Las comparten el formulario,
 * la validación del servidor y el panel, como el brief. Cada pregunta es de opción
 * única o múltiple y siempre admite "Otro" con texto libre.
 */
const ENCUESTAS = {
  pinosoluciones: {
    cliente: 'Pino Soluciones',
    titulo: 'Tesorería: las últimas dudas',
    intro: 'Son las dudas que quedan del anexo de Tesorería para dejar el plan cerrado. Elegí una opción en cada una; si ninguna encaja, usá «Otro» y escribilo. Las respuestas se guardan en este dispositivo mientras completás.',
    secciones: [
      ['Período y libro IVA', [
        { id: 'iva', texto: 'El período que indican al cargar una factura, ¿es el mismo que va al libro IVA?', ayuda: 'Por ejemplo, una factura de mayo que llega y se carga en junio.',
          opciones: ['Sí, va al IVA del período que indicamos', 'No, el IVA va por la fecha de la factura', 'Lo tengo que consultar con el contador'] },
      ]],
      ['Buscador de cajas y cuentas', [
        { id: 'buscador_cajas', texto: 'Para elegir la caja o cuenta se escribe el código o parte del nombre (32 → Banco Macro), y solo aparecen las de la empresa de la operación y las compartidas. ¿Alcanza así?',
          opciones: ['Sí, alcanza con el código y el nombre', 'Quiero además filtros por tipo y moneda, como en TANGO'] },
      ]],
      ['Retenciones', [
        { id: 'ret_practicadas', multiple: true, texto: 'Al pagarle a un proveedor, ¿PINO le retiene algún impuesto?', ayuda: 'El anexo pide que la orden de pago no tenga retenciones, pero en TANGO están las cuentas «Retenciones … Practicadas», que son las que se hacen al pagar. Marcá todas las que correspondan.',
          opciones: ['No, nunca retenemos al pagar', 'Ganancias', 'Ingresos Brutos', 'IVA', 'SUSS'] },
        { id: 'ret_sufridas', multiple: true, texto: 'Cuando cobran, ¿qué retenciones les hacen los clientes?', ayuda: 'Marcá todas las que correspondan.',
          opciones: ['Ganancias', 'Ingresos Brutos', 'IVA', 'SUSS', 'Ninguna'] },
        { id: 'ret_certificado', texto: 'Al cargar una retención en el recibo, ¿qué registran?',
          opciones: ['El importe y el número de certificado', 'El importe, el número de certificado y el PDF del certificado', 'Solo el importe'] },
      ]],
      ['Cobros con tarjeta (posnet)', [
        { id: 'posnet_banco', texto: 'Los dos posnet de cada empresa, ¿acreditan en el mismo banco?', ayuda: 'Si es distinto, contanos en «Otro» en qué banco acredita cada uno.',
          opciones: ['Sí, los dos en el mismo banco', 'No, cada uno acredita en un banco distinto'] },
        { id: 'posnet_descuentos', texto: 'Cuando se acredita un cobro con tarjeta, ¿cómo quieren registrar los descuentos (arancel, impuestos)?',
          opciones: ['Cargamos lo que llegó al banco y la diferencia queda como gasto', 'Cargamos cada descuento por separado, como figura en la liquidación'] },
      ]],
      ['Orden de pago', [
        { id: 'moneda_op', texto: '¿Les pagan a proveedores en dólares u otra moneda?', ayuda: 'Si es así, la orden de pago tiene que pedir la cotización del día.',
          opciones: ['No, siempre en pesos', 'Sí, a veces en dólares', 'Sí, en dólares y en otras monedas'] },
        { id: 'tarjeta_cuotas', texto: 'Cuando pagan una factura con la tarjeta de crédito de la empresa, ¿cuándo queda pagada la factura?',
          opciones: ['En el momento: la deuda pasa a la tarjeta y se cancela con el resumen', 'A medida que se pagan las cuotas del resumen'] },
      ]],
      ['Proveedores y clientes', [
        { id: 'prov_codigos', texto: '¿Los proveedores tienen un código en TANGO que quieran mantener?',
          opciones: ['Sí, mantener los códigos de TANGO', 'No, que el sistema los numere solo'] },
        { id: 'prov_listado', texto: '¿Pueden exportar de TANGO el listado de proveedores con código, razón social, nombre de fantasía y CUIT?',
          opciones: ['Sí, lo exporto y te lo paso', 'Necesito ayuda para exportarlo'] },
        { id: 'clientes', texto: 'El buscador por código, razón social, nombre de fantasía y CUIT, ¿lo quieren también para clientes?',
          opciones: ['Sí, igual que para proveedores', 'No hace falta para clientes'] },
      ]],
    ],
  },
};
const OTRO = 'Otro';
if (typeof module !== 'undefined') module.exports = { ENCUESTAS, OTRO };
