import { scanFolderAction } from "@/actions/scan-folder-action"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get("folderId")
  const folderName = searchParams.get("folderName")
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
          const result = await scanFolderAction(folderId, accessToken, folderName || undefined)

          if (!result.isSuccess) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: result.message })))
            controller.close()
            return
          }

          for (const file of result.data) {
            const fileJson = JSON.stringify(file) + "\n"
            controller.enqueue(new TextEncoder().encode(fileJson))
          }
          controller.close()
        } catch (e: any) {
          console.error("Scan stream error:", e)
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
    console.error("Scan API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 