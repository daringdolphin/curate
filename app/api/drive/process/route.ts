import { processFilesAction } from "@/actions/process-files-action"
import { FileMeta } from "@/types"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { files, options = {} } = await request.json()
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Files array is required" },
        { status: 400 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      )
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Process files and stream results
          const result = await processFilesAction(files as FileMeta[], accessToken, {
            batchSize: options.batchSize || 3,
            includeContent: options.includeContent || false,
            enableEmbedding: options.enableEmbedding || false
          })

          if (!result.isSuccess) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: result.message })))
            controller.close()
            return
          }

          // Stream each processing result
          for (const processingResult of result.data) {
            const resultJson = JSON.stringify(processingResult) + "\n"
            controller.enqueue(new TextEncoder().encode(resultJson))
          }
          
          // Send completion signal
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
            type: 'complete',
            message: result.message
          }) + "\n"))
          
          controller.close()
        } catch (e: any) {
          console.error("Process stream error:", e)
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: e.message })))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Transfer-Encoding": "chunked"
      }
    })
  } catch (error: any) {
    console.error("Process API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 