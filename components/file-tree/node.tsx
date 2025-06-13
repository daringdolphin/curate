"use client"

import { useCallback } from "react"
import { FileMeta, OVERSIZE_LIMIT_BYTES, TOKEN_CAPS } from "@/types"
import { useAppStore } from "@/state/atoms"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Clock, AlertTriangle, Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FileTreeNodeProps {
  file: FileMeta
  onFileClick?: (file: FileMeta) => void
}

export function FileTreeNode({ file, onFileClick }: FileTreeNodeProps) {
  const { 
    fileSelectionState, 
    setFileSelectionState,
    tokenState,
    setTokenState
  } = useAppStore()

  const isSelected = fileSelectionState.selectedFiles.has(file.id)
  const isOversize = file.size > OVERSIZE_LIMIT_BYTES
  const tokens = file.tokens || 0
  const isProcessing = tokens === 0 && file.size > 0 && !isOversize
  const isImageOnly = tokens === 0 && file.size > 0 && !isProcessing
  const isSelectable = tokens > 0 && !isOversize && !isImageOnly

  // Get file type icon
  const getFileIcon = () => {
    if (isProcessing) {
      return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
    }
    
    if (isOversize || isImageOnly) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    
    if (file.mimeType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-600" />
    }
    
    if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    
    if (file.mimeType === "application/vnd.google-apps.document") {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    
    return <FileText className="h-4 w-4 text-slate-600" />
  }

  // Format token count
  const formatTokenCount = (count: number) => {
    if (count === 0) return "0"
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

  // Handle selection change
  const handleSelectionChange = useCallback(async (checked: boolean) => {
    const newSelectedFiles = new Set(fileSelectionState.selectedFiles)
    
    if (checked) {
      // Check if adding this file would exceed token cap
      const currentTotal = tokenState.totalTokens
      const potentialTotal = currentTotal + tokens
      
      if (potentialTotal > tokenState.hardCap) {
        toast.error(`Adding this file would exceed the ${TOKEN_CAPS.hard.toLocaleString()} token limit`)
        return
      }
      
      // Warn if approaching soft cap
      if (potentialTotal > tokenState.softCap) {
        toast.warning(`Approaching token limit (${TOKEN_CAPS.soft.toLocaleString()} tokens)`)
      }
      
      newSelectedFiles.add(file.id)
      
      // Update token state
      const newTokenCounts = new Map(tokenState.tokenCounts)
      newTokenCounts.set(file.id, tokens)
      
      setTokenState({
        ...tokenState,
        tokenCounts: newTokenCounts,
        totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
      })
    } else {
      newSelectedFiles.delete(file.id)
      
      // Remove tokens for this file
      const newTokenCounts = new Map(tokenState.tokenCounts)
      newTokenCounts.delete(file.id)
      
      setTokenState({
        ...tokenState,
        tokenCounts: newTokenCounts,
        totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
      })
    }
    
    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })
  }, [
    file.id, 
    tokens,
    fileSelectionState, 
    setFileSelectionState,
    tokenState,
    setTokenState
  ])

  // Handle file click for preview
  const handleFileClick = useCallback(() => {
    if (onFileClick && isSelectable) {
      onFileClick(file)
    }
  }, [onFileClick, file, isSelectable])

  return (
    <div className={cn(
      "flex items-center gap-3 py-2 px-2 hover:bg-muted/50 transition-colors rounded-sm",
      isSelected && "bg-muted",
      !isSelectable && "opacity-60",
      onFileClick && isSelectable && "cursor-pointer"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleSelectionChange}
        disabled={!isSelectable}
        className="shrink-0 h-4 w-4"
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* File icon */}
      <div className="shrink-0">
        {getFileIcon()}
      </div>
      
      {/* File name and token count */}
      <div 
        className="flex-1 min-w-0 flex items-center justify-between"
        onClick={handleFileClick}
      >
        <span className="font-medium truncate text-sm pr-2">
          {file.name}
        </span>
        
        {/* Token count with icon */}
        {tokens > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
            <Hash className="h-3 w-3" />
            {formatTokenCount(tokens)}
          </div>
        )}
        
        {/* Processing state */}
        {isProcessing && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded shrink-0">
            <Clock className="h-3 w-3" />
            Processing
          </div>
        )}
        
        {/* Error states */}
        {(isOversize || isImageOnly) && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {isOversize ? "Oversize" : "No text"}
          </div>
        )}
      </div>
    </div>
  )
} 