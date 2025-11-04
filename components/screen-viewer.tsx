"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Maximize2, Minimize2, Monitor, MousePointer2 } from "lucide-react"

interface ScreenViewerProps {
  agentId: string
  hostname: string
  onClose: () => void
  sendMessage: (message: any) => void
}

export function ScreenViewer({ agentId, hostname, onClose, sendMessage }: ScreenViewerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState(0)
  const [remoteControlEnabled, setRemoteControlEnabled] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(Date.now())
  const fpsIntervalRef = useRef<NodeJS.Timeout>()

  // Start screen stream
  const startStream = useCallback(() => {
    const requestId = `stream-${Date.now()}`
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "start-screen-stream",
        requestId,
        quality: 60,
        fps: 10,
      },
    })
    setIsStreaming(true)
  }, [agentId, sendMessage])

  // Stop screen stream
  const stopStream = useCallback(() => {
    const requestId = `stream-stop-${Date.now()}`
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "stop-screen-stream",
        requestId,
      },
    })
    setIsStreaming(false)
  }, [agentId, sendMessage])

  // Handle screen frames
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === "from-agent" && message.agentId === agentId) {
          const payload = message.payload

          if (payload.type === "screen-frame" && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")

            if (ctx) {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)

                // Update FPS counter
                frameCountRef.current++
                const now = Date.now()
                const timeSinceLastFrame = now - lastFrameTimeRef.current
                lastFrameTimeRef.current = now

                // Calculate latency
                if (payload.timestamp) {
                  setLatency(now - payload.timestamp)
                }
              }
              img.src = `data:image/jpeg;base64,${payload.frame}`
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error handling screen frame:", error)
      }
    }

    // Listen for WebSocket messages
    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleMessage)
      }
    }
  }, [agentId])

  // FPS counter
  useEffect(() => {
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
    }, 1000)

    return () => {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
    }
  }, [])

  // Auto-start stream
  useEffect(() => {
    startStream()
    return () => {
      stopStream()
    }
  }, [startStream, stopStream])

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!remoteControlEnabled || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "remote-input",
        input: { type: "mousemove", x, y },
      },
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!remoteControlEnabled) return

    const button = e.button === 0 ? "left" : e.button === 2 ? "right" : "middle"
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "remote-input",
        input: { type: "mousedown", button },
      },
    })
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!remoteControlEnabled) return

    const button = e.button === 0 ? "left" : e.button === 2 ? "right" : "middle"
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "remote-input",
        input: { type: "mouseup", button },
      },
    })
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!remoteControlEnabled) return
    e.preventDefault()

    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "remote-input",
        input: {
          type: "scroll",
          x: Math.floor(e.deltaX / 10),
          y: Math.floor(e.deltaY / 10),
        },
      },
    })
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!remoteControlEnabled) return

      e.preventDefault()
      const modifiers = []
      if (e.ctrlKey) modifiers.push("control")
      if (e.shiftKey) modifiers.push("shift")
      if (e.altKey) modifiers.push("alt")
      if (e.metaKey) modifiers.push("command")

      sendMessage({
        type: "to-agent",
        agentId,
        payload: {
          type: "remote-input",
          input: {
            type: "keypress",
            key: e.key.toLowerCase(),
            modifiers,
          },
        },
      })
    }

    if (remoteControlEnabled) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [remoteControlEnabled, agentId, sendMessage])

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <Card className="flex h-[90vh] w-[95vw] flex-col border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{hostname}</h2>
              <p className="text-xs text-muted-foreground">Remote Screen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {fps} FPS
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {latency}ms
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRemoteControlEnabled(!remoteControlEnabled)}
              className={remoteControlEnabled ? "bg-primary/10 text-primary" : ""}
            >
              <MousePointer2 className="mr-2 h-4 w-4" />
              {remoteControlEnabled ? "Control On" : "Control Off"}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Screen Canvas */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-black p-4">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </Card>
    </div>
  )
}
