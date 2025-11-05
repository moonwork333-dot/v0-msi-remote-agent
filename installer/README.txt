MSI Remote Agent - Installation Complete
=========================================

The MSI Remote Agent files have been installed to:
C:\Program Files\MSI Remote Agent

IMPORTANT: Service Installation Required
-----------------------------------------

After the MSI installer completes, you MUST install the Windows Service separately.

Option 1: Use Desktop Shortcut (Easiest)
   1. Find "Install MSI Agent Service" shortcut on your Desktop
   2. RIGHT-CLICK the shortcut
   3. Select "Run as administrator"
   4. A command window will open and install the service
   5. Press any key when it says "Press any key to continue..."

Option 2: Use Start Menu
   1. Open Start Menu and search for "MSI Remote Agent"
   2. Find "Install Service (Run as Admin)"
   3. RIGHT-CLICK and select "Run as administrator"
   4. Wait for the service to install and start

Option 3: Manual Installation via Command Prompt
   1. Press Windows Key + X
   2. Select "Command Prompt (Admin)" or "Windows PowerShell (Admin)"
   3. Type: cd "C:\Program Files\MSI Remote Agent"
   4. Type: install-service.cmd
   5. Press Enter

Verify Installation
-------------------
To check if the service is running, open Command Prompt and run:
   sc query "MSI Remote Agent"

You should see: STATE: 4 RUNNING

If you see "FAILED 1060: The specified service does not exist", 
the service hasn't been installed yet. Follow the steps above.

Configuration
-------------
The agent connects to: ws://localhost:8080 by default

To change the server URL:
   1. Open: C:\Program Files\MSI Remote Agent\config.json
   2. Edit the SERVER_URL value
   3. Restart the service:
      sc stop "MSI Remote Agent"
      sc start "MSI Remote Agent"

Troubleshooting
---------------

Problem: "The system cannot find the path specified"
Solution: The MSI didn't install properly. Try:
   1. Uninstall any existing version via Control Panel
   2. Download the latest MSI installer
   3. RIGHT-CLICK the MSI file and select "Run as administrator"
   4. Complete the installation
   5. Then follow the service installation steps above

Problem: Service won't start
Solution: 
   1. Open Event Viewer (press Windows Key + R, type: eventvwr.msc)
   2. Go to: Windows Logs > Application
   3. Look for errors from "MSI Remote Agent"
   4. Check that config.json has a valid SERVER_URL
   5. Verify Windows Firewall isn't blocking the connection

Problem: Agent doesn't appear in dashboard
Solution:
   1. Verify service is running: sc query "MSI Remote Agent"
   2. Check the SERVER_URL in config.json matches your server
   3. Ensure the server is running and accessible
   4. Check firewall settings on both agent and server

Uninstallation
--------------
To uninstall:
   1. The service will be automatically stopped and removed
   2. Go to: Control Panel > Programs and Features
   3. Find "MSI Remote Agent" and click Uninstall
   OR
   4. Start Menu > MSI Remote Agent > Uninstall MSI Remote Agent

Files Location
--------------
Installation: C:\Program Files\MSI Remote Agent\
   - agent.exe (the service executable)
   - config.json (configuration file)
   - install-service.cmd (service installer)
   - uninstall-service.cmd (service uninstaller)
   - README.txt (this file)

Logs: C:\Program Files\MSI Remote Agent\logs\
   - agent.log (service logs, if logging is enabled)

Support
-------
If you continue to have issues:
   1. Check that you're running Windows 10 or later
   2. Verify you have Administrator privileges
   3. Try disabling antivirus temporarily during installation
   4. Check Windows Event Viewer for detailed error messages
