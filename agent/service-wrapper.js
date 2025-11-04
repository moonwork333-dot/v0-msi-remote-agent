// Service wrapper for Windows Service mode
const Service = require("node-windows").Service
const path = require("path")
const fs = require("fs")

// Load configuration
const configPath = path.join(__dirname, "config.json")
let config = {
  serverUrl: "ws://localhost:8080",
  heartbeatInterval: 30000,
  reconnectInterval: 5000,
}

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"))
  } catch (error) {
    console.error("Failed to load config:", error)
  }
}

// Set environment variables from config
process.env.SERVER_URL = config.serverUrl

// Check if running as service
if (process.argv.includes("--service")) {
  // Running as Windows Service
  console.log("Starting as Windows Service...")
  require("./service.js")
} else if (process.argv.includes("--install")) {
  // Install as Windows Service
  const svc = new Service({
    name: "MSI Remote Agent",
    description: "Remote monitoring and control agent",
    script: path.join(__dirname, "service.js"),
    nodeOptions: ["--harmony", "--max_old_space_size=4096"],
    env: [
      {
        name: "SERVER_URL",
        value: config.serverUrl,
      },
    ],
  })

  svc.on("install", () => {
    console.log("Service installed successfully")
    svc.start()
  })

  svc.install()
} else if (process.argv.includes("--uninstall")) {
  // Uninstall Windows Service
  const svc = new Service({
    name: "MSI Remote Agent",
    script: path.join(__dirname, "service.js"),
  })

  svc.on("uninstall", () => {
    console.log("Service uninstalled successfully")
  })

  svc.uninstall()
} else {
  // Run normally (for testing)
  console.log("Starting in console mode...")
  require("./service.js")
}
