"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Terminal, FolderOpen, Eye, Settings } from "lucide-react"

interface Agent {
  agentId: string
  hostname: string
  platform: string
  arch: string
  connectedAt: string
  lastSeen: string
}

interface AgentCardProps {
  agent: Agent
  isSelected: boolean
  onSelect: () => void
  onAction: (action: string) => void
}

export function AgentCard({ agent, isSelected, onSelect, onAction }: AgentCardProps) {
  const getPlatformIcon = (platform: string) => {
    if (platform.includes("win")) return "🪟"
    if (platform.includes("darwin")) return "🍎"
    if (platform.includes("linux")) return "🐧"
    return "💻"
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <Card
      className={`border-border bg-card p-6 transition-all hover:border-primary/50 ${
        isSelected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
            {getPlatformIcon(agent.platform)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.hostname}</h3>
            <p className="text-xs text-muted-foreground">{agent.agentId}</p>
          </div>
        </div>
        <Badge className="bg-success/10 text-success hover:bg-success/20">
          <Activity className="mr-1 h-3 w-3" />
          Online
        </Badge>
      </div>

      {/* System Info */}
      <div className="mb-4 space-y-2 rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-mono text-foreground">{agent.platform}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Architecture</span>
          <span className="font-mono text-foreground">{agent.arch}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last Seen</span>
          <span className="font-mono text-foreground">{formatTime(agent.lastSeen)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={(e) => {
            e.stopPropagation()
            onAction("terminal")
          }}
        >
          <Terminal className="mr-2 h-4 w-4" />
          Terminal
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={(e) => {
            e.stopPropagation()
            onAction("files")
          }}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Files
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={(e) => {
            e.stopPropagation()
            onAction("screen")
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Screen
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={(e) => {
            e.stopPropagation()
            onAction("system-controls")
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Controls
        </Button>
      </div>
    </Card>
  )
}
