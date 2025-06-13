import { get_encoding, Tiktoken } from "tiktoken"

let encoding: Tiktoken | null = null
let initializationPromise: Promise<void> | null = null

async function initialize() {
  if (encoding) return
  
  if (initializationPromise) {
    await initializationPromise
    return
  }

  initializationPromise = (async () => {
    try {
      // Use dynamic import for better WASM handling
      const tiktoken = await import("tiktoken")
      encoding = tiktoken.get_encoding("cl100k_base")
    } catch (error) {
      console.error("Failed to initialize tiktoken:", error)
      throw error
    }
  })()

  await initializationPromise
}

self.onmessage = async (event: MessageEvent<{ text: string; fileId: string }>) => {
  try {
    await initialize()
    
    if (!encoding) {
      self.postMessage({ 
        error: "Tokenizer not initialized.", 
        fileId: event.data.fileId 
      })
      return
    }

    const { text, fileId } = event.data
    
    // Handle empty or very large text
    if (!text || text.length === 0) {
      self.postMessage({ tokenCount: 0, fileId })
      return
    }

    // Limit text size to prevent memory issues (100MB max)
    const maxTextLength = 100 * 1024 * 1024
    const textToProcess = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) 
      : text

    const tokens = encoding.encode(textToProcess)
    self.postMessage({ tokenCount: tokens.length, fileId })
    
  } catch (e: any) {
    console.error("Tokenizer worker error:", e)
    self.postMessage({ 
      error: e.message || "Unknown tokenizer error", 
      fileId: event.data.fileId 
    })
  }
} 