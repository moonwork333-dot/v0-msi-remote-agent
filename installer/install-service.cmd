@echo off
REM Native Windows Service Installation Script
REM This script creates a Windows Service using only built-in Windows tools (sc.exe)

set INSTALL_DIR=%~1
set SERVICE_NAME=MSIRemoteAgent
set DISPLAY_NAME=MSI Remote Agent
set DESCRIPTION=Remote monitoring and control agent for MSI system
REM Changed from msi-agent.exe to agent.exe to match the renamed file
set EXE_PATH=%INSTALL_DIR%agent.exe
set LOG_PATH=%INSTALL_DIR%agent.log

echo Installing MSI Remote Agent Service...
echo Install Directory: %INSTALL_DIR%
echo Executable: %EXE_PATH%

REM Added check to verify executable exists before creating service
if not exist "%EXE_PATH%" (
    echo ERROR: Agent executable not found at %EXE_PATH%
    exit /b 1
)

REM Stop service if it exists
sc query %SERVICE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Stopping existing service...
    sc stop %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
    sc delete %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
)

REM Create the service using sc.exe (native Windows Service Control)
echo Creating Windows Service...
sc create %SERVICE_NAME% binPath= "\"%EXE_PATH%\"" DisplayName= "%DISPLAY_NAME%" start= auto

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create service (Error code: %ERRORLEVEL%)
    exit /b 1
)

REM Set service description
sc description %SERVICE_NAME% "%DESCRIPTION%"

REM Configure service recovery options (restart on failure)
sc failure %SERVICE_NAME% reset= 86400 actions= restart/5000/restart/10000/restart/30000

REM Set service to run as LocalSystem
sc config %SERVICE_NAME% obj= LocalSystem

echo Starting service...
sc start %SERVICE_NAME%

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Service created but failed to start (Error code: %ERRORLEVEL%)
    echo Check the log file at: %LOG_PATH%
    REM Still exit with success if service was created, even if start failed
    exit /b 0
)

echo Service installed and started successfully!
exit /b 0
