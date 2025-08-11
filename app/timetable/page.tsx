import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TimetableClient } from "./timetable-client"

// Mock data for demo mode
const mockTimetables = [
  {
    id: "1",
    name: "Weekly Schedule",
    description: "My main weekly timetable",
    user_id: "demo-user",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockActivities = [
  {
    id: "1",
    timetable_id: "1",
    name: "Morning Workout",
    description: "Daily exercise routine",
    location: "Home Gym",
    category: "Health",
    color: "#10b981",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    timetable_id: "1",
    name: "Team Meeting",
    description: "Weekly team sync",
    location: "Conference Room A",
    category: "Work",
    color: "#3b82f6",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    timetable_id: "1",
    name: "Study Session",
    description: "Focus time for learning",
    location: "Library",
    category: "Education",
    color: "#8b5cf6",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockSchedules = [
  {
    id: "1",
    activity_id: "1",
    day_of_week: 1, // Monday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    activity_id: "1",
    day_of_week: 3, // Wednesday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    activity_id: "1",
    day_of_week: 5, // Friday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    activity_id: "2",
    day_of_week: 2, // Tuesday
    start_time: "10:00",
    end_time: "11:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    activity_id: "3",
    day_of_week: 1, // Monday
    start_time: "19:00",
    end_time: "21:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    activity_id: "3",
    day_of_week: 4, // Thursday
    start_time: "19:00",
    end_time: "21:00",
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

export default async function TimetablePage({ searchParams }: { searchParams: { demo?: string } }) {
  const supabase = await createClient()

  const isDemoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || searchParams.demo === "true"

  let user = null
  let timetables = []
  let activities = []
  let schedules = []
  let profile = null

  if (isDemoMode) {
    user = mockUser
    timetables = mockTimetables
    activities = mockActivities
    schedules = mockSchedules
    profile = {
      id: "demo-user",
      full_name: "Demo User",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return redirect("/auth")
    }

    user = authUser

    try {
      // Get user's timetables
      const { data: userTimetables, error: timetablesError } = await supabase
        .from("timetables")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (timetablesError && timetablesError.code !== "42P01") {
        // 42P01 is "relation does not exist" error
        console.error("Error fetching timetables:", timetablesError)
      }

      timetables = userTimetables || []

      // Get user profile
      const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      profile = userProfile

      // If we have timetables, get activities and schedules
      if (timetables.length > 0) {
        const timetableIds = timetables.map((t) => t.id)

        const { data: userActivities } = await supabase
          .from("activities")
          .select("*")
          .in("timetable_id", timetableIds)
          .order("name", { ascending: true })

        activities = userActivities || []

        if (activities.length > 0) {
          const activityIds = activities.map((a) => a.id)

          const { data: userSchedules } = await supabase
            .from("schedules")
            .select("*")
            .in("activity_id", activityIds)
            .order("day_of_week", { ascending: true })

          schedules = userSchedules || []
        }
      }
    } catch (error) {
      console.error("Error fetching timetable data:", error)
      // Continue with empty data if tables don't exist yet
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-amber-800">
              🎯 <strong>Demo Mode:</strong> You're viewing a preview with sample timetable data.
              <a href="/auth" className="underline ml-1">
                Try the real authentication
              </a>
            </p>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Time Table</h1>
              <p className="text-sm text-gray-600">Manage your daily schedule and activities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <TimetableClient
          user={user}
          profile={profile}
          initialTimetables={timetables}
          initialActivities={activities}
          initialSchedules={schedules}
          isDemoMode={isDemoMode}
        />
      </main>
    </div>
  )
}
