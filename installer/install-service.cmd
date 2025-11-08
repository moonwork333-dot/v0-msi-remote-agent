@echo off
REM Native Windows Service Installation Script
REM This script creates a Windows Service using only built-in Windows tools (sc.exe)

echo ========================================
echo MSI Remote Agent Service Installer
echo ========================================
echo.

REM Auto-detect installation directory from script location
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

REM Allow override via command line parameter
if not "%~1"=="" set "INSTALL_DIR=%~1"

echo Installation Directory: %INSTALL_DIR%
echo.

set "SERVICE_NAME=MSI Remote Agent"
set "EXE_PATH=%INSTALL_DIR%\agent.exe"

REM Better validation with more informative error messages
if not exist "%INSTALL_DIR%" (
    echo ERROR: Installation directory does not exist: %INSTALL_DIR%
    echo.
    echo Please verify that MSI Remote Agent is installed correctly.
    echo Default location: C:\Program Files\MSI Remote Agent
    echo.
    pause
    exit /b 1
)

if not exist "%EXE_PATH%" (
    echo ERROR: Agent executable not found at: %EXE_PATH%
    echo.
    echo Please verify the installation completed correctly.
    echo Try reinstalling MSI Remote Agent.
    echo.
    pause
    exit /b 1
)

echo Found agent executable: %EXE_PATH%
echo.

REM Stop and remove existing service if it exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Existing service found. Removing...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 1 /nobreak >nul
    echo.
)

REM Create the service with proper quoting for paths with special characters
echo Creating Windows Service...
REM Use a temporary file to avoid batch parsing issues with parentheses
set "BINPATH=%EXE_PATH%"
sc create "%SERVICE_NAME%" binPath= "%BINPATH%" start= auto DisplayName= "%SERVICE_NAME%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create service (Error code: %ERRORLEVEL%)
    echo.
    echo Common causes:
    echo - Script not run as Administrator (Right-click ^> Run as administrator)
    echo - Service name conflicts with existing service
    echo.
    pause
    exit /b 1
)

REM Set service description
sc description "%SERVICE_NAME%" "Remote monitoring and control agent" >nul 2>&1

REM Configure service to restart on failure
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/10000// >nul 2>&1

echo.
echo Starting service...
sc start "%SERVICE_NAME%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Service created but failed to start (Error code: %ERRORLEVEL%)
    echo The service is installed and will start on next reboot.
    echo.
    echo To manually start: sc start "%SERVICE_NAME%"
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================
echo SUCCESS! Service installed and started.
echo ========================================
echo.
echo The agent should now appear in your dashboard within 10-15 seconds.
echo.
echo To check service status: sc query "%SERVICE_NAME%"
echo.
pause
exit /b 0
