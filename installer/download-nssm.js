const https = require("https")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const NSSM_VERSION = "2.24"
const NSSM_URL = `https://nssm.cc/release/nssm-${NSSM_VERSION}.zip`
const DOWNLOAD_PATH = path.join(__dirname, "nssm.zip")
const EXTRACT_PATH = path.join(__dirname, "nssm-temp")
const TARGET_PATH = path.join(__dirname, "nssm.exe")

console.log("Downloading NSSM...")

// Download NSSM
const file = fs.createWriteStream(DOWNLOAD_PATH)
https
  .get(NSSM_URL, (response) => {
    response.pipe(file)
    file.on("finish", () => {
      file.close()
      console.log("Download complete. Extracting...")

      try {
        // Extract using PowerShell (available on all Windows systems)
        execSync(
          `powershell -command "Expand-Archive -Path '${DOWNLOAD_PATH}' -DestinationPath '${EXTRACT_PATH}' -Force"`,
          { stdio: "inherit" },
        )

        // Copy the 64-bit version to installer directory
        const nssmExePath = path.join(EXTRACT_PATH, `nssm-${NSSM_VERSION}`, "win64", "nssm.exe")
        fs.copyFileSync(nssmExePath, TARGET_PATH)

        // Cleanup
        fs.rmSync(DOWNLOAD_PATH)
        fs.rmSync(EXTRACT_PATH, { recursive: true, force: true })

        console.log("NSSM extracted successfully to:", TARGET_PATH)
      } catch (error) {
        console.error("Error extracting NSSM:", error.message)
        process.exit(1)
      }
    })
  })
  .on("error", (err) => {
    fs.unlink(DOWNLOAD_PATH, () => {})
    console.error("Error downloading NSSM:", err.message)
    process.exit(1)
  })
