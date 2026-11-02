$ErrorActionPreference = "Stop"

function ConvertTo-PlainText {
    param([Parameter(Mandatory)][Security.SecureString]$Secret)

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$androidRoot = Join-Path $repositoryRoot "android"
$gradleFile = Join-Path $androidRoot "app\build.gradle"
$manifestFile = Join-Path $androidRoot "app\src\main\AndroidManifest.xml"
$keyAlias = "astrared"

if (-not (Test-Path $env:LOCALAPPDATA)) {
    throw "No se encontro el perfil local de Windows para guardar la llave."
}

$keystoreDirectory = Join-Path $env:LOCALAPPDATA "AstraRed\signing"
$keystoreFile = Join-Path $keystoreDirectory "astrared-release-key.jks"
$keytool = Get-Command keytool.exe -ErrorAction Stop
$sdkDirectory = $env:ANDROID_SDK_ROOT
if (-not $sdkDirectory) {
    $sdkDirectory = $env:ANDROID_HOME
}
if (-not $sdkDirectory) {
    $sdkDirectory = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}
if (-not (Test-Path $sdkDirectory)) {
    throw "No se encontro Android SDK. Configura ANDROID_SDK_ROOT y vuelve a intentar."
}

$buildToolsDirectory = Get-ChildItem (Join-Path $sdkDirectory "build-tools") -Directory |
    Where-Object { $_.Name -match '^\d+(\.\d+)*$' } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1
if (-not $buildToolsDirectory) {
    throw "No se encontraron Android SDK Build Tools."
}

$apksigner = Join-Path $buildToolsDirectory.FullName "apksigner.bat"
$zipalign = Join-Path $buildToolsDirectory.FullName "zipalign.exe"
foreach ($toolPath in @($apksigner, $zipalign, $gradleFile, $manifestFile)) {
    if (-not (Test-Path $toolPath)) {
        throw "No se encontro una herramienta o archivo requerido: $toolPath"
    }
}

$gradleSource = Get-Content $gradleFile -Raw
$versionNameMatch = [regex]::Match($gradleSource, '(?m)^\s*versionName\s+["'']([^"'']+)["'']')
$versionCodeMatch = [regex]::Match($gradleSource, '(?m)^\s*versionCode\s+(\d+)')
if (-not $versionNameMatch.Success -or -not $versionCodeMatch.Success) {
    throw "No se pudo leer la version Android desde android\app\build.gradle."
}

$versionName = $versionNameMatch.Groups[1].Value
$versionCode = [int]$versionCodeMatch.Groups[1].Value
$safeVersion = $versionName -replace '[^A-Za-z0-9._-]', '-'
$apkSource = Join-Path $androidRoot "app\build\outputs\apk\release\app-release.apk"
$downloadFileName = "astrared-android-v$safeVersion.apk"
$releaseMetadataFile = Join-Path $repositoryRoot "src\lib\android-release.json"
$downloadDirectory = Join-Path $repositoryRoot "public\downloads"
$password = $null

if (-not (Test-Path $keystoreFile)) {
    Write-Host "Se creara la primera llave oficial de AstraRed en:"
    Write-Host $keystoreFile
    Write-Host "Conserva una copia de seguridad cifrada. Perder esta llave impedira actualizar la app instalada."
    $securePassword = Read-Host "Crea una contrasena de al menos 16 caracteres" -AsSecureString
    $confirmation = Read-Host "Confirma la contrasena" -AsSecureString
    $password = ConvertTo-PlainText $securePassword
    $confirmationPassword = ConvertTo-PlainText $confirmation
    if ($password.Length -lt 16) {
        throw "La contrasena debe tener al menos 16 caracteres."
    }
    if ($password -cne $confirmationPassword) {
        throw "Las contrasenas no coinciden."
    }
    $confirmationPassword = $null
}
else {
    $securePassword = Read-Host "Ingresa la contrasena de la llave de AstraRed" -AsSecureString
    $password = ConvertTo-PlainText $securePassword
    if ($password.Length -eq 0) {
        throw "La contrasena no puede estar vacia."
    }
}

try {
    New-Item -ItemType Directory -Path $keystoreDirectory -Force | Out-Null
    $env:ASTRARED_UPLOAD_STORE_FILE = $keystoreFile
    $env:ASTRARED_UPLOAD_STORE_PASSWORD = $password
    $env:ASTRARED_UPLOAD_KEY_ALIAS = $keyAlias
    $env:ASTRARED_UPLOAD_KEY_PASSWORD = $password

    if (-not (Test-Path $keystoreFile)) {
        & $keytool.Source -genkeypair -v `
            -keystore $keystoreFile `
            -alias $keyAlias `
            -keyalg RSA `
            -keysize 4096 `
            -validity 10000 `
            -dname "CN=AstraRed, O=AstraRed, C=VE" `
            -storepass:env ASTRARED_UPLOAD_STORE_PASSWORD `
            -keypass:env ASTRARED_UPLOAD_KEY_PASSWORD
        if ($LASTEXITCODE -ne 0) {
            throw "keytool no pudo crear la llave de firma."
        }
    }
    else {
        & $keytool.Source -list `
            -keystore $keystoreFile `
            -alias $keyAlias `
            -storepass:env ASTRARED_UPLOAD_STORE_PASSWORD | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo abrir la llave o encontrar el alias esperado."
        }
    }

    Push-Location $androidRoot
    try {
        & .\gradlew.bat assembleRelease --no-daemon
        if ($LASTEXITCODE -ne 0) {
            throw "La compilacion Android release fallo."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    $env:ASTRARED_UPLOAD_STORE_FILE = $null
    $env:ASTRARED_UPLOAD_STORE_PASSWORD = $null
    $env:ASTRARED_UPLOAD_KEY_ALIAS = $null
    $env:ASTRARED_UPLOAD_KEY_PASSWORD = $null
    $password = $null
    $confirmationPassword = $null
}

if (-not (Test-Path $apkSource)) {
    throw "Gradle termino, pero no se encontro el APK esperado: $apkSource"
}

$alignmentOutput = & $zipalign -c -v 4 $apkSource 2>&1
if ($LASTEXITCODE -ne 0) {
    $alignmentOutput | Write-Host
    throw "La comprobacion de alineacion zipalign fallo."
}

$signatureOutput = & $apksigner verify --verbose --print-certs $apkSource 2>&1
if ($LASTEXITCODE -ne 0) {
    $signatureOutput | Write-Host
    throw "apksigner no pudo verificar la firma del APK."
}

$signatureText = $signatureOutput -join [Environment]::NewLine
# The app supports Android 7 (API 24) and newer; v1 is only needed below API 24.
foreach ($scheme in @("v2", "v3")) {
    if ($signatureText -notmatch "Verified using $scheme scheme.*:\s*true") {
        $signatureOutput | Write-Host
        throw "El APK no tiene una firma valida con el esquema $scheme requerido."
    }
}
if ($signatureText -notmatch "Number of signers:\s*1") {
    throw "El APK debe tener exactamente un firmante."
}

$certificateMatch = [regex]::Match(
    $signatureText,
    'Signer #1 certificate SHA-256 digest:\s*([0-9a-f]{64})',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
if (-not $certificateMatch.Success) {
    throw "No se pudo leer la huella SHA-256 del certificado de firma."
}

$manifest = [xml](Get-Content $manifestFile -Raw)
$androidNamespace = "http://schemas.android.com/apk/res/android"
$permissions = @(
    $manifest.SelectNodes("/manifest/uses-permission") |
        ForEach-Object { $_.GetAttribute("name", $androidNamespace) }
)

$apkHash = (Get-FileHash $apkSource -Algorithm SHA256).Hash.ToLowerInvariant()
$apkSize = (Get-Item $apkSource).Length
$releasedAt = Get-Date -Format "yyyy-MM-dd"
$releaseMetadata = [ordered]@{
    available = $true
    packageName = "com.astrared.app"
    versionName = $versionName
    versionCode = $versionCode
    fileName = $downloadFileName
    releasedAt = $releasedAt
    sizeBytes = $apkSize
    sha256 = $apkHash
    certificateSha256 = $certificateMatch.Groups[1].Value.ToLowerInvariant()
    permissions = $permissions
}

New-Item -ItemType Directory -Path $downloadDirectory -Force | Out-Null
Copy-Item -LiteralPath $apkSource -Destination (Join-Path $downloadDirectory $downloadFileName) -Force
$metadataJson = $releaseMetadata | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText(
    $releaseMetadataFile,
    $metadataJson + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

Push-Location $repositoryRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        throw "La compilacion web fallo despues de generar los metadatos de release."
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "APK firmado, alineado y verificado:"
Write-Host (Join-Path $downloadDirectory $downloadFileName)
Write-Host "SHA-256: $apkHash"
Write-Host "Certificado SHA-256: $($certificateMatch.Groups[1].Value.ToLowerInvariant())"
Write-Host "Llave privada conservada fuera del repositorio en: $keystoreFile"
