let robot = null
try {
  robot = require("robotjs")
  console.log("[InputController] RobotJS loaded successfully")
} catch (err) {
  console.log("[InputController] RobotJS not available:", err.message)
  console.log("[InputController] Input control disabled - screen viewing only")
}

class InputController {
  isAvailable() {
    return robot !== null
  }

  moveMouse(x, y) {
    if (!robot) {
      console.log("[InputController] Mouse control not available")
      return
    }
    try {
      const screenSize = robot.getScreenSize()
      console.log(`[v0] Mouse move request: (${x}, ${y}) - Screen: ${screenSize.width}x${screenSize.height}`)

      // Clamp coordinates to screen bounds
      const clampedX = Math.max(0, Math.min(x, screenSize.width - 1))
      const clampedY = Math.max(0, Math.min(y, screenSize.height - 1))

      robot.moveMouse(clampedX, clampedY)
      console.log(`[v0] Mouse moved to: (${clampedX}, ${clampedY})`)
    } catch (error) {
      console.error("[InputController] Mouse move error:", error.message)
    }
  }

  mouseClick(button = "left") {
    if (!robot) {
      console.log("[InputController] Mouse control not available")
      return
    }
    try {
      const currentPos = robot.getMousePos()
      console.log(`[v0] Mouse click: ${button} at (${currentPos.x}, ${currentPos.y})`)
      robot.mouseClick(button)
      console.log(`[v0] Mouse click completed`)
    } catch (error) {
      console.error("[InputController] Mouse click error:", error.message)
    }
  }

  mouseDoubleClick(button = "left") {
    if (!robot) {
      console.log("[InputController] Mouse control not available")
      return
    }
    try {
      robot.mouseClick(button, true) // double click
      console.log(`[v0] Mouse double-click: ${button}`)
    } catch (error) {
      console.error("[InputController] Mouse double-click error:", error.message)
    }
  }

  mouseToggle(down = true, button = "left") {
    if (!robot) {
      console.log("[InputController] Mouse control not available")
      return
    }
    try {
      robot.mouseToggle(down ? "down" : "up", button)
      console.log(`[v0] Mouse ${down ? "down" : "up"}: ${button}`)
    } catch (error) {
      console.error("[InputController] Mouse toggle error:", error.message)
    }
  }

  mouseScroll(x, y) {
    if (!robot) {
      console.log("[InputController] Mouse control not available")
      return
    }
    try {
      robot.scrollMouse(x, y)
      console.log(`[v0] Mouse scroll: (${x}, ${y})`)
    } catch (error) {
      console.error("[InputController] Mouse scroll error:", error.message)
    }
  }

  typeString(text) {
    if (!robot) {
      console.log("[InputController] Keyboard control not available")
      return
    }
    try {
      robot.typeString(text)
    } catch (error) {
      console.error("[InputController] Type string error:", error.message)
    }
  }

  keyTap(key, modifiers = []) {
    if (!robot) {
      console.log("[InputController] Keyboard control not available")
      return
    }
    try {
      robot.keyTap(key, modifiers)
    } catch (error) {
      console.error("[InputController] Key tap error:", error.message)
    }
  }
}

module.exports = InputController
