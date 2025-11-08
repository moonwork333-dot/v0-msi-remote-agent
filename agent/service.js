const WebSocket = require("ws")
const os = require("os")
const { exec } = require("child_process")
const fs = require("fs")
const fsPromises = require("fs").promises
const path = require("path")

const LOG_FILE = path.join(path.dirname(process.execPath), "agent.log")

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`

  // Write to console
  console.log(message)

  // Write to file synchronously to ensure it's written even if process crashes
  try {
    fs.appendFileSync(LOG_FILE, logMessage)
  } catch (error) {
    console.error("Failed to write to log file:", error)
  }
}

// Check if running as Windows service
const isWindowsService = process.platform === "win32" && !process.stdout.isTTY

if (isWindowsService) {
  // Redirect console output to log file when running as service
  const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" })
  process.stdout.write = process.stderr.write = logStream.write.bind(logStream)

  log("=== Running as Windows Service ===")
}

// Log startup immediately
log("=== MSI Remote Agent Starting ===")
log(`Process ID: ${process.pid}`)
log(`Executable path: ${process.execPath}`)
log(`Working directory: ${process.cwd()}`)
log(`Log file: ${LOG_FILE}`)
log(`Is Windows Service: ${isWindowsService}`)

let screenshot = null
let robot = null

try {
  screenshot = require("screenshot-desktop")
  log("[Agent] Screenshot module loaded successfully")
} catch (error) {
  log("[Agent] Screenshot module not available: " + error.message)
}

try {
  robot = require("robotjs")
  log("[Agent] RobotJS module loaded successfully")
} catch (error) {
  log("[Agent] RobotJS module not available: " + error.message)
}

const configPaths = [
  path.join(__dirname, "config.json"),
  path.join(process.cwd(), "config.json"),
  path.join(path.dirname(process.execPath), "config.json"),
  "C:\\Program Files (x86)\\MSI Remote Agent\\config.json",
  "C:\\Program Files\\MSI Remote Agent\\config.json",
]

let SERVER_URL_FROM_CONFIG = "ws://localhost:8080"

log("[Agent] Searching for config.json in:")
for (const configPath of configPaths) {
  log(`  - ${configPath}`)
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
      SERVER_URL_FROM_CONFIG = config.serverUrl || SERVER_URL_FROM_CONFIG
      log(`[Agent] ✓ Loaded config from: ${configPath}`)
      log(`[Agent] Server URL from config: ${SERVER_URL_FROM_CONFIG}`)
      break
    }
  } catch (error) {
    log(`[Agent] Failed to load config from ${configPath}: ${error.message}`)
  }
}

// Configuration
const SERVER_URL = process.env.SERVER_URL || SERVER_URL_FROM_CONFIG
const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const RECONNECT_INTERVAL = 5000 // 5 seconds

log(`[Agent] Final Server URL: ${SERVER_URL}`)

class AgentService {
  constructor() {
    this.ws = null
    this.agentId = os.hostname()
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.isConnected = false
    this.screenStreamInterval = null
    this.isStreaming = false
    this.blankScreenWindow = null
    this.isScreenBlank = false
  }

  start() {
    log("[Agent] Starting MSI Remote Agent Service...")
    log(`[Agent] Agent ID: ${this.agentId}`)
    log(`[Agent] Server URL: ${SERVER_URL}`)
    this.connect()
  }

  connect() {
    try {
      log("[Agent] Connecting to server...")
      this.ws = new WebSocket(SERVER_URL)

      this.ws.on("open", () => {
        log("[Agent] Connected to server")
        this.isConnected = true
        this.register()
        this.startHeartbeat()
      })

      this.ws.on("message", (data) => {
        this.handleMessage(data)
      })

      this.ws.on("close", () => {
        log("[Agent] Disconnected from server")
        this.isConnected = false
        this.stopHeartbeat()
        this.scheduleReconnect()
      })

      this.ws.on("error", (error) => {
        log("[Agent] WebSocket error: " + error.message)
      })
    } catch (error) {
      log("[Agent] Connection error: " + error.message)
      log("[Agent] Stack: " + error.stack)
      this.scheduleReconnect()
    }
  }

  register() {
    const registrationData = {
      type: "register",
      clientType: "agent",
      agentId: this.agentId,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    }

    this.send(registrationData)
    log("[Agent] Registration sent")
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: "heartbeat" })
      }
    }, HEARTBEAT_INTERVAL)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    log(`[Agent] Reconnecting in ${RECONNECT_INTERVAL / 1000} seconds...`)
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, RECONNECT_INTERVAL)
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case "registered":
          log("[Agent] Registration confirmed")
          break

        case "heartbeat-ack":
          // Heartbeat acknowledged
          break

        case "execute-command":
          this.executeCommand(message.command, message.requestId)
          break

        case "list-files":
          this.listFiles(message.directory, message.requestId)
          break

        case "read-file":
          this.readFile(message.filePath, message.requestId)
          break

        case "write-file":
          this.writeFile(message.filePath, message.content, message.requestId)
          break

        case "delete-file":
          this.deleteFile(message.filePath, message.requestId)
          break

        case "get-system-info":
          this.getSystemInfo(message.requestId)
          break

        case "screenshot":
          this.takeScreenshot(message.requestId)
          break

        case "start-screen-stream":
          this.startScreenStream(message.requestId, message.quality, message.fps)
          break

        case "stop-screen-stream":
          this.stopScreenStream(message.requestId)
          break

        case "remote-input":
          this.handleRemoteInput(message.input, message.requestId)
          break

        case "blank-screen":
          this.blankScreen(message.enabled, message.requestId)
          break

        default:
          log("[Agent] Unknown message type: " + message.type)
      }
    } catch (error) {
      log("[Agent] Error handling message: " + error.message)
    }
  }

  executeCommand(command, requestId) {
    log(`[Agent] Executing command: ${command}`)

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      this.sendToDashboard({
        type: "command-result",
        requestId,
        success: !error,
        stdout: stdout || "",
        stderr: stderr || "",
        error: error ? error.message : null,
      })
    })
  }

  takeScreenshot(requestId) {
    if (!screenshot) {
      this.sendToDashboard({
        type: "screenshot",
        requestId,
        error: "Screenshot functionality not available",
      })
      return
    }

    try {
      screenshot({ format: "png" })
        .then((img) => {
          this.sendToDashboard({
            type: "screenshot",
            requestId,
            image: img.toString("base64"),
            timestamp: Date.now(),
          })
        })
        .catch((error) => {
          this.sendToDashboard({
            type: "screenshot",
            requestId,
            error: error.message,
          })
        })
    } catch (error) {
      this.sendToDashboard({
        type: "screenshot",
        requestId,
        error: "Screenshot library not available: " + error.message,
      })
    }
  }

  startScreenStream(requestId, quality = 60, fps = 10) {
    if (!screenshot) {
      this.sendToDashboard({
        type: "screen-stream-started",
        requestId,
        error: "Screen streaming not available",
      })
      return
    }

    if (this.isStreaming) {
      this.sendToDashboard({
        type: "screen-stream-started",
        requestId,
        error: "Already streaming",
      })
      return
    }

    try {
      const frameInterval = 1000 / fps

      log(`[Agent] Starting screen stream at ${fps} FPS, quality ${quality}`)

      this.isStreaming = true
      this.sendToDashboard({
        type: "screen-stream-started",
        requestId,
        success: true,
        fps,
        quality,
      })

      this.screenStreamInterval = setInterval(() => {
        screenshot({ format: "jpg" })
          .then((img) => {
            if (this.isStreaming) {
              this.sendToDashboard({
                type: "screen-frame",
                frame: img.toString("base64"),
                timestamp: Date.now(),
              })
            }
          })
          .catch((error) => {
            log("[Agent] Screen capture error: " + error.message)
          })
      }, frameInterval)
    } catch (error) {
      this.isStreaming = false
      this.sendToDashboard({
        type: "screen-stream-started",
        requestId,
        error: "Failed to start screen stream: " + error.message,
      })
    }
  }

  stopScreenStream(requestId) {
    log("[Agent] Stopping screen stream")

    if (this.screenStreamInterval) {
      clearInterval(this.screenStreamInterval)
      this.screenStreamInterval = null
    }

    this.isStreaming = false

    this.sendToDashboard({
      type: "screen-stream-stopped",
      requestId,
      success: true,
    })
  }

  handleRemoteInput(input, requestId) {
    if (!robot) {
      if (requestId) {
        this.sendToDashboard({
          type: "remote-input-result",
          requestId,
          success: false,
          error: "Remote input functionality not available",
        })
      }
      return
    }

    try {
      switch (input.type) {
        case "mousemove":
          robot.moveMouse(input.x, input.y)
          break

        case "mousedown":
          robot.mouseToggle("down", input.button || "left")
          break

        case "mouseup":
          robot.mouseToggle("up", input.button || "left")
          break

        case "click":
          robot.mouseClick(input.button || "left", input.double || false)
          break

        case "scroll":
          robot.scrollMouse(input.x || 0, input.y || 0)
          break

        case "keypress":
          if (input.modifiers && input.modifiers.length > 0) {
            robot.keyTap(input.key, input.modifiers)
          } else {
            robot.keyTap(input.key)
          }
          break

        case "keydown":
          robot.keyToggle(input.key, "down", input.modifiers)
          break

        case "keyup":
          robot.keyToggle(input.key, "up", input.modifiers)
          break

        case "type":
          robot.typeString(input.text)
          break

        default:
          log("[Agent] Unknown input type: " + input.type)
      }

      if (requestId) {
        this.sendToDashboard({
          type: "remote-input-result",
          requestId,
          success: true,
        })
      }
    } catch (error) {
      log("[Agent] Remote input error: " + error.message)
      if (requestId) {
        this.sendToDashboard({
          type: "remote-input-result",
          requestId,
          success: false,
          error: error.message,
        })
      }
    }
  }

  async listFiles(directory, requestId) {
    try {
      const dirPath = directory || (os.platform() === "win32" ? "C:\\" : "/")
      log(`[Agent] Listing files in: ${dirPath}`)

      const files = await fsPromises.readdir(dirPath, { withFileTypes: true })
      const fileList = await Promise.all(
        files.map(async (file) => {
          try {
            const filePath = path.join(dirPath, file.name)
            const stats = await fsPromises.stat(filePath)
            return {
              name: file.name,
              isDirectory: file.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
              path: filePath,
            }
          } catch (err) {
            return {
              name: file.name,
              isDirectory: file.isDirectory(),
              error: "Permission denied",
            }
          }
        }),
      )

      this.sendToDashboard({
        type: "file-list",
        requestId,
        directory: dirPath,
        files: fileList,
      })
    } catch (error) {
      this.sendToDashboard({
        type: "file-list",
        requestId,
        error: error.message,
      })
    }
  }

  async readFile(filePath, requestId) {
    try {
      log(`[Agent] Reading file: ${filePath}`)
      const content = await fsPromises.readFile(filePath, "utf8")

      this.sendToDashboard({
        type: "file-content",
        requestId,
        filePath,
        content,
      })
    } catch (error) {
      this.sendToDashboard({
        type: "file-content",
        requestId,
        error: error.message,
      })
    }
  }

  async writeFile(filePath, content, requestId) {
    try {
      log(`[Agent] Writing file: ${filePath}`)
      await fsPromises.writeFile(filePath, content, "utf8")

      this.sendToDashboard({
        type: "file-written",
        requestId,
        success: true,
        filePath,
      })
    } catch (error) {
      this.sendToDashboard({
        type: "file-written",
        requestId,
        success: false,
        error: error.message,
      })
    }
  }

  async deleteFile(filePath, requestId) {
    try {
      log(`[Agent] Deleting: ${filePath}`)
      const stats = await fsPromises.stat(filePath)

      if (stats.isDirectory()) {
        await fsPromises.rmdir(filePath, { recursive: true })
      } else {
        await fsPromises.unlink(filePath)
      }

      this.sendToDashboard({
        type: "file-deleted",
        requestId,
        success: true,
        filePath,
      })
    } catch (error) {
      this.sendToDashboard({
        type: "file-deleted",
        requestId,
        success: false,
        error: error.message,
      })
    }
  }

  getSystemInfo(requestId) {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      networkInterfaces: os.networkInterfaces(),
      userInfo: os.userInfo(),
    }

    this.sendToDashboard({
      type: "system-info",
      requestId,
      info: systemInfo,
    })
  }

  blankScreen(enabled, requestId) {
    log(`[Agent] Blank screen ${enabled ? "enabled" : "disabled"}`)

    if (enabled && !this.isScreenBlank) {
      // Turn off display using platform-specific commands
      const platform = os.platform()

      if (platform === "win32") {
        // Windows: Turn off monitor
        exec(
          'powershell (Add-Type "[DllImport(\\"user32.dll\\")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);" -Name a -Pas)::SendMessage(-1,0x0112,0xF170,2)',
          (error) => {
            if (error) {
              log("[Agent] Blank screen error: " + error.message)
              this.sendToDashboard({
                type: "blank-screen-result",
                requestId,
                success: false,
                error: error.message,
              })
            } else {
              this.isScreenBlank = true
              this.sendToDashboard({
                type: "blank-screen-result",
                requestId,
                success: true,
                enabled: true,
              })
            }
          },
        )
      } else if (platform === "darwin") {
        // macOS: Turn off display
        exec("pmset displaysleepnow", (error) => {
          if (error) {
            log("[Agent] Blank screen error: " + error.message)
            this.sendToDashboard({
              type: "blank-screen-result",
              requestId,
              success: false,
              error: error.message,
            })
          } else {
            this.isScreenBlank = true
            this.sendToDashboard({
              type: "blank-screen-result",
              requestId,
              success: true,
              enabled: true,
            })
          }
        })
      } else if (platform === "linux") {
        // Linux: Turn off display using xset
        exec("xset dpms force off", (error) => {
          if (error) {
            log("[Agent] Blank screen error: " + error.message)
            this.sendToDashboard({
              type: "blank-screen-result",
              requestId,
              success: false,
              error: error.message,
            })
          } else {
            this.isScreenBlank = true
            this.sendToDashboard({
              type: "blank-screen-result",
              requestId,
              success: true,
              enabled: true,
            })
          }
        })
      } else {
        this.sendToDashboard({
          type: "blank-screen-result",
          requestId,
          success: false,
          error: "Platform not supported",
        })
      }
    } else if (!enabled && this.isScreenBlank) {
      // Turn on display
      const platform = os.platform()

      if (platform === "win32") {
        // Windows: Turn on monitor
        exec(
          'powershell (Add-Type "[DllImport(\\"user32.dll\\")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);" -Name a -Pas)::SendMessage(-1,0x0112,0xF170,-1)',
          (error) => {
            if (error) {
              log("[Agent] Unblank screen error: " + error.message)
            }
            this.isScreenBlank = false
            this.sendToDashboard({
              type: "blank-screen-result",
              requestId,
              success: true,
              enabled: false,
            })
          },
        )
      } else if (platform === "darwin") {
        // macOS: Wake display (move mouse slightly)
        if (robot) {
          robot.moveMouse(robot.getMousePos().x + 1, robot.getMousePos().y)
        }
        this.isScreenBlank = false
        this.sendToDashboard({
          type: "blank-screen-result",
          requestId,
          success: true,
          enabled: false,
        })
      } else if (platform === "linux") {
        // Linux: Turn on display
        exec("xset dpms force on", (error) => {
          if (error) {
            log("[Agent] Unblank screen error: " + error.message)
          }
          this.isScreenBlank = false
          this.sendToDashboard({
            type: "blank-screen-result",
            requestId,
            success: true,
            enabled: false,
          })
        })
      }
    } else {
      this.sendToDashboard({
        type: "blank-screen-result",
        requestId,
        success: true,
        enabled: this.isScreenBlank,
      })
    }
  }

  sendToDashboard(payload) {
    this.send({
      type: "to-dashboard",
      payload,
    })
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  stop() {
    log("[Agent] Stopping agent service...")
    this.stopScreenStream()
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    if (this.ws) {
      this.ws.close()
    }
  }
}

try {
  log("[Agent] Initializing agent service...")
  const agent = new AgentService()
  agent.start()
  log("[Agent] Agent service started successfully")

  // Keep the process alive
  const keepAliveInterval = setInterval(() => {
    // This ensures the Node.js event loop stays active
  }, 60000)

  process.on("uncaughtException", (error) => {
    log("[Agent] Uncaught exception: " + error.message)
    log("[Agent] Stack: " + error.stack)
  })

  process.on("unhandledRejection", (reason, promise) => {
    log("[Agent] Unhandled rejection: " + reason)
  })

  // Graceful shutdown
  process.on("SIGINT", () => {
    log("[Agent] Received SIGINT, shutting down...")
    clearInterval(keepAliveInterval)
    agent.stop()
    process.exit(0)
  })

  process.on("SIGTERM", () => {
    log("[Agent] Received SIGTERM, shutting down...")
    clearInterval(keepAliveInterval)
    agent.stop()
    process.exit(0)
  })
} catch (error) {
  log("[Agent] FATAL ERROR during startup: " + error.message)
  log("[Agent] Stack: " + error.stack)
  process.exit(1)
}
