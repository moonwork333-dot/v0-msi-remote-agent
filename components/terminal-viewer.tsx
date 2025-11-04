"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Terminal, Trash2 } from "lucide-react"

interface TerminalViewerProps {
  agentId: string
  hostname: string
  onClose: () => void
  sendMessage: (message: any) => void
}

interface TerminalLine {
  type: "command" | "output" | "error"
  content: string
  timestamp: number
}

export function TerminalViewer({ agentId, hostname, onClose, sendMessage }: TerminalViewerProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [command, setCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle command responses
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === "from-agent" && message.agentId === agentId) {
          const payload = message.payload

          if (payload.type === "command-result") {
            if (payload.stdout) {
              setLines((prev) => [
                ...prev,
                {
                  type: "output",
                  content: payload.stdout,
                  timestamp: Date.now(),
                },
              ])
            }

            if (payload.stderr) {
              setLines((prev) => [
                ...prev,
                {
                  type: "error",
                  content: payload.stderr,
                  timestamp: Date.now(),
                },
              ])
            }

            if (payload.error) {
              setLines((prev) => [
                ...prev,
                {
                  type: "error",
                  content: `Error: ${payload.error}`,
                  timestamp: Date.now(),
                },
              ])
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error handling terminal message:", error)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleMessage)
      }
    }
  }, [agentId])

  const executeCommand = useCallback(() => {
    if (!command.trim()) return

    // Add command to display
    setLines((prev) => [
      ...prev,
      {
        type: "command",
        content: command,
        timestamp: Date.now(),
      },
    ])

    // Add to history
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)

    // Send command to agent
    const requestId = `cmd-${Date.now()}`
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "execute-command",
        command,
        requestId,
      },
    })

    setCommand("")
  }, [command, agentId, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCommand("")
        } else {
          setHistoryIndex(newIndex)
          setCommand(commandHistory[newIndex])
        }
      }
    }
  }

  const clearTerminal = () => {
    setLines([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="flex h-[80vh] w-[90vw] max-w-5xl flex-col border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{hostname}</h2>
              <p className="text-xs text-muted-foreground">Remote Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearTerminal}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Terminal Output */}
        <ScrollArea className="flex-1 p-4">
          <div ref={scrollRef} className="font-mono text-sm">
            {lines.length === 0 && (
              <div className="text-muted-foreground">
                <p>Remote terminal ready. Type a command and press Enter.</p>
                <p className="mt-2">Examples:</p>
                <ul className="ml-4 mt-1 list-disc">
                  <li>ls -la (Linux/Mac) or dir (Windows)</li>
                  <li>pwd (Linux/Mac) or cd (Windows)</li>
                  <li>whoami</li>
                </ul>
              </div>
            )}

            {lines.map((line, index) => (
              <div key={index} className="mb-1">
                {line.type === "command" && (
                  <div className="text-primary">
                    <span className="text-muted-foreground">$ </span>
                    {line.content}
                  </div>
                )}
                {line.type === "output" && <pre className="whitespace-pre-wrap text-foreground">{line.content}</pre>}
                {line.type === "error" && <pre className="whitespace-pre-wrap text-destructive">{line.content}</pre>}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Command Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">$</span>
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 font-mono"
            />
            <Button onClick={executeCommand} disabled={!command.trim()}>
              Execute
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Press Enter to execute, ↑/↓ to navigate command history</p>
        </div>
      </Card>
    </div>
  )
}
