const WebSocket = require("ws")
const screenshot = require("screenshot-desktop")
const InputController = require("./input-control")
const fs = require("fs")
const path = require("path")

const DASHBOARD_URL = process.env.DASHBOARD_URL || "ws://localhost:3000"
const AGENT_ID = process.env.AGENT_ID || require("os").hostname()

const LOG_DIR = process.env.PROGRAMDATA
  ? path.join(process.env.PROGRAMDATA, "MSIRemoteAgent", "logs")
  : path.join(process.cwd(), "logs")

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const LOG_FILE = path.join(LOG_DIR, `agent-${new Date().toISOString().split("T")[0]}.log`)

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`

  // Write to console
  console.log(message)

  // Write to file
  try {
    fs.appendFileSync(LOG_FILE, logMessage)
  } catch (error) {
    console.error("Failed to write to log file:", error.message)
  }
}

process.on("uncaughtException", (error) => {
  log(`[FATAL] Uncaught exception: ${error.message}`)
  log(error.stack)
})

process.on("unhandledRejection", (reason, promise) => {
  log(`[ERROR] Unhandled rejection: ${reason}`)
})

class AgentService {
  constructor() {
    this.ws = null
    this.reconnectInterval = 5000
    this.isRunning = false
    this.inputController = new InputController()
    this.remoteSessionActive = false
  }

  async start() {
    log("[Agent] Starting MSI Remote Agent...")
    log(`[Agent] Node version: ${process.version}`)
    log(`[Agent] Platform: ${process.platform} ${process.arch}`)
    log(`[Agent] Log file: ${LOG_FILE}`)

    try {
      await screenshot({ format: "png" })
      log("[Agent] Screenshot module loaded successfully")
    } catch (error) {
      log(`[Agent] WARNING: Screenshot module failed: ${error.message}`)
      log("[Agent] Service will run in limited mode (no screen capture)")
    }

    this.isRunning = true
    this.connect()
  }

  connect() {
    if (!this.isRunning) return

    try {
      log("[Agent] Connecting to dashboard: " + DASHBOARD_URL)
      this.ws = new WebSocket(DASHBOARD_URL)

      this.ws.on("open", () => {
        log("[Agent] Connected to dashboard")

        this.ws.send(
          JSON.stringify({
            type: "register",
            agentId: AGENT_ID,
            capabilities: {
              screenCapture: true,
              inputControl: this.inputController.isAvailable(),
            },
          }),
        )
      })

      this.ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleMessage(message)
        } catch (error) {
          log("[Agent] Error handling message: " + error.message)
        }
      })

      this.ws.on("close", () => {
        log("[Agent] Disconnected from dashboard")

        if (this.remoteSessionActive) {
          this.remoteSessionActive = false
        }

        if (this.isRunning) {
          setTimeout(() => this.connect(), this.reconnectInterval)
        }
      })

      this.ws.on("error", (error) => {
        log("[Agent] WebSocket error: " + error.message)
      })
    } catch (error) {
      log("[Agent] Connection error: " + error.message)
      if (this.isRunning) {
        setTimeout(() => this.connect(), this.reconnectInterval)
      }
    }
  }

  async handleMessage(message) {
    switch (message.type) {
      case "request-screenshot":
        await this.sendScreenshot()
        break

      case "start-remote-session":
        this.remoteSessionActive = true
        break

      case "end-remote-session":
        this.remoteSessionActive = false
        break

      case "mouse-move":
        if (this.inputController.isAvailable()) {
          this.inputController.moveMouse(message.x, message.y)
        }
        break

      case "mouse-click":
        if (this.inputController.isAvailable()) {
          this.inputController.mouseClick(message.button)
        }
        break

      case "key-press":
        if (this.inputController.isAvailable()) {
          this.inputController.typeString(message.key)
        }
        break

      default:
        log("[Agent] Unknown message type: " + message.type)
    }
  }

  async sendScreenshot() {
    try {
      const img = await screenshot({ format: "png" })
      const base64 = img.toString("base64")

      this.ws.send(
        JSON.stringify({
          type: "screenshot",
          agentId: AGENT_ID,
          data: base64,
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      log("[Agent] Screenshot error: " + error.message)
    }
  }

  stop() {
    log("[Agent] Stopping agent service...")
    this.isRunning = false

    if (this.ws) {
      this.ws.close()
    }
  }
}

log("[Agent] Service starting in 2 seconds...")
setTimeout(() => {
  const agent = new AgentService()

  process.on("SIGINT", () => {
    agent.stop()
    process.exit(0)
  })

  process.on("SIGTERM", () => {
    agent.stop()
    process.exit(0)
  })

  agent.start().catch((error) => {
    log(`[FATAL] Service start failed: ${error.message}`)
    log(error.stack)
    process.exit(1)
  })
}, 2000)

module.exports = AgentService
