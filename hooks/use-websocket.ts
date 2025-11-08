"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface Agent {
  agentId: string
  hostname: string
  platform: string
  arch: string
  connectedAt: string
  lastSeen: string
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

type MessageListener = (message: WebSocketMessage) => void

export function useWebSocket() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const messageListenersRef = useRef<Set<MessageListener>>(new Set())

  const addMessageListener = useCallback((listener: MessageListener) => {
    messageListenersRef.current.add(listener)
    return () => {
      messageListenersRef.current.delete(listener)
    }
  }, [])

  const connect = useCallback(() => {
    // Use environment variable or default to localhost
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "ws://localhost:8080"

    console.log("[v0] Connecting to WebSocket server:", serverUrl)

    try {
      const ws = new WebSocket(serverUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        setIsConnected(true)

        // Register as dashboard
        ws.send(
          JSON.stringify({
            type: "register",
            clientType: "dashboard",
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("[v0] Received message:", message.type)

          messageListenersRef.current.forEach((listener) => {
            try {
              listener(message)
            } catch (error) {
              console.error("[v0] Error in message listener:", error)
            }
          })

          switch (message.type) {
            case "agent-list":
              setAgents(message.agents || [])
              break

            case "agent-connected":
              setAgents((prev) => {
                const exists = prev.find((a) => a.agentId === message.agent.agentId)
                if (exists) return prev
                return [...prev, message.agent]
              })
              break

            case "agent-disconnected":
              setAgents((prev) => prev.filter((a) => a.agentId !== message.agentId))
              break

            case "from-agent":
              console.log("[v0] Message from agent:", message.agentId, message.payload?.type)
              // Messages are now handled by listeners
              break
          }
        } catch (error) {
          console.error("[v0] Error parsing message:", error)
        }
      }

      ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[v0] Attempting to reconnect...")
          connect()
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }
    } catch (error) {
      console.error("[v0] Connection error:", error)
      // Retry connection
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("[v0] Sending message:", message.type)
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.error("[v0] WebSocket is not connected")
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    agents,
    isConnected,
    sendMessage,
    addMessageListener, // Export listener registration function
  }
}
