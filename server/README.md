# MSI Remote Agent Server

This is the central WebSocket server that acts as a hub for all agent connections and dashboard clients.

## Setup

1. Install dependencies:
\`\`\`bash
cd server
npm install
\`\`\`

2. Start the server:
\`\`\`bash
npm start
\`\`\`

The server will run on port 8080 by default. You can change this by setting the PORT environment variable.

## Using with ngrok

To expose the server to the internet:

1. Install ngrok: https://ngrok.com/download
2. Start the server: `npm start`
3. In another terminal, run: `ngrok http 8080`
4. Use the ngrok URL (e.g., `wss://abc123.ngrok.io`) in your agents and dashboard

## Architecture

- **Agents** connect and register with their hostname-based ID
- **Dashboards** connect to view and control agents
- Server routes messages between dashboards and agents
- Heartbeat mechanism keeps connections alive
