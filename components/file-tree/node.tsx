"use client"

import { useCallback, useState, useEffect } from "react"
import { FileMeta, OVERSIZE_LIMIT_BYTES, TOKEN_CAPS } from "@/types"
import { useAppStore } from "@/state/atoms"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, FileImage, AlertTriangle, Loader2, Clock } from "lucide-react"
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
  const isProcessing = tokens === 0 && file.size > 0 && !isOversize // File has content but no tokens means it's still processing
  const isImageOnly = tokens === 0 && file.size > 0 && !isProcessing // File has content but no tokens and not processing means it's image-only or error

  // Get file type icon
  const getFileIcon = () => {
    if (isProcessing) {
      return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
    }
    
    if (isImageOnly && file.mimeType === "application/pdf") {
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
    
    if (file.mimeType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    
    if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileText className="h-4 w-4 text-blue-500" />
    }
    
    if (file.mimeType === "application/vnd.google-apps.document") {
      return <FileText className="h-4 w-4 text-blue-500" />
    }
    
    return <FileText className="h-4 w-4 text-muted-foreground" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

  // Get badges for the file
  const getBadges = () => {
    const badges = []
    
    if (isOversize) {
      badges.push(
        <Badge key="oversize" variant="destructive" className="text-xs">
          Oversize
        </Badge>
      )
    }
    
    if (isProcessing) {
      badges.push(
        <Badge key="processing" variant="secondary" className="text-xs text-muted-foreground">
          Processing...
        </Badge>
      )
    }
    
    if (isImageOnly && file.mimeType === "application/pdf") {
      badges.push(
        <TooltipProvider key="image-only">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                Image-only
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This PDF contains only images and no extractable text</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    
    return badges
  }

  // Handle file click for preview
  const handleFileClick = useCallback(() => {
    if (onFileClick && !isOversize && !isImageOnly && !isProcessing) {
      onFileClick(file)
    }
  }, [onFileClick, file, isOversize, isImageOnly, isProcessing])

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors",
      isSelected && "bg-muted",
      (isImageOnly || isProcessing) && "opacity-60",
      onFileClick && !isOversize && !isImageOnly && !isProcessing && "cursor-pointer"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleSelectionChange}
        disabled={isOversize || isImageOnly || isProcessing}
        className="shrink-0"
        onClick={(e) => e.stopPropagation()} // Prevent triggering file click when clicking checkbox
      />
      
      {/* File icon */}
      <div className="shrink-0">
        {getFileIcon()}
      </div>
      
      {/* File info - clickable for preview */}
      <div 
        className="flex-1 min-w-0"
        onClick={handleFileClick}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{file.name}</span>
          <div className="flex gap-1">
            {getBadges()}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          {tokens > 0 && (
            <span>{formatTokenCount(tokens)} tokens</span>
          )}
          {isProcessing && (
            <span className="text-muted-foreground">Processing...</span>
          )}
          {file.parentPath && (
            <span className="truncate">{file.parentPath}</span>
          )}
        </div>
      </div>
    </div>
  )
} 