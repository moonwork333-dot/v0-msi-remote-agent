# Windows Server Setup Guide

## Step 1: Get the Project Files on Your Windows Server

You have three options:

### Option A: Clone from GitHub (Recommended)

1. Install Git for Windows if not already installed:
   - Download from: https://git-scm.com/download/win

2. Open Command Prompt or PowerShell as Administrator

3. Navigate to where you want the project:
   \`\`\`cmd
   cd C:\
   mkdir Projects
   cd Projects
   \`\`\`

4. Clone the repository:
   \`\`\`cmd
   git clone https://github.com/moonwork333-dot/v0-msi-remote-agent.git
   cd v0-msi-remote-agent
   \`\`\`

### Option B: Download ZIP from GitHub

1. Go to: https://github.com/moonwork333-dot/v0-msi-remote-agent
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP to `C:\Projects\v0-msi-remote-agent`

### Option C: Push from v0 to GitHub (if not already done)

1. In v0, click the GitHub icon in the top right
2. Push all changes to your repository
3. Then follow Option A or B above

---

## Step 2: Install Prerequisites

### Install Node.js (if not already installed)

1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer
3. Verify installation:
   \`\`\`cmd
   node --version
   npm --version
   \`\`\`

---

## Step 3: Start the WebSocket Server

1. Open Command Prompt as Administrator

2. Navigate to the server directory:
   \`\`\`cmd
   cd C:\Projects\v0-msi-remote-agent\server
   \`\`\`

3. Install dependencies:
   \`\`\`cmd
   npm install
   \`\`\`

4. Start the server:
   \`\`\`cmd
   node server.js
   \`\`\`

The server will start on port 8080.

---

## Step 4: Set Up ngrok Tunnel

Since you're using ngrok (wss://val-closefisted-morgan.ngrok-free.dev):

1. Download ngrok from: https://ngrok.com/download

2. Extract ngrok.exe to a folder (e.g., `C:\ngrok`)

3. Open a new Command Prompt window

4. Run ngrok:
   \`\`\`cmd
   cd C:\ngrok
   ngrok http 8080
   \`\`\`

5. Verify the URL matches your configured URL:
   - Should show: `wss://val-closefisted-morgan.ngrok-free.dev`
   - If different, update `.env.local` in the dashboard

---

## Step 5: Start the Dashboard

### Option A: Deploy to Vercel (Recommended for Production)

1. In v0, click the "Publish" button
2. Follow prompts to deploy to Vercel
3. Your dashboard will be live at a Vercel URL

### Option B: Run Locally on Windows Server

1. Open a new Command Prompt as Administrator

2. Navigate to the project root:
   \`\`\`cmd
   cd C:\Projects\v0-msi-remote-agent
   \`\`\`

3. Install dependencies:
   \`\`\`cmd
   npm install
   \`\`\`

4. Start the dashboard:
   \`\`\`cmd
   npm run dev
   \`\`\`

5. Open browser to: http://localhost:3000

---

## Step 6: Test the Connection

1. Open the dashboard in your browser
2. Check the connection status (top right)
3. Should show "Connected" in green

---

## Step 7: Deploy Agents to Remote PCs

1. Download the MSI from GitHub Actions:
   - Go to: https://github.com/moonwork333-dot/v0-msi-remote-agent/actions
   - Click the latest successful workflow run
   - Download the "msi-installer" artifact

2. Extract the ZIP to get `MSIRemoteAgent-1.0.0.msi`

3. **Send only this single MSI file to your users**

4. Users run the MSI - it will automatically:
   - Install as a Windows Service
   - Connect to your WebSocket server
   - Appear in your dashboard

---

## Troubleshooting

### Server won't start

- Check if port 8080 is already in use:
  \`\`\`cmd
  netstat -ano | findstr :8080
  \`\`\`
- Kill the process if needed:
  \`\`\`cmd
  taskkill /PID <process_id> /F
  \`\`\`

### ngrok URL doesn't match

- Update the `.env.local` file in the project root:
  \`\`\`
  NEXT_PUBLIC_WEBSOCKET_URL=wss://your-new-ngrok-url.ngrok-free.dev
  \`\`\`

### Agents not connecting

- Verify the WebSocket server is running
- Check ngrok tunnel is active
- Verify firewall allows port 8080
- Check agent logs in Windows Event Viewer

### Permission errors

- Always run Command Prompt as Administrator
- Check antivirus isn't blocking Node.js

---

## Running as a Windows Service (Optional)

To keep the server running permanently:

1. Install node-windows:
   \`\`\`cmd
   cd C:\Projects\v0-msi-remote-agent\server
   npm install -g node-windows
   \`\`\`

2. Create a service installation script (we can help with this)

3. The server will start automatically on boot

---

## Next Steps

Once everything is running:

1. ✅ WebSocket server running on Windows Server
2. ✅ ngrok tunnel active
3. ✅ Dashboard accessible (Vercel or localhost)
4. ✅ Download MSI from GitHub Actions
5. ✅ Send single MSI file to users
6. ✅ Monitor and control agents from dashboard

Need help with any step? Let us know!
