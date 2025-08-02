import { Skeleton } from "@/components/ui/skeleton"
import { Target, StickyNote } from "lucide-react"

export default function NotesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DeadlineMate</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Skeleton className="h-16 w-full" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <StickyNote className="w-8 h-8 text-emerald-600" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Filter Tabs Skeleton */}
            <div className="flex space-x-1 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>

            {/* Search Bar Skeleton */}
            <Skeleton className="h-10 w-full max-w-md mb-6" />

            {/* Notes Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-20 w-full mb-3" />
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
