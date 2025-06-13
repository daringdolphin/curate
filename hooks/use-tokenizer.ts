"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAppStore } from "@/state/atoms"
import { countTokens, cleanupTokenizer } from "@/lib/tokenizer"
import { extractFileAction } from "@/actions/extract-file-action"
import { FileMeta } from "@/types"
import { toast } from "@/hooks/use-toast"

interface UseTokenizerOptions {
  onTokensUpdated?: (fileId: string, tokens: number) => void
  onExtractionComplete?: (fileId: string, content: string, tokens: number) => void
  onExtractionError?: (fileId: string, error: string) => void
}

export function useTokenizer(options: UseTokenizerOptions = {}) {
  const { 
    tokenState, 
    setTokenState, 
    drivePickerState 
  } = useAppStore()
  
  const processingFiles = useRef(new Set<string>())
  const extractionCache = useRef(new Map<string, { content: string; tokens: number }>())

  // Extract and tokenize a file
  const extractAndTokenizeFile = useCallback(async (file: FileMeta): Promise<{ content: string; tokens: number } | undefined> => {
    // Skip if already processing
    if (processingFiles.current.has(file.id)) {
      return undefined
    }

    // Check cache first
    const cached = extractionCache.current.get(file.id)
    if (cached) {
      options.onTokensUpdated?.(file.id, cached.tokens)
      options.onExtractionComplete?.(file.id, cached.content, cached.tokens)
      return cached
    }

    processingFiles.current.add(file.id)

    try {
      // Extract text content
      const { content, error } = await extractFileAction(
        file.id,
        file.mimeType,
        drivePickerState.accessToken || undefined
      )

      if (error) {
        throw new Error(error)
      }

      if (!content) {
        throw new Error("No content extracted from file")
      }

      // Check for image-only PDFs (very little text)
      if (file.mimeType === "application/pdf" && content.trim().length < 50) {
        const result = { content, tokens: 0 }
        extractionCache.current.set(file.id, result)
        options.onExtractionError?.(file.id, "Image-only PDF")
        return result
      }

      // Tokenize the content
      return new Promise<{ content: string; tokens: number }>((resolve, reject) => {
        countTokens(content, file.id, (response) => {
          if (response.error) {
            reject(new Error(response.error))
            return
          }

          const tokens = response.tokenCount || 0
          const result = { content, tokens }
          
          // Cache the result
          extractionCache.current.set(file.id, result)
          
          // Update token state
          const newTokenCounts = new Map(tokenState.tokenCounts)
          newTokenCounts.set(file.id, tokens)
          
          setTokenState({
            ...tokenState,
            tokenCounts: newTokenCounts,
            totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
          })

          // Notify callbacks
          options.onTokensUpdated?.(file.id, tokens)
          options.onExtractionComplete?.(file.id, content, tokens)

          resolve(result)
        })
      })

    } catch (error: any) {
      const errorMessage = error.message || "Failed to extract and tokenize file"
      options.onExtractionError?.(file.id, errorMessage)
      throw error
    } finally {
      processingFiles.current.delete(file.id)
    }
  }, [tokenState, setTokenState, drivePickerState.accessToken, options])

  // Batch process multiple files
  const extractAndTokenizeFiles = useCallback(async (files: FileMeta[]) => {
    const results = new Map<string, { content: string; tokens: number }>()
    const errors = new Map<string, string>()

    // Process files in parallel, but limit concurrency to avoid overwhelming the API
    const BATCH_SIZE = 3
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      
      await Promise.allSettled(
        batch.map(async (file) => {
          try {
            const result = await extractAndTokenizeFile(file)
            if (result) {
              results.set(file.id, result)
            }
          } catch (error: any) {
            errors.set(file.id, error.message)
          }
        })
      )
    }

    return { results, errors }
  }, [extractAndTokenizeFile])

  // Remove tokens for a file
  const removeFileTokens = useCallback((fileId: string) => {
    const newTokenCounts = new Map(tokenState.tokenCounts)
    newTokenCounts.delete(fileId)
    
    setTokenState({
      ...tokenState,
      tokenCounts: newTokenCounts,
      totalTokens: Array.from(newTokenCounts.values()).reduce((sum, count) => sum + count, 0)
    })

    // Remove from cache
    extractionCache.current.delete(fileId)
  }, [tokenState, setTokenState])

  // Check if adding a file would exceed token limits
  const checkTokenLimits = useCallback((additionalTokens: number) => {
    const potentialTotal = tokenState.totalTokens + additionalTokens
    
    if (potentialTotal > tokenState.hardCap) {
      return {
        canAdd: false,
        exceedsHardCap: true,
        exceedsSoftCap: potentialTotal > tokenState.softCap,
        potentialTotal
      }
    }

    return {
      canAdd: true,
      exceedsHardCap: false,
      exceedsSoftCap: potentialTotal > tokenState.softCap,
      potentialTotal
    }
  }, [tokenState])

  // Get cached content for a file
  const getCachedContent = useCallback((fileId: string) => {
    return extractionCache.current.get(fileId)
  }, [])

  // Clear all tokens and cache
  const clearAll = useCallback(() => {
    setTokenState({
      ...tokenState,
      tokenCounts: new Map(),
      totalTokens: 0
    })
    extractionCache.current.clear()
    processingFiles.current.clear()
  }, [tokenState, setTokenState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTokenizer()
    }
  }, [])

  return {
    // Actions
    extractAndTokenizeFile,
    extractAndTokenizeFiles,
    removeFileTokens,
    clearAll,
    
    // State checks
    checkTokenLimits,
    getCachedContent,
    
    // Current state
    totalTokens: tokenState.totalTokens,
    tokenCounts: tokenState.tokenCounts,
    softCap: tokenState.softCap,
    hardCap: tokenState.hardCap,
    isProcessing: (fileId: string) => processingFiles.current.has(fileId)
  }
}

export type UseTokenizerReturn = ReturnType<typeof useTokenizer> 