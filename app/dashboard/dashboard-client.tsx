"use client"

import type React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  LogOut,
  MoreHorizontal,
  Edit,
  Trash2,
  Info,
  RefreshCw,
  Menu,
  ExternalLink,
  Share2,
  StickyNote,
} from "lucide-react"
import { signOut } from "../auth/actions"
import AddDeadlineDialog from "./add-deadline-dialog"
import EditDeadlineDialog from "./edit-deadline-dialog"
import DeleteDeadlineDialog from "./delete-deadline-dialog"
import ShareDeadlineDialog from "@/components/share-deadline-dialog"
import { format, isToday, isThisWeek, isPast, isFuture } from "date-fns"
import { LoadingButton } from "@/components/loading-button"
import { NotificationSystem } from "@/components/notification-system"
import { NotificationBanner } from "@/components/notification-banner"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
  project_link?: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
}

interface DashboardClientProps {
  user: any
  initialDeadlines: Deadline[]
  isDemoMode?: boolean
}

export default function DashboardClient({ user, initialDeadlines = [], isDemoMode = false }: DashboardClientProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    id: user?.id || "demo-user",
    email: user?.email || "demo@example.com",
    full_name: user?.user_metadata?.full_name || "Demo User",
    avatar_url: user?.user_metadata?.avatar_url || "",
  })

  // Fetch current profile data
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (isDemoMode || !user) {
        // In demo mode, use demo data
        setCurrentProfile({
          id: "demo-user",
          email: "demo@example.com",
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
        // Fallback to user metadata if profile fetch fails
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

  // Listen for profile updates (when user comes back from profile page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isDemoMode && user) {
        // Refetch profile when tab becomes visible
        const fetchProfile = async () => {
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
            console.error("Error refetching profile:", error)
          }
        }
        fetchProfile()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [user, isDemoMode])

  // Refresh deadlines function
  const refreshDeadlines = useCallback(async () => {
    if (isDemoMode || !user) {
      // In demo mode, just simulate a refresh
      await new Promise((resolve) => setTimeout(resolve, 500))
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })

      if (error) {
        console.error("Error refreshing deadlines:", error)
        return
      }

      setDeadlines(data || [])
    } catch (error) {
      console.error("Error refreshing deadlines:", error)
    }
  }, [user, isDemoMode])

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshDeadlines()
    setIsRefreshing(false)
  }, [refreshDeadlines])

  const getDeadlineBadge = (dueDate: string, status: string) => {
    const date = new Date(dueDate)

    if (status === "completed") {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
          Completed
        </Badge>
      )
    }

    if (isPast(date) && status !== "completed") {
      return (
        <Badge variant="destructive" className="text-xs">
          Overdue
        </Badge>
      )
    }

    if (isToday(date)) {
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Today</Badge>
    }

    if (isThisWeek(date)) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">This Week</Badge>
    }

    return (
      <Badge variant="outline" className="text-xs">
        Later
      </Badge>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-orange-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((deadline) => {
      const dueDate = new Date(deadline.due_date)

      switch (activeFilter) {
        case "upcoming":
          return deadline.status !== "completed" && isFuture(dueDate)
        case "completed":
          return deadline.status === "completed"
        case "overdue":
          return deadline.status !== "completed" && isPast(dueDate)
        default:
          return true
      }
    })
  }, [deadlines, activeFilter])

  const stats = useMemo(() => {
    const total = deadlines.length
    const completed = deadlines.filter((d) => d.status === "completed").length
    const overdue = deadlines.filter((d) => d.status !== "completed" && isPast(new Date(d.due_date))).length
    const upcoming = deadlines.filter((d) => d.status !== "completed" && isFuture(new Date(d.due_date))).length

    return { total, completed, overdue, upcoming }
  }, [deadlines])

  const handleAddDeadline = useCallback((newDeadline: Deadline) => {
    setDeadlines((prev) => [...prev, newDeadline])
  }, [])

  const handleUpdateDeadline = useCallback((updatedDeadline: Deadline) => {
    setDeadlines((prev) => prev.map((deadline) => (deadline.id === updatedDeadline.id ? updatedDeadline : deadline)))
  }, [])

  const handleDeleteDeadline = useCallback((deadlineId: string) => {
    setDeadlines((prev) => prev.filter((deadline) => deadline.id !== deadlineId))
  }, [])

  const toggleDeadlineStatus = useCallback(
    async (id: string) => {
      const deadline = deadlines.find((d) => d.id === id)
      if (!deadline) return

      const newStatus = deadline.status === "completed" ? "pending" : "completed"

      // Optimistically update UI
      setDeadlines((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus, updated_at: new Date().toISOString() } : d)),
      )

      // Update database if not in demo mode
      if (!isDemoMode && user) {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from("deadlines")
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)

          if (error) {
            console.error("Error updating deadline status:", error)
            // Revert optimistic update on error
            setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, status: deadline.status } : d)))
          }
        } catch (error) {
          console.error("Error updating deadline status:", error)
          // Revert optimistic update on error
          setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, status: deadline.status } : d)))
        }
      }
    },
    [deadlines, isDemoMode, user],
  )

  const handleEditClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleShareClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsShareDialogOpen(true)
  }, [])

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
          <LoadingButton variant="ghost" className="w-full justify-start bg-emerald-50 text-emerald-700 h-10 sm:h-auto">
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Dashboard</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/calendar">
            <Clock className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Calendar View</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/timetable">
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
            <span>Total</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed</span>
            <span className="font-medium text-emerald-600">{stats.completed}</span>
          </div>
          <div className="flex justify-between">
            <span>Overdue</span>
            <span className="font-medium text-red-600">{stats.overdue}</span>
          </div>
        </div>
      </div>
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

              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
                <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                  Manage your deadlines and stay organized
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* Manual Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center bg-transparent p-2 sm:px-3"
              >
                {isRefreshing ? (
                  <LoadingSpinner size="sm" className="animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1 sm:ml-2 hidden sm:inline text-sm">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </Button>

              {/* Notification System */}
              <NotificationSystem userId={currentProfile.id} isDemoMode={isDemoMode} />

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

        {/* Dashboard Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {/* Demo Mode Alert */}
          {isDemoMode && (
            <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Demo Mode:</strong> You're viewing sample data. Changes won't be saved.
                <a href="/auth" className="underline ml-1">
                  Set up real authentication
                </a>{" "}
                to save your deadlines.
              </AlertDescription>
            </Alert>
          )}

          {/* Notification Banner */}
          <NotificationBanner deadlines={deadlines} isDemoMode={isDemoMode} />

          {/* Welcome Message */}
          <div className="mb-4 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Welcome back, {displayName}! 👋
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Here's what's happening with your deadlines today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Deadlines</CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All your deadlines</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.upcoming}</div>
                <p className="text-xs text-muted-foreground">Due in the future</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Deadline Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">Your Deadlines</h2>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 h-10 sm:h-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Add New Deadline</span>
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                All ({deadlines.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                Overdue ({stats.overdue})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Deadlines List */}
          <div className="space-y-3 sm:space-y-4">
            {filteredDeadlines.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No deadlines found</h3>
                  <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6 max-w-md">
                    {activeFilter === "all"
                      ? "Get started by adding your first deadline."
                      : `No ${activeFilter} deadlines at the moment.`}
                  </p>
                  {activeFilter === "all" && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Deadline
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredDeadlines.map((deadline) => (
                <Card key={deadline.id} className={`border-l-4 ${getPriorityColor(deadline.priority)}`}>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2">
                          <button
                            onClick={() => toggleDeadlineStatus(deadline.id)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                              deadline.status === "completed"
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-gray-300 hover:border-emerald-500"
                            }`}
                          >
                            {deadline.status === "completed" && (
                              <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <CardTitle
                              className={`text-sm sm:text-lg leading-tight ${deadline.status === "completed" ? "line-through text-gray-500" : ""}`}
                            >
                              {deadline.title}
                            </CardTitle>
                            <div className="mt-1 sm:mt-2">{getDeadlineBadge(deadline.due_date, deadline.status)}</div>
                          </div>
                        </div>
                        {deadline.description && (
                          <CardDescription className="ml-6 sm:ml-8 text-xs sm:text-sm">
                            {deadline.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleShareClick(e, deadline)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleEditClick(e, deadline)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDeleteClick(e, deadline)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 ml-6 sm:ml-8 gap-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {format(new Date(deadline.due_date), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {format(new Date(deadline.due_date), "h:mm a")}
                        </span>
                        {deadline.project_link && (
                          <a
                            href={deadline.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="underline">Project</span>
                          </a>
                        )}
                        {deadline.category && (
                          <Badge variant="outline" className="text-xs">
                            {deadline.category}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${
                          deadline.priority === "high"
                            ? "border-red-200 text-red-700"
                            : deadline.priority === "medium"
                              ? "border-orange-200 text-orange-700"
                              : "border-green-200 text-green-700"
                        }`}
                      >
                        {deadline.priority} priority
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <AddDeadlineDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddDeadline}
        onRefresh={refreshDeadlines}
        userId={currentProfile.id}
        isDemoMode={isDemoMode}
      />

      <EditDeadlineDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedDeadline(null)
        }}
        onUpdate={handleUpdateDeadline}
        onRefresh={refreshDeadlines}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />

      <DeleteDeadlineDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedDeadline(null)
        }}
        onDelete={handleDeleteDeadline}
        onRefresh={refreshDeadlines}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />

      <ShareDeadlineDialog
        isOpen={isShareDialogOpen}
        onClose={() => {
          setIsShareDialogOpen(false)
          setSelectedDeadline(null)
        }}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />
    </div>
  )
}
