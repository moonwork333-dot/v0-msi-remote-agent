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
      robot.moveMouse(x, y)
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
      robot.mouseClick(button)
    } catch (error) {
      console.error("[InputController] Mouse click error:", error.message)
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
