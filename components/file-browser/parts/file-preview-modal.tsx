"use client"

import { FileMeta } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Loader2 } from "lucide-react"

interface FilePreviewModalProps {
  file: (FileMeta & { content?: string }) | null
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

export function FilePreviewModal({ file, isOpen, onClose, isLoading = false }: FilePreviewModalProps) {
  if (!file) return null

  const filePath = file.parentPath ? `${file.parentPath}/${file.name}` : file.name

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {file.name}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </DialogTitle>
          <DialogDescription>
            File preview - {filePath}
            {file.content && (
              <span className="ml-2 text-xs">
                ({file.content.length.toLocaleString()} characters)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto min-h-0 border rounded-md">
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed">
                {file.content || "No content available for preview."}
              </pre>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 