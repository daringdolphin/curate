"use client"

import { useState } from "react"
import { FileMeta } from "@/types"
import { FileTree } from "@/components/file-tree"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/state/atoms"
import { FileText, Search, Copy } from "lucide-react"
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
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          <FileTree files={files} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Selected Files Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">SELECTED FILES</h2>
              <p className="text-sm text-muted-foreground">
                {selectedFiles.length} Files | ~{formatNumber(totalTokens)} Tokens
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Tokens: High to Low
              </Badge>
            </div>
          </div>
        </div>

        {/* Selected Files Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Files Selected</h3>
              <p className="text-muted-foreground">
                Select files from the sidebar to view them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedFiles
                .sort((a, b) => b.tokens - a.tokens) // Sort by tokens high to low
                .map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <Badge variant="secondary" className="text-xs">
                        {formatTokenCount(file.tokens)} tokens
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-sm font-medium leading-tight mb-1">
                      {file.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {file.parentPath || 'Root folder'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>{formatNumber(file.tokens)} tokens</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-6 border-t bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">{formatNumber(totalTokens)}</span>
                <span className="text-muted-foreground"> / {formatNumber(tokenState.hardCap)} tokens</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden max-w-xs">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    totalTokens > tokenState.hardCap ? "bg-red-500" :
                    totalTokens > tokenState.softCap ? "bg-yellow-500" : "bg-blue-500"
                  )}
                  style={{ 
                    width: `${Math.min((totalTokens / tokenState.hardCap) * 100, 100)}%` 
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
                onClick={handleCopyAllFiles}
              >
                <Copy className="h-4 w-4 mr-2" />
                {isCopying ? "COPYING..." : `COPY ALL SELECTED (${selectedFiles.length} files)`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 