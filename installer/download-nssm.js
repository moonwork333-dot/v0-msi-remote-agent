const https = require("https")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const NSSM_VERSION = "2.24"
const NSSM_URL = `https://nssm.cc/release/nssm-${NSSM_VERSION}.zip`
const TEMP_ZIP = path.join(__dirname, "nssm-temp.zip")
const TEMP_DIR = path.join(__dirname, "nssm-temp")
const TARGET_FILE = path.join(__dirname, "nssm.exe")

console.log("=".repeat(60))
console.log("NSSM DOWNLOAD SCRIPT STARTING")
console.log("=".repeat(60))
console.log(`Working directory: ${__dirname}`)
console.log(`Target file: ${TARGET_FILE}`)
console.log(`Download URL: ${NSSM_URL}`)
console.log("=".repeat(60))

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Initiating download from: ${url}`)
    const file = fs.createWriteStream(dest)
    https
      .get(url, (response) => {
        console.log(`HTTP Status: ${response.statusCode}`)

        if (response.statusCode === 302 || response.statusCode === 301) {
          console.log(`Following redirect to: ${response.headers.location}`)
          file.close()
          fs.unlinkSync(dest)
          return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
        }

        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(dest)
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`))
          return
        }

        let downloaded = 0
        response.on("data", (chunk) => {
          downloaded += chunk.length
        })

        response.pipe(file)
        file.on("finish", () => {
          file.close()
          console.log(`Download complete: ${downloaded} bytes`)
          resolve()
        })
      })
      .on("error", (err) => {
        console.error(`Download error: ${err.message}`)
        file.close()
        fs.unlink(dest, () => {})
        reject(err)
      })
  })
}

async function main() {
  try {
    console.log("\nStep 1: Downloading NSSM ZIP file...")
    await downloadFile(NSSM_URL, TEMP_ZIP)

    console.log("\nStep 2: Verifying download...")
    const stats = fs.statSync(TEMP_ZIP)
    console.log(`ZIP file size: ${stats.size} bytes`)

    console.log("\nStep 3: Extracting NSSM...")
    const extractCmd = `powershell -Command "Expand-Archive -Path '${TEMP_ZIP}' -DestinationPath '${TEMP_DIR}' -Force"`
    console.log(`Running: ${extractCmd}`)
    execSync(extractCmd, { stdio: "inherit" })

    console.log("\nStep 4: Locating 64-bit NSSM executable...")
    const nssmSource = path.join(TEMP_DIR, `nssm-${NSSM_VERSION}`, "win64", "nssm.exe")
    console.log(`Source path: ${nssmSource}`)

    if (!fs.existsSync(nssmSource)) {
      console.error(`ERROR: NSSM executable not found at: ${nssmSource}`)
      console.log("\nDirectory contents:")
      const tempContents = fs.readdirSync(TEMP_DIR)
      console.log(tempContents)
      throw new Error(`NSSM executable not found at: ${nssmSource}`)
    }

    const sourceStats = fs.statSync(nssmSource)
    console.log(`Found NSSM: ${sourceStats.size} bytes`)

    console.log("\nStep 5: Copying NSSM to installer directory...")
    fs.copyFileSync(nssmSource, TARGET_FILE)

    const targetStats = fs.statSync(TARGET_FILE)
    console.log(`NSSM copied successfully: ${targetStats.size} bytes`)

    console.log("\nStep 6: Cleaning up temporary files...")
    fs.unlinkSync(TEMP_ZIP)
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })

    console.log("\n" + "=".repeat(60))
    console.log("NSSM DOWNLOAD COMPLETED SUCCESSFULLY")
    console.log("=".repeat(60))
  } catch (error) {
    console.error("\n" + "=".repeat(60))
    console.error("NSSM DOWNLOAD FAILED")
    console.error("=".repeat(60))
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    process.exit(1)
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

main()
