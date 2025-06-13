import { google, drive_v3 } from "googleapis"
import { FileMeta } from "@/types"

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withExponentialBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await apiCall()
    } catch (error: any) {
      if (error.code === 403 || error.code === 429) {
        attempt++
        if (attempt >= maxRetries) {
          throw new Error("Max retries reached for Google Drive API.")
        }
        const delayTime = initialDelay * 2 ** (attempt - 1) + Math.random() * 1000
        console.log(
          `Rate limit exceeded. Retrying in ${delayTime.toFixed(0)}ms...`
        )
        await delay(delayTime)
      } else {
        console.error("Google Drive API error:", error)
        throw new Error(`Google Drive API error: ${error.message}`)
      }
    }
  }
  throw new Error("Exponential backoff failed.")
}

function getDriveClient(accessToken?: string): drive_v3.Drive {
  const token = accessToken || process.env.DRIVE_ACCESS_TOKEN
  console.log(`Creating Drive client with token: ${token ? 'present' : 'missing'}`)
  
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: token })
  
  return google.drive({
    version: "v3",
    auth
  })
}

export async function listAllItems(folderId: string, accessToken?: string): Promise<any[]> {
  const drive = getDriveClient(accessToken)
  const apiCall = () =>
    drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, size, modifiedTime)",
      pageSize: 1000, // max page size
      key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    })

  const res = await withExponentialBackoff(apiCall)
  return res.data.files || []
}

export async function listFiles(folderId: string, accessToken?: string): Promise<FileMeta[]> {
  const files = await listAllItems(folderId, accessToken)
  
  // Convert Google Drive API response to our FileMeta interface
  return files.map(file => ({
    id: file.id || '',
    name: file.name || '',
    mimeType: file.mimeType as any,
    size: file.size ? parseInt(file.size) : 0,
    modifiedTime: file.modifiedTime || new Date().toISOString()
  })).filter(file => 
    file.mimeType === 'application/pdf' || 
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimeType === 'application/vnd.google-apps.document'
  )
}

export async function getFileStream(fileId: string, accessToken?: string, mimeType?: string): Promise<NodeJS.ReadableStream> {
  console.log(`Getting file stream for ${fileId} with token: ${accessToken ? 'present' : 'missing'}`)
  
  const drive = getDriveClient(accessToken)

  const apiCall = async () => {
    console.log(`Making Google Drive API call for file ${fileId}`)
    
    // For Google Docs, export as DOCX format
    if (mimeType === 'application/vnd.google-apps.document') {
      console.log(`Exporting Google Doc ${fileId} as DOCX`)
      const res = await drive.files.export(
        { 
          fileId, 
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY 
        },
        { responseType: "stream" }
      )
      console.log(`Successfully exported Google Doc ${fileId} as DOCX`)
      return res.data
    } else {
      // For other files, download directly
      const res = await drive.files.get(
        { fileId, alt: "media", key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY },
        { responseType: "stream" }
      )
      console.log(`Successfully got stream for file ${fileId}`)
      return res.data
    }
  }

  return withExponentialBackoff(apiCall)
} 