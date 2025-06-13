"use server"

import { Suspense } from "react"
import CuratePageClient from "./curate/_components/curate-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Page() {
  return (
    <Suspense fallback={<CuratePageSkeleton />}>
      <CuratePageClient />
    </Suspense>
  )
}

function CuratePageSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Left sidebar skeleton */}
      <div className="w-80 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}