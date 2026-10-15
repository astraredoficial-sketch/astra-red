# Notificaciones de AstraRed

AstraRed guarda los avisos en la bandeja de la app y puede mostrarlos en la
barra de notificaciones de Android. Los tipos cubiertos son mensajes nuevos,
conexiones mutuas, compatibilidades astrales altas y recordatorios de fechas
guardadas para el día siguiente.

## Despliegue de Supabase

Aplica la migración y despliega la Edge Function actualizada:

```powershell
supabase db push
supabase functions deploy notify-new-message
```

La migración crea `app_notifications` y `push_devices`, sus políticas RLS y
activa la tabla de avisos en Realtime. Los recordatorios del calendario usan
el trabajo diario `astrared-astral-reminders` ya configurado en el proyecto;
la función conserva el control de `CRON_SECRET`.

## Configuración Firebase / Android

1. En el proyecto Firebase `astrared-397ec`, registra una app Android con el ID
   `com.astrared.app` y habilita Firebase Cloud Messaging.
2. Descarga `google-services.json` y guárdalo como
   `android/app/google-services.json`. El archivo se excluye de Git; no lo
   agregues al repositorio.
3. En la configuración del proyecto Firebase, crea una clave de cuenta de
   servicio con permiso para enviar mensajes de Firebase Cloud Messaging.
   Añade el JSON completo como secreto `FCM_SERVICE_ACCOUNT_JSON` en
   **Supabase → Edge Functions → Secrets**. No lo guardes en el código, en
   archivos `.env` versionados ni en el repositorio.
4. Sincroniza y compila la app Android:

   ```powershell
   npm run android:sync
   .\android\gradlew.bat -p android assembleRelease
   ```

5. En cada dispositivo, inicia sesión en la app y activa los avisos desde
   **Cuenta → Activar notificaciones en Android**. Android mostrará el permiso
   del sistema; la persona debe aceptarlo.

El servicio guarda primero el aviso dentro de AstraRed. Si FCM aún no está
configurado o un dispositivo no tiene permiso, el aviso seguirá disponible en
la bandeja de notificaciones y la función lo registrará en sus logs.

## Comprobación funcional

- **Mensaje:** envía un mensaje a una cuenta con un dispositivo Android
  registrado.
- **Conexión mutua:** completa un `like` recíproco entre dos perfiles.
- **Compatibilidad alta:** termina el onboarding de una cuenta nueva que
  supere el 85% de afinidad recíproca con perfiles existentes. Se avisa como
  máximo a los tres perfiles mejor puntuados, excluyendo bloqueos y matches
  previos.
- **Calendario:** guarda una fecha para el día siguiente y espera el trabajo
  diario de `09:00 UTC`.

El aviso push abre la sección relacionada de AstraRed. Al abrirse la app, los
avisos también aparecen en `/notificaciones` y se pueden marcar como leídos.
