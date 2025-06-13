export interface FileMeta {
  id: string
  name: string
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'application/vnd.google-apps.document'
  size: number
  modifiedTime: string
  tokens?: number
  parentPath?: string
}

export const TOKEN_CAPS = {
  soft: 750000,
  hard: 1000000
}

export const OVERSIZE_LIMIT_BYTES = 1 * 1024 * 1024 // 1MB

export const MimeTypes = {
  GoogleDoc: "application/vnd.google-apps.document",
  GoogleFolder: "application/vnd.google-apps.folder",
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
} as const 