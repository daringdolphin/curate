import mammoth from "mammoth"

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    stream.on("data", (chunk) => {
      console.log(`Received chunk of size: ${chunk.length}`)
      chunks.push(Buffer.from(chunk))
    })
    
    stream.on("end", () => {
      const buffer = Buffer.concat(chunks)
      console.log(`Stream ended, total buffer size: ${buffer.length}`)
      resolve(buffer)
    })
    
    stream.on("error", (error) => {
      console.error("Stream error:", error)
      reject(error)
    })
  })
}

export async function extractTextFromDocx(
  stream: NodeJS.ReadableStream
): Promise<string> {
  try {
    const buffer = await streamToBuffer(stream)
    const { value } = await mammoth.extractRawText({ buffer })
    
    // Check if extracted content is meaningful
    if (!value || value.trim().length === 0) {
      throw new Error("Document appears to be empty or corrupted")
    }
    
    return value
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`)
    }
    throw new Error("Failed to extract text from DOCX due to unknown error")
  }
}

export async function extractTextFromPdf(
  stream: NodeJS.ReadableStream
): Promise<string> {
  try {
    console.log("Starting PDF extraction...")
    const buffer = await streamToBuffer(stream)
    console.log(`PDF buffer size: ${buffer.length} bytes`)
    
    if (buffer.length === 0) {
      throw new Error("Received empty buffer from Google Drive")
    }
    
    // Temporarily disable PDF extraction to avoid server-side issues
    // TODO: Implement proper server-side PDF text extraction
    throw new Error("PDF text extraction is temporarily disabled due to server compatibility issues")
    
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`)
    }
    throw new Error("Failed to extract text from PDF due to unknown error")
  }
} 