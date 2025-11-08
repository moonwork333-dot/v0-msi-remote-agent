@echo off
REM Windows Service Uninstallation Script
REM Uses node-windows to remove the native Windows service

echo ========================================
echo MSI Remote Agent Service Uninstaller
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

REM Run the service uninstaller (built into agent.exe)
echo Uninstalling service...
echo.
"%INSTALL_DIR%\agent.exe" uninstall-service

echo.
pause
exit /b 0
