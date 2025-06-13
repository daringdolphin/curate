"use client"

import { useState } from "react"
import { FileMeta } from "@/types"
import { FileCard } from "./file-card"
import { FilePreviewModal } from "./file-preview-modal"
import { FileText } from "lucide-react"
import { useAppStore } from "@/state/atoms"
import { toast } from "sonner"
import { extractFileAction } from "@/actions/extract-file-action"

interface FileGridProps {
  selectedFiles: (FileMeta & { tokens: number })[]
  formatNumber: (num: number) => string
  formatTokenCount: (count: number) => string
}

export function FileGrid({ selectedFiles, formatNumber, formatTokenCount }: FileGridProps) {
  const [previewFile, setPreviewFile] = useState<(FileMeta & { content?: string }) | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  
  const { 
    fileSelectionState, 
    setFileSelectionState,
    tokenState,
    setTokenState,
    drivePickerState,
    contentState
  } = useAppStore()

  const handleRemove = (file: FileMeta) => {
    const newSelectedFiles = new Set(fileSelectionState.selectedFiles)
    newSelectedFiles.delete(file.id)
    
    // Remove tokens for this file
    const newTokenCounts = new Map(tokenState.tokenCounts)
    newTokenCounts.delete(file.id)
    
    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })
    
    setTokenState({
      ...tokenState,
      tokenCounts: newTokenCounts,
      totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
    })

    toast.success("File removed from selection")
  }

  const handlePreview = async (file: FileMeta & { content?: string }) => {
    // Check if content is cached in the app store first (from initial processing)
    const cachedContent = contentState.contentCache.get(file.id)
    if (cachedContent) {
      console.log("Using cached content for preview:", file.name, "Length:", cachedContent.length)
      const fileWithContent = {
        ...file,
        content: cachedContent
      }
      setPreviewFile(fileWithContent)
      setIsPreviewOpen(true)
      return
    }

    // Check if content is already available in the file object
    if (file.content) {
      console.log("Using file object content for preview:", file.name, "Length:", file.content.length)
      setPreviewFile(file)
      setIsPreviewOpen(true)
      return
    }

    // Fallback: Extract fresh content if not cached (should be rare)
    console.log("No cached content found, extracting fresh content for:", file.name)
    setIsLoadingPreview(true)
    
    try {
      const result = await extractFileAction(
        file.id, 
        file.mimeType, 
        drivePickerState.accessToken || undefined
      )
      
      if (result.error) {
        console.error("Extraction error:", result.error)
        toast.error("Failed to extract file content for preview")
        return
      }

      if (result.content) {
        console.log("Extracted fresh content length:", result.content.length)
        
        const fileWithContent = {
          ...file,
          content: result.content
        }
        setPreviewFile(fileWithContent)
        setIsPreviewOpen(true)
      } else {
        console.error("No content in extraction result")
        toast.error("No content available for preview")
      }
    } catch (error) {
      console.error("Error extracting file for preview:", error)
      toast.error("Failed to load file preview")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleCopy = async (file: FileMeta & { content?: string }) => {
    try {
      // Check if content is cached in the app store first (from initial processing)
      let content = contentState.contentCache.get(file.id)
      
      if (content) {
        console.log("Using cached content for copy:", file.name, "Length:", content.length)
      } else if (file.content) {
        console.log("Using file object content for copy:", file.name, "Length:", file.content.length)
        content = file.content
      } else {
        // Fallback: Extract content if not already available (should be rare)
        console.log("No cached content found, extracting for copy:", file.name)
        toast.info("Extracting file content...")
        
        const result = await extractFileAction(
          file.id, 
          file.mimeType, 
          drivePickerState.accessToken || undefined
        )
        
        if (result.error) {
          toast.error("Failed to extract file content")
          return
        }

        content = result.content || ""
      }

      if (!content) {
        toast.error("No content available to copy")
        return
      }

      await navigator.clipboard.writeText(content)
      toast.success(`Copied ${file.name} to clipboard`)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast.error("Failed to copy to clipboard")
    }
  }

  if (selectedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Files Selected</h3>
        <p className="text-muted-foreground">
          Select files from the sidebar to view them here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {selectedFiles
          .sort((a, b) => b.tokens - a.tokens) // Sort by tokens high to low
          .map((file) => (
            <FileCard
              key={file.id}
              file={file}
              formatNumber={formatNumber}
              formatTokenCount={formatTokenCount}
              onRemove={handleRemove}
              onPreview={handlePreview}
              onCopy={handleCopy}
            />
          ))}
      </div>

      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        isLoading={isLoadingPreview}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewFile(null)
        }}
      />
    </>
  )
} 