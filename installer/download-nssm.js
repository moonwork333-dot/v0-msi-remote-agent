const https = require("https")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const NSSM_VERSION = "2.24"
const NSSM_URL = `https://nssm.cc/release/nssm-${NSSM_VERSION}.zip`
const TEMP_ZIP = path.join(__dirname, "nssm-temp.zip")
const TEMP_DIR = path.join(__dirname, "nssm-temp")
const TARGET_FILE = path.join(__dirname, "nssm.exe")

console.log("Downloading NSSM...")
console.log(`URL: ${NSSM_URL}`)

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`))
          return
        }

        response.pipe(file)
        file.on("finish", () => {
          file.close()
          console.log("Download complete")
          resolve()
        })
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
  })
}

async function main() {
  try {
    // Download NSSM ZIP
    await downloadFile(NSSM_URL, TEMP_ZIP)

    // Verify download
    const stats = fs.statSync(TEMP_ZIP)
    console.log(`Downloaded ${stats.size} bytes`)

    // Extract using PowerShell
    console.log("Extracting NSSM...")
    execSync(`powershell -Command "Expand-Archive -Path '${TEMP_ZIP}' -DestinationPath '${TEMP_DIR}' -Force"`, {
      stdio: "inherit",
    })

    // Copy 64-bit version
    const nssmSource = path.join(TEMP_DIR, `nssm-${NSSM_VERSION}`, "win64", "nssm.exe")
    console.log(`Copying from: ${nssmSource}`)
    console.log(`Copying to: ${TARGET_FILE}`)

    if (!fs.existsSync(nssmSource)) {
      throw new Error(`NSSM executable not found at: ${nssmSource}`)
    }

    fs.copyFileSync(nssmSource, TARGET_FILE)

    // Verify the copied file
    const targetStats = fs.statSync(TARGET_FILE)
    console.log(`NSSM installed successfully (${targetStats.size} bytes)`)

    // Cleanup
    console.log("Cleaning up...")
    fs.unlinkSync(TEMP_ZIP)
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })

    console.log("Done!")
  } catch (error) {
    console.error("Error downloading NSSM:", error)
    process.exit(1)
  }
}

main()
