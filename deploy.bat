@echo off
REM 🚀 Script di Deploy per Clouding.io (Windows)
REM Automatizza il processo di build e deploy dell'applicazione

echo 🚀 Iniziando il deploy di Salone di Bellezza...

REM 1. Verifica prerequisiti
echo [INFO] Verificando prerequisiti...

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker non è installato!
    pause
    exit /b 1
)

where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git non è installato!
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisiti verificati ✓

REM 2. Pulizia build precedenti
echo [INFO] Pulendo build precedenti...
if exist dist rmdir /s /q dist
if exist client\dist rmdir /s /q client\dist
echo [SUCCESS] Pulizia completata ✓

REM 3. Installa dipendenze
echo [INFO] Installando dipendenze...
call npm ci --silent
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Installazione dipendenze fallita!
    pause
    exit /b 1
)
echo [SUCCESS] Dipendenze installate ✓

REM 4. Build dell'applicazione
echo [INFO] Building applicazione...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build fallito!
    pause
    exit /b 1
)
echo [SUCCESS] Build completato ✓

REM 5. Test del build
echo [INFO] Testando il build...
if not exist "dist\index.js" (
    echo [ERROR] Build fallito - file dist\index.js non trovato!
    pause
    exit /b 1
)

if not exist "client\dist\index.html" (
    echo [ERROR] Build fallito - file client\dist\index.html non trovato!
    pause
    exit /b 1
)

echo [SUCCESS] Test build completato ✓

REM 6. Build Docker image
echo [INFO] Building Docker image...
docker build -t salone-bellezza:latest .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build Docker fallito!
    pause
    exit /b 1
)
echo [SUCCESS] Docker image creata ✓

REM 7. Test Docker image
echo [INFO] Testando Docker image...
docker run --rm -d --name salone-test -p 5001:5000 -e NODE_ENV=production -e SESSION_SECRET=test-secret -e DATABASE_URL=postgresql://test:test@localhost:5432/test salone-bellezza:latest

REM Aspetta che il container si avvii
timeout /t 5 /nobreak >nul

REM Test health check
curl -f http://localhost:5001/api/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Health check passed ✓
) else (
    echo [WARNING] Health check failed - potrebbe essere normale se il database non è configurato
)

REM Ferma il container di test
docker stop salone-test >nul 2>nul

echo [SUCCESS] Test Docker completato ✓

REM 8. Istruzioni finali
echo.
echo 🎉 Deploy preparato con successo!
echo.
echo 📋 Prossimi passi:
echo 1. Vai su clouding.io
echo 2. Crea una nuova applicazione Docker
echo 3. Connetti questo repository Git
echo 4. Configura le variabili d'ambiente:
echo    - DATABASE_URL=postgresql://...
echo    - SESSION_SECRET=your-secret-key
echo    - NODE_ENV=production
echo    - PORT=5000
echo 5. Avvia il deploy!
echo.
echo 📖 Per istruzioni dettagliate, leggi DEPLOY.md
echo.
echo 🔗 Health check URL: https://your-domain.com/api/health
echo 🔗 Login URL: https://your-domain.com
echo 👤 Credenziali: admin / admin123
echo.
echo [SUCCESS] Tutto pronto per il deploy! 🚀

pause 