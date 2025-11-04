# Building the MSI Installer

This guide explains how to build the MSI installer for the MSI Remote Agent.

## Prerequisites

### 1. Install Node.js
Download and install Node.js from https://nodejs.org/ (LTS version recommended)

### 2. Install WiX Toolset
The WiX Toolset is required to build MSI installers on Windows.

**Option A: Direct Download**
- Download from: https://wixtoolset.org/
- Install WiX Toolset v3.11 or later
- Add WiX bin directory to your PATH

**Option B: Using Chocolatey**
\`\`\`bash
choco install wixtoolset
\`\`\`

### 3. Install Dependencies
\`\`\`bash
cd agent
npm install
npm install -g pkg
\`\`\`

## Build Process

### Step 1: Configure the Agent
Edit `installer/config.json` to set your server URL:
\`\`\`json
{
  "serverUrl": "ws://your-server-ip:8080",
  "heartbeatInterval": 30000,
  "reconnectInterval": 5000
}
\`\`\`

### Step 2: Build the Executable
\`\`\`bash
cd agent
npm run build
\`\`\`

This creates a standalone executable at `agent/dist/msi-agent.exe`

### Step 3: Build the MSI Installer
\`\`\`bash
cd installer
node build-msi.js
\`\`\`

This will:
1. Verify WiX Toolset installation
2. Build the agent executable
3. Compile the WiX source files
4. Create the MSI installer

### Step 4: Find Your Installer
The MSI installer will be created at:
\`\`\`
installer/MSIRemoteAgent.msi
\`\`\`

## Manual Build (Alternative)

If you prefer to build manually:

\`\`\`bash
# 1. Build the executable
cd agent
npm run build

# 2. Compile WiX source
cd ../installer
candle Product.wxs -out obj\Product.wixobj

# 3. Link and create MSI
light obj\Product.wixobj -out MSIRemoteAgent.msi -ext WixUIExtension
\`\`\`

## Installation

### Install the Agent
Double-click `MSIRemoteAgent.msi` and follow the installation wizard.

The installer will:
- Install the agent to `C:\Program Files\MSI Remote Agent\`
- Create a Windows Service named "MSI Remote Agent"
- Configure the service to start automatically
- Add firewall rules for the agent
- Create an uninstall shortcut in the Start Menu

### Verify Installation
\`\`\`bash
# Check if service is running
sc query MSIRemoteAgent

# View service status
services.msc
\`\`\`

### Uninstall
- Use "Add or Remove Programs" in Windows Settings
- Or use the Start Menu shortcut: "Uninstall MSI Remote Agent"

## Customization

### Change Product Information
Edit `installer/Product.wxs`:
- `Name`: Product name
- `Manufacturer`: Your company name
- `Version`: Version number
- `UpgradeCode`: Unique GUID (generate new one for your product)

### Change Service Configuration
Edit the `<ServiceInstall>` section in `Product.wxs`:
- `Name`: Service name
- `DisplayName`: Display name in Services
- `Start`: auto (automatic) or demand (manual)
- `Account`: LocalSystem, NetworkService, or custom account

### Add Custom Actions
You can add custom actions to run during installation:
\`\`\`xml
<CustomAction Id="MyAction" 
              Directory="INSTALLFOLDER" 
              ExeCommand="my-command.exe"
              Execute="deferred"
              Return="check" />
\`\`\`

## Troubleshooting

### WiX Toolset Not Found
- Ensure WiX is installed and in your PATH
- Restart your terminal after installation
- Try running `candle -?` to verify

### Build Fails
- Check that Node.js and npm are installed
- Ensure all dependencies are installed: `npm install`
- Verify the agent executable exists at `agent/dist/msi-agent.exe`

### Service Won't Start
- Check the Windows Event Viewer for errors
- Verify the server URL in config.json is correct
- Ensure the server is running and accessible
- Check firewall settings

### Permission Errors
- Run the build process as Administrator
- Ensure you have write permissions to the installer directory

## Distribution

Once built, you can distribute `MSIRemoteAgent.msi` to install the agent on remote computers.

**Deployment Options:**
1. Manual installation on each PC
2. Group Policy deployment (Active Directory)
3. SCCM/Intune deployment
4. Silent installation: `msiexec /i MSIRemoteAgent.msi /quiet`

## Silent Installation

For automated deployment:
\`\`\`bash
# Silent install
msiexec /i MSIRemoteAgent.msi /quiet /norestart

# Silent install with logging
msiexec /i MSIRemoteAgent.msi /quiet /norestart /l*v install.log

# Silent uninstall
msiexec /x MSIRemoteAgent.msi /quiet /norestart
