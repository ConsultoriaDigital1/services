# Encuestas para clientes

Encuestas cortas para cerrar dudas con un cliente: cada pregunta es de opción única o múltiple y siempre tiene «Otro» con texto libre. La de Pino Soluciones está en `https://consultoriadigital.io/encuestas/pinosoluciones/`.

Las respuestas se ven en `/admin/encuestas/`, con la contraseña del panel, y se exportan a CSV. Lo que el cliente va completando queda en su navegador. Si vuelve y corrige, se actualiza la misma respuesta (el panel muestra cuántas veces la corrigió).

## Sumar una encuesta

1. Agregar la encuesta en `encuestas/schema.js`, con su clave (el slug de la URL), el cliente, el título, la intro y las secciones con sus preguntas (`id`, `texto`, `ayuda` opcional, `opciones`, `multiple` si se puede marcar más de una).
2. Copiar `encuestas/pinosoluciones/index.html` a `encuestas/<slug>/index.html` y cambiar `data-encuesta`.
3. Publicar el sitio y actualizar el VPS: el servidor valida contra el mismo `schema.js`.

No cambiar el `id` ni el texto de las opciones de una encuesta que ya tiene respuestas: las respuestas guardan el texto de la opción elegida.

## Publicación

1. Publicar el sitio estático por GitHub Pages, como siempre. Tienen que estar las carpetas `encuestas/` y `admin/encuestas/`.
2. En el VPS, actualizar el checkout (incluido `encuestas/schema.js`, que usa el backend) y reiniciar `cd-chat-api` con PM2. No hay dependencias nuevas.
3. Las respuestas se guardan en `DATA_DIR/encuestas.jsonl`. Respaldarlo con el resto de `DATA_DIR`.

La API admite 30 envíos por IP por hora (`MAX_ENCUESTAS`).

## Verificación local

`pnpm --dir server test:encuestas` prueba la validación contra el esquema, la corrección sin duplicar, el acceso privado del panel y el CSV.
