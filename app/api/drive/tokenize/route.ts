import { tokenizeTextAction } from "@/actions/tokenize-text-action"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const { tokenCount, error } = await tokenizeTextAction(text)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ tokenCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 