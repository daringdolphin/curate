"use client"

type TokenizerResponse = {
  tokenCount?: number
  fileId?: string
  error?: string
}

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/tokenizer-worker.ts", import.meta.url))
  }
  return worker
}

export function countTokens(
  text: string,
  fileId: string,
  callback: (response: TokenizerResponse) => void
) {
  const tokenizerWorker = getWorker()

  const handleMessage = (event: MessageEvent<TokenizerResponse>) => {
    if (event.data.fileId === fileId) {
      callback(event.data)
      tokenizerWorker.removeEventListener("message", handleMessage)
    }
  }

  tokenizerWorker.addEventListener("message", handleMessage)
  tokenizerWorker.postMessage({ text, fileId })
}

export function cleanupTokenizer() {
  if (worker) {
    worker.terminate()
    worker = null
  }
} 