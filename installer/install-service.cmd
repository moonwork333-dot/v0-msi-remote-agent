@echo off
REM Native Windows Service Installation Script
REM This script creates a Windows Service using only built-in Windows tools (sc.exe)

REM Improved parameter handling and path quoting
set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" (
    echo ERROR: Installation directory not provided
    exit /b 1
)

REM Ensure path ends with backslash
if not "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR%\"

set "SERVICE_NAME=MSIRemoteAgent"
set "DISPLAY_NAME=MSI Remote Agent"
set "DESCRIPTION=Remote monitoring and control agent for MSI system"
set "EXE_PATH=%INSTALL_DIR%agent.exe"
set "LOG_PATH=%INSTALL_DIR%agent.log"

echo Installing MSI Remote Agent Service...
echo Install Directory: %INSTALL_DIR%
echo Executable: %EXE_PATH%

REM Better error handling for missing executable
if not exist "%EXE_PATH%" (
    echo ERROR: Agent executable not found at: %EXE_PATH%
    echo Please verify the installation completed correctly.
    exit /b 1
)

REM Stop and remove existing service if it exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Stopping existing service...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo Removing existing service...
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Fixed sc create command with proper quoting
echo Creating Windows Service...
sc create "%SERVICE_NAME%" binPath= "\"%EXE_PATH%\"" DisplayName= "%DISPLAY_NAME%" start= auto

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create service (Error code: %ERRORLEVEL%)
    echo This usually means insufficient permissions or the service already exists.
    exit /b 1
)

REM Set service description
sc description "%SERVICE_NAME%" "%DESCRIPTION%" >nul 2>&1

REM Configure service recovery options (restart on failure)
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/10000/restart/30000 >nul 2>&1

REM Set service to run as LocalSystem
sc config "%SERVICE_NAME%" obj= LocalSystem >nul 2>&1

echo Starting service...
sc start "%SERVICE_NAME%"

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Service created but failed to start (Error code: %ERRORLEVEL%)
    echo The service will start automatically on next reboot.
    echo Check the log file at: %LOG_PATH%
    REM Exit with success even if start fails - service is installed
    exit /b 0
)

echo Service installed and started successfully!
exit /b 0
