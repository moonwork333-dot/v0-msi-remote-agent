const { exec } = require("child_process")
const os = require("os")
const util = require("util")
const execPromise = util.promisify(exec)

class InputController {
  constructor() {
    this.platform = os.platform()
  }

  async moveMouse(x, y) {
    if (this.platform === "win32") {
      const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async mouseClick(button = "left", double = false) {
    if (this.platform === "win32") {
      const buttonCode = button === "left" ? "0x02" : "0x08"
      const downCode = button === "left" ? "0x02" : "0x08"
      const upCode = button === "left" ? "0x04" : "0x10"

      const script = `
Add-Type -MemberDefinition @"
  [DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extrainfo);
"@ -Name "MouseControl" -Namespace Win32
[Win32.MouseControl]::mouse_event(${downCode}, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[Win32.MouseControl]::mouse_event(${upCode}, 0, 0, 0, 0)
${double ? `Start-Sleep -Milliseconds 50\n[Win32.MouseControl]::mouse_event(${downCode}, 0, 0, 0, 0)\nStart-Sleep -Milliseconds 50\n[Win32.MouseControl]::mouse_event(${upCode}, 0, 0, 0, 0)` : ""}
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async mouseDown(button = "left") {
    if (this.platform === "win32") {
      const downCode = button === "left" ? "0x02" : "0x08"

      const script = `
Add-Type -MemberDefinition @"
  [DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extrainfo);
"@ -Name "MouseControl" -Namespace Win32
[Win32.MouseControl]::mouse_event(${downCode}, 0, 0, 0, 0)
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async mouseUp(button = "left") {
    if (this.platform === "win32") {
      const upCode = button === "left" ? "0x04" : "0x10"

      const script = `
Add-Type -MemberDefinition @"
  [DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extrainfo);
"@ -Name "MouseControl" -Namespace Win32
[Win32.MouseControl]::mouse_event(${upCode}, 0, 0, 0, 0)
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async scroll(x, y) {
    if (this.platform === "win32") {
      const script = `
Add-Type -MemberDefinition @"
  [DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extrainfo);
"@ -Name "MouseControl" -Namespace Win32
[Win32.MouseControl]::mouse_event(0x0800, 0, 0, ${y * 120}, 0)
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async keyTap(key, modifiers = []) {
    if (this.platform === "win32") {
      const vkCode = this.getVKCode(key)
      const modCodes = modifiers.map((m) => this.getVKCode(m))

      let script = `
Add-Type -MemberDefinition @"
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);
"@ -Name "KeyControl" -Namespace Win32
`
      // Press modifiers
      modCodes.forEach((code) => {
        script += `[Win32.KeyControl]::keybd_event(${code}, 0, 0, 0)\n`
      })

      // Press key
      script += `[Win32.KeyControl]::keybd_event(${vkCode}, 0, 0, 0)\n`
      script += `Start-Sleep -Milliseconds 50\n`
      script += `[Win32.KeyControl]::keybd_event(${vkCode}, 0, 2, 0)\n`

      // Release modifiers
      modCodes.forEach((code) => {
        script += `[Win32.KeyControl]::keybd_event(${code}, 0, 2, 0)\n`
      })

      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  async typeString(text) {
    if (this.platform === "win32") {
      const escaped = text.replace(/'/g, "''").replace(/"/g, '""')
      const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${escaped}')
      `
      return this.execPowerShell(script)
    }
    throw new Error("Platform not supported")
  }

  getVKCode(key) {
    const vkCodes = {
      enter: 0x0d,
      tab: 0x09,
      backspace: 0x08,
      delete: 0x2e,
      escape: 0x1b,
      space: 0x20,
      up: 0x26,
      down: 0x28,
      left: 0x25,
      right: 0x27,
      home: 0x24,
      end: 0x23,
      pageup: 0x21,
      pagedown: 0x22,
      shift: 0x10,
      control: 0x11,
      ctrl: 0x11,
      alt: 0x12,
      meta: 0x5b,
      command: 0x5b,
    }

    if (vkCodes[key.toLowerCase()]) {
      return vkCodes[key.toLowerCase()]
    }

    // Single character keys
    if (key.length === 1) {
      return key.toUpperCase().charCodeAt(0)
    }

    return 0x20 // Default to space
  }

  async execPowerShell(script) {
    try {
      const { stdout, stderr } = await execPromise(
        `powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '\\"')}"`,
        { timeout: 5000 },
      )
      if (stderr) {
        throw new Error(stderr)
      }
      return stdout
    } catch (error) {
      throw new Error(`PowerShell execution failed: ${error.message}`)
    }
  }
}

module.exports = InputController
