const WebSocket = require("ws")
const wol = require("wake_on_lan")

const PORT = process.env.PORT || 8080

// Store connected clients
const clients = new Map()
const agents = new Map()
const dashboards = new Set()

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT })

console.log(`[Server] MSI Remote Agent Server started on port ${PORT}`)

wss.on("connection", (ws) => {
  console.log("[Server] New client connected")

  let clientId = null
  let clientType = null

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case "register":
          handleRegistration(ws, message)
          clientId = message.agentId || `dashboard-${Date.now()}`
          clientType = message.clientType
          break

        case "heartbeat":
          handleHeartbeat(ws, clientId)
          break

        case "to-agent":
          routeToAgent(message.agentId, message.payload)
          break

        case "to-dashboard":
          routeToDashboards(clientId, message.payload)
          break

        case "wake-on-lan":
          handleWakeOnLan(message.macAddress, message.requestId, ws)
          break

        default:
          console.log("[Server] Unknown message type:", message.type)
      }
    } catch (error) {
      console.error("[Server] Error handling message:", error)
    }
  })

  ws.on("close", () => {
    console.log("[Server] Client disconnected")

    if (clientType === "agent" && clientId) {
      agents.delete(clientId)
      broadcastAgentDisconnected(clientId)
    } else if (clientType === "dashboard") {
      dashboards.delete(ws)
    }

    clients.delete(clientId)
  })

  ws.on("error", (error) => {
    console.error("[Server] WebSocket error:", error)
  })
})

function handleRegistration(ws, message) {
  if (message.clientType === "agent") {
    const agentId = message.agentId
    const agentInfo = {
      agentId,
      hostname: message.hostname,
      platform: message.platform,
      arch: message.arch,
      cpus: message.cpus,
      totalMemory: message.totalMemory,
      freeMemory: message.freeMemory,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      ws,
    }

    agents.set(agentId, agentInfo)
    clients.set(agentId, ws)

    console.log(`[Server] Agent registered: ${agentId} (${message.hostname})`)

    // Send confirmation to agent
    ws.send(JSON.stringify({ type: "registered", agentId }))

    // Notify all dashboards
    broadcastAgentConnected(agentInfo)
  } else if (message.clientType === "dashboard") {
    dashboards.add(ws)
    console.log("[Server] Dashboard registered")

    // Send current agent list to dashboard
    const agentList = Array.from(agents.values()).map((agent) => ({
      agentId: agent.agentId,
      hostname: agent.hostname,
      platform: agent.platform,
      arch: agent.arch,
      connectedAt: agent.connectedAt,
      lastSeen: agent.lastSeen,
    }))

    ws.send(
      JSON.stringify({
        type: "agent-list",
        agents: agentList,
      }),
    )
  }
}

function handleHeartbeat(ws, clientId) {
  if (clientId && agents.has(clientId)) {
    const agent = agents.get(clientId)
    agent.lastSeen = new Date().toISOString()
  }

  ws.send(JSON.stringify({ type: "heartbeat-ack" }))
}

function handleWakeOnLan(macAddress, requestId, ws) {
  console.log(`[Server] Wake-on-LAN request for MAC: ${macAddress}`)

  wol.wake(macAddress, (error) => {
    if (error) {
      console.error("[Server] Wake-on-LAN error:", error)
      ws.send(
        JSON.stringify({
          type: "wake-on-lan-result",
          requestId,
          success: false,
          error: error.message,
        }),
      )
    } else {
      console.log(`[Server] Wake-on-LAN packet sent to ${macAddress}`)
      ws.send(
        JSON.stringify({
          type: "wake-on-lan-result",
          requestId,
          success: true,
          macAddress,
        }),
      )
    }
  })
}

function routeToAgent(agentId, payload) {
  const agent = agents.get(agentId)

  if (agent && agent.ws.readyState === WebSocket.OPEN) {
    agent.ws.send(JSON.stringify(payload))
  } else {
    console.log(`[Server] Agent ${agentId} not found or not connected`)
  }
}

function routeToDashboards(agentId, payload) {
  const message = JSON.stringify({
    type: "from-agent",
    agentId,
    payload,
  })

  dashboards.forEach((dashboard) => {
    if (dashboard.readyState === WebSocket.OPEN) {
      dashboard.send(message)
    }
  })
}

function broadcastAgentConnected(agentInfo) {
  const message = JSON.stringify({
    type: "agent-connected",
    agent: {
      agentId: agentInfo.agentId,
      hostname: agentInfo.hostname,
      platform: agentInfo.platform,
      arch: agentInfo.arch,
      connectedAt: agentInfo.connectedAt,
      lastSeen: agentInfo.lastSeen,
    },
  })

  dashboards.forEach((dashboard) => {
    if (dashboard.readyState === WebSocket.OPEN) {
      dashboard.send(message)
    }
  })
}

function broadcastAgentDisconnected(agentId) {
  const message = JSON.stringify({
    type: "agent-disconnected",
    agentId,
  })

  dashboards.forEach((dashboard) => {
    if (dashboard.readyState === WebSocket.OPEN) {
      dashboard.send(message)
    }
  })
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...")
  wss.close(() => {
    console.log("[Server] Server closed")
    process.exit(0)
  })
})

process.on("SIGTERM", () => {
  console.log("\n[Server] Shutting down...")
  wss.close(() => {
    console.log("[Server] Server closed")
    process.exit(0)
  })
})
