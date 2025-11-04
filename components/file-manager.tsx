"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X, FolderOpen, File, Folder, ChevronRight, Home, RefreshCw, Search } from "lucide-react"

interface FileManagerProps {
  agentId: string
  hostname: string
  platform: string
  onClose: () => void
  sendMessage: (message: any) => void
}

interface FileItem {
  name: string
  isDirectory: boolean
  size?: number
  modified?: string
  path: string
  error?: string
}

export function FileManager({ agentId, hostname, platform, onClose, sendMessage }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string>("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pathHistory, setPathHistory] = useState<string[]>([])

  // Get initial directory based on platform
  const getInitialDirectory = useCallback(() => {
    if (platform.includes("win")) return "C:\\"
    return "/"
  }, [platform])

  // Load directory
  const loadDirectory = useCallback(
    (directory: string) => {
      setLoading(true)
      const requestId = `files-${Date.now()}`

      sendMessage({
        type: "to-agent",
        agentId,
        payload: {
          type: "list-files",
          directory,
          requestId,
        },
      })
    },
    [agentId, sendMessage],
  )

  // Handle file list responses
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === "from-agent" && message.agentId === agentId) {
          const payload = message.payload

          if (payload.type === "file-list") {
            setLoading(false)

            if (payload.error) {
              console.error("[v0] File list error:", payload.error)
              return
            }

            setCurrentPath(payload.directory)
            setFiles(payload.files || [])
          }
        }
      } catch (error) {
        console.error("[v0] Error handling file manager message:", error)
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

  // Load initial directory
  useEffect(() => {
    const initialDir = getInitialDirectory()
    loadDirectory(initialDir)
  }, [getInitialDirectory, loadDirectory])

  const navigateToDirectory = (path: string) => {
    setPathHistory((prev) => [...prev, currentPath])
    loadDirectory(path)
  }

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1]
      setPathHistory((prev) => prev.slice(0, -1))
      loadDirectory(previousPath)
    }
  }

  const navigateToHome = () => {
    setPathHistory([])
    loadDirectory(getInitialDirectory())
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="flex h-[85vh] w-[95vw] max-w-6xl flex-col border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{hostname}</h2>
              <p className="text-xs text-muted-foreground">File Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigateToHome}>
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateBack} disabled={pathHistory.length === 0}>
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadDirectory(currentPath)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Path and Search */}
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {currentPath || "/"}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-9"
            />
          </div>
        </div>

        {/* File List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Folder className="mb-2 h-12 w-12 opacity-50" />
                <p>No files found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      {file.isDirectory ? (
                        <Folder className="h-5 w-5 text-primary" />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{file.name}</p>
                        {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(file.modified)}</p>
                      </div>

                      <div className="flex gap-1">
                        {file.isDirectory && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToDirectory(file.path)}
                            disabled={!!file.error}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredFiles.length} item{filteredFiles.length !== 1 ? "s" : ""}
            </span>
            <span>
              {filteredFiles.filter((f) => f.isDirectory).length} folder
              {filteredFiles.filter((f) => f.isDirectory).length !== 1 ? "s" : ""},{" "}
              {filteredFiles.filter((f) => !f.isDirectory).length} file
              {filteredFiles.filter((f) => !f.isDirectory).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
