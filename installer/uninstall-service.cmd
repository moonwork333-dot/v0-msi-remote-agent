@echo off
REM Windows Service Uninstallation Script (NSSM-compatible)

echo ========================================
echo MSI Remote Agent Service Uninstaller
echo ========================================
echo.

set "SERVICE_NAME=MSI Remote Agent"
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"
set "NSSM_PATH=%INSTALL_DIR%\nssm.exe"

REM Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Service not found, nothing to uninstall.
    echo.
    pause
    exit /b 0
)

echo Found service: %SERVICE_NAME%
echo.

REM Try to use NSSM if available
if exist "%NSSM_PATH%" (
    echo Using NSSM to uninstall service...
    "%NSSM_PATH%" stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
    "%NSSM_PATH%" remove "%SERVICE_NAME%" confirm
) else (
    echo Using sc.exe to uninstall service...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
    sc delete "%SERVICE_NAME%"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Failed to remove service
    echo Make sure you are running this script as Administrator
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Service uninstalled successfully!
echo ========================================
echo.
pause
exit /b 0
