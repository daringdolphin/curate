"use client"

import { useCallback, useState, useEffect } from "react"
import { FileMeta, OVERSIZE_LIMIT_BYTES, TOKEN_CAPS } from "@/types"
import { useAppStore } from "@/state/atoms"
import { useTokenizer } from "@/hooks/use-tokenizer"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, FileImage, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FileTreeNodeProps {
  file: FileMeta
  onFileClick?: (file: FileMeta) => void
}

export function FileTreeNode({ file, onFileClick }: FileTreeNodeProps) {
  const { 
    fileSelectionState, 
    setFileSelectionState
  } = useAppStore()

  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isImageOnly, setIsImageOnly] = useState(false)
  const [hasTriedExtraction, setHasTriedExtraction] = useState(false)

  const { 
    checkTokenLimits, 
    removeFileTokens, 
    tokenCounts, 
    isProcessing,
    extractAndTokenizeFile 
  } = useTokenizer({
    onExtractionError: (fileId, error) => {
      if (fileId === file.id) {
        if (error.includes("Image-only")) {
          setIsImageOnly(true)
        } else {
          setExtractionError(error)
        }
        setHasTriedExtraction(true)
      }
    }
  })

  const isSelected = fileSelectionState.selectedFiles.has(file.id)
  const isOversize = file.size > OVERSIZE_LIMIT_BYTES
  const tokens = tokenCounts.get(file.id) || 0
  const isFileProcessing = isProcessing(file.id)

  // Check for extraction errors or image-only status on mount
  useEffect(() => {
    // Reset error state when file changes
    setExtractionError(null)
    setIsImageOnly(false)
    setHasTriedExtraction(false)
  }, [file.id])

  // Get file type icon
  const getFileIcon = () => {
    if (isFileProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
    
    if (extractionError || isImageOnly) {
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
    
    if (file.mimeType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    
    if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileText className="h-4 w-4 text-blue-500" />
    }
    
    if (file.mimeType === "application/vnd.google-apps.document") {
      return <FileText className="h-4 w-4 text-green-500" />
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

  // Auto-extract and tokenize on first render if not oversize
  useEffect(() => {
    if (!hasTriedExtraction && !isOversize && tokens === 0 && !isFileProcessing) {
      extractAndTokenizeFile(file).catch(() => {
        // Error will be handled by the onExtractionError callback
        setHasTriedExtraction(true)
      })
    }
  }, [file, hasTriedExtraction, isOversize, tokens, isFileProcessing, extractAndTokenizeFile])

  // Handle selection change
  const handleSelectionChange = useCallback(async (checked: boolean) => {
    const newSelectedFiles = new Set(fileSelectionState.selectedFiles)
    
    if (checked) {
      // If file hasn't been tokenized yet, do it now
      if (tokens === 0 && !isFileProcessing && !isOversize && !extractionError && !isImageOnly) {
        try {
          await extractAndTokenizeFile(file)
        } catch (error) {
          toast.error("Failed to process file for token counting")
          return
        }
        // The tokenizer hook will update the state, so we'll get the tokens on next render
        // For now, we'll add the file and let the hook handle the token counting
      }

      // Use the current tokens (might be 0 if still processing)
      const currentTokens = tokenCounts.get(file.id) || 0
      
      // Check if adding this file would exceed token cap
      const limitCheck = checkTokenLimits(currentTokens)
      if (!limitCheck.canAdd) {
        toast.error(`Adding this file would exceed the ${TOKEN_CAPS.hard.toLocaleString()} token limit`)
        return
      }
      
      // Warn if approaching soft cap
      if (limitCheck.exceedsSoftCap) {
        toast.warning(`Approaching token limit (${TOKEN_CAPS.soft.toLocaleString()} tokens)`)
      }
      
      newSelectedFiles.add(file.id)
    } else {
      newSelectedFiles.delete(file.id)
      // Remove tokens for this file
      removeFileTokens(file.id)
    }
    
    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })
  }, [
    file, 
    fileSelectionState, 
    setFileSelectionState, 
    tokens, 
    isFileProcessing, 
    isOversize, 
    extractionError, 
    isImageOnly,
    extractAndTokenizeFile,
    tokenCounts,
    checkTokenLimits,
    removeFileTokens
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
    
    if (extractionError) {
      badges.push(
        <TooltipProvider key="error">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{extractionError}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    
    if (isImageOnly) {
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
    if (onFileClick && !isOversize && !extractionError) {
      onFileClick(file)
    }
  }, [onFileClick, file, isOversize, extractionError])

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors",
      isSelected && "bg-muted",
      (extractionError || isImageOnly) && "opacity-60",
      onFileClick && !isOversize && !extractionError && "cursor-pointer"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleSelectionChange}
        disabled={isOversize || extractionError !== null}
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
          {file.parentPath && (
            <span className="truncate">{file.parentPath}</span>
          )}
        </div>
      </div>
    </div>
  )
} 