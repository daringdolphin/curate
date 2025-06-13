/*
<ai_context>
This client component provides the header for the app.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { FolderOpen, RotateCcw, Filter, Settings, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side - Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-xl font-bold">
            Curate
          </Link>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-2">
          {/* <Button variant="ghost" size="sm" className="h-8">
            <FolderOpen className="h-4 w-4 mr-2" />
            Select Folder
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            Clear All
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <Filter className="h-4 w-4 mr-2" />
            Ignore Filters
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <Settings className="h-4 w-4 mr-2" />
            Workspaces
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
