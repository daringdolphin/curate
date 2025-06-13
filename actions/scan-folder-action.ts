"use server"

import { listAllItems } from "@/lib/google-drive"
import { MimeTypes, FileMeta, ActionState } from "@/types"

interface FolderInfo {
  id: string
  name: string
  path: string
}

async function listFilesRecursively(folderId: string, accessToken: string, rootFolderName?: string): Promise<FileMeta[]> {
  const allFiles: FileMeta[] = []
  const foldersToProcess: FolderInfo[] = [{ 
    id: folderId, 
    name: rootFolderName || "Root", 
    path: "" 
  }]
  const processedFolders: Set<string> = new Set()
  const folderIdToInfo: Map<string, FolderInfo> = new Map()

  // Initialize with root folder
  folderIdToInfo.set(folderId, { id: folderId, name: rootFolderName || "Root", path: "" })

  while (foldersToProcess.length > 0) {
    const currentFolder = foldersToProcess.shift()!
    if (processedFolders.has(currentFolder.id)) {
      continue
    }
    processedFolders.add(currentFolder.id)

    console.log(`Processing folder: ${currentFolder.name} at path: ${currentFolder.path}`)

    // Get all items (files and folders)
    const allItems = await listAllItems(currentFolder.id, accessToken)
    
    for (const item of allItems) {
      if (item.mimeType === MimeTypes.GoogleFolder && item.id) {
        // Create folder info for subfolder
        const subfolderPath = currentFolder.path 
          ? `${currentFolder.path}/${item.name}` 
          : item.name
        
        const folderInfo: FolderInfo = {
          id: item.id,
          name: item.name || 'Unknown Folder',
          path: subfolderPath
        }

        folderIdToInfo.set(item.id, folderInfo)
        foldersToProcess.push(folderInfo)
        
        console.log(`Found subfolder: ${item.name} at path: ${subfolderPath}`)
      } else if (
        item.mimeType === 'application/pdf' || 
        item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        item.mimeType === 'application/vnd.google-apps.document'
      ) {
        // Create file metadata with folder path information
        const fileMeta: FileMeta = {
          id: item.id || '',
          name: item.name || '',
          mimeType: item.mimeType,
          size: item.size ? parseInt(item.size) : 0,
          modifiedTime: item.modifiedTime || new Date().toISOString(),
          tokens: 0, // Will be updated during processing
          parentPath: currentFolder.path // This is the key addition!
        }

        // Skip files that are too large (over 10MB)
        if (fileMeta.size > 10 * 1024 * 1024) {
          console.log(`Skipping oversized file: ${fileMeta.name} (${fileMeta.size} bytes) in folder: ${currentFolder.path}`)
          continue
        }

        console.log(`Found file: ${fileMeta.name} in folder: ${currentFolder.path || 'Root'}`)
        allFiles.push(fileMeta)
      }
    }
  }

  return allFiles
}

export async function scanFolderAction(
  folderId: string,
  accessToken: string,
  rootFolderName?: string
): Promise<ActionState<FileMeta[]>> {
  try {
    console.log(`Scanning folder ${folderId} (${rootFolderName || 'Unknown'}) for files...`)
    const files = await listFilesRecursively(folderId, accessToken, rootFolderName)
    console.log(`Found ${files.length} files to process`)
    
    // Log the folder structure for debugging
    const folderStructure = files.reduce((acc, file) => {
      const path = file.parentPath || 'Root'
      if (!acc[path]) acc[path] = []
      acc[path].push(file.name)
      return acc
    }, {} as Record<string, string[]>)
    
    console.log('Folder structure:', JSON.stringify(folderStructure, null, 2))
    
    return { 
      isSuccess: true, 
      message: `Found ${files.length} files in folder structure`, 
      data: files 
    }
  } catch (error: any) {
    console.error("Error scanning folder:", error)
    return { 
      isSuccess: false, 
      message: error.message 
    }
  }
} 