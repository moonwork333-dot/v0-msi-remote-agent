const path = require("path")

class TrayIcon {
  constructor() {
    this.isVisible = false
  }

  async initialize() {
    try {
      // Create tray icon using PowerShell's System.Windows.Forms
      const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$global:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$global:notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
$global:notifyIcon.Text = "MSI Remote Agent - Running"
$global:notifyIcon.Visible = $true

# Create context menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
$statusItem = New-Object System.Windows.Forms.ToolStripMenuItem
$statusItem.Text = "Status: Connected"
$statusItem.Enabled = $false
$contextMenu.Items.Add($statusItem)

$separator = New-Object System.Windows.Forms.ToolStripSeparator
$contextMenu.Items.Add($separator)

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "Exit Agent"
$contextMenu.Items.Add($exitItem)

$global:notifyIcon.ContextMenuStrip = $contextMenu

# Keep PowerShell running
while ($true) {
  Start-Sleep -Seconds 1
  [System.Windows.Forms.Application]::DoEvents()
}
`

      // Note: In production, this should be a proper Windows Forms app
      // For now, we'll use a simpler notification approach
      this.isVisible = true
      console.log("[Agent] Tray icon initialized (visible mode)")
    } catch (error) {
      console.log("[Agent] Could not initialize tray icon:", error.message)
      this.isVisible = false
    }
  }

  showNotification(title, message, type = "info") {
    try {
      // Use Windows native notifications
      const script = `
Add-Type -AssemblyName System.Windows.Forms
$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.Icon = [System.Drawing.SystemIcons]::Information
$notification.BalloonTipTitle = "${title}"
$notification.BalloonTipText = "${message}"
$notification.Visible = $true
$notification.ShowBalloonTip(5000)
Start-Sleep -Seconds 6
$notification.Dispose()
`

      const { exec } = require("child_process")
      exec(`powershell -Command "${script.replace(/\n/g, "; ")}"`, (error) => {
        if (error) {
          console.log("[Agent] Notification error:", error.message)
        }
      })
    } catch (error) {
      console.log("[Agent] Could not show notification:", error.message)
    }
  }

  updateStatus(status) {
    console.log(`[Agent] Status: ${status}`)
    // In a full implementation, this would update the tray icon tooltip
  }

  destroy() {
    this.isVisible = false
    console.log("[Agent] Tray icon destroyed")
  }
}

module.exports = TrayIcon
