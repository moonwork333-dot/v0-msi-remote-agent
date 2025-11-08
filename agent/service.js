const WebSocket = require("ws")
const screenshot = require("screenshot-desktop")
const TrayIcon = require("./tray-icon")
const InputController = require("./input-control")
const EventLogger = require("./event-logger")

const DASHBOARD_URL = process.env.DASHBOARD_URL || "ws://localhost:3000"
const AGENT_ID = process.env.AGENT_ID || require("os").hostname()

class AgentService {
  constructor() {
    this.ws = null
    this.reconnectInterval = 5000
    this.isRunning = false
    this.trayIcon = new TrayIcon()
    this.inputController = new InputController()
    this.eventLogger = new EventLogger()
    this.remoteSessionActive = false
  }

  async start() {
    console.log("[Agent] Starting MSI Remote Agent...")
    this.isRunning = true

    await this.trayIcon.initialize()
    this.trayIcon.showNotification("MSI Remote Agent", "Agent service started successfully", "info")
    this.eventLogger.log("Service started", { agentId: AGENT_ID })

    this.connect()
  }

  connect() {
    if (!this.isRunning) return

    try {
      console.log("[Agent] Connecting to dashboard:", DASHBOARD_URL)
      this.ws = new WebSocket(DASHBOARD_URL)

      this.ws.on("open", () => {
        console.log("[Agent] Connected to dashboard")
        this.trayIcon.updateStatus("Connected")
        this.trayIcon.showNotification("MSI Remote Agent", "Connected to dashboard", "success")
        this.eventLogger.log("Connected to dashboard", { url: DASHBOARD_URL })

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
          console.error("[Agent] Error handling message:", error)
        }
      })

      this.ws.on("close", () => {
        console.log("[Agent] Disconnected from dashboard")
        this.trayIcon.updateStatus("Disconnected - Reconnecting...")
        this.eventLogger.log("Disconnected from dashboard")

        if (this.remoteSessionActive) {
          this.trayIcon.showNotification("MSI Remote Agent", "Remote session ended", "info")
          this.remoteSessionActive = false
          this.eventLogger.log("Remote session ended")
        }

        if (this.isRunning) {
          setTimeout(() => this.connect(), this.reconnectInterval)
        }
      })

      this.ws.on("error", (error) => {
        console.error("[Agent] WebSocket error:", error.message)
        this.eventLogger.log("WebSocket error", { error: error.message })
      })
    } catch (error) {
      console.error("[Agent] Connection error:", error)
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
        if (!this.remoteSessionActive) {
          this.remoteSessionActive = true
          this.trayIcon.showNotification(
            "Remote Session Started",
            "An administrator is now viewing and controlling your screen",
            "warning",
          )
          this.eventLogger.log("Remote session started", {
            operator: message.operator || "Unknown",
          })
        }
        break

      case "end-remote-session":
        if (this.remoteSessionActive) {
          this.remoteSessionActive = false
          this.trayIcon.showNotification("Remote Session Ended", "Remote control session has ended", "info")
          this.eventLogger.log("Remote session ended")
        }
        break

      case "mouse-move":
        if (this.inputController.isAvailable()) {
          this.inputController.moveMouse(message.x, message.y)
          this.eventLogger.log("Mouse moved", { x: message.x, y: message.y })
        }
        break

      case "mouse-click":
        if (this.inputController.isAvailable()) {
          this.inputController.mouseClick(message.button)
          this.eventLogger.log("Mouse clicked", { button: message.button })
        }
        break

      case "key-press":
        if (this.inputController.isAvailable()) {
          this.inputController.typeString(message.key)
          this.eventLogger.log("Key pressed", { key: message.key })
        }
        break

      default:
        console.log("[Agent] Unknown message type:", message.type)
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
      console.error("[Agent] Screenshot error:", error)
      this.eventLogger.log("Screenshot error", { error: error.message })
    }
  }

  stop() {
    console.log("[Agent] Stopping agent service...")
    this.isRunning = false

    this.trayIcon.showNotification("MSI Remote Agent", "Agent service stopped", "info")
    this.eventLogger.log("Service stopped")

    if (this.ws) {
      this.ws.close()
    }

    this.trayIcon.destroy()
  }
}

// Run as service
const agent = new AgentService()

process.on("SIGINT", () => {
  agent.stop()
  process.exit(0)
})

process.on("SIGTERM", () => {
  agent.stop()
  process.exit(0)
})

agent.start()

module.exports = AgentService
