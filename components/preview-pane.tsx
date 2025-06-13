"use client"

import { useState, useCallback, useEffect } from "react"
import { FileMeta } from "@/types"
import { useAppStore } from "@/state/atoms"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { extractFileAction } from "@/actions/extract-file-action"
import { toast } from "sonner"

interface PreviewPaneProps {
  file: FileMeta | null
  className?: string
}

const INITIAL_PREVIEW_SIZE = 8 * 1024 // 8KB
const EXPANDED_PREVIEW_SIZE = 32 * 1024 // 32KB

export function PreviewPane({ file, className = "" }: PreviewPaneProps) {
  const { drivePickerState } = useAppStore()
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Extract file content
  const extractFile = useCallback(async (fileId: string, mimeType: string, expanded: boolean = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await extractFileAction(fileId, mimeType, drivePickerState.accessToken || undefined)
      
      if (result.error) {
        setError(result.error)
        setContent("")
        setHasMore(false)
        return
      }

      if (!result.content) {
        setError("No content extracted from file")
        setContent("")
        setHasMore(false)
        return
      }

      const fullContent = result.content
      const previewLimit = expanded ? EXPANDED_PREVIEW_SIZE : INITIAL_PREVIEW_SIZE
      
      if (fullContent.length > previewLimit) {
        setContent(fullContent.substring(0, previewLimit))
        setHasMore(true)
      } else {
        setContent(fullContent)
        setHasMore(false)
      }

      // Detect if this is an image-only PDF
      if (mimeType === "application/pdf" && fullContent.trim().length < 50) {
        setError("This PDF appears to contain only images with no extractable text")
      }

    } catch (err: any) {
      setError(err.message || "Failed to extract file content")
      setContent("")
      setHasMore(false)
      toast.error("Failed to load file preview")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle expand/collapse
  const handleToggleExpanded = useCallback(() => {
    if (!file) return
    
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    
    if (newExpanded && hasMore) {
      extractFile(file.id, file.mimeType, true)
    }
  }, [file, isExpanded, hasMore, extractFile])

  // Load file when selection changes
  useEffect(() => {
    if (!file) {
      setContent("")
      setError(null)
      setIsExpanded(false)
      setHasMore(false)
      return
    }

    // Check if file is too large
    if (file.size > 16 * 1024 * 1024) {
      setError("File is too large to preview (>16MB)")
      setContent("")
      setHasMore(false)
      return
    }

    extractFile(file.id, file.mimeType, false)
  }, [file, extractFile])

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get file type badge
  const getFileTypeBadge = () => {
    if (!file) return null
    
    if (file.mimeType === "application/pdf") {
      return <Badge variant="destructive">PDF</Badge>
    }
    
    if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <Badge variant="default">DOCX</Badge>
    }
    
    if (file.mimeType === "application/vnd.google-apps.document") {
      return <Badge variant="outline">Google Doc</Badge>
    }
    
    return <Badge variant="secondary">Unknown</Badge>
  }

  if (!file) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a file to preview its content</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{file.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getFileTypeBadge()}
              <span className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              {file.parentPath && (
                <span className="text-sm text-muted-foreground truncate">
                  {file.parentPath}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : content ? (
          <div>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {content}
              </pre>
              
              {hasMore && !isExpanded && (
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Preview truncated at {INITIAL_PREVIEW_SIZE / 1024}KB
                  </p>
                </div>
              )}
            </ScrollArea>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleExpanded}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No content available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 