# cd-chat-api — asistente de agendamiento y tests de automatización

Backend del sitio. Hace dos cosas:

**1. Proxy de DeepSeek** para el asistente. Existe por una sola razón:
**la API key nunca puede estar en el JavaScript del sitio**, porque cualquiera la vería
en el código fuente y podría gastar el crédito.

- El sitio (GitHub Pages) llama a este servicio.
- Este servicio agrega la key y consulta a DeepSeek.
- La respuesta vuelve en streaming, palabra por palabra.

**2. Registro de los tests de `/test`** y disparo del flujo de n8n. El sitio es estático,
así que no puede guardar nada: cada test se guarda acá y desde acá se le avisa a n8n,
que arma el PDF y lo manda por wasender. El panel de `consultoriadigital.io/admin` lee
de este servicio.

## 1. Subir e instalar

```bash
# en el VPS
cd /var/www
git clone <repo> consultoriadigital && cd consultoriadigital/server
npm install
```

## 2. Cargar la API key

```bash
cp .env.example .env
nano .env
```

```ini
DEEPSEEK_API_KEY=sk-...            # la key de platform.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3060
ALLOWED_ORIGINS=https://consultoriadigital.io,https://www.consultoriadigital.io

# Flujo de n8n que arma el PDF y lo manda por wasender
N8N_WEBHOOK_URL=https://n8n.srv1224751.hstgr.cloud/webhook/cuestionario

# Panel /admin — sin ADMIN_PASSWORD el panel queda deshabilitado
ADMIN_PASSWORD=una-contraseña-larga
DATA_DIR=./data
```

`.env` está en el `.gitignore`: no se sube al repo. `server/data/` también, porque son
datos personales de clientes.

El archivo de datos (`server/data/tests.jsonl`) lo crea el servicio solo, pero
**el directorio tiene que ser escribible por el usuario con el que corre pm2**.

## 3. Levantar con pm2

```bash
pm2 start server.js --name cd-chat-api
pm2 save
pm2 startup          # para que arranque solo al reiniciar el VPS
pm2 logs cd-chat-api # ver los logs
```

Probar que responde: `curl http://localhost:3060/api/health` → `{"ok":true,...}`

## 4. Publicarlo por HTTPS (paso obligatorio)

El sitio corre en `https://`, así que el navegador **bloquea** cualquier llamada a
`http://IP:3060`. Hace falta un subdominio con certificado.

1. En el DNS de `consultoriadigital.io`, crear un registro `A`:
   `api` → la IP del VPS.

2. Nginx (`/etc/nginx/sites-available/api.consultoriadigital.io`):

```nginx
server {
    server_name api.consultoriadigital.io;

    location / {
        proxy_pass http://127.0.0.1:3060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # imprescindible para el streaming del chat
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/api.consultoriadigital.io /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.consultoriadigital.io
```

3. Verificar desde afuera:
   `curl https://api.consultoriadigital.io/api/health`

## 5. Apuntar el sitio al servicio

En `chat.js`, primera constante:

```js
const CHAT_API = window.CD_CHAT_API || 'https://api.consultoriadigital.io/api/chat';
```

Si usás otro subdominio, cambialo ahí y volvé a publicar el sitio.

## 6. Los tests de /test y el panel /admin

Cuando alguien termina el test, el navegador manda todo a `POST /api/test` y el servicio
lo guarda. La lectura personalizada de la IA llega por streaming **después**, así que se
avisa aparte con `POST /api/test/:id/lectura` y recién ahí se dispara n8n, para que el PDF
salga completo. Si la persona cierra la pestaña antes, se dispara igual a los 25 segundos
(`N8N_ESPERA_IA_MS`).

El payload que recibe n8n trae el contacto (con `whatsapp_e164` ya normalizado para
wasender), el resultado con horas y semanas perdidas, las 8 respuestas, las oportunidades,
el plan de 3 pasos y la lectura de la IA. Está armado en `n8n.js`.

Si n8n está caído se reintenta 3 veces y queda registrado el error: desde el panel se
puede volver a disparar con el botón **Reenviar a n8n** (también sirve para regenerar el PDF).

**Panel**: `https://consultoriadigital.io/admin`, con la contraseña de `ADMIN_PASSWORD`.
Muestra todos los tests, con buscador, filtros, detalle pregunta por pregunta y export a CSV.

**Backup**: todo vive en `server/data/tests.jsonl`, una línea JSON por evento. Copiarlo
es todo el backup que hace falta.

## Mantenimiento

- **Qué sabe la IA**: `knowledge.js`. Si cambia un servicio en la web, actualizalo ahí también.
- **Límite de uso**: 40 mensajes por IP por hora (`MAX_REQUESTS`), 60 tests (`MAX_TESTS`) y
  20 logins (`MAX_LOGINS`). Cada uno lleva su propio contador.
- **Idioma**: lo manda el sitio según el selector; el prompt se adapta a es/en/pt.
- **Leads**: cuando la IA junta nombre + contacto + necesidad, el navegador dispara el mismo
  formsubmit que usa el formulario de contacto, con el asunto "Reunión solicitada desde el asistente IA".
  El test de `/test` también sigue mandando su formsubmit, además de guardarse acá.
- **Al desplegar**: `git pull && pm2 restart cd-chat-api`. Chequear con
  `curl https://api.consultoriadigital.io/api/health`, que informa si el panel y n8n están
  configurados y cuántos tests hay guardados.
