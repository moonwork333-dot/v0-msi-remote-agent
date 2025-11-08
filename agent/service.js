const WebSocket = require("ws")
const screenshot = require("screenshot-desktop")
const InputController = require("./input-control")

const DASHBOARD_URL = process.env.DASHBOARD_URL || "ws://localhost:3000"
const AGENT_ID = process.env.AGENT_ID || require("os").hostname()

class AgentService {
  constructor() {
    this.ws = null
    this.reconnectInterval = 5000
    this.isRunning = false
    this.inputController = new InputController()
    this.remoteSessionActive = false
  }

  async start() {
    console.log("[Agent] Starting MSI Remote Agent...")
    this.isRunning = true
    this.connect()
  }

  connect() {
    if (!this.isRunning) return

    try {
      console.log("[Agent] Connecting to dashboard:", DASHBOARD_URL)
      this.ws = new WebSocket(DASHBOARD_URL)

      this.ws.on("open", () => {
        console.log("[Agent] Connected to dashboard")

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

        if (this.remoteSessionActive) {
          this.remoteSessionActive = false
        }

        if (this.isRunning) {
          setTimeout(() => this.connect(), this.reconnectInterval)
        }
      })

      this.ws.on("error", (error) => {
        console.error("[Agent] WebSocket error:", error.message)
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
    }
  }

  stop() {
    console.log("[Agent] Stopping agent service...")
    this.isRunning = false

    if (this.ws) {
      this.ws.close()
    }
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
