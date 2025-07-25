import { LoadingSpinner } from "@/components/loading-spinner"
import { Target } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Target className="w-7 h-7 text-white" />
        </div>
        <LoadingSpinner size="lg" text="Loading authentication..." />
      </div>
    </div>
  )
}
