"use server"

import { FileMeta, ActionState } from "@/types"
import { extractFileAction } from "./extract-file-action"
import { tokenizeTextAction } from "./tokenize-text-action"

export interface FileProcessingResult {
  fileId: string
  tokens: number
  content?: string
  error?: string
  processingSteps: {
    extracted: boolean
    tokenized: boolean
    embedded?: boolean // For future implementation
  }
}

export interface ProcessingOptions {
  includeContent?: boolean
  enableEmbedding?: boolean // For future implementation
  batchSize?: number
}

async function processIndividualFile(
  file: FileMeta, 
  accessToken: string, 
  options: ProcessingOptions = {}
): Promise<FileProcessingResult> {
  const result: FileProcessingResult = {
    fileId: file.id,
    tokens: 0,
    processingSteps: {
      extracted: false,
      tokenized: false
    }
  }

  try {
    // Step 1: Extract content
    console.log(`Extracting content from: ${file.name}`)
    const { content, error: extractError } = await extractFileAction(
      file.id,
      file.mimeType,
      accessToken
    )

    if (extractError || !content) {
      result.error = extractError || "No content extracted"
      return result
    }

    result.processingSteps.extracted = true

    // Check for image-only PDFs (very little text)
    if (file.mimeType === "application/pdf" && content.trim().length < 50) {
      result.error = "Image-only PDF with no extractable text"
      return result
    }

    // Optionally include content in result
    if (options.includeContent) {
      result.content = content
    }

    // Step 2: Tokenize content
    console.log(`Tokenizing content from: ${file.name}`)
    const { tokenCount, error: tokenError } = await tokenizeTextAction(content)

    if (tokenError) {
      result.error = tokenError
      return result
    }

    result.tokens = tokenCount || 0
    result.processingSteps.tokenized = true

    // Step 3: Future embedding step would go here
    // if (options.enableEmbedding) {
    //   const embeddings = await embedTextAction(content)
    //   result.embeddings = embeddings
    //   result.processingSteps.embedded = true
    // }

    console.log(`Successfully processed: ${file.name} (${result.tokens} tokens)`)
    return result

  } catch (error: any) {
    console.error(`Error processing file ${file.name}:`, error)
    result.error = error.message
    return result
  }
}

export async function processFilesAction(
  files: FileMeta[],
  accessToken: string,
  options: ProcessingOptions = {}
): Promise<ActionState<FileProcessingResult[]>> {
  try {
    const { batchSize = 3 } = options // Process 3 files in parallel by default
    const results: FileProcessingResult[] = []
    
    console.log(`Starting to process ${files.length} files in batches of ${batchSize}`)

    // Process files in batches to avoid overwhelming the API
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} files)`)
      
      const batchPromises = batch.map(file => 
        processIndividualFile(file, accessToken, options)
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const [index, result] of batchResults.entries()) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          // Handle rejected promises
          results.push({
            fileId: batch[index].id,
            tokens: 0,
            error: result.reason?.message || 'Unknown processing error',
            processingSteps: {
              extracted: false,
              tokenized: false
            }
          })
        }
      }
    }

    const successCount = results.filter(r => !r.error).length
    const errorCount = results.filter(r => r.error).length
    
    return {
      isSuccess: true,
      message: `Processed ${successCount} files successfully, ${errorCount} errors`,
      data: results
    }
  } catch (error: any) {
    console.error("Error in batch processing:", error)
    return {
      isSuccess: false,
      message: error.message
    }
  }
}

// Helper function to process a single file (useful for real-time updates)
export async function processSingleFileAction(
  file: FileMeta,
  accessToken: string,
  options: ProcessingOptions = {}
): Promise<ActionState<FileProcessingResult>> {
  try {
    const result = await processIndividualFile(file, accessToken, options)
    
    if (result.error) {
      return {
        isSuccess: false,
        message: result.error
      }
    }
    
    return {
      isSuccess: true,
      message: `Successfully processed ${file.name}`,
      data: result
    }
  } catch (error: any) {
    console.error(`Error processing single file ${file.name}:`, error)
    return {
      isSuccess: false,
      message: error.message
    }
  }
} 