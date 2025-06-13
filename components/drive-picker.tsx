"use client"

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

interface DrivePickerProps {
  onFolderSelected: (folderId: string, folderName: string, accessToken: string) => void
  apiKey: string
  clientId: string
}

export function DrivePicker({ onFolderSelected, apiKey, clientId }: DrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGapiLoaded, setIsGapiLoaded] = useState(false)
  const [isGisLoaded, setIsGisLoaded] = useState(false)
  const [tokenClient, setTokenClient] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Load Google API scripts
  useEffect(() => {
    const loadGapi = () => {
      if (window.gapi) {
        window.gapi.load('picker', () => {
          setIsGapiLoaded(true)
        })
      } else {
        const script = document.createElement('script')
        script.src = 'https://apis.google.com/js/api.js'
        script.async = true
        script.defer = true
        script.onload = () => {
          window.gapi.load('picker', () => {
            setIsGapiLoaded(true)
          })
        }
        document.head.appendChild(script)
      }
    }

    const loadGis = () => {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            if (response.error) {
              console.error('OAuth error:', response.error)
              toast.error('Failed to authenticate with Google Drive')
              setIsLoading(false)
              return
            }
            setAccessToken(response.access_token)
            createPicker(response.access_token)
          }
        })
        setTokenClient(client)
        setIsGisLoaded(true)
      } else {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (response: any) => {
              if (response.error) {
                console.error('OAuth error:', response.error)
                toast.error('Failed to authenticate with Google Drive')
                setIsLoading(false)
                return
              }
              setAccessToken(response.access_token)
              createPicker(response.access_token)
            }
          })
          setTokenClient(client)
          setIsGisLoaded(true)
        }
        document.head.appendChild(script)
      }
    }

    loadGapi()
    loadGis()
  }, [clientId])

  const createPicker = useCallback((token: string) => {
    if (!window.google?.picker || !token) {
      toast.error('Google Picker not available')
      setIsLoading(false)
      return
    }

    // Create a custom folder view for better selection
    const folderView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)

    const picker = new window.google.picker.PickerBuilder()
      .addView(folderView)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .setCallback((data: any) => {
        console.log('Picker callback data:', data) // Debug logging
        setIsLoading(false)
        
        if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
          const doc = data[window.google.picker.Response.DOCUMENTS][0]
          const folderId = doc[window.google.picker.Document.ID]
          const folderName = doc[window.google.picker.Document.NAME]
          
          console.log('Selected folder:', { folderId, folderName }) // Debug logging
          onFolderSelected(folderId, folderName, token)
          toast.success(`Selected folder: ${folderName}`)
        } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
          toast.info('Folder selection cancelled')
        } else {
          console.log('Picker action:', data[window.google.picker.Response.ACTION]) // Debug logging
        }
      })
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setTitle('Select a Google Drive folder')
      .build()

    picker.setVisible(true)
  }, [apiKey, onFolderSelected])

  const handlePickFolder = () => {
    if (!isGapiLoaded || !isGisLoaded) {
      toast.error('Google APIs not loaded yet. Please try again.')
      return
    }

    if (!tokenClient) {
      toast.error('Authentication not initialized')
      return
    }

    setIsLoading(true)

    if (accessToken) {
      // Use existing token
      createPicker(accessToken)
    } else {
      // Request new token
      tokenClient.requestAccessToken({ prompt: 'consent' })
    }
  }

  const isReady = isGapiLoaded && isGisLoaded

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FolderOpen className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Select Google Drive Folder</CardTitle>
        <CardDescription>
          Choose a folder from your Google Drive to scan for DOCX, PDF, and Google Docs files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handlePickFolder}
          disabled={!isReady || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : !isReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Google APIs...
            </>
          ) : (
            <>
              <FolderOpen className="mr-2 h-4 w-4" />
              Pick Folder
            </>
          )}
        </Button>
        
        {!isReady && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Loading Google Drive integration...
          </p>
        )}
      </CardContent>
    </Card>
  )
} 