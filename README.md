# MSI Remote Agent System

A comprehensive remote monitoring and control system for managing multiple PCs from a centralized dashboard.

## Architecture

The system consists of three main components:

1. **WebSocket Server** (`/server`) - Central hub for all connections
2. **Agent Service** (`/agent`) - Runs on remote PCs to be monitored
3. **Dashboard** (Next.js app) - Web interface for monitoring and control

## Quick Start

### 1. Start the WebSocket Server

\`\`\`bash
cd server
npm install
npm start
\`\`\`

The server will run on port 8080.

### 2. Expose Server with ngrok (for remote access)

\`\`\`bash
ngrok http 8080
\`\`\`

Copy the ngrok URL (e.g., `wss://abc123.ngrok.io`)

### 3. Start the Dashboard

\`\`\`bash
npm install
npm run dev
\`\`\`

Set the server URL in your environment:
\`\`\`bash
NEXT_PUBLIC_SERVER_URL=ws://localhost:8080  # or your ngrok URL
\`\`\`

### 4. Deploy Agents on Remote PCs

#### Option A: Using MSI Installer (Recommended for Production)

1. Download the latest `MSIRemoteAgent-1.0.0.msi` from GitHub Actions artifacts
2. Run the MSI installer on the target Windows PC
3. The agent will automatically:
   - Install to `C:\Program Files (x86)\MSI Remote Agent\`
   - Create a native Windows Service
   - Start automatically on boot
   - Connect to the dashboard

#### Option B: Manual Installation (Development)

On each remote PC you want to monitor:

\`\`\`bash
cd agent
npm install
SERVER_URL=wss://your-ngrok-url.ngrok.io npm start
\`\`\`

## Features

- Real-time agent connection monitoring
- System information display
- Terminal command execution
- File management (list, read, write, delete)
- Screen capture and streaming
- Remote mouse and keyboard control
- Blank screen feature
- **Native Windows Service** - No third-party dependencies

## Native Windows Service

The MSI installer creates a **native Windows Service** using only built-in Windows tools (`sc.exe`). This approach:

- **Eliminates NSSM dependency** - No third-party service wrappers
- **Reduces antivirus flags** - Uses only trusted Microsoft components
- **Simplifies deployment** - Professional Windows Service integration
- **Improves reliability** - Automatic restart on failure, standard Windows logging

See [installer/NATIVE-SERVICE.md](installer/NATIVE-SERVICE.md) for detailed technical information.

## Building the MSI Installer

### Prerequisites

- Node.js 18 or later
- Windows OS (for building)
- WiX Toolset 3.11: `choco install wixtoolset`

### Build Steps

\`\`\`bash
# Install dependencies
cd agent
npm install
cd ../installer
npm install

# Build the MSI
cd installer
node build-msi.js
\`\`\`

The MSI will be created at `installer/output/MSIRemoteAgent-1.0.0.msi`

### Automated Builds

GitHub Actions automatically builds the MSI on every push to main. Download artifacts from the Actions tab.

## Code Signing (Recommended for Production)

To avoid antivirus false positives and Windows SmartScreen warnings, code sign your installer:

### Getting a Certificate

- **Commercial**: DigiCert ($474/year), Sectigo ($179/year), SSL.com ($199/year)
- **Open Source**: SignPath.io (free for qualifying projects)

### Signing Commands

\`\`\`bash
# Sign the agent executable
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com agent/dist/msi-agent.exe

# Sign the MSI installer
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com installer/output/MSIRemoteAgent-1.0.0.msi
\`\`\`

## Environment Variables

### Dashboard
- `NEXT_PUBLIC_SERVER_URL` - WebSocket server URL (default: ws://localhost:8080)

### Agent
- `SERVER_URL` - WebSocket server URL (required for remote agents)

### Server
- `PORT` - Server port (default: 8080)

## Troubleshooting

### Agent Won't Connect

1. Check the log file: `C:\Program Files (x86)\MSI Remote Agent\agent.log`
2. Verify the server URL in `config.json`
3. Check Windows Firewall settings
4. Ensure the service is running: `sc query MSIRemoteAgent`

### Service Won't Start

1. Check Windows Event Viewer (Application logs)
2. Verify the executable exists and is not corrupted
3. Try running manually to see error messages
4. Check the service status: `sc query MSIRemoteAgent`

### Antivirus Blocking Installation

1. **Code sign your MSI** (most effective solution)
2. Submit signed MSI to Microsoft Defender: https://www.microsoft.com/en-us/wdsi/filesubmission
3. Add an exception in your antivirus software
4. Contact your antivirus vendor to report false positive

For more troubleshooting, see [installer/NATIVE-SERVICE.md](installer/NATIVE-SERVICE.md)

## Security Considerations

- The agent runs with LocalSystem privileges
- All communication should use WSS (WebSocket Secure) in production
- Consider implementing authentication tokens for agent registration
- Code signing is highly recommended for production deployments
- Review firewall rules and network access policies

## Development

The dashboard runs on Next.js 16 with React 19 and uses WebSockets for real-time communication.

## License

MIT License - See LICENSE file for details
