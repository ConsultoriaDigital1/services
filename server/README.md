# cd-chat-api — asistente de agendamiento con DeepSeek

Proxy mínimo entre el sitio y la API de DeepSeek. Existe por una sola razón:
**la API key nunca puede estar en el JavaScript del sitio**, porque cualquiera la vería
en el código fuente y podría gastar el crédito.

- El sitio (GitHub Pages) llama a este servicio.
- Este servicio agrega la key y consulta a DeepSeek.
- La respuesta vuelve en streaming, palabra por palabra.

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
```

`.env` está en el `.gitignore`: no se sube al repo.

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

## Mantenimiento

- **Qué sabe la IA**: `knowledge.js`. Si cambia un servicio en la web, actualizalo ahí también.
- **Límite de uso**: 40 mensajes por IP por hora (`MAX_REQUESTS` en `server.js`).
- **Idioma**: lo manda el sitio según el selector; el prompt se adapta a es/en/pt.
- **Leads**: cuando la IA junta nombre + contacto + necesidad, el navegador dispara el mismo
  formsubmit que usa el formulario de contacto, con el asunto "Reunión solicitada desde el asistente IA".
