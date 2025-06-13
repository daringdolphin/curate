"use server"

import { getFileStream } from "@/lib/google-drive"
import { extractTextFromDocx, extractTextFromPdf } from "@/lib/extract"
import { MimeTypes } from "@/types"

export async function extractFileAction(
  fileId: string,
  mimeType: string,
  accessToken?: string
): Promise<{ content?: string; error?: string }> {
  try {
    console.log(`Extracting file ${fileId} with MIME type: ${mimeType}`)
    
    const stream = await getFileStream(fileId, accessToken, mimeType)
    let content = ""

    if (mimeType === MimeTypes.DOCX || mimeType === MimeTypes.GoogleDoc) {
      console.log(`Extracting DOCX content for file ${fileId}`)
      content = await extractTextFromDocx(stream)
    } else if (mimeType === MimeTypes.PDF) {
      console.log(`Extracting PDF content for file ${fileId}`)
      content = await extractTextFromPdf(stream)
    } else {
      console.error(`Unsupported MIME type: ${mimeType} for file ${fileId}`)
      return { error: `Unsupported MIME type: ${mimeType}` }
    }

    console.log(`Successfully extracted ${content.length} characters from file ${fileId}`)
    return { content }
  } catch (error: any) {
    console.error(`Error extracting file ${fileId}:`, error)
    const errorMessage = error?.message || "Unknown error occurred during file extraction"
    return { error: errorMessage }
  }
} 