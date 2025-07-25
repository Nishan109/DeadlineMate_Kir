"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LoadingSpinner } from "./loading-spinner"
import { Target } from "lucide-react"

export function PageLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Target className="w-7 h-7 text-white" />
        </div>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    </div>
  )
}
