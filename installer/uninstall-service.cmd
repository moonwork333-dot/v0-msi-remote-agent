@echo off
REM Native Windows Service Uninstallation Script

set SERVICE_NAME=MSIRemoteAgent

echo Uninstalling MSI Remote Agent Service...

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Service not found, nothing to uninstall
    exit /b 0
)

REM Stop the service
echo Stopping service...
sc stop %SERVICE_NAME%
timeout /t 3 /nobreak >nul

REM Delete the service
echo Removing service...
sc delete %SERVICE_NAME%

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to remove service
    exit /b 1
)

echo Service uninstalled successfully!
exit /b 0
