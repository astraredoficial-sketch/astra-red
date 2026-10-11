# AstraRed

Aplicación de cartas natales, compatibilidad astrológica y conversaciones entre
personas con afinidad mutua. Usa Next.js, Supabase Auth, PostgreSQL y Realtime.

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

Aplica [`supabase/migrations/20261011000100_profiles_matches_chat.sql`](./supabase/migrations/20261011000100_profiles_matches_chat.sql)
en el SQL Editor de Supabase (o mediante Supabase CLI). La migración crea el
perfil público, los datos privados de nacimiento, los me gusta mutuos y los
mensajes; activa RLS y agrega las reglas de Realtime para el chat.

En **Authentication → URL Configuration**, añade las URL locales y de Vercel a
la lista de redirect URLs permitidas para que funcione la confirmación de correo.
Después de aplicar la migración, vuelve a intentar el registro: el formulario
mostrará el error de Supabase si falla la escritura y no te enviará a una carta
que no se haya guardado.

## Verificación

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
