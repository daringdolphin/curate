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
    tokenState,
    contentState,
    setDrivePickerState,
    setFilesMeta,
    setFilesLoading,
    setTokenState,
    setContentState
  } = useAppStore()
  
  // Store access token from drive picker
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalFilesToProcess, setTotalFilesToProcess] = useState(0)

  // Environment variables for Google APIs
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Check if required environment variables are set
  const isConfigured = apiKey && clientId

  const startFileProcessing = useCallback(async (files: FileMeta[], token: string) => {
    if (files.length === 0) return

    setProcessing(true)
    setProcessedCount(0)
    setTotalFilesToProcess(files.length)

    try {
      console.log(`Starting background processing of ${files.length} files`)
      
      const response = await fetch('/api/drive/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          files,
          options: {
            batchSize: 3,
            includeContent: true // Include content for caching
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const updatedFiles = new Map<string, FileMeta>()
      const newTokenCounts = new Map(tokenState.tokenCounts)
      const newContentCache = new Map(contentState.contentCache)
      
      // Initialize map with current files
      files.forEach(file => updatedFiles.set(file.id, file))

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const result = JSON.parse(line)
              
              if (result.type === 'complete') {
                console.log('Processing complete:', result.message)
                break
              }
              
              if (result.error) {
                console.warn('Processing error:', result.error)
                continue
              }

              if (result.fileId && result.tokens !== undefined) {
                // Update the file with token count
                const existingFile = updatedFiles.get(result.fileId)
                if (existingFile) {
                  const updatedFile = { ...existingFile, tokens: result.tokens }
                  updatedFiles.set(result.fileId, updatedFile)
                  setProcessedCount(prev => prev + 1)
                  
                  // Update token counts
                  newTokenCounts.set(result.fileId, result.tokens)
                  
                  // Cache content if available
                  if (result.content) {
                    newContentCache.set(result.fileId, result.content)
                  }
                  
                  // Update the files array in real-time
                  setFilesMeta(Array.from(updatedFiles.values()))
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse processing result:', line, parseError)
            }
          }
        }
      }

      // Update token state with all new counts
      setTokenState({
        ...tokenState,
        tokenCounts: newTokenCounts,
        totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
      })

      // Update content cache
      setContentState({
        contentCache: newContentCache
      })

      setProcessing(false)
      const totalTokens = Array.from(updatedFiles.values()).reduce((sum, file) => sum + file.tokens, 0)
      toast.success(`Processing complete! ${totalTokens.toLocaleString()} total tokens`)
      
    } catch (error) {
      console.error('Error processing files:', error)
      toast.error('Failed to process files')
      setProcessing(false)
    }
  }, [setFilesMeta, tokenState, contentState, setTokenState, setContentState])

  const handleFolderSelected = useCallback(async (folderId: string, folderName: string, token: string) => {
    setDrivePickerState({
      isLoading: false,
      selectedFolderId: folderId,
      folderName: folderName,
      accessToken: token
    })
    
    setAccessToken(token)
    setScanComplete(false)
    setProcessing(false)
    setProcessedCount(0)
    setTotalFilesToProcess(0)

    // Phase 1: Quick scan to get file metadata
    setFilesLoading(true)
    try {
      console.log('Phase 1: Scanning folder for files...')
      
      const response = await fetch(`/api/drive/scan?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
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
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const fileData = JSON.parse(line)
              if (fileData.error) {
                throw new Error(fileData.error)
              }
              
              fileData.tokens = 0 // Initialize with 0 tokens
              files.push(fileData)
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
          if (!fileData.error) {
            fileData.tokens = 0
            files.push(fileData)
          }
        } catch (parseError) {
          if (buffer.trim().length > 10 && buffer.trim().startsWith('{')) {
            console.warn('Failed to parse remaining buffer:', buffer.trim().substring(0, 100) + '...', parseError)
          }
        }
      }

      setFilesMeta(files)
      setFilesLoading(false)
      setScanComplete(true)
      
      toast.success(`Found ${files.length} files. Processing tokens in background...`)
      
      // Phase 2: Start background processing for tokens
      if (files.length > 0) {
        startFileProcessing(files, token)
      }
      
    } catch (error) {
      console.error('Error scanning folder:', error)
      toast.error('Failed to scan folder')
      setFilesLoading(false)
    }
  }, [setDrivePickerState, setFilesMeta, setFilesLoading, startFileProcessing])

  const handleReset = useCallback(() => {
    setDrivePickerState({
      isLoading: false,
      selectedFolderId: null,
      folderName: null,
      accessToken: null
    })
    setFilesMeta([])
    setFilesLoading(false)
    setScanComplete(false)
    setProcessing(false)
    setProcessedCount(0)
    setTotalFilesToProcess(0)
    
    // Clear token and content caches
    setTokenState({
      tokenCounts: new Map(),
      totalTokens: 0,
      softCap: 750000,
      hardCap: 1000000
    })
    
    setContentState({
      contentCache: new Map()
    })
  }, [setDrivePickerState, setFilesMeta, setFilesLoading, setTokenState, setContentState])

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-screen">
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
      </div>
    )
  }

  // Show folder picker if no folder is selected
  if (!drivePickerState.selectedFolderId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <DrivePicker
          onFolderSelected={handleFolderSelected}
          apiKey={apiKey}
          clientId={clientId}
        />
      </div>
    )
  }

  // Show loading state while scanning
  if (filesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle>Scanning Folder</CardTitle>
            <CardDescription>
              Finding files in "{drivePickerState.folderName}"...
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

  // Show the main file browser interface with optional processing status
  return (
    <div className="relative">
      <FileBrowser files={filesMeta} />
      
      {/* Processing Status Overlay */}
      {processing && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <CardTitle className="text-sm">Processing Files</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Extracting and tokenizing...</span>
                  <span>{processedCount} / {totalFilesToProcess}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${totalFilesToProcess > 0 ? (processedCount / totalFilesToProcess) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 