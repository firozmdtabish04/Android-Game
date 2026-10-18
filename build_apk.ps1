$ErrorActionPreference = "Stop"

$BUILD_TOOLS = "C:\Users\mdtab\AppData\Local\Android\Sdk\build-tools\34.0.0"
$PLATFORM = "C:\Users\mdtab\AppData\Local\Android\Sdk\platforms\android-34\android.jar"
$JAVAC = "D:\Node\jdk-27_windows-x64_bin\jdk-27\bin\javac.exe"

$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$ZIPALIGN = "$BUILD_TOOLS\zipalign.exe"
$APKSIGNER = "$BUILD_TOOLS\apksigner.bat"
$D8 = "$BUILD_TOOLS\d8.bat"

Write-Host ">>> Starting MITTI RUN APK Build..." -ForegroundColor Cyan

# 0. Bundle Web Assets
Write-Host ">>> Step 0: Bundling web engine into single IIFE bundle..." -ForegroundColor Yellow
npx esbuild "web_playable\game.js" --bundle --minify --format=iife --outfile="web_playable\bundle.js"

$ASSETS_DIR = "android\app\src\main\assets"
if (-not (Test-Path $ASSETS_DIR)) { New-Item -ItemType Directory -Force -Path $ASSETS_DIR | Out-Null }
Copy-Item "web_playable\index.html" -Destination "$ASSETS_DIR\index.html" -Force
Copy-Item "web_playable\style.css" -Destination "$ASSETS_DIR\style.css" -Force
Copy-Item "web_playable\bundle.js" -Destination "$ASSETS_DIR\bundle.js" -Force
Copy-Item "web_playable\lucide.min.js" -Destination "$ASSETS_DIR\lucide.min.js" -Force

# Prep build directory
$BUILD_DIR = "d:\FullStack\UIUX\AndroidGame\build"
if (Test-Path $BUILD_DIR) { Remove-Item -Recurse -Force $BUILD_DIR }
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\gen" | Out-Null
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\obj" | Out-Null
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\compiled_res" | Out-Null

# 1. Compile resources with AAPT2
Write-Host ">>> Step 1: Compiling resources with aapt2..." -ForegroundColor Yellow
& $AAPT2 compile --dir "android\app\src\main\res" -o "$BUILD_DIR\compiled_res.zip"

# 2. Link resources and generate R.java
Write-Host ">>> Step 2: Linking APK and generating R.java..." -ForegroundColor Yellow
& $AAPT2 link -I $PLATFORM `
    --manifest "android\app\src\main\AndroidManifest.xml" `
    --min-sdk-version 24 `
    --target-sdk-version 34 `
    -o "$BUILD_DIR\unaligned.apk" `
    --java "$BUILD_DIR\gen" `
    -A $ASSETS_DIR `
    --auto-add-overlay `
    "$BUILD_DIR\compiled_res.zip"

# 3. Compile Java source files
Write-Host ">>> Step 3: Compiling Java classes..." -ForegroundColor Yellow
$JAVA_FILES = Get-ChildItem -Path "$BUILD_DIR\gen", "android\app\src\main\java" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
& $JAVAC --release 17 -cp $PLATFORM -d "$BUILD_DIR\obj" $JAVA_FILES

# 4. Dex bytecode with D8
Write-Host ">>> Step 4: Converting to classes.dex with D8..." -ForegroundColor Yellow
$CLASS_FILES = Get-ChildItem -Path "$BUILD_DIR\obj" -Filter "*.class" -Recurse | Select-Object -ExpandProperty FullName
& $D8 --min-api 24 --lib $PLATFORM --output "$BUILD_DIR" $CLASS_FILES

if (-not (Test-Path "$BUILD_DIR\classes.dex")) {
    throw "classes.dex generation failed! Aborting build."
}

# 5. Add classes.dex to APK
Write-Host ">>> Step 5: Adding classes.dex to APK package..." -ForegroundColor Yellow
& "D:\Node\jdk-27_windows-x64_bin\jdk-27\bin\jar.exe" -uf "$BUILD_DIR\unaligned.apk" -C "$BUILD_DIR" "classes.dex"

# 6. Zipalign APK
Write-Host ">>> Step 6: Aligning APK with zipalign..." -ForegroundColor Yellow
& $ZIPALIGN -f -v -p 4 "$BUILD_DIR\unaligned.apk" "$BUILD_DIR\aligned.apk" | Out-Null

# 7. Sign APK with debug key
Write-Host ">>> Step 7: Signing APK with apksigner..." -ForegroundColor Yellow
& $APKSIGNER sign --ks "android\debug.keystore" --ks-pass pass:android --ks-key-alias androiddebugkey --out "MittiRun.apk" "$BUILD_DIR\aligned.apk"

# Verify APK
Write-Host ">>> Step 8: Verifying signature..." -ForegroundColor Yellow
& $APKSIGNER verify -v "MittiRun.apk"

# Copy to web_playable so it can be downloaded directly from phone
Copy-Item "MittiRun.apk" -Destination "web_playable\MittiRun.apk" -Force

$apk = Get-Item "MittiRun.apk"
Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "SUCCESS! MITTI RUN APK is READY:" -ForegroundColor Green
Write-Host "File: $($apk.FullName)" -ForegroundColor White
Write-Host "Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Green
