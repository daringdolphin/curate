"use server"

import { get_encoding } from "tiktoken"

export async function tokenizeTextAction(
  text: string
): Promise<{ tokenCount?: number; error?: string }> {
  try {
    const encoding = get_encoding("cl100k_base")
    const tokens = encoding.encode(text)
    encoding.free()
    return { tokenCount: tokens.length }
  } catch (error: any) {
    return { error: error.message }
  }
} 