@echo off
REM Windows Service Installation Script using NSSM
REM NSSM wraps the agent.exe to make it work as a proper Windows service

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
set "NSSM_PATH=%INSTALL_DIR%\nssm.exe"
set "NSSM_URL=https://nssm.cc/release/nssm-2.24.zip"

REM Validate installation directory and executable
if not exist "%INSTALL_DIR%" (
    echo ERROR: Installation directory does not exist: %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

if not exist "%EXE_PATH%" (
    echo ERROR: Agent executable not found at: %EXE_PATH%
    echo.
    pause
    exit /b 1
)

echo Found agent executable: %EXE_PATH%
echo.

REM Check if NSSM exists, if not download it
if not exist "%NSSM_PATH%" (
    echo NSSM not found. Downloading NSSM service wrapper...
    echo This is needed to run the agent as a Windows service.
    echo.
    
    REM Download NSSM using PowerShell
    powershell -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NSSM_URL%' -OutFile '%INSTALL_DIR%\nssm.zip'"
    
    if not exist "%INSTALL_DIR%\nssm.zip" (
        echo ERROR: Failed to download NSSM
        echo.
        echo Manual installation:
        echo 1. Download NSSM from https://nssm.cc/download
        echo 2. Extract nssm.exe to: %INSTALL_DIR%
        echo 3. Run this script again
        echo.
        pause
        exit /b 1
    )
    
    echo Extracting NSSM...
    powershell -Command "Expand-Archive -Path '%INSTALL_DIR%\nssm.zip' -DestinationPath '%INSTALL_DIR%\nssm_temp' -Force"
    
    REM Copy the correct architecture version (64-bit)
    copy /Y "%INSTALL_DIR%\nssm_temp\nssm-2.24\win64\nssm.exe" "%NSSM_PATH%" >nul 2>&1
    
    REM Cleanup
    del /Q "%INSTALL_DIR%\nssm.zip" >nul 2>&1
    rmdir /S /Q "%INSTALL_DIR%\nssm_temp" >nul 2>&1
    
    if exist "%NSSM_PATH%" (
        echo NSSM downloaded successfully.
        echo.
    ) else (
        echo ERROR: Failed to extract NSSM
        pause
        exit /b 1
    )
)

echo Using NSSM at: %NSSM_PATH%
echo.

REM Stop and remove existing service if it exists
"%NSSM_PATH%" stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 /nobreak >nul
"%NSSM_PATH%" remove "%SERVICE_NAME%" confirm >nul 2>&1
timeout /t 1 /nobreak >nul

REM Create the service using NSSM
echo Creating Windows Service using NSSM...
"%NSSM_PATH%" install "%SERVICE_NAME%" "%EXE_PATH%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create service
    echo Make sure you are running this script as Administrator
    echo.
    pause
    exit /b 1
)

REM Configure service
echo Configuring service...
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%SERVICE_NAME%" >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "Remote monitoring and control agent" >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%INSTALL_DIR%" >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%INSTALL_DIR%\service-output.log" >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%INSTALL_DIR%\service-error.log" >nul 2>&1

REM Configure restart on failure
"%NSSM_PATH%" set "%SERVICE_NAME%" AppExit Default Restart >nul 2>&1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRestartDelay 5000 >nul 2>&1

echo.
echo Starting service...
"%NSSM_PATH%" start "%SERVICE_NAME%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Service created but failed to start
    echo.
    echo Check the logs at:
    echo - %INSTALL_DIR%\agent.log
    echo - %INSTALL_DIR%\service-output.log
    echo - %INSTALL_DIR%\service-error.log
    echo.
    pause
    exit /b 1
)

REM Wait a moment and check service status
timeout /t 3 /nobreak >nul
sc query "%SERVICE_NAME%" | find "RUNNING" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Service is running.
    echo ========================================
    echo.
    echo The agent should appear in your dashboard within 10-15 seconds.
    echo.
    echo Logs location: %INSTALL_DIR%\agent.log
    echo.
) else (
    echo.
    echo WARNING: Service started but may not be running properly.
    echo.
    echo Check the logs at:
    echo - %INSTALL_DIR%\agent.log
    echo - %INSTALL_DIR%\service-output.log
    echo.
    echo To check status: sc query "%SERVICE_NAME%"
    echo.
)

pause
exit /b 0
