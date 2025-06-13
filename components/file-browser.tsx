"use client"

import { useState } from "react"
import { FileMeta } from "@/types"
import { FileTree, Controls } from "@/components/file-tree"
import { PreviewPane } from "@/components/preview-pane"
import { TokenMeter } from "@/components/token-meter"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

interface FileBrowserProps {
  files: FileMeta[]
  className?: string
}

export function FileBrowser({ files, className = "" }: FileBrowserProps) {
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileMeta | null>(null)

  const handleFileClick = (file: FileMeta) => {
    setSelectedFileForPreview(file)
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Controls */}
      <Controls files={files} />
      
      {/* Main content area with resizable panels */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File tree panel */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full overflow-hidden">
              <FileTree 
                files={files} 
                onFileClick={handleFileClick}
                className="h-full"
              />
            </div>
          </ResizablePanel>
          
          {/* Resizable handle */}
          <ResizableHandle withHandle />
          
          {/* Preview panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full overflow-hidden p-4">
              <PreviewPane 
                file={selectedFileForPreview} 
                className="h-full"
              />
            </div>
          </ResizablePanel>
          
          {/* Resizable handle */}
          <ResizableHandle withHandle />
          
          {/* Token meter sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full overflow-hidden p-4">
              <TokenMeter className="h-fit sticky top-4" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
} 