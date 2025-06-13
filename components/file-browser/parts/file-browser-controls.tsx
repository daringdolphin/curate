"use client"

import { FileMeta } from "@/types"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileBrowserControlsProps {
  selectedFiles: (FileMeta & { tokens: number })[]
  totalTokens: number
  softCap: number
  hardCap: number
  formatNumber: (num: number) => string
  isCopying: boolean
  onCopyAllFiles: () => void
}

export function FileBrowserControls({
  selectedFiles,
  totalTokens,
  softCap,
  hardCap,
  formatNumber,
  isCopying,
  onCopyAllFiles
}: FileBrowserControlsProps) {
  return (
    <div className="p-6 border-t bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{formatNumber(totalTokens)}</span>
            <span className="text-muted-foreground"> / {formatNumber(hardCap)} tokens</span>
          </div>
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden max-w-xs">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                totalTokens > hardCap ? "bg-red-500" :
                totalTokens > softCap ? "bg-yellow-500" : "bg-blue-500"
              )}
              style={{ 
                width: `${Math.min((totalTokens / hardCap) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Include File Tree</span>
          </div>
          <div className="flex items-center space-x-1">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Include Binary As Paths</span>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={selectedFiles.length === 0 || isCopying}
            onClick={onCopyAllFiles}
          >
            <Copy className="h-4 w-4 mr-2" />
            {isCopying ? "COPYING..." : `COPY ALL SELECTED (${selectedFiles.length} files)`}
          </Button>
        </div>
      </div>
    </div>
  )
} 