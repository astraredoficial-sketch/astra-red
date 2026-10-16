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

Ese APK usa la clave de depuración de Android; sirve para pruebas, no para
publicarlo en Google Play.

## Preparar APK y AAB de publicación

La clave de subida debe mantenerse fuera del repositorio y respaldarse en un
lugar seguro. No compartas su contraseña ni la subas a Git. Configura estas
propiedades en el archivo de usuario `~/.gradle/gradle.properties` (en Windows:
`%USERPROFILE%\.gradle\gradle.properties`):

```properties
ASTRARED_UPLOAD_STORE_FILE=C:/ruta/segura/astrared-upload.p12
ASTRARED_UPLOAD_STORE_PASSWORD=...
ASTRARED_UPLOAD_KEY_ALIAS=astrared-upload
ASTRARED_UPLOAD_KEY_PASSWORD=...
```

Después de cambiar `versionCode` a un valor superior al último publicado:

```powershell
npm run android:sync
.\android\gradlew.bat -p android assembleRelease bundleRelease
```

Los archivos firmados quedan en:

```text
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

El AAB firmado es el archivo que se sube a Play Console. No publiques el APK
`debug` ni archivos `unsigned`.

## Alcance pendiente antes de publicar

La app actualmente carga `https://astrared.vip` mediante `server.url`; no
incluye una copia local de la web y requiere conexión. La propia configuración
de Capacitor reserva `server.url` para recarga en vivo, por lo que estos
paquetes deben considerarse candidatos técnicos hasta reemplazar esa estrategia
y probar la experiencia Android completa. También hay que verificar en Play
Console el acceso a la app, la política de privacidad, la clasificación por
edad y los requisitos de la ficha antes de enviar una versión.
