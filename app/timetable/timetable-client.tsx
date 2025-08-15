"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Calendar, Plus, Search, ChevronLeft, ChevronRight, Settings, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AddActivityDialog } from "@/components/timetable/add-activity-dialog"
import { EditActivityDialog } from "@/components/timetable/edit-activity-dialog"
import { CurrentActivityCard } from "@/components/timetable/current-activity-card"
import { NextActivityCard } from "@/components/timetable/next-activity-card"
import { v4 as uuidv4 } from "uuid"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface Timetable {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  timetable_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  created_at: string
  updated_at: string
  schedules: ActivitySchedule[]
}

interface ActivitySchedule {
  id: string
  activity_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern: string
  specific_dates: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CurrentActivity {
  activity_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  start_time: string
  end_time: string
  day_of_week: number
}

interface NextActivity extends CurrentActivity {
  days_until: number
}

interface TimetableClientProps {
  user: User
  profile: Profile
  initialTimetables: Timetable[]
  initialActivities: Activity[]
  initialSchedules: ActivitySchedule[]
  isDemoMode: boolean
}

const DAYS_OF_WEEK = [
  { short: "Sun", full: "Sunday", value: 0 },
  { short: "Mon", full: "Monday", value: 1 },
  { short: "Tue", full: "Tuesday", value: 2 },
  { short: "Wed", full: "Wednesday", value: 3 },
  { short: "Thu", full: "Thursday", value: 4 },
  { short: "Fri", full: "Friday", value: 5 },
  { short: "Sat", full: "Saturday", value: 6 },
]

const COLOR_OPTIONS = [
  { name: "Red", value: "red", class: "bg-red-100 text-red-800 border-red-200" },
  { name: "Orange", value: "orange", class: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { name: "Green", value: "green", class: "bg-green-100 text-green-800 border-green-200" },
  { name: "Blue", value: "blue", class: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { name: "Purple", value: "purple", class: "bg-purple-100 text-purple-800 border-purple-200" },
  { name: "Pink", value: "pink", class: "bg-pink-100 text-pink-800 border-pink-200" },
  { name: "Gray", value: "gray", class: "bg-gray-100 text-gray-800 border-gray-200" },
]

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Work", value: "work" },
  { label: "Health", value: "health" },
  { label: "Personal", value: "personal" },
]

export function TimetableClient({
  user,
  profile,
  initialTimetables = [],
  initialActivities = [],
  initialSchedules = [],
  isDemoMode = false,
}: TimetableClientProps) {
  const [timetables, setTimetables] = useState<Timetable[]>(initialTimetables)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null)
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(isDemoMode || !user?.id)

  const supabase = createClient()

  const generateUUID = () => uuidv4()

  const currentTimetable = useMemo(() => {
    if (timetables.length > 0) {
      return timetables.find((t) => t.is_active) || timetables[0]
    }

    return {
      id: generateUUID(),
      user_id: user?.id || "demo-user",
      name: "My Timetable",
      description: "Default timetable",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }, [timetables, user])

  const demoActivities: Activity[] = [
    {
      id: generateUUID(),
      timetable_id: generateUUID(),
      title: "Morning Workout",
      description: "Daily exercise routine",
      category: "Health",
      location: "Home Gym",
      color: "green",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: generateUUID(),
          activity_id: generateUUID(),
          day_of_week: 1,
          start_time: "07:00",
          end_time: "08:00",
          is_recurring: true,
          recurrence_pattern: "weekly",
          specific_dates: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: generateUUID(),
      timetable_id: generateUUID(),
      title: "Team Meeting",
      description: "Weekly team sync",
      category: "Work",
      location: "Conference Room A",
      color: "blue",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: generateUUID(),
          activity_id: generateUUID(),
          day_of_week: 1,
          start_time: "10:00",
          end_time: "11:00",
          is_recurring: true,
          recurrence_pattern: "weekly",
          specific_dates: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
  ]

  useEffect(() => {
    const initializeTimetables = async () => {
      console.log("[v0] Initializing timetables with user:", user?.id, "demo mode:", isDemo)

      if (user?.id && initialTimetables.length > 0) {
        console.log("[v0] Using initial timetables data:", initialTimetables.length)
        setTimetables(initialTimetables)
        setIsDemo(false)

        if (initialActivities.length > 0) {
          console.log("[v0] Using initial activities data:", initialActivities.length)
          setActivities(initialActivities)
        } else {
          await loadActivitiesFromDatabase()
        }

        setLoading(false)
        return
      }

      if (!user?.id) {
        console.log("[v0] No authenticated user, using demo mode")
        setIsDemo(true)
        setActivities(demoActivities)
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Loading timetables from database for user:", user.id)

        const { data, error } = await supabase
          .from("timetables")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.log("[v0] Database not available, using demo mode:", error)
          setIsDemo(true)
          setActivities(demoActivities)
          setLoading(false)
          return
        }

        if (data && data.length > 0) {
          console.log("[v0] Loaded timetables from database:", data.length)
          setTimetables(data)
          setIsDemo(false)
          await loadActivitiesFromDatabase()
        } else {
          try {
            const { data: newTimetable, error: createError } = await supabase
              .from("timetables")
              .insert({
                user_id: user.id,
                name: "My Timetable",
                description: "Default timetable",
                is_active: true,
              })
              .select()
              .single()

            if (createError) {
              console.log("[v0] Cannot create timetable (RLS policy), using demo mode:", createError)
              setIsDemo(true)
              setActivities(demoActivities)
            } else {
              console.log("[v0] Created new timetable:", newTimetable)
              setTimetables([newTimetable])
              setIsDemo(false)
            }
          } catch (createError) {
            console.log("[v0] RLS policy violation, using demo mode:", createError)
            setIsDemo(true)
            setActivities(demoActivities)
          }
        }
      } catch (error) {
        console.log("[v0] Database error, using demo mode:", error)
        setIsDemo(true)
        setActivities(demoActivities)
      }

      setLoading(false)
    }

    initializeTimetables()
  }, [user, initialTimetables, initialActivities])

  useEffect(() => {
    if (activities.length > 0) {
      console.log("[v0] Calculating current and next activities from", activities.length, "activities")
      loadCurrentAndNextActivity()
    }
  }, [activities])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activities.length > 0) {
        console.log("[v0] Updating current and next activities (1-minute interval)")
        loadCurrentAndNextActivity()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [activities])

  const loadActivitiesFromDatabase = async () => {
    if (!currentTimetable?.id || isDemo || !user?.id) return

    try {
      console.log("[v0] Loading activities from database for timetable:", currentTimetable.id)

      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          schedules:activity_schedules(*)
        `)
        .eq("timetable_id", currentTimetable.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.log("[v0] Error loading activities from database:", error)
        return
      }

      console.log("[v0] Loaded activities from database:", data?.length || 0)
      setActivities(data || [])
    } catch (error) {
      console.log("[v0] Error loading activities:", error)
    }
  }

  const loadActivities = async () => {
    if (isDemo) {
      setActivities(demoActivities)
      return
    }
    await loadActivitiesFromDatabase()
  }

  const loadCurrentAndNextActivity = () => {
    console.log("[v0] Calculating current and next activities from", activities.length, "activities")

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
    const currentDayOfWeek = now.getDay()

    const todaySchedules = activities
      .flatMap((activity) =>
        activity.schedules
          .filter((schedule) => schedule.day_of_week === currentDayOfWeek && schedule.is_active)
          .map((schedule) => ({
            ...schedule,
            activity,
            startMinutes:
              Number.parseInt(schedule.start_time.split(":")[0]) * 60 +
              Number.parseInt(schedule.start_time.split(":")[1]),
            endMinutes:
              Number.parseInt(schedule.end_time.split(":")[0]) * 60 + Number.parseInt(schedule.end_time.split(":")[1]),
          })),
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)

    const current = todaySchedules.find(
      (schedule) => currentTime >= schedule.startMinutes && currentTime < schedule.endMinutes,
    )

    if (current) {
      console.log("[v0] Found current activity:", current.activity.title)
      setCurrentActivity({
        activity_id: current.activity.id,
        title: current.activity.title,
        description: current.activity.description,
        category: current.activity.category,
        color: current.activity.color,
        location: current.activity.location,
        start_time: current.start_time,
        end_time: current.end_time,
        day_of_week: current.day_of_week,
      })
    } else {
      console.log("[v0] No current activity found")
      setCurrentActivity(null)
    }

    let nextActivityFound = null

    const upcomingToday = todaySchedules.filter((schedule) => schedule.startMinutes > currentTime)
    if (upcomingToday.length > 0) {
      const next = upcomingToday[0]
      console.log("[v0] Found next activity today:", next.activity.title)
      nextActivityFound = {
        activity_id: next.activity.id,
        title: next.activity.title,
        description: next.activity.description,
        category: next.activity.category,
        color: next.activity.color,
        location: next.activity.location,
        start_time: next.start_time,
        end_time: next.end_time,
        day_of_week: next.day_of_week,
        days_until: 0,
      }
    } else {
      for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
        const checkDay = (currentDayOfWeek + daysAhead) % 7
        const daySchedules = activities
          .flatMap((activity) =>
            activity.schedules
              .filter((schedule) => schedule.day_of_week === checkDay && schedule.is_active)
              .map((schedule) => ({
                ...schedule,
                activity,
                startMinutes:
                  Number.parseInt(schedule.start_time.split(":")[0]) * 60 +
                  Number.parseInt(schedule.start_time.split(":")[1]),
              })),
          )
          .sort((a, b) => a.startMinutes - b.startMinutes)

        if (daySchedules.length > 0) {
          const next = daySchedules[0]
          console.log("[v0] Found next activity in", daysAhead, "days:", next.activity.title)
          nextActivityFound = {
            activity_id: next.activity.id,
            title: next.activity.title,
            description: next.activity.description,
            category: next.activity.category,
            color: next.activity.color,
            location: next.activity.location,
            start_time: next.start_time,
            end_time: next.end_time,
            day_of_week: next.day_of_week,
            days_until: daysAhead,
          }
          break
        }
      }
    }

    if (nextActivityFound) {
      console.log("[v0] Setting next activity:", nextActivityFound.title)
    } else {
      console.log("[v0] No next activity found")
    }

    setNextActivity(nextActivityFound)
  }

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const hasScheduleForDay = activity.schedules.some(
        (schedule) => schedule.day_of_week === selectedDay && schedule.is_active,
      )
      if (!hasScheduleForDay) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = activity.title.toLowerCase().includes(query)
        const matchesDescription = activity.description?.toLowerCase().includes(query)
        const matchesCategory = activity.category?.toLowerCase().includes(query)
        const matchesLocation = activity.location?.toLowerCase().includes(query)

        if (!matchesTitle && !matchesDescription && !matchesCategory && !matchesLocation) {
          return false
        }
      }

      if (activeFilter !== "all" && activity.category !== activeFilter) {
        return false
      }

      return true
    })
  }, [activities, selectedDay, searchQuery, activeFilter])

  const categories = useMemo(() => {
    const cats = activities
      .map((a) => a.category)
      .filter(Boolean)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
    return cats as string[]
  }, [activities])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getColorClass = (color: string) => {
    return COLOR_OPTIONS.find((c) => c.value === color)?.class || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 gap-4 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Time Table</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your daily activities and schedule</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 text-sm"
              />
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white border-r border-gray-200 p-4 sm:p-6">
          {/* Day Navigation */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Navigation</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              <div className="flex lg:hidden items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}
                  className="flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDay((selectedDay + 1) % 7)}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`flex-shrink-0 lg:flex-shrink px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedDay === day.value
                      ? "bg-emerald-100 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="lg:hidden">{day.short}</span>
                  <span className="hidden lg:inline">{day.full}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Activity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Current Activity</h3>
            <CurrentActivityCard activity={currentActivity} formatTime={formatTime} getColorClass={getColorClass} />
          </div>

          {/* Next Activity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Up Next</h3>
            <NextActivityCard activity={nextActivity} formatTime={formatTime} getColorClass={getColorClass} />
          </div>

          {/* Quick Add */}
          <div className="hidden lg:block">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    activeFilter === tab.value ? "bg-emerald-100 text-emerald-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{activity.title}</h3>
                      {activity.category && (
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getColorClass(activity.color)}`}
                        >
                          {activity.category}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingActivity(activity)}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {activity.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
                  )}

                  {activity.location && (
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-3">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {activity.schedules.slice(0, 2).map((schedule, index) => (
                      <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {DAYS_OF_WEEK.find((d) => d.value === schedule.day_of_week)?.short}
                        </span>
                        <span className="font-medium">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                    ))}
                    {activity.schedules.length > 2 && (
                      <div className="text-xs text-gray-500">+{activity.schedules.length - 2} more</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first activity"}
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
          )}
        </div>
      </div>

      <AddActivityDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        timetableId={currentTimetable?.id}
        onActivityAdded={loadActivities}
      />

      {editingActivity && (
        <EditActivityDialog
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          activity={editingActivity}
          onActivityUpdated={loadActivities}
        />
      )}
    </div>
  )
}

export default TimetableClient
