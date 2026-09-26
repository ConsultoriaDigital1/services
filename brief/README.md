# Brief web

Formulario genérico en `https://consultoriadigital.io/brief/`: enviar este mismo enlace a cada cliente. No contiene respuestas de AVC. Cada envío se identifica por empresa, responsable, email e ID único.

Incluye las 15 secciones del documento, servicios repetibles y adjuntos JPG, PNG, WEBP y PDF (8 archivos, 5 MB por archivo, 15 MB en total). Los videos y otros materiales pueden compartirse mediante enlaces. El guardado local es opcional y solo conserva respuestas, nunca archivos; no sincroniza entre dispositivos.

Los envíos se consultan en `/admin/brief/`, con la contraseña del panel existente. Los archivos requieren autenticación y se descargan como adjuntos. No existen listados públicos ni enlaces públicos a los materiales.

## Publicación

1. Publicar los cambios del sitio estático por el procedimiento habitual de GitHub Pages. Las carpetas `brief/` y `admin/brief/` deben incluirse.
2. Actualizar también el checkout del VPS (incluyendo `brief/schema.js`, utilizado por el backend) y reiniciar `cd-chat-api` con PM2. No requiere nuevas dependencias. Si se reinstala: `pnpm install --frozen-lockfile` en `server/`.
3. En el bloque `server` de Nginx de `api.consultoriadigital.io`, configurar `client_max_body_size 23m;` y recargar luego de validar con `nginx -t`. El JSON transporta archivos codificados en base64; el límite de la API es 22 MB.
4. Mantener `ADMIN_PASSWORD` y `ALLOWED_ORIGINS` configurados. Para pruebas locales agregar el origen del servidor estático, por ejemplo `http://localhost:8080`.
5. Asegurar escritura y espacio disponible en `DATA_DIR`. Respaldar la carpeta completa `DATA_DIR/briefs/`, que contiene respuestas y adjuntos privados. No servir ese directorio por HTTP. Definir limpieza y retención según los proyectos finalizados.
6. Verificar desde producción un envío con imagen y su descarga desde el panel privado.

La API admite 10 intentos por IP por hora para este formulario. Los reintentos dentro de la misma pestaña usan el mismo ID y no duplican el envío. Los archivos se validan por tamaño y firma de formato; no hay análisis antivirus integrado.

## Verificación local

`pnpm --dir server test:brief` prueba persistencia, reintentos, separación entre empresas, validación de archivos y acceso privado a las descargas. La prueba utiliza un directorio temporal y lo elimina al terminar.
