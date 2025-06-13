"use client"

import { Badge } from "@/components/ui/badge"

interface SelectedFilesHeaderProps {
  selectedCount: number
  totalTokens: number
  formatNumber: (num: number) => string
}

export function SelectedFilesHeader({ 
  selectedCount, 
  totalTokens, 
  formatNumber 
}: SelectedFilesHeaderProps) {
  return (
    <div className="p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">SELECTED FILES</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedCount} Files</span>
            <span>•</span>
            <span>~{formatNumber(totalTokens)} Tokens</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Tokens: High to Low
          </Badge>
        </div>
      </div>
    </div>
  )
} 