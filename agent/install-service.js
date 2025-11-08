const { Service } = require("node-windows")
const path = require("path")
const fs = require("fs")

console.log("========================================")
console.log("MSI Remote Agent Service Installer")
console.log("========================================\n")

// Determine if we're running from pkg executable or node
const isPackaged = typeof process.pkg !== "undefined"
const installDir = isPackaged ? path.dirname(process.execPath) : __dirname
const scriptPath = isPackaged ? process.execPath : path.join(__dirname, "service.js")

console.log("Installation Directory:", installDir)
console.log("Service Script:", scriptPath)
console.log("")

// Verify the script exists
if (!fs.existsSync(scriptPath)) {
  console.error("ERROR: Service script not found at:", scriptPath)
  process.exit(1)
}

// Create the service object
const svc = new Service({
  name: "MSI Remote Agent",
  description: "Remote monitoring and control agent",
  script: scriptPath,
  nodeOptions: [],
  workingDirectory: installDir,
  allowMultipleInstances: false,
  // Configure service behavior
  env: {
    name: "NODE_ENV",
    value: "production",
  },
})

// Listen for install event
svc.on("install", () => {
  console.log('\nService "MSI Remote Agent" installed successfully!')
  console.log("Starting service...\n")
  svc.start()
})

// Listen for start event
svc.on("start", () => {
  console.log("========================================")
  console.log("SUCCESS! Service is running.")
  console.log("========================================\n")
  console.log("The agent should appear in your dashboard within 10-15 seconds.\n")
  console.log("Logs location:", path.join(installDir, "agent.log"))
  console.log("")
})

// Listen for already installed
svc.on("alreadyinstalled", () => {
  console.log("Service is already installed.")
  console.log("To reinstall, first run uninstall-service.cmd\n")
})

// Listen for errors
svc.on("error", (err) => {
  console.error("ERROR:", err.message)
  process.exit(1)
})

// Install the service
console.log("Installing Windows service...\n")
svc.install()

// Keep process alive for events
setTimeout(() => {
  process.exit(0)
}, 10000)
