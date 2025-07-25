"use client"

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
  eachDayOfInterval,
  isWithinInterval,
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
  const [deadlines] = useState<Deadline[]>(initialDeadlines)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    avatar_url: user.user_metadata?.avatar_url || "",
  })

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

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = deadlines.length
    const completed = deadlines.filter((d) => d.status === "completed").length
    const pending = deadlines.filter((d) => d.status === "pending").length
    const inProgress = deadlines.filter((d) => d.status === "in_progress").length
    const overdue = deadlines.filter((d) => d.status === "overdue").length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Priority distribution
    const highPriority = deadlines.filter((d) => d.priority === "high").length
    const mediumPriority = deadlines.filter((d) => d.priority === "medium").length
    const lowPriority = deadlines.filter((d) => d.priority === "low").length

    // Category distribution
    const categoryStats = deadlines.reduce(
      (acc, deadline) => {
        const category = deadline.category || "Uncategorized"
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Weekly completion trend (last 7 days)
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const weeklyData = weekDays.map((day) => {
      const dayCompleted = deadlines.filter(
        (d) => d.status === "completed" && isWithinInterval(parseISO(d.updated_at), { start: day, end: day }),
      ).length

      return {
        day: format(day, "EEE"),
        completed: dayCompleted,
      }
    })

    // Average completion time
    const completedDeadlines = deadlines.filter((d) => d.status === "completed")
    const avgCompletionTime =
      completedDeadlines.length > 0
        ? Math.round(
            completedDeadlines.reduce((acc, d) => {
              const created = parseISO(d.created_at)
              const completed = parseISO(d.updated_at)
              return acc + differenceInDays(completed, created)
            }, 0) / completedDeadlines.length,
          )
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
      avgCompletionTime,
    }
  }, [deadlines])

  // Chart data
  const statusData = [
    { name: "Completed", value: analytics.completed, color: COLORS.completed },
    { name: "Pending", value: analytics.pending, color: COLORS.pending },
    { name: "In Progress", value: analytics.inProgress, color: COLORS.in_progress },
    { name: "Overdue", value: analytics.overdue, color: COLORS.overdue },
  ]

  const priorityData = [
    { name: "High", value: analytics.highPriority, color: PRIORITY_COLORS.high },
    { name: "Medium", value: analytics.mediumPriority, color: PRIORITY_COLORS.medium },
    { name: "Low", value: analytics.lowPriority, color: PRIORITY_COLORS.low },
  ]

  const categoryData = Object.entries(analytics.categoryStats).map(([name, value]) => ({
    name,
    value,
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

          {/* Key Metrics */}
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
                <CardTitle className="text-xs sm:text-sm font-medium">Avg. Completion Time</CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold">{analytics.avgCompletionTime}</div>
                <p className="text-xs text-muted-foreground">days on average</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">High Priority</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{analytics.highPriority}</div>
                <p className="text-xs text-muted-foreground">urgent deadlines</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Overdue Items</CardTitle>
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{analytics.overdue}</div>
                <p className="text-xs text-muted-foreground">need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Status Distribution */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Status Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Breakdown of deadline statuses</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
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
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs sm:text-sm">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Priority Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Breakdown by priority levels</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <ChartContainer
                  config={{
                    high: { label: "High", color: PRIORITY_COLORS.high },
                    medium: { label: "Medium", color: PRIORITY_COLORS.medium },
                    low: { label: "Low", color: PRIORITY_COLORS.low },
                  }}
                  className="h-[200px] sm:h-[300px]"
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
              </CardContent>
            </Card>
          </div>

          {/* Weekly Trend and Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Weekly Completion Trend */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Weekly Completion Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Deadlines completed this week</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <ChartContainer
                  config={{
                    completed: { label: "Completed", color: COLORS.completed },
                  }}
                  className="h-[200px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">Category Breakdown</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Deadlines by category</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {categoryData.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No categories found</p>
                  ) : (
                    categoryData.map((category, index) => {
                      const percentage = Math.round((category.value / analytics.total) * 100)
                      return (
                        <div key={category.name} className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="font-medium truncate">{category.name}</span>
                            <span className="text-gray-500 flex-shrink-0 ml-2">
                              {category.value} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-1 sm:h-2" />
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
