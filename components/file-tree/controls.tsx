"use client"

import { useCallback, useState, useEffect } from "react"
import { FileMeta, OVERSIZE_LIMIT_BYTES } from "@/types"
import { useAppStore } from "@/state/atoms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CheckSquare, Square } from "lucide-react"
import { toast } from "sonner"

interface ControlsProps {
  files: FileMeta[]
  className?: string
}

export function Controls({ files, className = "" }: ControlsProps) {
  const { 
    fileSelectionState, 
    setFileSelectionState, 
    tokenState,
    setTokenState,
    contentState,
    setContentState,
    uiPrefsState, 
    setUIPrefsState
  } = useAppStore()

  const [searchInput, setSearchInput] = useState(uiPrefsState.searchQuery)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== uiPrefsState.searchQuery) {
        setUIPrefsState({
          ...uiPrefsState,
          searchQuery: searchInput
        })
      }
    }, 200) // 200ms debounce

    return () => clearTimeout(timer)
  }, [searchInput, uiPrefsState, setUIPrefsState])

  // Check if adding tokens would exceed limits
  const checkTokenLimits = useCallback((additionalTokens: number) => {
    const potentialTotal = tokenState.totalTokens + additionalTokens
    
    if (potentialTotal > tokenState.hardCap) {
      return {
        canAdd: false,
        exceedsHardCap: true,
        exceedsSoftCap: potentialTotal > tokenState.softCap,
        potentialTotal
      }
    }

    return {
      canAdd: true,
      exceedsHardCap: false,
      exceedsSoftCap: potentialTotal > tokenState.softCap,
      potentialTotal
    }
  }, [tokenState])

  // Get selectable files (not oversize, not errored)
  const selectableFiles = files.filter(file => 
    file.size <= OVERSIZE_LIMIT_BYTES && // Not oversize
    !file.name.includes("[ERROR]") // Not errored (simplified check)
  )

  const selectedCount = fileSelectionState.selectedFiles.size
  const selectableCount = selectableFiles.length
  const allSelected = selectedCount === selectableCount && selectableCount > 0

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const newSelectedFiles = new Set<string>()
    const newTokenCounts = new Map(tokenState.tokenCounts)
    let runningTotal = tokenState.totalTokens

    // Add all selectable files that fit within token limits
    for (const file of selectableFiles) {
      const tokens = file.tokens || 0
      const limitCheck = checkTokenLimits(tokens)
      
      if (limitCheck.canAdd && runningTotal + tokens <= tokenState.hardCap) {
        newSelectedFiles.add(file.id)
        newTokenCounts.set(file.id, tokens)
        runningTotal += tokens
      } else {
        if (newSelectedFiles.size > 0) {
          toast.warning("Some files skipped to stay within token limit")
        }
        break
      }
    }

    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })

    setTokenState({
      ...tokenState,
      tokenCounts: newTokenCounts,
      totalTokens: runningTotal
    })
  }, [selectableFiles, fileSelectionState, setFileSelectionState, tokenState, setTokenState, checkTokenLimits])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: new Set()
    })
    
    // Clear token and content state
    setTokenState({
      ...tokenState,
      tokenCounts: new Map(),
      totalTokens: 0
    })
    
    setContentState({
      contentCache: new Map()
    })
  }, [fileSelectionState, setFileSelectionState, tokenState, setTokenState, contentState, setContentState])

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    setUIPrefsState({
      ...uiPrefsState,
      sortOrder: value as 'name' | 'tokens' | 'modified'
    })
  }, [uiPrefsState, setUIPrefsState])

  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 border-b ${className}`}>
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sort dropdown */}
      <Select value={uiPrefsState.sortOrder} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="tokens">Token count</SelectItem>
          <SelectItem value="modified">Last modified</SelectItem>
        </SelectContent>
      </Select>

      {/* Selection controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={allSelected ? handleClearAll : handleSelectAll}
          disabled={selectableCount === 0}
          className="flex items-center gap-2"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4" />
              Clear All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" />
              Select All
            </>
          )}
        </Button>

        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Clear ({selectedCount})
          </Button>
        )}
      </div>

      {/* File counts */}
      <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
        {selectedCount > 0 ? (
          <span>{selectedCount} of {selectableCount} selected</span>
        ) : (
          <span>{selectableCount} files available</span>
        )}
      </div>
    </div>
  )
} 