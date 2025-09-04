"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Clock,
  ExternalLink,
  Share2,
  AlertCircle,
  Timer,
  ArrowRight,
  Target,
} from "lucide-react"
import Link from "next/link"

interface SharedDeadlineClientProps {
  token: string
}

interface SharedDeadline {
  id: string
  deadline_id: string
  share_token: string
  created_by: string
  expires_at: string | null
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
  deadlines: {
    id: string
    title: string
    description: string | null
    due_date: string
    priority: string
    status: string
    category: string | null
    project_link: string | null
    created_at: string
    user_id: string
  }
}

export default function SharedDeadlineClient({ token }: SharedDeadlineClientProps) {
  const [sharedDeadline, setSharedDeadline] = useState<SharedDeadline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedDeadline() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        
        const { data, error: queryError } = await supabase
          .from("shared_deadlines")
          .select(`
            id,
            deadline_id,
            share_token,
            created_by,
            expires_at,
            is_active,
            view_count,
            created_at,
            updated_at,
            deadlines (
              id,
              title,
              description,
              due_date,
              priority,
              status,
              category,
              project_link,
              created_at,
              user_id
            )
          `)
          .eq("share_token", token)
          .eq("is_active", true)
          .single()

        if (queryError) {
          console.error("Client-side query error:", queryError)
          setError(queryError.message)
          return
        }

        if (!data) {
          setError("Shared deadline not found")
          return
        }

        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError("This shared deadline has expired")
          return
        }

        setSharedDeadline(data)

        // Increment view count
        supabase
          .from("shared_deadlines")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating view count:", error)
            }
          })
      } catch (err) {
        console.error("Client-side fetch error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedDeadline()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-blue-900">Loading Shared Deadline</CardTitle>
            <CardDescription className="text-blue-700">
              Please wait while we fetch the deadline details...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !sharedDeadline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Error Loading Deadline</CardTitle>
            <CardDescription className="text-red-700">
              {error || "An error occurred while loading the shared deadline."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Go to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deadline = sharedDeadline.deadlines
  const dueDate = new Date(deadline.due_date)
  const now = new Date()
  const isOverdue = dueDate < now && deadline.status !== "completed"
  const timeUntilDue = dueDate.getTime() - now.getTime()
  const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24))
  
  // Debug logging to help identify timezone issues
  console.log("🕐 Client Date Debug Info:", {
    originalDueDate: deadline.due_date,
    parsedDueDate: dueDate.toISOString(),
    localDueDate: dueDate.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    formattedTime: format(dueDate, "h:mm a"),
    utcTime: dueDate.toUTCString(),
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">DeadlineMate</h1>
                <p className="text-xs sm:text-sm text-gray-600">Shared Deadline</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent text-xs sm:text-sm">
                <span className="hidden sm:inline">Try DeadlineMate</span>
                <span className="sm:hidden">Try App</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Deadline Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-2 break-words">
                      {deadline.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
                      <Badge className={`${getPriorityColor(deadline.priority)} border text-xs sm:text-sm`}>
                        {deadline.priority} priority
                      </Badge>
                      <Badge
                        className={`${getStatusColor(isOverdue ? "overdue" : deadline.status)} border text-xs sm:text-sm`}
                      >
                        {isOverdue ? "overdue" : deadline.status.replace("_", " ")}
                      </Badge>
                      {deadline.category && (
                        <Badge variant="outline" className="bg-gray-50 text-xs sm:text-sm">
                          {deadline.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Due Date Section */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {format(dueDate, "EEEE, MMMM do, yyyy")}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {format(dueDate, "h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="flex items-center text-blue-600">
                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <div className="text-right">
                          <p className="font-medium">
                            {daysUntilDue > 0 ? `${daysUntilDue} days left` : "Due today"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Description</h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                    {deadline.description || "No description available."}
                  </p>
                </div>

                {/* Project Link */}
                {deadline.project_link && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Project Resources</h3>
                    <a
                      href={deadline.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">View Project</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Share Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Share Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Shared By:</span>
                  <span className="text-blue-900 text-sm sm:text-base">{sharedDeadline.created_by}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Views:</span>
                  <span className="text-blue-900 text-sm sm:text-base">{sharedDeadline.view_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Expires:</span>
                  <span className="text-blue-900 text-sm sm:text-base">
                    {sharedDeadline.expires_at ? format(new Date(sharedDeadline.expires_at), "PPP") : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-xs sm:text-sm text-gray-600">
            <p>© 2024 DeadlineMate. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <Link href="/auth" className="hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
