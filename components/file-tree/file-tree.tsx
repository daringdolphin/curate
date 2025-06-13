"use client"

import { memo, useMemo, useCallback } from "react"
import { FixedSizeList as List } from "react-window"
import { FileMeta } from "@/types"
import { useAppStore } from "@/state/atoms"
import { FileTreeNode } from "./node"

interface FileTreeProps {
  files: FileMeta[]
  className?: string
  onFileClick?: (file: FileMeta) => void
}

// Memoized row renderer for react-window
const FileTreeRow = memo(({ index, style, data }: { 
  index: number
  style: React.CSSProperties
  data: { files: FileMeta[], onFileClick?: (file: FileMeta) => void }
}) => (
  <div style={style}>
    <FileTreeNode file={data.files[index]} onFileClick={data.onFileClick} />
  </div>
))

FileTreeRow.displayName = "FileTreeRow"

export function FileTree({ files, className = "", onFileClick }: FileTreeProps) {
  const { fileSelectionState, uiPrefsState } = useAppStore()
  
  // Filter and sort files based on UI preferences
  const filteredFiles = useMemo(() => {
    let filtered = files

    // Apply search filter
    if (uiPrefsState.searchQuery.trim()) {
      const query = uiPrefsState.searchQuery.toLowerCase()
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        (file.parentPath && file.parentPath.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (uiPrefsState.sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'tokens':
          return (b.tokens || 0) - (a.tokens || 0)
        case 'modified':
          return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [files, uiPrefsState.searchQuery, uiPrefsState.sortOrder])

  const itemHeight = 48 // Height for each file row
  const maxHeight = Math.min(filteredFiles.length * itemHeight, 600) // Max height of 600px

  if (filteredFiles.length === 0) {
    return (
      <div className={`border rounded-lg p-8 text-center text-muted-foreground ${className}`}>
        {uiPrefsState.searchQuery ? 
          `No files found matching "${uiPrefsState.searchQuery}"` : 
          "No files to display"
        }
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <List
        height={maxHeight}
        width="100%"
        itemCount={filteredFiles.length}
        itemSize={itemHeight}
        itemData={{ files: filteredFiles, onFileClick }}
        overscanCount={5} // Render 5 extra items outside viewport for smooth scrolling
      >
        {FileTreeRow}
      </List>
    </div>
  )
} 