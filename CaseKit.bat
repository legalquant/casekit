@echo off
title CaseKit - Starting...
echo ============================================
echo   CaseKit - Civil Dispute Toolkit
echo ============================================
echo.
echo Starting development server...
echo (This window must stay open while CaseKit runs)
echo.

cd /d "%~dp0src"

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo         Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check pnpm
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing pnpm...
    npm install -g pnpm
)

:: Check Rust
where rustc >nul 2>&1 || (
    set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
)
where rustc >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust toolchain is not installed.
    echo         Install from: https://rustup.rs/
    pause
    exit /b 1
)

:: Check Tesseract (optional - OCR)
set "TESS_FOUND=0"
if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" set "TESS_FOUND=1"
if exist "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe" set "TESS_FOUND=1"
where tesseract >nul 2>&1 && set "TESS_FOUND=1"

if "%TESS_FOUND%"=="0" (
    echo [WARNING] Tesseract OCR is not installed.
    echo           Scanned PDFs and images will not be readable.
    echo           Install from: https://github.com/UB-Mannheim/tesseract/wiki
    echo.
)

echo [OK] All core dependencies found. Launching CaseKit...
echo.

pnpm tauri dev

if errorlevel 1 (
    echo.
    echo [ERROR] CaseKit failed to start. Check the error messages above.
    pause
)
