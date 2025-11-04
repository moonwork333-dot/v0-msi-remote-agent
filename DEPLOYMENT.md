# MSI Remote Agent - Deployment Guide

## Your Configuration

**WebSocket Server URL:** `wss://val-closefisted-morgan.ngrok-free.dev`

---

## Step 1: Start the WebSocket Server

The WebSocket server needs to run on a machine that's always online and accessible through your ngrok tunnel.

### Option A: Run Locally with ngrok

\`\`\`bash
# Terminal 1: Start the server
cd server
npm install
npm start
# Server runs on ws://localhost:8080

# Terminal 2: Start ngrok tunnel
ngrok http 8080
# This creates your tunnel: wss://val-closefisted-morgan.ngrok-free.dev
\`\`\`

### Option B: Deploy to a Cloud Server

Deploy the `server` folder to:
- AWS EC2
- DigitalOcean Droplet
- Azure VM
- Any VPS with Node.js

\`\`\`bash
# On your server
cd server
npm install
npm start
\`\`\`

Then point your ngrok tunnel to this server.

---

## Step 2: Deploy the Dashboard

### Option A: Deploy to Vercel (Recommended)

1. Click the **"Publish"** button in v0
2. Or push to GitHub and connect to Vercel
3. Add environment variable in Vercel:
   - `NEXT_PUBLIC_SERVER_URL` = `wss://val-closefisted-morgan.ngrok-free.dev`

### Option B: Run Locally

\`\`\`bash
npm install
npm run dev
# Dashboard runs on http://localhost:3000
\`\`\`

The dashboard will automatically connect to your WebSocket server using the URL in `.env.local`.

---

## Step 3: Deploy Agents to Remote PCs

### Option A: Use the MSI Installer (Recommended)

1. Download the MSI from GitHub Actions artifacts
2. Run the MSI on each remote PC
3. The agent will automatically:
   - Install as a Windows Service
   - Connect to `wss://val-closefisted-morgan.ngrok-free.dev`
   - Start on boot
   - Appear in your dashboard

### Option B: Run Manually (for testing)

\`\`\`bash
cd agent
npm install
npm start
\`\`\`

The agent will connect to the server URL configured in the MSI installer.

---

## Verification

1. **Check Server**: Server should show "MSI Remote Agent Server started on port 8080"
2. **Check Dashboard**: Open dashboard and verify "Connected" status in top-right
3. **Check Agents**: Agents should appear in the dashboard within 5 seconds of starting

---

## Troubleshooting

### Dashboard shows "Disconnected"
- Verify ngrok tunnel is running
- Check `.env.local` has correct WebSocket URL
- Ensure URL starts with `wss://` (not `ws://`)

### Agents don't appear
- Check agent logs for connection errors
- Verify agent is using correct SERVER_URL
- Ensure firewall allows WebSocket connections

### ngrok URL changes
- Free ngrok URLs change on restart
- Update `.env.local` with new URL
- Rebuild MSI installer with new URL
- Or use ngrok paid plan for static URLs

---

## Production Recommendations

1. **Use a static ngrok domain** (paid plan) or deploy server to a cloud provider
2. **Deploy dashboard to Vercel** for best performance
3. **Use the MSI installer** for easy agent deployment
4. **Set up monitoring** for the WebSocket server
5. **Enable HTTPS/WSS** for secure connections (ngrok does this automatically)

---

## Architecture Overview

\`\`\`
Remote PC 1 (Agent) ──┐
Remote PC 2 (Agent) ──┼──> WebSocket Server <──> Dashboard (Browser)
Remote PC 3 (Agent) ──┘     (ngrok tunnel)        (Vercel/Local)
\`\`\`

All communication flows through the central WebSocket server via your ngrok tunnel.
