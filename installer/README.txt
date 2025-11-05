MSI Remote Agent - Installation Complete
=========================================

The MSI Remote Agent files have been installed successfully.

IMPORTANT: Service Installation Required
-----------------------------------------

To complete the setup, you need to install the Windows Service:

Option 1: Use Start Menu Shortcut (Recommended)
   1. Open Start Menu
   2. Find "MSI Remote Agent" folder
   3. Right-click "Install Service" and select "Run as administrator"
   4. Wait for the service to install and start

Option 2: Manual Installation
   1. Open Command Prompt as Administrator
   2. Navigate to: C:\Program Files\MSI Remote Agent
   3. Run: install-service.cmd "C:\Program Files\MSI Remote Agent\"
   4. The service will be created and started automatically

Verify Installation
-------------------
To check if the service is running:
   sc query "MSI Remote Agent"

You should see STATE: RUNNING

Configuration
-------------
Edit config.json to set your server URL:
   {
     "SERVER_URL": "ws://your-server-url:8080"
   }

After changing the config, restart the service:
   sc stop "MSI Remote Agent"
   sc start "MSI Remote Agent"

Troubleshooting
---------------
If the service fails to start:
   1. Check Windows Event Viewer (eventvwr.msc)
   2. Look for errors under Windows Logs > Application
   3. Verify the SERVER_URL in config.json is correct
   4. Ensure port 8080 is not blocked by firewall

Uninstallation
--------------
The service will be automatically removed when you uninstall via:
   - Control Panel > Programs and Features
   - Or Start Menu > MSI Remote Agent > Uninstall

Support
-------
For issues, check the logs at:
   C:\Program Files\MSI Remote Agent\logs\
