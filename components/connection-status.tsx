import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <Badge
      className={
        isConnected
          ? "bg-success/10 text-success hover:bg-success/20"
          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
      }
    >
      {isConnected ? (
        <>
          <Wifi className="mr-1 h-3 w-3" />
          Connected to Server
        </>
      ) : (
        <>
          <WifiOff className="mr-1 h-3 w-3" />
          Disconnected
        </>
      )}
    </Badge>
  )
}
