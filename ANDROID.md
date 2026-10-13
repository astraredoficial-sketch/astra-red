# App Android de AstraRed

La app Android usa Capacitor y abre la versión web publicada en
`https://astrared.vip`. Por eso, las mejoras de la página se reflejan en
la app sin reinstalar el APK. El dispositivo debe tener conexión a internet.
Los cambios que requieran código nativo sí necesitarán una nueva compilación.

## Requisitos para compilar

- JDK 21 (required by the Capacitor Android share/filesystem plugins)
- Android SDK con Android SDK Platform 36 y Android SDK Build-Tools
- Licencias del Android SDK aceptadas en Android Studio o con `sdkmanager --licenses`

## Compilar un APK de prueba

Desde la raíz del proyecto:

```powershell
npm install
npm run android:sync
Set-Location android
.\gradlew.bat assembleDebug
```

El APK de prueba queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

La tarjeta de descarga de Home debe habilitarse cuando ese APK se haya probado y
se haya publicado en una ruta de descarga válida.

## Alcance actual

Esta configuración remota es para pruebas privadas del APK. Capacitor indica
que `server.url` está destinado a recarga en vivo y no a una compilación de
producción. Antes de distribuir la app ampliamente, habrá que reemplazar esta
configuración por una estrategia de publicación apropiada y volver a validar
la experiencia Android.
