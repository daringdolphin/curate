"use server"

import { listAllItems, listFiles as listDriveFiles } from "@/lib/google-drive"
import { MimeTypes } from "@/types"
import { FileMeta } from "@/types"

async function listFilesRecursively(folderId: string, accessToken: string): Promise<FileMeta[]> {
  const allFiles: FileMeta[] = []
  const foldersToProcess: string[] = [folderId]
  const processedFolders: Set<string> = new Set()

  while (foldersToProcess.length > 0) {
    const currentFolderId = foldersToProcess.shift()!
    if (processedFolders.has(currentFolderId)) {
      continue
    }
    processedFolders.add(currentFolderId)

    // Get all items (files and folders)
    const allItems = await listAllItems(currentFolderId, accessToken)
    
    for (const item of allItems) {
      if (item.mimeType === MimeTypes.GoogleFolder && item.id) {
        // Add folder to processing queue
        foldersToProcess.push(item.id)
      } else if (
        item.mimeType === 'application/pdf' || 
        item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        item.mimeType === 'application/vnd.google-apps.document'
      ) {
        // Add file to results if it's DOCX, PDF, or Google Doc
        allFiles.push({
          id: item.id || '',
          name: item.name || '',
          mimeType: item.mimeType,
          size: item.size ? parseInt(item.size) : 0,
          modifiedTime: item.modifiedTime || new Date().toISOString()
        })
      }
    }
  }

  return allFiles
}

export async function scanFolderAction(
  folderId: string,
  accessToken: string
): Promise<{ files: FileMeta[]; error?: string }> {
  try {
    const files = await listFilesRecursively(folderId, accessToken)
    return { files }
  } catch (error: any) {
    console.error("Error scanning folder:", error)
    return { files: [], error: error.message }
  }
} 