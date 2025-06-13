"use client"

import { useState } from "react"
import { FileMeta } from "@/types"
import { FileTree } from "@/components/file-tree"
import { FileSearch } from "./parts/file-search"
import { SelectedFilesHeader } from "./parts/selected-files-header"
import { FileGrid } from "./parts/file-grid"
import { FileBrowserControls } from "./parts/file-browser-controls"
import { useAppStore } from "@/state/atoms"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FileBrowserProps {
  files: FileMeta[]
  className?: string
}

export function FileBrowser({ files, className = "" }: FileBrowserProps) {
  const { fileSelectionState, tokenState, contentState } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCopying, setIsCopying] = useState(false)

  // Get selected files with their tokens
  const selectedFiles = files.filter(file => 
    fileSelectionState.selectedFiles.has(file.id)
  ).map(file => ({
    ...file,
    // Use token count from tokenState instead of file.tokens
    tokens: tokenState.tokenCounts.get(file.id) || file.tokens || 0
  }))

  // Calculate total tokens for selected files
  const totalTokens = tokenState.totalTokens

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Format token count (compact version)
  const formatTokenCount = (count: number) => {
    if (count === 0) return "0"
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

  // Handle copy all selected files using cached content from app store
  const handleCopyAllFiles = async () => {
    if (selectedFiles.length === 0) return

    setIsCopying(true)
    let allContent = ""
    let successCount = 0
    let missingContentCount = 0

    try {
      // Use cached content from app store
      for (const file of selectedFiles) {
        const cachedContent = contentState.contentCache.get(file.id)
        
        if (cachedContent) {
          // Format with XML tags including the file path
          const filePath = file.parentPath ? `${file.parentPath}/${file.name}` : file.name
          allContent += `<${filePath}>\n${cachedContent.trim()}\n</${filePath}>\n\n`
          successCount++
        } else {
          missingContentCount++
          console.warn(`No cached content found for ${file.name}`)
        }
      }

      if (allContent.trim()) {
        // Copy to clipboard
        await navigator.clipboard.writeText(allContent.trim())
        
        // Show success toast
        toast.success(
          `Copied ${successCount} file${successCount !== 1 ? 's' : ''} to clipboard`,
        )
      } else {
        toast.error("No content available for the selected files. Please wait for processing to complete.")
      }
    } catch (error) {
      console.error("Error copying files:", error)
      toast.error("Failed to copy files to clipboard")
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className={cn("flex h-screen", className)}>
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-background flex flex-col">
        <FileSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          <FileTree files={files} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <SelectedFilesHeader 
          selectedCount={selectedFiles.length}
          totalTokens={totalTokens}
          formatNumber={formatNumber}
        />

        {/* Selected Files Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <FileGrid 
            selectedFiles={selectedFiles}
            formatNumber={formatNumber}
            formatTokenCount={formatTokenCount}
          />
        </div>

        <FileBrowserControls
          selectedFiles={selectedFiles}
          totalTokens={totalTokens}
          softCap={tokenState.softCap}
          hardCap={tokenState.hardCap}
          formatNumber={formatNumber}
          isCopying={isCopying}
          onCopyAllFiles={handleCopyAllFiles}
        />
      </div>
    </div>
  )
} 