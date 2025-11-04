# Starting the WebSocket Server

## Quick Start

\`\`\`bash
cd server
npm install
npm start
\`\`\`

The server will start on port 8080.

## With ngrok

If you need remote access:

\`\`\`bash
# Terminal 1
npm start

# Terminal 2
ngrok http 8080
\`\`\`

Your ngrok URL will be displayed. Update the dashboard and agent configurations with this URL.

## Environment Variables

Create a `.env` file in the server directory:

\`\`\`env
PORT=8080
\`\`\`

## Logs

The server logs all connections and messages:
- `[Server] MSI Remote Agent Server started on port 8080`
- `[Server] New client connected`
- `[Server] Agent registered: HOSTNAME`
- `[Server] Dashboard registered`

## Stopping the Server

Press `Ctrl+C` to gracefully shut down the server.
