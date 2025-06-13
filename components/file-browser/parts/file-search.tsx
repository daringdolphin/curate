"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FileSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function FileSearch({ searchQuery, onSearchChange }: FileSearchProps) {
  return (
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
} 