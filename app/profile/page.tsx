import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProfileManagement } from "@/components/profile-management"
import { Target, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()

  // Check if we're in demo mode
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let user = null

  if (isDemoMode) {
    user = {
      id: "demo-user",
      email: "demo@deadlinemate.com",
      user_metadata: {
        full_name: "Demo User",
        avatar_url: null,
      },
      created_at: new Date().toISOString(),
    }
  } else {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return redirect("/auth")
    }

    user = authUser
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-3 sm:gap-0">
            <div className="flex items-center justify-between sm:justify-start">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back to Dashboard</span>
                <span className="xs:hidden">Back</span>
              </Link>
              {/* Mobile menu button space if needed */}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Profile Settings</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <ProfileManagement user={user} isDemoMode={isDemoMode} />
      </main>
    </div>
  )
}
