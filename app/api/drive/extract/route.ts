import { extractFileAction } from "@/actions/extract-file-action"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get("fileId")
  const mimeType = searchParams.get("mimeType")

  if (!fileId || !mimeType) {
    return NextResponse.json(
      { error: "fileId and mimeType are required" },
      { status: 400 }
    )
  }

  try {
    const { content, error } = await extractFileAction(fileId, mimeType)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content))
        controller.close()
      }
    })

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 