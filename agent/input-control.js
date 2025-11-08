const ffi = require("ffi-napi")
const ref = require("ref-napi")
const os = require("os")

// Define Windows API types
const int = ref.types.int
const uint = ref.types.uint
const byte = ref.types.byte
const uintPtr = ref.types.ulong

class InputController {
  constructor() {
    this.platform = os.platform()

    if (this.platform === "win32") {
      // Load user32.dll for mouse and keyboard control
      this.user32 = ffi.Library("user32", {
        SetCursorPos: ["bool", [int, int]],
        mouse_event: ["void", [uint, uint, uint, uint, uintPtr]],
        keybd_event: ["void", [byte, byte, uint, uintPtr]],
        GetCursorPos: ["bool", ["pointer"]],
      })
    }
  }

  async moveMouse(x, y) {
    if (this.platform === "win32") {
      this.user32.SetCursorPos(Math.round(x), Math.round(y))
      return true
    }
    throw new Error("Platform not supported")
  }

  async mouseClick(button = "left", double = false) {
    if (this.platform === "win32") {
      const downFlag = button === "left" ? 0x0002 : 0x0008 // MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_RIGHTDOWN
      const upFlag = button === "left" ? 0x0004 : 0x0010 // MOUSEEVENTF_LEFTUP : MOUSEEVENTF_RIGHTUP

      this.user32.mouse_event(downFlag, 0, 0, 0, 0)
      await this.sleep(50)
      this.user32.mouse_event(upFlag, 0, 0, 0, 0)

      if (double) {
        await this.sleep(50)
        this.user32.mouse_event(downFlag, 0, 0, 0, 0)
        await this.sleep(50)
        this.user32.mouse_event(upFlag, 0, 0, 0, 0)
      }

      return true
    }
    throw new Error("Platform not supported")
  }

  async mouseDown(button = "left") {
    if (this.platform === "win32") {
      const downFlag = button === "left" ? 0x0002 : 0x0008
      this.user32.mouse_event(downFlag, 0, 0, 0, 0)
      return true
    }
    throw new Error("Platform not supported")
  }

  async mouseUp(button = "left") {
    if (this.platform === "win32") {
      const upFlag = button === "left" ? 0x0004 : 0x0010
      this.user32.mouse_event(upFlag, 0, 0, 0, 0)
      return true
    }
    throw new Error("Platform not supported")
  }

  async scroll(x, y) {
    if (this.platform === "win32") {
      const MOUSEEVENTF_WHEEL = 0x0800
      const wheelDelta = Math.round(y * 120) // Standard wheel delta is 120 per notch
      this.user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, wheelDelta, 0)
      return true
    }
    throw new Error("Platform not supported")
  }

  async keyTap(key, modifiers = []) {
    if (this.platform === "win32") {
      const vkCode = this.getVKCode(key)
      const modCodes = modifiers.map((m) => this.getVKCode(m))

      // Press modifiers
      for (const code of modCodes) {
        this.user32.keybd_event(code, 0, 0, 0)
      }

      // Press key
      this.user32.keybd_event(vkCode, 0, 0, 0)
      await this.sleep(50)
      // Release key (KEYEVENTF_KEYUP = 0x0002)
      this.user32.keybd_event(vkCode, 0, 0x0002, 0)

      // Release modifiers
      for (const code of modCodes) {
        this.user32.keybd_event(code, 0, 0x0002, 0)
      }

      return true
    }
    throw new Error("Platform not supported")
  }

  async typeString(text) {
    if (this.platform === "win32") {
      // Type each character one by one
      for (const char of text) {
        const vkCode = char.toUpperCase().charCodeAt(0)
        const needsShift = /[A-Z!@#$%^&*()_+{}|:"<>?]/.test(char)

        if (needsShift) {
          this.user32.keybd_event(0x10, 0, 0, 0) // Shift down
        }

        this.user32.keybd_event(vkCode, 0, 0, 0)
        await this.sleep(10)
        this.user32.keybd_event(vkCode, 0, 0x0002, 0)

        if (needsShift) {
          this.user32.keybd_event(0x10, 0, 0x0002, 0) // Shift up
        }

        await this.sleep(20)
      }
      return true
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

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

module.exports = InputController
