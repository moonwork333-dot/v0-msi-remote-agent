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

### 4. Start Agents on Remote PCs

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
- Screen streaming (coming soon)
- Remote control (coming soon)
- Wake-on-LAN (coming soon)
- Blank screen feature (coming soon)

## Environment Variables

### Dashboard
- `NEXT_PUBLIC_SERVER_URL` - WebSocket server URL (default: ws://localhost:8080)

### Agent
- `SERVER_URL` - WebSocket server URL (required for remote agents)

### Server
- `PORT` - Server port (default: 8080)

## Development

The dashboard runs on Next.js 16 with React 19 and uses WebSockets for real-time communication.
\`\`\`
