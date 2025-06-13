"use client"

import { memo, useMemo, useCallback, useState } from "react"
import { FileMeta } from "@/types"
import { useAppStore } from "@/state/atoms"
import { FileTreeNode } from "./node"
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react"
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
  const { fileSelectionState, setFileSelectionState, uiPrefsState } = useAppStore()
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
      // Split the path into parts
      const pathParts = file.parentPath ? file.parentPath.split('/').filter(Boolean) : []
      let currentNode = root

      // Navigate/create folder structure
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

      // Add the file
      currentNode.children.push({
        name: file.name,
        path: file.parentPath ? `${file.parentPath}/${file.name}` : file.name,
        type: 'file',
        file: file,
        children: []
      })
    })

    // Sort function
    const sortNodes = (nodes: TreeNode[]) => {
      return nodes.sort((a, b) => {
        // Folders first
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        
        // Then by name
        return a.name.localeCompare(b.name)
      })
    }

    // Recursively sort all nodes
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
    // Get all files in this folder (recursively)
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

    filesInFolder.forEach(file => {
      if (checked) {
        newSelectedFiles.add(file.id)
      } else {
        newSelectedFiles.delete(file.id)
      }
    })

    setFileSelectionState({
      ...fileSelectionState,
      selectedFiles: newSelectedFiles
    })
  }, [treeData, fileSelectionState, setFileSelectionState])

  const renderTreeNode = useCallback((node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const paddingLeft = depth * 16

    if (node.type === 'folder') {
      // Count selected files in this folder
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
      const selectedFilesInFolder = filesInFolder.filter(f => 
        fileSelectionState.selectedFiles.has(f.id)
      )
      const isPartiallySelected = selectedFilesInFolder.length > 0 && 
        selectedFilesInFolder.length < filesInFolder.length
      const isAllSelected = filesInFolder.length > 0 && 
        selectedFilesInFolder.length === filesInFolder.length

      return (
        <div key={node.path}>
          <div 
            className="flex items-center gap-1 py-1 px-2 hover:bg-muted/50 cursor-pointer group"
            style={{ paddingLeft: `${paddingLeft + 8}px` }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
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
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            
            <span className="text-sm flex-1" onClick={() => toggleFolder(node.path)}>
              {node.name}
            </span>
            
            {filesInFolder.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedFilesInFolder.length}/{filesInFolder.length}
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
      // File node
      return (
        <div 
          key={node.path}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
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

  return (
    <div className={`overflow-auto ${className}`}>
      {treeData.map(node => renderTreeNode(node))}
    </div>
  )
} 