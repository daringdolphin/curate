import { scanFolderAction } from "@/actions/scan-folder-action"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get("folderId")
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!folderId) {
    return NextResponse.json(
      { error: "folderId is required" },
      { status: 400 }
    )
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authorization token is required" },
      { status: 401 }
    )
  }

  try {
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const { files, error } = await scanFolderAction(folderId, accessToken)

          if (error) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ error })))
            controller.close()
            return
          }

          for (const file of files) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify(file) + "\n"))
          }
          controller.close()
        } catch (e: any) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 