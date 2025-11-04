"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Power, MonitorOff, MonitorCheck } from "lucide-react"

interface SystemControlsProps {
  agentId: string
  hostname: string
  onClose: () => void
  sendMessage: (message: any) => void
}

export function SystemControls({ agentId, hostname, onClose, sendMessage }: SystemControlsProps) {
  const [macAddress, setMacAddress] = useState("")
  const [isBlankScreen, setIsBlankScreen] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleWakeOnLan = () => {
    if (!macAddress.trim()) {
      setStatus({ type: "error", message: "Please enter a MAC address" })
      return
    }

    const requestId = `wol-${Date.now()}`
    sendMessage({
      type: "wake-on-lan",
      macAddress: macAddress.trim(),
      requestId,
    })

    setStatus({ type: "success", message: `Wake-on-LAN packet sent to ${macAddress}` })

    setTimeout(() => setStatus(null), 5000)
  }

  const handleBlankScreen = (enabled: boolean) => {
    const requestId = `blank-${Date.now()}`
    sendMessage({
      type: "to-agent",
      agentId,
      payload: {
        type: "blank-screen",
        enabled,
        requestId,
      },
    })

    setIsBlankScreen(enabled)
    setStatus({
      type: "success",
      message: enabled ? "Screen blanked" : "Screen restored",
    })

    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md border-border bg-card p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">System Controls</h2>
            <p className="text-sm text-muted-foreground">{hostname}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`mb-4 rounded-lg p-3 ${
              status.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
          >
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        {/* Wake-on-LAN Section */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Power className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Wake-on-LAN</h3>
          </div>
          <p className="text-sm text-muted-foreground">Send a magic packet to wake up a computer on the network</p>
          <div className="space-y-2">
            <Label htmlFor="mac-address">MAC Address</Label>
            <Input
              id="mac-address"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="00:11:22:33:44:55"
              className="font-mono"
            />
          </div>
          <Button onClick={handleWakeOnLan} className="w-full">
            <Power className="mr-2 h-4 w-4" />
            Send Wake-on-LAN
          </Button>
        </div>

        {/* Blank Screen Section */}
        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <MonitorOff className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Screen Control</h3>
          </div>
          <p className="text-sm text-muted-foreground">Turn the remote screen on or off</p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBlankScreen(true)}
              disabled={isBlankScreen}
              variant={isBlankScreen ? "outline" : "default"}
              className="flex-1"
            >
              <MonitorOff className="mr-2 h-4 w-4" />
              Blank Screen
            </Button>
            <Button
              onClick={() => handleBlankScreen(false)}
              disabled={!isBlankScreen}
              variant={!isBlankScreen ? "outline" : "default"}
              className="flex-1"
            >
              <MonitorCheck className="mr-2 h-4 w-4" />
              Restore Screen
            </Button>
          </div>
          {isBlankScreen && (
            <Badge variant="outline" className="w-full justify-center bg-warning/10 text-warning">
              Screen is currently blanked
            </Badge>
          )}
        </div>
      </Card>
    </div>
  )
}
