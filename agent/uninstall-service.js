const { Service } = require("node-windows")
const path = require("path")

console.log("========================================")
console.log("MSI Remote Agent Service Uninstaller")
console.log("========================================\n")

// Determine if we're running from pkg executable or node
const isPackaged = typeof process.pkg !== "undefined"
const installDir = isPackaged ? path.dirname(process.execPath) : __dirname
const scriptPath = isPackaged ? process.execPath : path.join(__dirname, "service.js")

console.log("Installation Directory:", installDir)
console.log("Service Script:", scriptPath)
console.log("")

// Create the service object
const svc = new Service({
  name: "MSI Remote Agent",
  script: scriptPath,
  workingDirectory: installDir,
})

// Listen for uninstall event
svc.on("uninstall", () => {
  console.log("\n========================================")
  console.log("Service uninstalled successfully!")
  console.log("========================================\n")
})

// Listen for already uninstalled
svc.on("alreadyuninstalled", () => {
  console.log("Service is not installed.\n")
})

// Listen for errors
svc.on("error", (err) => {
  console.error("ERROR:", err.message)
  process.exit(1)
})

// Uninstall the service
console.log("Uninstalling Windows service...\n")
svc.uninstall()

// Keep process alive for events
setTimeout(() => {
  process.exit(0)
}, 5000)
