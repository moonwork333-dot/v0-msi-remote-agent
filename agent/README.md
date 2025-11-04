# MSI Remote Agent Service

This is the agent service that runs on remote PCs to be monitored and controlled.

## Setup

1. Install dependencies:
\`\`\`bash
cd agent
npm install
\`\`\`

2. Configure the server URL (use your ngrok URL):
\`\`\`bash
# Windows
set SERVER_URL=wss://your-ngrok-url.ngrok.io

# Linux/Mac
export SERVER_URL=wss://your-ngrok-url.ngrok.io
\`\`\`

3. Start the agent:
\`\`\`bash
npm start
\`\`\`

## Features

- **Automatic Registration**: Uses hostname as consistent agent ID
- **Auto-Reconnect**: Automatically reconnects if connection is lost
- **Heartbeat**: Keeps connection alive with periodic heartbeats
- **Command Execution**: Execute terminal commands remotely
- **File Management**: List, read, write, and delete files
- **System Information**: Get detailed system info (CPU, memory, network)

## Running as a Service

### Windows Service
You can use tools like `node-windows` or `nssm` to run this as a Windows service.

### Linux Service (systemd)
Create a systemd service file at `/etc/systemd/system/msi-agent.service`:

\`\`\`ini
[Unit]
Description=MSI Remote Agent Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/agent
Environment=SERVER_URL=wss://your-ngrok-url.ngrok.io
ExecStart=/usr/bin/node service.js
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

Then enable and start:
\`\`\`bash
sudo systemctl enable msi-agent
sudo systemctl start msi-agent
\`\`\`
\`\`\`
