"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"
import {
  Calendar,
  Clock,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Target,
  Settings,
  StickyNote,
  CheckCircle,
  MapPin,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingButton } from "@/components/loading-button"
import { AddActivityDialog } from "@/components/timetable/add-activity-dialog"
import { EditActivityDialog } from "@/components/timetable/edit-activity-dialog"
import { CurrentActivityCard } from "@/components/timetable/current-activity-card"
import { NextActivityCard } from "@/components/timetable/next-activity-card"

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
  profile: Profile | null
  initialTimetables: Timetable[]
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

export function TimetableClient({ user, profile, initialTimetables }: TimetableClientProps) {
  const [timetables, setTimetables] = useState<Timetable[]>(initialTimetables)
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null)
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const supabase = createClientComponentClient()

  const currentTimetable = timetables.find((t) => t.is_active) || timetables[0]

  const demoActivities: Activity[] = [
    {
      id: "demo-1",
      timetable_id: "demo-timetable",
      title: "Morning Workout",
      description: "Daily exercise routine",
      category: "Health",
      location: "Home Gym",
      color: "#10B981",
      is_recurring: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: "demo-schedule-1",
          activity_id: "demo-1",
          day_of_week: 1,
          start_time: "07:00",
          end_time: "08:00",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: "demo-2",
      timetable_id: "demo-timetable",
      title: "Team Meeting",
      description: "Weekly team sync",
      category: "Work",
      location: "Conference Room A",
      color: "#3B82F6",
      is_recurring: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: "demo-schedule-2",
          activity_id: "demo-2",
          day_of_week: 1,
          start_time: "10:00",
          end_time: "11:00",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ]

  useEffect(() => {
    if (currentTimetable) {
      loadActivities()
      loadCurrentAndNextActivity()
    } else {
      setIsDemo(true)
      setActivities(demoActivities)
      setLoading(false)
    }
  }, [currentTimetable])

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTimetable && !isDemo) {
        loadCurrentAndNextActivity()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [currentTimetable, isDemo])

  const loadActivities = async () => {
    if (!currentTimetable) return

    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          schedules:activity_schedules(*)
        `)
        .eq("timetable_id", currentTimetable.id)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.log("Timetable tables not found, enabling demo mode")
          setIsDemo(true)
          setActivities(demoActivities)
        } else {
          throw error
        }
      } else {
        setActivities(data || [])
      }
    } catch (error) {
      console.error("Error loading activities:", error)
      setIsDemo(true)
      setActivities(demoActivities)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentAndNextActivity = async () => {
    if (!currentTimetable || isDemo) return

    try {
      const { data: currentData, error: currentError } = await supabase.rpc("get_current_activity", {
        user_uuid: user.id,
      })

      if (currentError && currentError.code !== "42883") {
        throw currentError
      }

      setCurrentActivity(currentData?.[0] || null)

      const { data: nextData, error: nextError } = await supabase.rpc("get_next_activity", { user_uuid: user.id })

      if (nextError && nextError.code !== "42883") {
        throw nextError
      }

      setNextActivity(nextData?.[0] || null)
    } catch (error) {
      console.error("Error loading current/next activity:", error)
    }
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

      if (selectedCategory && activity.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [activities, selectedDay, searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const cats = activities
      .map((a) => a.category)
      .filter(Boolean)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
    return cats as string[]
  }, [activities])

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User"
  const avatarFallback = profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"

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

  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-gray-900">DeadlineMate</span>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/dashboard">
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Dashboard</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/calendar">
            <Clock className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Calendar View</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start bg-emerald-50 text-emerald-700 h-10 sm:h-auto">
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Time Table</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/analytics">
            <CheckCircle className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Analytics</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/notes">
            <StickyNote className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Notes</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/profile">
            <Settings className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Profile Settings</span>
          </LoadingButton>
        </div>
      </nav>

      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="text-xs sm:text-sm text-gray-600 mb-2">Quick Stats</div>
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Activities</span>
            <span className="font-medium">{activities.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Today's Activities</span>
            <span className="font-medium">
              {
                activities.filter((a) => a.schedules.some((s) => s.day_of_week === new Date().getDay() && s.is_active))
                  .length
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Categories</span>
            <span className="font-medium">{categories.length}</span>
          </div>
        </div>
      </div>
    </>
  )

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
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      <div className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Time Table</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your daily schedule and activities</p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{DAYS_OF_WEEK[selectedDay].full}</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDay((selectedDay + 1) % 7)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  variant={selectedDay === day.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day.value)}
                  className={`min-w-[60px] ${selectedDay === day.value ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                >
                  {day.short}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <CurrentActivityCard activity={currentActivity} formatTime={formatTime} getColorClass={getColorClass} />
            <NextActivityCard activity={nextActivity} formatTime={formatTime} getColorClass={getColorClass} />
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No activities for {DAYS_OF_WEEK[selectedDay].full}
                  </h3>
                  <p className="text-gray-600 mb-4">Add your first activity to get started with your timetable.</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredActivities
                .sort((a, b) => {
                  const aSchedule = a.schedules.find((s) => s.day_of_week === selectedDay && s.is_active)
                  const bSchedule = b.schedules.find((s) => s.day_of_week === selectedDay && s.is_active)
                  if (!aSchedule || !bSchedule) return 0
                  return aSchedule.start_time.localeCompare(bSchedule.start_time)
                })
                .map((activity) => {
                  const schedule = activity.schedules.find((s) => s.day_of_week === selectedDay && s.is_active)
                  if (!schedule) return null

                  return (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getColorClass(activity.color)}>{activity.title}</Badge>
                              {activity.category && (
                                <Badge variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {activity.category}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Clock className="w-4 h-4 mr-2" />
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </div>

                            {activity.location && (
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4 mr-2" />
                                {activity.location}
                              </div>
                            )}

                            {activity.description && (
                              <p className="text-sm text-gray-700 mt-2">{activity.description}</p>
                            )}
                          </div>

                          <Button variant="ghost" size="sm" onClick={() => setEditingActivity(activity)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
            )}
          </div>
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
