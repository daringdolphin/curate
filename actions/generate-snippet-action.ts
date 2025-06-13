"use server"

import { formatSnippet } from "@/lib/snippet"

export async function generateSnippetAction(
  fileName: string,
  content: string,
  customInstructions?: string
): Promise<{ snippet?: string; error?: string }> {
  try {
    const snippet = formatSnippet(fileName, content, customInstructions)
    return { snippet }
  } catch (error: any) {
    return { error: error.message }
  }
} 