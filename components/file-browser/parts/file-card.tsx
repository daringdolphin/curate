"use client"

import { FileMeta } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, X, Eye, Copy } from "lucide-react"
import { useState } from "react"

interface FileCardProps {
  file: FileMeta & { tokens: number; content?: string }
  formatNumber: (num: number) => string
  formatTokenCount: (count: number) => string
  onRemove?: (file: FileMeta) => void
  onPreview?: (file: FileMeta & { content?: string }) => void
  onCopy?: (file: FileMeta & { content?: string }) => void
}

export function FileCard({ 
  file, 
  formatNumber, 
  formatTokenCount, 
  onRemove, 
  onPreview, 
  onCopy 
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.(file)
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview?.(file)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopy?.(file)
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer border-2 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* File icon */}
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {file.name}
          </h3>
        </div>

        {/* Token count */}
        <div className="text-sm text-muted-foreground">
          ~{formatTokenCount(file.tokens)} tokens
        </div>

        {/* Hover icons */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleRemove}
              title="Remove from selection"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handlePreview}
              title="Preview file"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 