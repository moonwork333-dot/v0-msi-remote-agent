const WebSocket = require("ws")
const screenshot = require("screenshot-desktop")
const InputController = require("./input-control")
const fs = require("fs")
const path = require("path")
const Service = require("node-windows").Service

const AGENT_VERSION = "1.0.1"

let CONFIG = {
  dashboardUrl: "wss://v0-msi-remote-agent.vercel.app", // Default to production server
  reconnectInterval: 5000,
}

const possibleConfigPaths = [
  path.join(path.dirname(process.execPath), "config.json"), // Next to agent.exe
  path.join(process.cwd(), "config.json"), // Current working directory
  path.join(__dirname, "config.json"), // Inside pkg bundle
]

let configLoaded = false
for (const configPath of possibleConfigPaths) {
  try {
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, "utf8")
      const loadedConfig = JSON.parse(configFile)
      CONFIG = { ...CONFIG, ...loadedConfig }
      console.log(`[Agent] Loaded config from: ${configPath}`)
      console.log(`[Agent] Dashboard URL from config: ${CONFIG.dashboardUrl}`)
      configLoaded = true
      break
    }
  } catch (error) {
    // Silently continue to next path
  }
}

if (!configLoaded) {
  console.log(`[Agent] No external config.json found. Using production server: ${CONFIG.dashboardUrl}`)
}

const DASHBOARD_URL = process.env.DASHBOARD_URL || CONFIG.dashboardUrl
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

  console.log(message)

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

const IS_WINDOWS_SERVICE = process.platform === "win32" && !process.env.SESSIONNAME

class AgentService {
  constructor() {
    this.ws = null
    this.reconnectInterval = CONFIG.reconnectInterval || 5000
    this.isRunning = false
    this.inputController = new InputController()
    this.remoteSessionActive = false
  }

  async start() {
    log("[Agent] Starting MSI Remote Agent Service...")
    log(`[Agent] Agent ID: ${AGENT_ID}`)
    log(`[Agent] Server URL: ${DASHBOARD_URL}`)
    log(`[Agent] Node version: ${process.version}`)
    log(`[Agent] Platform: ${process.platform} ${process.arch}`)
    log(`[Agent] Is Windows Service: ${IS_WINDOWS_SERVICE}`)
    log(`[Agent] Process ID: ${process.pid}`)
    log(`[Agent] Executable path: ${process.execPath}`)
    log(`[Agent] Working directory: ${process.cwd()}`)
    log(`[Agent] Log file: ${LOG_FILE}`)

    try {
      await screenshot({ format: "png" })
      log("[Agent] Screenshot module loaded successfully")
    } catch (error) {
      log(`[Agent] WARNING: Screenshot module failed: ${error.message}`)
    }

    try {
      const robotjs = require("robotjs")
      log("[Agent] RobotJS module available: " + (robotjs ? "Yes" : "No"))
    } catch (error) {
      log(`[Agent] WARNING: RobotJS module unavailable: ${error.message}`)
    }

    this.isRunning = true

    if (IS_WINDOWS_SERVICE) {
      log("[Agent] Initializing as Windows Service...")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

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
        log("[Agent] Remote session started")
        this.remoteSessionActive = true
        break

      case "end-remote-session":
        log("[Agent] Remote session ended")
        this.remoteSessionActive = false
        break

      case "mouse-move":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse move received: (${message.x}, ${message.y})`)
          if (typeof message.x === "number" && typeof message.y === "number") {
            this.inputController.moveMouse(Math.floor(message.x), Math.floor(message.y))
          } else {
            log(`[Agent] Invalid mouse coordinates: x=${message.x}, y=${message.y}`)
          }
        } else {
          log("[Agent] Mouse move ignored - input control unavailable")
        }
        break

      case "mouse-click":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse click received: ${message.button || "left"}`)
          this.inputController.mouseClick(message.button || "left")
        } else {
          log("[Agent] Mouse click ignored - input control unavailable")
        }
        break

      case "mouse-double-click":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse double-click received: ${message.button || "left"}`)
          this.inputController.mouseDoubleClick(message.button || "left")
        }
        break

      case "mouse-down":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse down received: ${message.button || "left"}`)
          this.inputController.mouseToggle(true, message.button || "left")
        }
        break

      case "mouse-up":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse up received: ${message.button || "left"}`)
          this.inputController.mouseToggle(false, message.button || "left")
        }
        break

      case "mouse-scroll":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Mouse scroll received: (${message.x}, ${message.y})`)
          this.inputController.mouseScroll(message.x || 0, message.y || 0)
        }
        break

      case "key-press":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Key press received: ${message.key}`)
          this.inputController.typeString(message.key)
        } else {
          log("[Agent] Key press ignored - input control unavailable")
        }
        break

      case "key-tap":
        if (this.inputController.isAvailable()) {
          log(`[Agent] Key tap received: ${message.key}`)
          this.inputController.keyTap(message.key, message.modifiers || [])
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

      const robotjs = require("robotjs")
      let screenSize = null
      try {
        screenSize = robotjs.getScreenSize()
      } catch (err) {
        // Screen size unavailable
      }

      this.ws.send(
        JSON.stringify({
          type: "screenshot",
          agentId: AGENT_ID,
          data: base64,
          timestamp: Date.now(),
          screenSize: screenSize,
        }),
      )
    } catch (error) {
      log("[Agent] Screenshot error: " + error.message)

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "screenshot-error",
            agentId: AGENT_ID,
            error: error.message,
            timestamp: Date.now(),
          }),
        )
      }
    }
  }

  stop() {
    log("[Agent] Stopping agent service...")
    this.isRunning = false

    if (this.ws) {
      this.ws.close()
    }

    setTimeout(() => {
      process.exit(0)
    }, 1000)
  }
}

console.log(`[Agent] MSI Remote Agent v${AGENT_VERSION}`)
console.log(`[Agent] Starting ${IS_WINDOWS_SERVICE ? "as Windows Service" : "in console mode"}...`)

if (IS_WINDOWS_SERVICE) {
  const agent = new AgentService()

  process.on("SIGINT", () => {
    log("[Agent] Received SIGINT")
    agent.stop()
  })

  process.on("SIGTERM", () => {
    log("[Agent] Received SIGTERM")
    agent.stop()
  })

  agent.start().catch((error) => {
    log(`[FATAL] Service start failed: ${error.message}`)
    log(error.stack)
    process.exit(1)
  })
} else {
  setTimeout(() => {
    const agent = new AgentService()

    process.on("SIGINT", () => {
      log("[Agent] Received SIGINT")
      agent.stop()
    })

    process.on("SIGTERM", () => {
      log("[Agent] Received SIGTERM")
      agent.stop()
    })

    agent.start().catch((error) => {
      log(`[FATAL] Service start failed: ${error.message}`)
      log(error.stack)
      process.exit(1)
    })
  }, 2000)
}

module.exports = AgentService
