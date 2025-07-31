import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, ExternalLink, Share2, AlertCircle, CheckCircle2, Timer, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface PageProps {
  params: {
    token: string
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()

  try {
    // Get shared deadline info
    const { data: sharedDeadline } = await supabase
      .from("shared_deadlines")
      .select(`
        *,
        deadlines (
          title,
          description,
          due_date,
          priority,
          category
        )
      `)
      .eq("share_token", params.token)
      .eq("is_active", true)
      .single()

    if (!sharedDeadline?.deadlines) {
      return {
        title: "Shared Deadline - DeadlineMate",
        description: "View shared deadline details on DeadlineMate",
      }
    }

    const deadline = sharedDeadline.deadlines
    const dueDate = format(new Date(deadline.due_date), "PPP")

    return {
      title: `${deadline.title} - Shared Deadline | DeadlineMate`,
      description: `${deadline.description || deadline.title} - Due ${dueDate}. Shared via DeadlineMate.`,
      openGraph: {
        title: `${deadline.title} - Shared Deadline`,
        description: `${deadline.description || deadline.title} - Due ${dueDate}`,
        type: "website",
        siteName: "DeadlineMate",
      },
      twitter: {
        card: "summary_large_image",
        title: `${deadline.title} - Shared Deadline`,
        description: `${deadline.description || deadline.title} - Due ${dueDate}`,
      },
    }
  } catch (error) {
    return {
      title: "Shared Deadline - DeadlineMate",
      description: "View shared deadline details on DeadlineMate",
    }
  }
}

export default async function SharedDeadlinePage({ params }: PageProps) {
  const supabase = createClient()

  try {
    // Get shared deadline with deadline details
    const { data: sharedDeadline, error } = await supabase
      .from("shared_deadlines")
      .select(`
        *,
        deadlines (
          id,
          title,
          description,
          due_date,
          priority,
          status,
          category,
          project_link,
          created_at
        )
      `)
      .eq("share_token", params.token)
      .eq("is_active", true)
      .single()

    if (error || !sharedDeadline) {
      console.error("Error fetching shared deadline:", error)
      notFound()
    }

    // Check if expired
    if (sharedDeadline.expires_at && new Date(sharedDeadline.expires_at) < new Date()) {
      notFound()
    }

    // Increment view count
    await supabase
      .from("shared_deadlines")
      .update({ view_count: (sharedDeadline.view_count || 0) + 1 })
      .eq("id", sharedDeadline.id)

    const deadline = sharedDeadline.deadlines
    if (!deadline) {
      notFound()
    }

    const dueDate = new Date(deadline.due_date)
    const now = new Date()
    const isOverdue = dueDate < now
    const timeUntilDue = dueDate.getTime() - now.getTime()
    const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24))

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
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Shared Deadline</h1>
                  <p className="text-sm text-gray-600">Powered by DeadlineMate</p>
                </div>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm" className="bg-transparent">
                  Try DeadlineMate
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Deadline Card */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{deadline.title}</CardTitle>
                      <div className="flex items-center space-x-3 mb-4">
                        <Badge className={`${getPriorityColor(deadline.priority)} border`}>
                          {deadline.priority} priority
                        </Badge>
                        <Badge className={`${getStatusColor(deadline.status)} border`}>
                          {deadline.status.replace("_", " ")}
                        </Badge>
                        {deadline.category && (
                          <Badge variant="outline" className="bg-gray-50">
                            {deadline.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Due Date Section */}
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{format(dueDate, "EEEE, MMMM do, yyyy")}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(dueDate, "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isOverdue ? (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span className="font-medium">Overdue</span>
                          </div>
                        ) : deadline.status === "completed" ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            <span className="font-medium">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-600">
                            <Timer className="w-5 h-5 mr-2" />
                            <div className="text-right">
                              <p className="font-medium">
                                {daysUntilDue === 0
                                  ? "Due today"
                                  : daysUntilDue === 1
                                    ? "Due tomorrow"
                                    : `${daysUntilDue} days left`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Description */}
                  {deadline.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{deadline.description}</p>
                    </div>
                  )}

                  {/* Project Link */}
                  {deadline.project_link && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Project Resources</h3>
                      <a
                        href={deadline.project_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Project
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Share Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-900">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Shared:</span>
                    <span className="text-blue-900 font-medium">
                      {format(new Date(sharedDeadline.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Views:</span>
                    <span className="text-blue-900 font-medium">{sharedDeadline.view_count || 0}</span>
                  </div>
                  {sharedDeadline.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Expires:</span>
                      <span className="text-blue-900 font-medium">
                        {format(new Date(sharedDeadline.expires_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-900">Try DeadlineMate</CardTitle>
                  <CardDescription className="text-emerald-700">
                    Organize your deadlines and collaborate with your team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm text-emerald-800">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Smart deadline tracking
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Team collaboration
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Real-time notifications
                    </div>
                  </div>
                  <Separator className="bg-emerald-200" />
                  <div className="space-y-2">
                    <Link href="/" className="block">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/auth" className="block">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Shared securely</p>
                      <p>This deadline was shared by a DeadlineMate user. Only people with this link can view it.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
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
  } catch (error) {
    console.error("Error in SharedDeadlinePage:", error)
    notFound()
  }
}
