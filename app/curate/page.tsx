"use server"

import { Suspense } from "react"
import CuratePageClient from "./_components/curate-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export default async function CuratePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Curate</h1>
        <p className="text-muted-foreground">
          Select a Google Drive folder and curate the perfect context for your LLM prompts
        </p>
      </div>

      <Suspense fallback={<CuratePageSkeleton />}>
        <CuratePageClient />
      </Suspense>
    </div>
  )
}

function CuratePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
} 