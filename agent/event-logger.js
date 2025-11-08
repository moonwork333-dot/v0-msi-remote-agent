const fs = require("fs")
const path = require("path")
const os = require("os")

class EventLogger {
  constructor() {
    // Log to ProgramData for visibility
    this.logDir = path.join(process.env.ProgramData || "C:\\ProgramData", "MSIRemoteAgent", "logs")
    this.logFile = path.join(this.logDir, `agent-${this.getDateString()}.log`)

    this.ensureLogDirectory()
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error("[EventLogger] Could not create log directory:", error.message)
    }
  }

  getDateString() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  }

  log(event, details = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      event,
      details,
      hostname: os.hostname(),
      user: os.userInfo().username,
    }

    const logLine = `[${timestamp}] ${event} - ${JSON.stringify(details)}\n`

    try {
      fs.appendFileSync(this.logFile, logLine, "utf8")
      console.log("[EventLogger]", logLine.trim())
    } catch (error) {
      console.error("[EventLogger] Could not write to log file:", error.message)
    }
  }

  getRecentLogs(count = 50) {
    try {
      const content = fs.readFileSync(this.logFile, "utf8")
      const lines = content.trim().split("\n")
      return lines.slice(-count)
    } catch (error) {
      console.error("[EventLogger] Could not read log file:", error.message)
      return []
    }
  }
}

module.exports = EventLogger
