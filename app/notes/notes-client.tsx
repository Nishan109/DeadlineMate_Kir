"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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
  Settings,
  LogOut,
  MoreHorizontal,
  Edit,
  Trash2,
  Info,
  RefreshCw,
  Menu,
  StickyNote,
  Search,
  Pin,
  LinkIcon,
  Tag,
} from "lucide-react"
import { signOut } from "../auth/actions"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import AddNoteDialog from "@/components/notes/add-note-dialog"
import EditNoteDialog from "@/components/notes/edit-note-dialog"
import DeleteNoteDialog from "@/components/notes/delete-note-dialog"
import ViewNoteDialog from "@/components/notes/view-note-dialog"
import { LoadingButton } from "@/components/loading-button"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  color: string
  is_pinned: boolean
  deadline_id?: string
  created_at: string
  updated_at: string
}

interface Deadline {
  id: string
  title: string
}

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
}

interface NotesClientProps {
  user: any
  initialNotes: Note[]
  deadlines: Deadline[]
  isDemoMode?: boolean
}

const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Project Research Notes",
    content:
      "Key findings from market research:\n\n• Target audience prefers mobile-first approach\n• Competitors lack real-time collaboration features\n• Budget considerations for Q2\n\nNext steps:\n1. Conduct user interviews\n2. Create wireframes\n3. Develop MVP prototype\n\nImportant contacts:\n- John Smith (Product Manager): john@company.com\n- Sarah Johnson (Designer): sarah@company.com\n\nDeadline: March 15th for initial prototype",
    tags: ["research", "project", "important"],
    color: "yellow",
    is_pinned: true,
    deadline_id: "1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "note-2",
    title: "Study Schedule",
    content:
      "Chapter breakdown for final exam:\n\nWeek 1 (Mon-Tue):\n- Chapter 1: Introduction to Data Structures\n- Chapter 2: Arrays and Linked Lists\n- Chapter 3: Stacks and Queues\n\nWeek 2 (Wed-Thu):\n- Chapter 4: Trees and Binary Search Trees\n- Chapter 5: Hash Tables\n- Chapter 6: Graph Algorithms\n\nWeek 3 (Fri-Sat):\n- Chapter 7: Sorting Algorithms\n- Chapter 8: Dynamic Programming\n- Chapter 9: System Design Principles\n- Chapter 10: Advanced Topics\n\nPractice problems:\n- LeetCode: 50 problems minimum\n- HackerRank: Complete data structures track\n- Mock interviews: Schedule 3 sessions\n\nStudy groups:\n- Monday 7 PM with Alex and Maria\n- Wednesday 6 PM with study group\n\nExam date: April 20th, 2024",
    tags: ["study", "exam", "schedule"],
    color: "blue",
    is_pinned: false,
    deadline_id: "2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "note-3",
    title: "Meeting Ideas",
    content:
      "Ideas for the team meeting:\n\n1. Project Timeline Discussion\n   - Review current milestones\n   - Identify potential bottlenecks\n   - Adjust deadlines if necessary\n\n2. Budget Allocations\n   - Q1 spending review\n   - Q2 budget planning\n   - Resource allocation for new projects\n\n3. Team Building Activities\n   - Monthly team lunch\n   - Quarterly off-site events\n   - Skills development workshops\n\n4. Process Improvements\n   - Code review process\n   - Documentation standards\n   - Communication protocols\n\n5. New Tool Evaluations\n   - Project management software\n   - Design collaboration tools\n   - Development environment upgrades\n\nAction items:\n- Send calendar invites\n- Prepare presentation slides\n- Book conference room\n- Order catering",
    tags: ["meeting", "ideas", "team"],
    color: "green",
    is_pinned: false,
    deadline_id: "3",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "note-4",
    title: "Quick Reminder",
    content:
      "URGENT: Don't forget to submit the quarterly report by Friday!\n\nReport should include:\n- Financial summary\n- Project progress updates\n- Team performance metrics\n- Goals for next quarter\n\nDeadline: Friday, 5 PM\nSubmit to: manager@company.com\nCC: hr@company.com",
    tags: ["reminder", "urgent"],
    color: "pink",
    is_pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function NotesClient({ user, initialNotes = [], deadlines = [], isDemoMode = false }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(isDemoMode ? mockNotes : initialNotes)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
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

  // Refresh notes function
  const refreshNotes = useCallback(async () => {
    if (isDemoMode || !user) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error refreshing notes:", error)
        return
      }

      setNotes(data || [])
    } catch (error) {
      console.error("Error refreshing notes:", error)
    }
  }, [user, isDemoMode])

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshNotes()
    setIsRefreshing(false)
  }, [refreshNotes])

  // Get color classes for notes
  const getColorClasses = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
      case "blue":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100"
      case "green":
        return "bg-green-50 border-green-200 hover:bg-green-100"
      case "pink":
        return "bg-pink-50 border-pink-200 hover:bg-pink-100"
      case "purple":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100"
      case "orange":
        return "bg-orange-50 border-orange-200 hover:bg-orange-100"
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100"
    }
  }

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply filter
    switch (activeFilter) {
      case "pinned":
        filtered = filtered.filter((note) => note.is_pinned)
        break
      case "linked":
        filtered = filtered.filter((note) => note.deadline_id)
        break
      case "solo":
        filtered = filtered.filter((note) => !note.deadline_id)
        break
      default:
        break
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Sort: pinned first, then by updated_at
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [notes, activeFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const total = notes.length
    const pinned = notes.filter((n) => n.is_pinned).length
    const linked = notes.filter((n) => n.deadline_id).length
    const solo = notes.filter((n) => !n.deadline_id).length

    return { total, pinned, linked, solo }
  }, [notes])

  // Event handlers
  const handleAddNote = useCallback((newNote: Note) => {
    setNotes((prev) => [newNote, ...prev])
  }, [])

  const handleUpdateNote = useCallback((updatedNote: Note) => {
    setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
  }, [])

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }, [])

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note)
    setIsViewDialogOpen(true)
  }, [])

  const handleEditClick = useCallback((note: Note) => {
    setSelectedNote(note)
    setIsEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((note: Note) => {
    setSelectedNote(note)
    setIsDeleteDialogOpen(true)
  }, [])

  const togglePin = useCallback(
    async (noteId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return

      const newPinnedState = !note.is_pinned

      // Optimistically update UI
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, is_pinned: newPinnedState, updated_at: new Date().toISOString() } : n,
        ),
      )

      // Update database if not in demo mode
      if (!isDemoMode && user) {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from("notes")
            .update({
              is_pinned: newPinnedState,
              updated_at: new Date().toISOString(),
            })
            .eq("id", noteId)

          if (error) {
            console.error("Error updating note pin status:", error)
            // Revert optimistic update on error
            setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_pinned: note.is_pinned } : n)))
          }
        } catch (error) {
          console.error("Error updating note pin status:", error)
          setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_pinned: note.is_pinned } : n)))
        }
      }
    },
    [notes, isDemoMode, user],
  )

  // Get display name and avatar
  const displayName = currentProfile.full_name || currentProfile.email.split("@")[0] || "User"
  const avatarFallback =
    currentProfile.full_name?.charAt(0)?.toUpperCase() || currentProfile.email?.charAt(0)?.toUpperCase() || "U"

  // Sidebar content component
  const SidebarContent = () => (
    <>
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">DeadlineMate</span>
        </div>
      </div>

      <nav className="flex-1 p-2 sm:p-3 lg:p-4">
        <div className="space-y-1 sm:space-y-2">
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            href="/dashboard"
          >
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Dashboard</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            href="/calendar"
          >
            <Clock className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Calendar View</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            href="/timetable"
          >
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Time Table</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            href="/analytics"
          >
            <CheckCircle className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Analytics</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start bg-emerald-50 text-emerald-700 h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
          >
            <StickyNote className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Notes</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            href="/profile"
          >
            <Settings className="w-4 h-4 mr-2 sm:mr-3" />
            <span>Profile Settings</span>
          </LoadingButton>
        </div>
      </nav>

      <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200">
        <div className="text-xs sm:text-sm text-gray-600 mb-2">Notes Stats</div>
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Pinned</span>
            <span className="font-medium text-emerald-600">{stats.pinned}</span>
          </div>
          <div className="flex justify-between">
            <span>Linked</span>
            <span className="font-medium text-blue-600">{stats.linked}</span>
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
        <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0">
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="lg:hidden p-1.5 sm:p-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <StickyNote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-600" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">Notes</h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 hidden sm:block">
                    Organize your thoughts and ideas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {/* Manual Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center bg-transparent p-1.5 sm:p-2 lg:px-3"
              >
                {isRefreshing ? (
                  <LoadingSpinner size="sm" className="animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="ml-1 sm:ml-2 hidden md:inline text-xs sm:text-sm">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
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
                <DropdownMenuContent className="w-48 sm:w-56" align="end" forceMount>
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

        {/* Notes Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {/* Demo Mode Alert */}
          {isDemoMode && (
            <Alert className="mb-3 sm:mb-4 lg:mb-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                <strong>Demo Mode:</strong> You're viewing sample data. Changes won't be saved.
                <a href="/auth" className="underline ml-1">
                  Set up real authentication
                </a>{" "}
                to save your notes.
              </AlertDescription>
            </Alert>
          )}

          {/* Add Note Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2 sm:gap-3 lg:gap-4">
            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-gray-900">Your Notes</h2>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 h-9 sm:h-10 lg:h-auto text-sm sm:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span>Add New Note</span>
            </Button>
          </div>
          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-3 sm:mb-4 lg:mb-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 lg:w-auto h-auto p-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                Pinned ({stats.pinned})
              </TabsTrigger>
              <TabsTrigger value="linked" className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                Linked ({stats.linked})
              </TabsTrigger>
              <TabsTrigger value="solo" className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                Solo ({stats.solo})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 max-w-full sm:max-w-md text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <StickyNote className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes found</h3>
                    <p className="text-base text-gray-600 text-center mb-6 max-w-md">
                      {activeFilter === "all" && !searchQuery
                        ? "Get started by creating your first note."
                        : searchQuery
                          ? `No notes match "${searchQuery}".`
                          : `No ${activeFilter} notes at the moment.`}
                    </p>
                    {activeFilter === "all" && !searchQuery && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Note
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const linkedDeadline = deadlines.find((d) => d.id === note.deadline_id)
                return (
                  <Card
                    key={note.id}
                    className={`${getColorClasses(note.color)} transition-all duration-200 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg group`}
                    onClick={() => handleNoteClick(note)}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-1 sm:space-x-2 flex-1 min-w-0">
                          {note.is_pinned && (
                            <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          )}
                          <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold leading-tight line-clamp-2">
                            {note.title}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePin(note.id)
                              }}
                            >
                              <Pin className="w-4 h-4 mr-2" />
                              {note.is_pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(note)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(note)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 sm:p-4 lg:p-6 group">
                      <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
                        {note.content}
                      </p>
                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                          {note.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                              <Tag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      {/* Linked Deadline */}
                      {linkedDeadline && (
                        <div className="flex items-center text-xs text-blue-600 mb-2 sm:mb-3">
                          <LinkIcon className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                          <span className="truncate text-xs">{linkedDeadline.title}</span>
                        </div>
                      )}
                      {/* Timestamp */}
                      <p className="text-xs text-gray-500">
                        Updated {format(new Date(note.updated_at), "MMM dd, yyyy")}
                      </p>
                      {/* Click hint */}
                      <div className="mt-1 sm:mt-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        Click to view full content
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </main>
      </div>
      {/* Dialogs */}
      <AddNoteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddNote}
        onRefresh={refreshNotes}
        deadlines={deadlines}
        userId={currentProfile.id}
        isDemoMode={isDemoMode}
      />
      <EditNoteDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedNote(null)
        }}
        onUpdate={handleUpdateNote}
        onRefresh={refreshNotes}
        note={selectedNote}
        deadlines={deadlines}
        isDemoMode={isDemoMode}
      />
      <DeleteNoteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedNote(null)
        }}
        onDelete={handleDeleteNote}
        onRefresh={refreshNotes}
        note={selectedNote}
        isDemoMode={isDemoMode}
      />
      <ViewNoteDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false)
          setSelectedNote(null)
        }}
        note={selectedNote}
        deadlines={deadlines}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onTogglePin={togglePin}
      />
    </div>
  )
}
