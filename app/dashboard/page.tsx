import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"

// Mock data for demo mode
const mockDeadlines = [
  {
    id: "1",
    title: "Complete Project Proposal",
    description: "Finish the quarterly project proposal for the marketing team",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
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
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
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
    due_date: new Date().toISOString(), // Today
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
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (overdue)
    priority: "low" as const,
    status: "pending" as const,
    category: "Personal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Grocery Shopping",
    description: "Buy groceries for the week",
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    priority: "low" as const,
    status: "completed" as const,
    category: "Personal",
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

export default async function DashboardPage({ searchParams }: { searchParams: { demo?: string } }) {
  const supabase = await createClient()

  // Check if we're in demo mode
  const isDemoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || searchParams.demo === "true"

  let user = null
  let deadlines = []

  if (isDemoMode) {
    user = mockUser
    deadlines = mockDeadlines
  } else {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return redirect("/auth")
    }

    user = authUser

    // Fetch user's deadlines
    const { data: userDeadlines, error } = await supabase
      .from("deadlines")
      .select("*")
      .eq("user_id", authUser.id)
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching deadlines:", error)
    }

    deadlines = userDeadlines || []
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
        <DashboardClient user={user} initialDeadlines={deadlines} isDemoMode={isDemoMode} />
      </main>
    </div>
  )
}
