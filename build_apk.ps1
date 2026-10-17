$ErrorActionPreference = "Stop"

$BUILD_TOOLS = "C:\Users\mdtab\AppData\Local\Android\Sdk\build-tools\34.0.0"
$PLATFORM = "C:\Users\mdtab\AppData\Local\Android\Sdk\platforms\android-34\android.jar"
$JAVAC = "D:\Node\jdk-27_windows-x64_bin\jdk-27\bin\javac.exe"

$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$ZIPALIGN = "$BUILD_TOOLS\zipalign.exe"
$APKSIGNER = "$BUILD_TOOLS\apksigner.bat"
$D8 = "$BUILD_TOOLS\d8.bat"

Write-Host ">>> Starting MITTI RUN APK Build..." -ForegroundColor Cyan

# 0. Prep build directory
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
    -o "$BUILD_DIR\unaligned.apk" `
    --java "$BUILD_DIR\gen" `
    -A "android\app\src\main\assets" `
    --auto-add-overlay `
    "$BUILD_DIR\compiled_res.zip"

# 3. Compile Java source files
Write-Host ">>> Step 3: Compiling Java classes..." -ForegroundColor Yellow
$JAVA_FILES = Get-ChildItem -Path "$BUILD_DIR\gen", "android\app\src\main\java" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
& $JAVAC --release 17 -cp $PLATFORM -d "$BUILD_DIR\obj" $JAVA_FILES

# 4. Dex bytecode with D8
Write-Host ">>> Step 4: Converting to classes.dex with D8..." -ForegroundColor Yellow
$CLASS_FILES = Get-ChildItem -Path "$BUILD_DIR\obj" -Filter "*.class" -Recurse | Select-Object -ExpandProperty FullName
& $D8 --lib $PLATFORM --output "$BUILD_DIR" $CLASS_FILES

# 5. Add classes.dex to APK
Write-Host ">>> Step 5: Adding classes.dex to APK package..." -ForegroundColor Yellow
Set-Location $BUILD_DIR
# Using jar/tar or aapt to add classes.dex
& $AAPT2 link -I $PLATFORM `
    --manifest "d:\FullStack\UIUX\AndroidGame\android\app\src\main\AndroidManifest.xml" `
    -o "unaligned_dex.apk" `
    -A "d:\FullStack\UIUX\AndroidGame\android\app\src\main\assets" `
    --auto-add-overlay `
    "compiled_res.zip"

# Add classes.dex into unaligned.apk using jar or zip
& "D:\Node\jdk-27_windows-x64_bin\jdk-27\bin\jar.exe" -uf "unaligned.apk" "classes.dex"
Set-Location "d:\FullStack\UIUX\AndroidGame"

# 6. Zipalign APK
Write-Host ">>> Step 6: Aligning APK with zipalign..." -ForegroundColor Yellow
& $ZIPALIGN -f -v -p 4 "$BUILD_DIR\unaligned.apk" "$BUILD_DIR\aligned.apk" | Out-Null

# 7. Sign APK with debug key
Write-Host ">>> Step 7: Signing APK with apksigner..." -ForegroundColor Yellow
& $APKSIGNER sign --ks "android\debug.keystore" --ks-pass pass:android --ks-key-alias androiddebugkey --out "MittiRun.apk" "$BUILD_DIR\aligned.apk"

# Verify APK
Write-Host ">>> Step 8: Verifying signature..." -ForegroundColor Yellow
& $APKSIGNER verify -v "MittiRun.apk"

$apk = Get-Item "MittiRun.apk"
Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "SUCCESS! MITTI RUN APK is READY:" -ForegroundColor Green
Write-Host "File: $($apk.FullName)" -ForegroundColor White
Write-Host "Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Green
