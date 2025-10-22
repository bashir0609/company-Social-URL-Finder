@echo off
REM ========================================
REM Company Social URL Finder - Cache Cleaner
REM Cleans all cached files for fresh start
REM ========================================

cd /d "%~dp0"

echo.
echo ========================================
echo  Cache Cleaner
echo  Company Social URL Finder
echo ========================================
echo.

REM Clean Next.js build cache
if exist ".next\" (
    echo [INFO] Cleaning Next.js cache (.next folder)...
    rmdir /s /q ".next" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Next.js cache cleaned!
    ) else (
        echo [WARNING] Could not clean .next folder (may be in use)
        echo [INFO] Please stop the dev server and try again.
    )
    echo.
) else (
    echo [INFO] No .next folder found (already clean)
    echo.
)

REM Clean node_modules cache
if exist "node_modules\.cache\" (
    echo [INFO] Cleaning node_modules cache...
    rmdir /s /q "node_modules\.cache" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Node modules cache cleaned!
    ) else (
        echo [WARNING] Could not clean node_modules\.cache
    )
    echo.
) else (
    echo [INFO] No node_modules cache found (already clean)
    echo.
)

REM Clean TypeScript build info
if exist "tsconfig.tsbuildinfo" (
    echo [INFO] Cleaning TypeScript build info...
    del /f /q "tsconfig.tsbuildinfo" 2>nul
    echo [SUCCESS] TypeScript build info cleaned!
    echo.
)

REM Clean npm cache (optional - uncomment if needed)
REM echo [INFO] Cleaning npm cache...
REM npm cache clean --force
REM echo [SUCCESS] npm cache cleaned!
REM echo.

echo ========================================
echo  Cache Cleaning Complete!
echo ========================================
echo.
echo [INFO] All caches have been cleaned.
echo [INFO] Next time you start the app, it will rebuild from scratch.
echo.
echo [TIP] If you're having issues:
echo       1. Run this script
echo       2. Restart "Start Social Finder.bat"
echo.
pause
