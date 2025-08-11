import { Skeleton } from "@/components/ui/skeleton"

export default function TimetableLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Day navigation skeleton */}
          <div className="flex space-x-2 mb-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-16" />
            ))}
          </div>

          {/* Current activity skeleton */}
          <div className="mb-6">
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Activities grid skeleton */}
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
