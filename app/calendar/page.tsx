import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import CalendarClient from "./calendar-client"

// Mock data for demo mode
const mockDeadlines = [
  {
    id: "1",
    title: "Complete Project Proposal",
    description: "Finish the quarterly project proposal for the marketing team",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high" as const,
    status: "pending" as const,
    category: "Work",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Study for Final Exam",
    description: "Review chapters 1-10 for the computer science final exam",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high" as const,
    status: "in_progress" as const,
    category: "Education",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Submit Tax Documents",
    description: "Gather and submit all required tax documents to accountant",
    due_date: new Date().toISOString(),
    priority: "medium" as const,
    status: "pending" as const,
    category: "Personal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Plan Birthday Party",
    description: "Organize surprise birthday party for Sarah",
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "low" as const,
    status: "pending" as const,
    category: "Personal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Team Meeting",
    description: "Weekly team sync meeting",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium" as const,
    status: "pending" as const,
    category: "Work",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockUser = {
  id: "demo-user",
  email: "demo@deadlinemate.com",
  user_metadata: {
    full_name: "Demo User",
    avatar_url: null,
  },
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return redirect("/auth")
  }

  // Fetch user's deadlines
  const { data: deadlines, error } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", authUser.id)
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching deadlines:", error)
  }

  // Check if we're in demo mode
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let user = authUser
  let initialDeadlines = deadlines || []

  if (isDemoMode) {
    user = mockUser
    initialDeadlines = mockDeadlines
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-amber-800">
              🎯 <strong>Demo Mode:</strong> You're viewing a preview with sample data.
              <a href="/auth" className="underline ml-1">
                Try the real authentication
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <CalendarClient user={user} initialDeadlines={initialDeadlines} isDemoMode={isDemoMode} />
      </main>
    </div>
  )
}
