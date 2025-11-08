"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Monitor, Activity, Radio } from "lucide-react"
import { AgentCard } from "@/components/agent-card"
import { ConnectionStatus } from "@/components/connection-status"
import { ScreenViewer } from "@/components/screen-viewer"
import { TerminalViewer } from "@/components/terminal-viewer"
import { FileManager } from "@/components/file-manager"
import { SystemControls } from "@/components/system-controls"
import { useWebSocket } from "@/hooks/use-websocket"

export default function DashboardPage() {
  const { agents, isConnected, sendMessage, addMessageListener } = useWebSocket()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [screenViewerAgent, setScreenViewerAgent] = useState<{ agentId: string; hostname: string } | null>(null)
  const [terminalAgent, setTerminalAgent] = useState<{ agentId: string; hostname: string } | null>(null)
  const [fileManagerAgent, setFileManagerAgent] = useState<{
    agentId: string
    hostname: string
    platform: string
  } | null>(null)
  const [systemControlsAgent, setSystemControlsAgent] = useState<{ agentId: string; hostname: string } | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Monitor className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">MSI Remote Agent</h1>
                <p className="text-sm text-muted-foreground">System Monitoring Dashboard</p>
              </div>
            </div>
            <ConnectionStatus isConnected={isConnected} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-semibold text-foreground">{agents.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-3xl font-semibold text-success">{agents.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-semibold text-muted-foreground">0</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Radio className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-3xl font-semibold text-foreground">0</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Activity className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Agents Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Connected Agents</h2>
            <p className="text-sm text-muted-foreground">Monitor and control remote systems</p>
          </div>
        </div>

        {/* Agent Grid */}
        {agents.length === 0 ? (
          <Card className="border-border bg-card p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Monitor className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No Agents Connected</h3>
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                Start an agent service on a remote PC to see it appear here. Make sure the agent is configured with the
                correct server URL.
              </p>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm text-muted-foreground">
                SERVER_URL=wss://your-server.com npm start
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                isSelected={selectedAgent === agent.agentId}
                onSelect={() => setSelectedAgent(agent.agentId)}
                onAction={(action) => {
                  console.log("[v0] Agent action:", action, "for agent:", agent.agentId)
                  if (action === "screen") {
                    setScreenViewerAgent({
                      agentId: agent.agentId,
                      hostname: agent.hostname,
                    })
                  } else if (action === "terminal") {
                    setTerminalAgent({
                      agentId: agent.agentId,
                      hostname: agent.hostname,
                    })
                  } else if (action === "files") {
                    setFileManagerAgent({
                      agentId: agent.agentId,
                      hostname: agent.hostname,
                      platform: agent.platform,
                    })
                  } else if (action === "system-controls") {
                    setSystemControlsAgent({
                      agentId: agent.agentId,
                      hostname: agent.hostname,
                    })
                  } else {
                    sendMessage({
                      type: "to-agent",
                      agentId: agent.agentId,
                      payload: { type: action },
                    })
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Screen Viewer Modal */}
      {screenViewerAgent && (
        <ScreenViewer
          agentId={screenViewerAgent.agentId}
          hostname={screenViewerAgent.hostname}
          onClose={() => setScreenViewerAgent(null)}
          sendMessage={sendMessage}
          addMessageListener={addMessageListener} // Pass message listener registration
        />
      )}

      {/* Terminal Viewer Modal */}
      {terminalAgent && (
        <TerminalViewer
          agentId={terminalAgent.agentId}
          hostname={terminalAgent.hostname}
          onClose={() => setTerminalAgent(null)}
          sendMessage={sendMessage}
        />
      )}

      {/* File Manager Modal */}
      {fileManagerAgent && (
        <FileManager
          agentId={fileManagerAgent.agentId}
          hostname={fileManagerAgent.hostname}
          platform={fileManagerAgent.platform}
          onClose={() => setFileManagerAgent(null)}
          sendMessage={sendMessage}
        />
      )}

      {/* System Controls Modal */}
      {systemControlsAgent && (
        <SystemControls
          agentId={systemControlsAgent.agentId}
          hostname={systemControlsAgent.hostname}
          onClose={() => setSystemControlsAgent(null)}
          sendMessage={sendMessage}
        />
      )}
    </div>
  )
}
