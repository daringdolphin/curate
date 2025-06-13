import { generateSnippetAction } from "@/actions/generate-snippet-action"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { fileName, content, customInstructions } = await request.json()

    if (!fileName || !content) {
      return NextResponse.json(
        { error: "fileName and content are required" },
        { status: 400 }
      )
    }

    const { snippet, error } = await generateSnippetAction(
      fileName,
      content,
      customInstructions
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ snippet })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 