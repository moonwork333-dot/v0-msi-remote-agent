const https = require("https")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const NSSM_VERSION = "2.24"
const NSSM_URL = `https://nssm.cc/release/nssm-${NSSM_VERSION}.zip`
const DOWNLOAD_PATH = path.join(__dirname, "nssm.zip")
const EXTRACT_PATH = path.join(__dirname, "nssm-temp")
const TARGET_PATH = path.join(__dirname, "nssm.exe")

console.log("Downloading NSSM from:", NSSM_URL)

async function downloadNSSM() {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(DOWNLOAD_PATH)
    https
      .get(NSSM_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`))
          return
        }

        response.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve()
        })
        file.on("error", (err) => {
          fs.unlink(DOWNLOAD_PATH, () => {})
          reject(err)
        })
      })
      .on("error", (err) => {
        fs.unlink(DOWNLOAD_PATH, () => {})
        reject(err)
      })
  })
}

async function main() {
  try {
    // Download NSSM
    await downloadNSSM()
    console.log("Download complete. Extracting...")

    // Extract using PowerShell
    execSync(
      `powershell -command "Expand-Archive -Path '${DOWNLOAD_PATH}' -DestinationPath '${EXTRACT_PATH}' -Force"`,
      { stdio: "inherit" },
    )

    // Copy the 64-bit version to installer directory
    const nssmExePath = path.join(EXTRACT_PATH, `nssm-${NSSM_VERSION}`, "win64", "nssm.exe")

    if (!fs.existsSync(nssmExePath)) {
      throw new Error(`NSSM executable not found at: ${nssmExePath}`)
    }

    fs.copyFileSync(nssmExePath, TARGET_PATH)
    console.log("NSSM copied to:", TARGET_PATH)

    // Verify the file exists
    if (!fs.existsSync(TARGET_PATH)) {
      throw new Error("Failed to copy NSSM executable")
    }

    console.log("NSSM file size:", fs.statSync(TARGET_PATH).size, "bytes")

    // Cleanup
    fs.rmSync(DOWNLOAD_PATH, { force: true })
    fs.rmSync(EXTRACT_PATH, { recursive: true, force: true })

    console.log("NSSM setup complete!")
  } catch (error) {
    console.error("Error setting up NSSM:", error.message)
    process.exit(1)
  }
}

main()
