import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("Building MSI Installer...\n")

// Step 1: Check if WiX Toolset is installed
console.log("Step 1: Checking WiX Toolset installation...")
try {
  execSync("candle -?", { stdio: "ignore" })
  console.log("✓ WiX Toolset found\n")
} catch (error) {
  console.error("✗ WiX Toolset not found!")
  console.error("Please install WiX Toolset from: https://wixtoolset.org/")
  console.error("Or run: choco install wixtoolset (if you have Chocolatey)")
  process.exit(1)
}

// Step 2: Build the agent executable
console.log("Step 2: Building agent executable...")
try {
  execSync("npm run build", { cwd: path.join(__dirname, "..", "agent"), stdio: "inherit" })
  console.log("✓ Agent executable built\n")
} catch (error) {
  console.error("✗ Failed to build agent executable")
  process.exit(1)
}

// Step 3: Verify executable exists
const exePath = path.join(__dirname, "..", "agent", "dist", "agent.exe")
if (!fs.existsSync(exePath)) {
  console.error("✗ Agent executable not found at:", exePath)
  process.exit(1)
}
console.log("✓ Agent executable verified\n")

// Step 4: Compile WiX source
console.log("Step 4: Compiling WiX source...")
try {
  execSync("candle Product.wxs -out obj\\Product.wixobj", {
    cwd: __dirname,
    stdio: "inherit",
  })
  console.log("✓ WiX source compiled\n")
} catch (error) {
  console.error("✗ Failed to compile WiX source")
  process.exit(1)
}

// Step 5: Link and create MSI
console.log("Step 5: Creating MSI installer...")
try {
  const outputDir = path.join(__dirname, "output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  execSync("light obj\\Product.wixobj -out output\\MSIRemoteAgent-1.0.0.msi -ext WixUIExtension -sval", {
    cwd: __dirname,
    stdio: "inherit",
  })
  console.log("✓ MSI installer created\n")
} catch (error) {
  console.error("✗ Failed to create MSI installer")
  process.exit(1)
}

console.log("========================================")
console.log("✓ Build complete!")
console.log("MSI installer location:", path.join(__dirname, "output", "MSIRemoteAgent-1.0.0.msi"))
console.log("========================================")
