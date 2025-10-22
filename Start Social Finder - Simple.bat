@echo off
cd /d "%~dp0"
echo Starting Company Social URL Finder...
echo.

REM Quick cache clean
if exist ".next\" (
    echo Cleaning cache...
    rmdir /s /q ".next" 2>nul
    echo Cache cleaned!
    echo.
)

npm run dev
pause
