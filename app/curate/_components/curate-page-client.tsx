"use client"

import { useCallback, useEffect, useState } from 'react'
import { DrivePicker } from '@/components/drive-picker'
import { useAppStore } from '@/state/atoms'
import { FileMeta } from '@/types'
import { FileBrowser } from '@/components/file-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, FolderOpen, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function CuratePageClient() {
  const { 
    drivePickerState,
    filesMeta,
    filesLoading,
    setDrivePickerState,
    setFilesMeta,
    setFilesLoading
  } = useAppStore()
  
  // Store access token from drive picker
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Environment variables for Google APIs
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Check if required environment variables are set
  const isConfigured = apiKey && clientId

  const handleFolderSelected = useCallback(async (folderId: string, folderName: string, token: string) => {
    setDrivePickerState({
      isLoading: false,
      selectedFolderId: folderId,
      folderName: folderName,
      accessToken: token
    })
    
    setAccessToken(token)

    // Start scanning the folder
    setFilesLoading(true)
    try {
      console.log('Scanning folder:', folderId, folderName)
      
      const response = await fetch(`/api/drive/scan?folderId=${encodeURIComponent(folderId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      const files: FileMeta[] = []
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const fileData = JSON.parse(line)
              if (fileData.error) {
                throw new Error(fileData.error)
              }
              // Filter for DOCX, PDF, and Google Docs files only, and check size limit
              if ((fileData.mimeType === 'application/pdf' || 
                   fileData.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   fileData.mimeType === 'application/vnd.google-apps.document') &&
                  fileData.size && fileData.size <= 1048576) { // 1MB limit
                files.push(fileData)
              }
            } catch (parseError) {
              console.warn('Failed to parse line:', line, parseError)
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const fileData = JSON.parse(buffer.trim())
          if (!fileData.error && 
              (fileData.mimeType === 'application/pdf' || 
               fileData.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               fileData.mimeType === 'application/vnd.google-apps.document') &&
              fileData.size && fileData.size <= 1048576) {
            files.push(fileData)
          }
        } catch (parseError) {
          // Only log if buffer contains substantial content (not just whitespace or partial data)
          if (buffer.trim().length > 10 && buffer.trim().startsWith('{')) {
            console.warn('Failed to parse remaining buffer:', buffer.trim().substring(0, 100) + '...', parseError)
          }
        }
      }

      setFilesMeta(files)
      setFilesLoading(false)
      toast.success(`Found ${files.length} files to process`)
      
    } catch (error) {
      console.error('Error scanning folder:', error)
      toast.error('Failed to scan folder')
      setFilesLoading(false)
    }
  }, [setDrivePickerState, setFilesMeta, setFilesLoading])

  const handleReset = useCallback(() => {
    setDrivePickerState({
      isLoading: false,
      selectedFolderId: null,
      folderName: null,
      accessToken: null
    })
    setFilesMeta([])
    setFilesLoading(false)
  }, [setDrivePickerState, setFilesMeta, setFilesLoading])

  if (!isConfigured) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Configuration Required</CardTitle>
          <CardDescription>
            Google Drive API credentials are not configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Please set the following environment variables:</p>
            <ul className="list-disc list-inside space-y-1 font-mono text-xs bg-muted p-3 rounded">
              <li>NEXT_PUBLIC_GOOGLE_API_KEY</li>
              <li>NEXT_PUBLIC_GOOGLE_CLIENT_ID</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show folder picker if no folder is selected
  if (!drivePickerState.selectedFolderId) {
    return (
      <DrivePicker
        onFolderSelected={handleFolderSelected}
        apiKey={apiKey}
        clientId={clientId}
      />
    )
  }

  // Show loading state while scanning
  if (filesLoading) {
    return (
      <div className="space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle>Scanning Folder</CardTitle>
            <CardDescription>
              Analyzing "{drivePickerState.folderName}" for DOCX, PDF, and Google Docs files...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Cancel Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show results after scanning
  return (
    <div className="space-y-6">
      {/* Header with selected folder info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{drivePickerState.folderName}</CardTitle>
                <CardDescription>
                  Found {filesMeta.length} files to process
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleReset} variant="outline">
              Select Different Folder
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main file browser with integrated file tree, preview, and token meter */}
      {filesMeta.length > 0 ? (
        <div className="h-[calc(100vh-300px)] min-h-[600px]">
          <FileBrowser files={filesMeta} />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Files Found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              No DOCX, PDF, or Google Docs files under 1MB were found in this folder.
            </p>
            <Button onClick={handleReset} variant="outline">
              Select Different Folder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 