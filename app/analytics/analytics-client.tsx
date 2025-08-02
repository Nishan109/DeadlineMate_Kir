"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  Calendar,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  Info,
  Menu,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import { signOut } from "../auth/actions"
import {
  format,
  parseISO,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subMonths,
  addDays,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns"
import { LoadingButton } from "@/components/loading-button"
import { NotificationSystem } from "@/components/notification-system"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
}

interface AnalyticsClientProps {
  user: any
  initialDeadlines: Deadline[]
  isDemoMode?: boolean
}

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  overdue: "#ef4444",
}

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
}

export default function AnalyticsClient({ user, initialDeadlines, isDemoMode = false }: AnalyticsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    avatar_url: user.user_metadata?.avatar_url || "",
  })

  // Enhanced deadline processing with accurate status calculation
  const processedDeadlines = useMemo(() => {
    const now = new Date()

    return initialDeadlines.map((deadline) => {
      const dueDate = parseISO(deadline.due_date)
      const createdDate = parseISO(deadline.created_at)
      const updatedDate = parseISO(deadline.updated_at)

      // Calculate accurate status
      let calculatedStatus = deadline.status
      if (deadline.status !== "completed" && isBefore(dueDate, now)) {
        calculatedStatus = "overdue"
      }

      // Calculate completion time for completed deadlines
      const completionTime = deadline.status === "completed" ? differenceInDays(updatedDate, createdDate) : null

      // Calculate time until due (or overdue)
      const timeUntilDue = differenceInMinutes(dueDate, now)
      const daysUntilDue = differenceInDays(dueDate, startOfDay(now))

      return {
        ...deadline,
        status: calculatedStatus,
        dueDate,
        createdDate,
        updatedDate,
        completionTime,
        timeUntilDue,
        daysUntilDue,
        isOverdue: calculatedStatus === "overdue",
        isCompleted: deadline.status === "completed",
      }
    })
  }, [initialDeadlines])

  // Fetch current profile data
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (isDemoMode) {
        setCurrentProfile({
          id: user.id,
          email: user.email,
          full_name: "Demo User",
          avatar_url: "/placeholder.svg?height=40&width=40",
        })
        return
      }

      try {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profile && !error) {
          setCurrentProfile({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        setCurrentProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || "",
        })
      }
    }

    fetchCurrentProfile()
  }, [user, isDemoMode])

  // Enhanced analytics calculations with more accurate metrics
  const analytics = useMemo(() => {
    const now = new Date()
    const total = processedDeadlines.length
    const completed = processedDeadlines.filter((d) => d.isCompleted).length
    const pending = processedDeadlines.filter((d) => d.status === "pending").length
    const inProgress = processedDeadlines.filter((d) => d.status === "in_progress").length
    const overdue = processedDeadlines.filter((d) => d.isOverdue).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Priority distribution
    const highPriority = processedDeadlines.filter((d) => d.priority === "high").length
    const mediumPriority = processedDeadlines.filter((d) => d.priority === "medium").length
    const lowPriority = processedDeadlines.filter((d) => d.priority === "low").length

    // Enhanced category distribution
    const categoryStats = processedDeadlines.reduce(
      (acc, deadline) => {
        const category = deadline.category || "Uncategorized"
        if (!acc[category]) {
          acc[category] = { total: 0, completed: 0, overdue: 0 }
        }
        acc[category].total += 1
        if (deadline.isCompleted) acc[category].completed += 1
        if (deadline.isOverdue) acc[category].overdue += 1
        return acc
      },
      {} as Record<string, { total: number; completed: number; overdue: number }>,
    )

    // Enhanced weekly completion trend (last 4 weeks)
    const fourWeeksAgo = subMonths(now, 1)
    const weeklyData = []

    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(addDays(now, -i * 7))
      const weekEnd = endOfWeek(addDays(now, -i * 7))

      const weekCompleted = processedDeadlines.filter(
        (d) => d.isCompleted && isWithinInterval(d.updatedDate, { start: weekStart, end: weekEnd }),
      ).length

      const weekCreated = processedDeadlines.filter((d) =>
        isWithinInterval(d.createdDate, { start: weekStart, end: weekEnd }),
      ).length

      weeklyData.push({
        week: format(weekStart, "MMM dd"),
        completed: weekCompleted,
        created: weekCreated,
        efficiency: weekCreated > 0 ? Math.round((weekCompleted / weekCreated) * 100) : 0,
      })
    }

    // Enhanced daily completion trend (last 7 days)
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const day = addDays(now, -i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const dayCompleted = processedDeadlines.filter(
        (d) => d.isCompleted && isWithinInterval(d.updatedDate, { start: dayStart, end: dayEnd }),
      ).length

      const dayCreated = processedDeadlines.filter((d) =>
        isWithinInterval(d.createdDate, { start: dayStart, end: dayEnd }),
      ).length

      dailyData.push({
        day: format(day, "EEE"),
        completed: dayCompleted,
        created: dayCreated,
      })
    }

    // Enhanced average completion time calculation
    const completedDeadlines = processedDeadlines.filter((d) => d.isCompleted && d.completionTime !== null)
    const avgCompletionTime =
      completedDeadlines.length > 0
        ? Math.round(
            completedDeadlines.reduce((acc, d) => acc + (d.completionTime || 0), 0) / completedDeadlines.length,
          )
        : 0

    // Performance metrics
    const onTimeCompletions = completedDeadlines.filter((d) => d.updatedDate <= d.dueDate).length

    const onTimeRate =
      completedDeadlines.length > 0 ? Math.round((onTimeCompletions / completedDeadlines.length) * 100) : 0

    // Productivity trends
    const thisWeekStart = startOfWeek(now)
    const lastWeekStart = startOfWeek(addDays(now, -7))
    const lastWeekEnd = endOfWeek(addDays(now, -7))

    const thisWeekCompleted = processedDeadlines.filter(
      (d) => d.isCompleted && isAfter(d.updatedDate, thisWeekStart),
    ).length

    const lastWeekCompleted = processedDeadlines.filter(
      (d) => d.isCompleted && isWithinInterval(d.updatedDate, { start: lastWeekStart, end: lastWeekEnd }),
    ).length

    const weeklyTrend =
      lastWeekCompleted > 0
        ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
        : thisWeekCompleted > 0
          ? 100
          : 0

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
      highPriority,
      mediumPriority,
      lowPriority,
      categoryStats,
      weeklyData,
      dailyData,
      avgCompletionTime,
      onTimeRate,
      weeklyTrend,
      thisWeekCompleted,
      lastWeekCompleted,
    }
  }, [processedDeadlines])

  // Enhanced chart data with better formatting
  const statusData = [
    { name: "Completed", value: analytics.completed, color: COLORS.completed },
    { name: "Pending", value: analytics.pending, color: COLORS.pending },
    { name: "In Progress", value: analytics.inProgress, color: COLORS.in_progress },
    { name: "Overdue", value: analytics.overdue, color: COLORS.overdue },
  ].filter((item) => item.value > 0) // Only show non-zero values

  const priorityData = [
    { name: "High", value: analytics.highPriority, color: PRIORITY_COLORS.high },
    { name: "Medium", value: analytics.mediumPriority, color: PRIORITY_COLORS.medium },
    { name: "Low", value: analytics.lowPriority, color: PRIORITY_COLORS.low },
  ].filter((item) => item.value > 0)

  const categoryData = Object.entries(analytics.categoryStats).map(([name, stats]) => ({
    name,
    total: stats.total,
    completed: stats.completed,
    overdue: stats.overdue,
    completionRate: Math.round((stats.completed / stats.total) * 100),
  }))

  // Get display name and avatar
  const displayName = currentProfile.full_name || currentProfile.email.split("@")[0] || "User"
  const avatarFallback =
    currentProfile.full_name?.charAt(0)?.toUpperCase() || currentProfile.email?.charAt(0)?.toUpperCase() || "U"

  // Sidebar content component
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
            <CheckCircle className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Analytics</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/profile">
            <Settings className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Profile Settings</span>
          </LoadingButton>
        </div>
      </nav>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">Back to Dashboard</span>
                  </Button>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                    Insights into your deadline management
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* Notification System */}
              <NotificationSystem userId={user.id} isDemoMode={isDemoMode} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={currentProfile.avatar_url || "/placeholder.svg?height=32&width=32"}
                        alt={`${displayName}'s avatar`}
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{currentProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                      <button type="submit" className="flex items-center w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Analytics Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {/* Demo Mode Alert */}
          {isDemoMode && (
            <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Demo Mode:</strong> You're viewing sample analytics data.
                <a href="/auth" className="underline ml-1">
                  Set up real authentication
                </a>{" "}
                to see your actual analytics.
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-emerald-600">{analytics.completionRate}%</div>
                <Progress value={analytics.completionRate} className="mt-1 sm:mt-2 h-1 sm:h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.completed} of {analytics.total} completed
                </p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">On-Time Rate</CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{analytics.onTimeRate}%</div>
                <Progress value={analytics.onTimeRate} className="mt-1 sm:mt-2 h-1 sm:h-2" />
                <p className="text-xs text-muted-foreground mt-1">completed before deadline</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Weekly Trend</CardTitle>
                {analytics.weeklyTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div
                  className={`text-lg sm:text-2xl font-bold ${analytics.weeklyTrend >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {analytics.weeklyTrend >= 0 ? "+" : ""}
                  {analytics.weeklyTrend}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs last week ({analytics.thisWeekCompleted} vs {analytics.lastWeekCompleted})
                </p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Avg. Completion</CardTitle>
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{analytics.avgCompletionTime}</div>
                <p className="text-xs text-muted-foreground mt-1">days on average</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Status Distribution */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Status Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current status of all deadlines</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {statusData.length > 0 ? (
                  <>
                    <ChartContainer
                      config={{
                        completed: { label: "Completed", color: COLORS.completed },
                        pending: { label: "Pending", color: COLORS.pending },
                        in_progress: { label: "In Progress", color: COLORS.in_progress },
                        overdue: { label: "Overdue", color: COLORS.overdue },
                      }}
                      className="h-[200px] sm:h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <RechartsPieChart data={statusData} cx="50%" cy="50%" outerRadius="80%">
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </RechartsPieChart>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-3 sm:mt-4">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex items-center space-x-1 sm:space-x-2">
                          <div
                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-xs sm:text-sm">
                            {item.name}: {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Completion Trend */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Weekly Completion Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Completed vs created deadlines</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <ChartContainer
                  config={{
                    completed: { label: "Completed", color: COLORS.completed },
                    created: { label: "Created", color: "#6b7280" },
                  }}
                  className="h-[200px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" fill={COLORS.completed} name="Completed" />
                      <Bar dataKey="created" fill="#6b7280" name="Created" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance and Daily Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Category Performance */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">Category Performance</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Completion rates by category</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {categoryData.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No categories found</p>
                  ) : (
                    categoryData.map((category) => (
                      <div key={category.name} className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-medium truncate">{category.name}</span>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <span className="text-emerald-600">{category.completed}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{category.total}</span>
                            <span className="text-gray-500">({category.completionRate}%)</span>
                          </div>
                        </div>
                        <Progress value={category.completionRate} className="h-1 sm:h-2" />
                        {category.overdue > 0 && <p className="text-xs text-red-600">{category.overdue} overdue</p>}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Completion Trend */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Daily Activity (Last 7 Days)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Daily completion patterns</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <ChartContainer
                  config={{
                    completed: { label: "Completed", color: COLORS.completed },
                    created: { label: "Created", color: "#6b7280" },
                  }}
                  className="h-[200px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke={COLORS.completed}
                        strokeWidth={2}
                        dot={{ fill: COLORS.completed, r: 4 }}
                        name="Completed"
                      />
                      <Line
                        type="monotone"
                        dataKey="created"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dot={{ fill: "#6b7280", r: 4 }}
                        name="Created"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Priority Analysis */}
          {priorityData.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Priority Distribution
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Breakdown by priority levels</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartContainer
                      config={{
                        high: { label: "High", color: PRIORITY_COLORS.high },
                        medium: { label: "Medium", color: PRIORITY_COLORS.medium },
                        low: { label: "Low", color: PRIORITY_COLORS.low },
                      }}
                      className="h-[200px] sm:h-[250px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="#8884d8">
                            {priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Priority Insights</h4>
                      {priorityData.map((priority) => {
                        const percentage = Math.round((priority.value / analytics.total) * 100)
                        return (
                          <div key={priority.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium" style={{ color: priority.color }}>
                                {priority.name} Priority
                              </span>
                              <span className="text-gray-600">
                                {priority.value} ({percentage}%)
                              </span>
                            </div>
                            <Progress
                              value={percentage}
                              className="h-2"
                              style={
                                {
                                  "--progress-background": priority.color,
                                } as React.CSSProperties
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
