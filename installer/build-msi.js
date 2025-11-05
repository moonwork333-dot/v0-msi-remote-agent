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
const exePath = path.join(__dirname, "..", "agent", "dist", "msi-agent.exe")
if (!fs.existsSync(exePath)) {
  console.error("✗ Agent executable not found at:", exePath)
  process.exit(1)
}
console.log("✓ Agent executable verified\n")

// Step 3.5: Download NSSM if not present
const nssmPath = path.join(__dirname, "nssm.exe")
if (!fs.existsSync(nssmPath)) {
  console.log("Step 3.5: Downloading NSSM...")
  console.log("========================================")

  const NSSM_URL = "https://nssm.cc/release/nssm-2.24.zip"
  const zipPath = path.join(__dirname, "nssm.zip")
  const extractDir = path.join(__dirname, "nssm-temp")

  try {
    // Download NSSM ZIP
    console.log("Downloading NSSM from:", NSSM_URL)
    execSync(`powershell -Command "(New-Object Net.WebClient).DownloadFile('${NSSM_URL}', '${zipPath}')"`, {
      stdio: "inherit",
    })

    const zipSize = fs.statSync(zipPath).size
    console.log(`✓ Downloaded NSSM ZIP (${(zipSize / 1024).toFixed(2)} KB)`)

    // Extract using PowerShell
    console.log("Extracting NSSM...")
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, {
      stdio: "inherit",
    })
    console.log("✓ Extracted NSSM ZIP")

    // Copy 64-bit NSSM
    const nssmSource = path.join(extractDir, "nssm-2.24", "win64", "nssm.exe")
    if (!fs.existsSync(nssmSource)) {
      throw new Error("64-bit NSSM not found in extracted files")
    }

    fs.copyFileSync(nssmSource, nssmPath)
    const nssmSize = fs.statSync(nssmPath).size
    console.log(`✓ Copied 64-bit NSSM (${(nssmSize / 1024).toFixed(2)} KB)`)

    // Cleanup
    fs.unlinkSync(zipPath)
    fs.rmSync(extractDir, { recursive: true, force: true })
    console.log("✓ Cleaned up temporary files")

    console.log("========================================")
    console.log("✓ NSSM downloaded successfully\n")
  } catch (error) {
    console.error("✗ Failed to download NSSM:", error.message)
    // Cleanup on error
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
    process.exit(1)
  }
} else {
  console.log("Step 3.5: NSSM already present, skipping download\n")
}

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

  execSync("light obj\\Product.wixobj -out output\\MSIRemoteAgent-1.0.0.msi -ext WixUIExtension", {
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
