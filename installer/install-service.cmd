@echo off
REM Windows Service Installation Script
REM Uses node-windows to create a native Windows service

echo ========================================
echo MSI Remote Agent Service Installer
echo ========================================
echo.

REM Auto-detect installation directory from script location
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Installation Directory: %INSTALL_DIR%
echo.

cd /d "%INSTALL_DIR%"

REM Check if agent.exe exists
if not exist "%INSTALL_DIR%\agent.exe" (
    echo ERROR: agent.exe not found at: %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

REM Run the service installer (built into agent.exe)
echo Installing service...
echo.
"%INSTALL_DIR%\agent.exe" install-service

echo.
pause
exit /b 0
