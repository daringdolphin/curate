"use client"

import { memo, useMemo, useCallback, useState } from "react"
import { FileMeta } from "@/types"
import { useAppStore } from "@/state/atoms"
import { FileTreeNode } from "./node"
import { ChevronDown, ChevronRight, Folder, FolderOpen, CheckSquare, Square } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface FileTreeProps {
  files: FileMeta[]
  className?: string
  onFileClick?: (file: FileMeta) => void
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  file?: FileMeta
  children: TreeNode[]
}

export function FileTree({ files, className = "", onFileClick }: FileTreeProps) {
  const { fileSelectionState, setFileSelectionState, tokenState, setTokenState } = useAppStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build hierarchical tree structure from flat file list
  const treeData = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      type: 'folder',
      children: []
    }

    files.forEach(file => {
      const pathParts = file.parentPath ? file.parentPath.split('/').filter(Boolean) : []
      let currentNode = root

      pathParts.forEach(part => {
        let existingChild = currentNode.children.find(
          child => child.name === part && child.type === 'folder'
        )
        
        if (!existingChild) {
          existingChild = {
            name: part,
            path: currentNode.path ? `${currentNode.path}/${part}` : part,
            type: 'folder',
            children: []
          }
          currentNode.children.push(existingChild)
        }
        
        currentNode = existingChild
      })

      currentNode.children.push({
        name: file.name,
        path: file.parentPath ? `${file.parentPath}/${file.name}` : file.name,
        type: 'file',
        file: file,
        children: []
      })
    })

    const sortNodes = (nodes: TreeNode[]) => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'file' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    const sortTree = (node: TreeNode) => {
      node.children = sortNodes(node.children)
      node.children.forEach(sortTree)
    }
    
    sortTree(root)
    return root.children
  }, [files])

  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }, [])

  const handleFolderSelection = useCallback((folderPath: string, checked: boolean) => {
    const getFilesInFolder = (nodes: TreeNode[], targetPath: string): FileMeta[] => {
      const result: FileMeta[] = []
      
      for (const node of nodes) {
        if (node.path.startsWith(targetPath)) {
          if (node.type === 'file' && node.file) {
            result.push(node.file)
          }
          result.push(...getFilesInFolder(node.children, targetPath))
        }
      }
      
      return result
    }

    const filesInFolder = getFilesInFolder(treeData, folderPath)
    const newSelectedFiles = new Set(fileSelectionState.selectedFiles)
    const newTokenCounts = new Map(tokenState.tokenCounts)

    filesInFolder.forEach(file => {
      if (checked) {
        newSelectedFiles.add(file.id)
        newTokenCounts.set(file.id, file.tokens || 0)
      } else {
        newSelectedFiles.delete(file.id)
        newTokenCounts.delete(file.id)
      }
    })

    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })

    setTokenState({
      ...tokenState,
      tokenCounts: newTokenCounts,
      totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
    })
  }, [treeData, fileSelectionState, setFileSelectionState, tokenState, setTokenState])

  // Select all functionality
  const handleSelectAll = useCallback(() => {
    const allFiles = files.filter(file => file.tokens && file.tokens > 0) // Only selectable files
    const newSelectedFiles = new Set<string>()
    const newTokenCounts = new Map<string, number>()

    allFiles.forEach(file => {
      newSelectedFiles.add(file.id)
      newTokenCounts.set(file.id, file.tokens || 0)
    })

    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })

    setTokenState({
      ...tokenState,
      tokenCounts: newTokenCounts,
      totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
    })
  }, [files, fileSelectionState, setFileSelectionState, tokenState, setTokenState])

  // Deselect all functionality
  const handleDeselectAll = useCallback(() => {
    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: new Set()
    })

    setTokenState({
      ...tokenState,
      tokenCounts: new Map(),
      totalTokens: 0
    })
  }, [fileSelectionState, setFileSelectionState, tokenState, setTokenState])

  const renderTreeNode = useCallback((node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const paddingLeft = depth * 12

    if (node.type === 'folder') {
      const getFilesInFolder = (n: TreeNode): FileMeta[] => {
        const result: FileMeta[] = []
        for (const child of n.children) {
          if (child.type === 'file' && child.file) {
            result.push(child.file)
          }
          result.push(...getFilesInFolder(child))
        }
        return result
      }

      const filesInFolder = getFilesInFolder(node)
      const selectableFilesInFolder = filesInFolder.filter(f => f.tokens && f.tokens > 0)
      const selectedFilesInFolder = selectableFilesInFolder.filter(f => 
        fileSelectionState.selectedFiles.has(f.id)
      )
      const isPartiallySelected = selectedFilesInFolder.length > 0 && 
        selectedFilesInFolder.length < selectableFilesInFolder.length
      const isAllSelected = selectableFilesInFolder.length > 0 && 
        selectedFilesInFolder.length === selectableFilesInFolder.length

      return (
        <div key={node.path}>
          <div 
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 cursor-pointer group rounded-sm"
            style={{ paddingLeft: `${paddingLeft + 4}px` }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => toggleFolder(node.path)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            
            <Checkbox
              checked={isAllSelected}
              ref={(el) => {
                if (el && isPartiallySelected) {
                  const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement
                  if (input) {
                    input.indeterminate = true
                  }
                }
              }}
              onCheckedChange={(checked) => handleFolderSelection(node.path, !!checked)}
              className="h-4 w-4"
            />
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )}
            
            <span className="text-sm font-medium flex-1" onClick={() => toggleFolder(node.path)}>
              {node.name}
            </span>
            
            {selectableFilesInFolder.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {selectedFilesInFolder.length}/{selectableFilesInFolder.length}
              </span>
            )}
          </div>
          
          {isExpanded && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div 
          key={node.path}
          style={{ paddingLeft: `${paddingLeft + 4}px` }}
        >
          <FileTreeNode file={node.file!} onFileClick={onFileClick} />
        </div>
      )
    }
  }, [expandedFolders, fileSelectionState, toggleFolder, handleFolderSelection, onFileClick])

  if (treeData.length === 0) {
    return (
      <div className={`p-4 text-center text-muted-foreground ${className}`}>
        No files to display
      </div>
    )
  }

  const selectableFiles = files.filter(file => file.tokens && file.tokens > 0)
  const selectedCount = fileSelectionState.selectedFiles.size
  const allSelected = selectedCount === selectableFiles.length && selectableFiles.length > 0

  return (
    <div className={`${className}`}>
      {/* Select All / Deselect All Controls */}
      <div className="flex gap-2 p-3 border-b bg-muted/20">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={selectableFiles.length === 0 || allSelected}
          className="flex items-center gap-2 h-8"
        >
          <CheckSquare className="h-3 w-3" />
          Select All
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={selectedCount === 0}
          className="flex items-center gap-2 h-8"
        >
          <Square className="h-3 w-3" />
          Deselect All
        </Button>

        
      </div>

      {/* File Tree */}
      <div className="overflow-auto">
        {treeData.map(node => renderTreeNode(node))}
      </div>
    </div>
  )
} 