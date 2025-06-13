import { FileMeta } from "@/types"

export function formatSnippet(
  fileName: string,
  content: string,
  customInstructions?: string
): string {
  let snippet = `File: ${fileName}\\n\\n`
  snippet += "```\\n"
  snippet += content.trim()
  snippet += "\\n```\\n\\n"

  if (customInstructions) {
    snippet += `Instructions: ${customInstructions}\\n\\n`
  }

  return snippet
} 