# AstraRed

Aplicación de cartas natales, compatibilidad astrológica y conversaciones entre
personas con afinidad mutua. Usa Next.js, Supabase Auth, PostgreSQL y Realtime.

## Motor astral y privacidad

La carta natal convierte la hora civil y la zona horaria del lugar de nacimiento
a UTC y calcula longitudes eclípticas geocéntricas con Astronomy Engine. El mapa
usa zodiaco tropical y casas iguales (la primera cúspide es el Ascendente); el
Nodo Norte es medio. Si la hora no se conoce, se usa el mediodía como referencia
y la Luna, el Ascendente y las casas se señalan como aproximados. En sinastría se
comparan aspectos angulares ponderados entre planetas; si falta la hora se
excluyen los contactos de Luna y Ascendente. La afinidad es una interpretación
astrológica simbólica, no una medida científica ni una garantía sobre una
relación.

La opción de compartir la carta genera un PNG astral propio (no una captura de
pantalla) que incluye la rueda, posiciones planetarias, cúspides de casas y
lecturas. Por privacidad, omite la fecha, hora y lugar de nacimiento. En Android
se comparte el archivo mediante el menú nativo; sincroniza Capacitor con
`npm run android:sync` después de instalar dependencias para registrar los
plugins de archivos y compartir.

El país, la ciudad y las coordenadas se guardan en `birth_details` para calcular
la carta, pero no se leen desde la tabla pública de perfiles. La migración
`20261012000300_private_birth_location.sql` retira a las cuentas autenticadas
permisos de lectura y escritura de las columnas de ubicación del perfil.

## Desarrollo local

Instala dependencias y arranca el servidor:

```bash
npm install
npm run dev
```

Crea `.env.local` con la URL y la clave pública (publishable/anon) de tu proyecto
Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

No uses la `service_role` key en variables `NEXT_PUBLIC_*` ni en código del
navegador. En Vercel configura las mismas dos variables para los entornos que
vayas a desplegar.

## Preparar Supabase

Aplica las migraciones pendientes de [`supabase/migrations`](./supabase/migrations)
en orden en el SQL Editor de Supabase (o mediante Supabase CLI). Crean perfiles,
conexiones, mensajes, fechas astrales, estado de lectura y registro de avisos;
activan RLS y Realtime para el chat y el contador de mensajes sin leer. Las
migraciones `20261012000300_private_birth_location.sql` y
`20261012000400_chat_ai.sql` protegen la ubicación natal y exigen pasar los
mensajes salientes por el filtro del servidor.

En **Authentication → URL Configuration**, usa `https://astrared.vip` como
Site URL y permite `https://astrared.vip/**`, las URL locales y
`https://astra-red.vercel.app/**` en Redirect URLs para que funcionen la
confirmación de correo y los enlaces antiguos.
Después de aplicar la migración, vuelve a intentar el registro: el formulario
mostrará el error de Supabase si falla la escritura y no te enviará a una carta
que no se haya guardado.

## Correo corporativo y notificaciones de AstraRed

El dominio `astrared.vip` está registrado en Spaceship. Los registros DNS de
verificación, DKIM, DMARC y seguimiento de Mailtrap están publicados y
verificados; Mailtrap confirmó que el dominio puede enviar correos. El remitente
`notificaciones@astrared.vip` se reenvía al correo de contacto configurado en
Spaceship. Mailtrap envía correos, pero no crea una bandeja de entrada propia.

El SMTP personalizado de Supabase ya está habilitado para los correos de
confirmación de cuenta, con `live.smtp.mailtrap.io`, puerto `587`, usuario
`api` y `notificaciones@astrared.vip` como remitente. El token de Mailtrap se
guarda como contraseña en Supabase y no se incluye en el repositorio. Personaliza
la plantilla en **Authentication → Email Templates** si hace falta. Esta
configuración SMTP es independiente de la función de notificaciones descrita
abajo.

La función `notify-new-message` envía por la API transaccional de Mailtrap los
avisos de mensajes y conexiones mutuas, y procesa recordatorios de fechas
astrales. Despliégala con Supabase CLI:

```bash
supabase functions deploy notify-new-message
supabase functions deploy delete-account
supabase functions deploy chat-assistant --no-verify-jwt
```

Configura estos secretos en **Supabase → Edge Functions → Secrets**. Las
variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya
están disponibles automáticamente:

```text
MAILTRAP_API_TOKEN=<token API con acceso de envío para astrared.vip>
MAILTRAP_FROM_EMAIL=notificaciones@astrared.vip
APP_URL=https://astrared.vip
CRON_SECRET=<secreto aleatorio largo para las alertas programadas>
OPENAI_API_KEY=<clave privada de OpenAI>
OPENAI_CHAT_MODEL=gpt-4o-mini
```

`chat-assistant` valida la sesión y la conexión mutua, revisa cada mensaje
saliente con el endpoint de moderación de OpenAI y solo entonces lo guarda con
la clave de servicio. Bloquea contenido sexual explícito y acoso. Las cuentas
autenticadas no tienen permiso para insertar mensajes directamente. También
genera tres sugerencias para romper el hielo a partir de los signos solares y
lunares de ambas cartas cuando se conocen ambas horas. El límite es de 30
acciones de IA por usuario por hora. Configura `OPENAI_API_KEY` como secreto;
nunca lo incluyas en `NEXT_PUBLIC_*` ni en el repositorio. El chat informa que
el texto enviado se procesa con OpenAI; no se envía el historial del chat al
generador de sugerencias.

Los tokens API se crean en **Mailtrap → Settings → API Tokens**; limita el token
a `astrared.vip` y guárdalo solo como secreto de Edge Function. La entrega de
prueba fue aceptada por Mailtrap para `astrared.oficial@gmail.com`.

La función valida las sesiones de usuario por sí misma. Desactiva **Verify JWT
with legacy secret** en su configuración y conserva `CRON_SECRET` tanto en Edge
Function Secrets como en Vault. En el proyecto actual, `pg_cron` y `pg_net`
están habilitadas; Vault contiene `astrared_project_url` y
`astrared_cron_secret`. Para una instalación nueva, crea esos dos secretos desde
**Integrations → Vault → Secrets**; el segundo debe ser el mismo valor aleatorio
configurado como `CRON_SECRET` en Edge Function Secrets. No hace falta guardar
una clave pública de API en Vault ni enviarla en la llamada programada.

El trabajo `astrared-astral-reminders` ya está activo y programa los avisos a
las `09:00 UTC` cada día. Para volver a crearlo en otro proyecto, comprueba
primero que no exista ya un trabajo con ese nombre en `cron.job` y ejecuta:

```sql
select cron.schedule(
  'astrared-astral-reminders',
  '0 9 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'astrared_project_url'
    ) || '/functions/v1/notify-new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'astrared_cron_secret'
      )
    ),
    body := '{"event":"astral-reminders"}'::jsonb
  );
  $$
);
```

## Alerta VIP de compatibilidad perfecta

La sección **Destinos** puede mostrar una alerta de conexión cuando la
compatibilidad calculada llega a 100% y ambos perfiles tienen membresía VIP
activa. La alerta usa las fotos, nombres, ciudades y posiciones públicas de las
cartas de ambos perfiles; no revela la fecha ni la hora de nacimiento. No exige
que exista un match mutuo.

Las membresías se guardan en `public.vip_memberships` y no pueden ser creadas ni
modificadas desde una cuenta normal. Hasta integrar pagos, se administran desde
el SQL Editor: consulta el UUID en **Authentication → Users** y registra la
fecha de vencimiento:

```sql
insert into public.vip_memberships (user_id, expires_at)
values ('<user-uuid>', now() + interval '1 month')
on conflict (user_id) do update
set expires_at = excluded.expires_at;
```

El estado VIP se comprueba en el servidor; el cliente no decide ni puede
conceder acceso. La alerta se habilita cuando se despliega la migración
`20261012000100_vip_memberships.sql`.

La tarea envía, una sola vez, los avisos de las fechas astrales guardadas para
el día siguiente. Si falla algún correo, la función devuelve un error y registra
el detalle para que la tarea pueda reintentarse ese día.

Los correos de mensajes y conexiones incluyen un enlace a Mensajes; los avisos
astrales incluyen el evento y su recomendación. No se copia el contenido privado
del chat. Si Mailtrap rechaza un envío, el mensaje o la conexión siguen guardados
y el error queda registrado para poder reintentar el aviso.

La función `delete-account` valida la sesión del usuario, elimina sus fotos del
bucket `profile-photos` y elimina definitivamente su usuario de Supabase Auth
(no como borrado lógico). Las tablas relacionadas usan claves foráneas con
`ON DELETE CASCADE`, por lo que también se eliminan perfiles, datos de
nacimiento, gustos, conexiones, mensajes, fechas astrales, avisos y membresía
VIP. La respuesta de éxito es `{ "success": true }`; la interfaz solo cierra la
sesión local y confirma el borrado cuando recibe esa respuesta. Tras completarse,
el usuario puede registrarse de nuevo con el mismo correo. No actives la opción
**Verify JWT with legacy secret** para esta función: valida el token de sesión
actual mediante Supabase Auth antes de usar la clave de servicio en el servidor.

## Verificación

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
