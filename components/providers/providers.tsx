"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import ProgressBarProvider from "@/components/providers/progress-bar-provider"
import { Toaster } from "@/components/providers/toaster-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ProgressBarProvider>
        {children}
        <Toaster />
      </ProgressBarProvider>
    </ThemeProvider>
  )
} 