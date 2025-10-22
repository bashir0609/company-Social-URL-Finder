@echo off
REM ========================================
REM Company Social URL Finder - Start Script
REM Next.js Application Launcher
REM ========================================

REM Change to the script's directory
cd /d "%~dp0"

echo.
echo ========================================
echo  Company Social URL Finder
echo  Starting Next.js Development Server
echo ========================================
echo.
echo [INFO] Working directory: %CD%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display npm version
echo [INFO] npm version:
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] node_modules folder not found!
    echo [INFO] Installing dependencies...
    echo.
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

REM Check if .env file exists, if not copy from .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env file from .env.example...
        copy ".env.example" ".env" >nul
        echo [SUCCESS] .env file created!
        echo [NOTE] Please edit .env file to add your API keys if needed.
        echo.
    ) else (
        echo [WARNING] No .env or .env.example file found.
        echo [INFO] The app will work without API key for basic functionality.
        echo.
    )
)

REM Auto-clean cache to prevent issues with outdated code
if exist ".next\" (
    echo [INFO] Cleaning Next.js cache for fresh start...
    rmdir /s /q ".next" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Cache cleaned!
    ) else (
        echo [WARNING] Could not clean cache (may be in use)
    )
    echo.
)

REM Also clean node_modules cache if it exists
if exist "node_modules\.cache\" (
    echo [INFO] Cleaning node_modules cache...
    rmdir /s /q "node_modules\.cache" 2>nul
    echo [SUCCESS] Node cache cleaned!
    echo.
)

REM Check if Playwright browsers are installed (required for Crawlee)
echo [INFO] Checking Playwright browsers...
where chromium >nul 2>nul
if not exist "%USERPROFILE%\AppData\Local\ms-playwright\chromium-*" (
    echo [WARNING] Playwright browsers not found!
    echo [INFO] Crawlee requires Playwright browsers to work properly.
    echo [INFO] Installing Chromium browser (~240MB download)...
    echo [INFO] This is a one-time installation.
    echo.
    npx playwright install chromium
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Failed to install browsers. Crawlee may not work.
        echo [INFO] You can install manually later with: npx playwright install chromium
    ) else (
        echo [SUCCESS] Chromium browser installed!
    )
    echo.
) else (
    echo [SUCCESS] Playwright browsers already installed!
    echo.
)

echo ========================================
echo  Starting Development Server...
echo ========================================
echo.
echo [INFO] The application will be available at:
echo        http://localhost:3000
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the Next.js development server
npm run dev

REM If the server stops, show message
echo.
echo ========================================
echo  Server Stopped
echo ========================================
echo.
pause
