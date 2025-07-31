import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink, Target, ArrowLeft, CheckCircle, AlertTriangle, User } from "lucide-react"
import Link from "next/link"

interface SharedDeadlinePageProps {
  params: {
    token: string
  }
}

export default async function SharedDeadlinePage({ params }: SharedDeadlinePageProps) {
  const supabase = createClient()

  // Fetch shared deadline
  const { data: sharedDeadline, error: shareError } = await supabase
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
        created_at,
        profiles!deadlines_user_id_fkey (
          full_name
        )
      )
    `)
    .eq("share_token", params.token)
    .eq("is_active", true)
    .single()

  if (shareError || !sharedDeadline) {
    notFound()
  }

  // Check if expired
  if (sharedDeadline.expires_at && new Date(sharedDeadline.expires_at) < new Date()) {
    notFound()
  }

  // Update view count
  await supabase
    .from("shared_deadlines")
    .update({ view_count: sharedDeadline.view_count + 1 })
    .eq("id", sharedDeadline.id)

  const deadline = sharedDeadline.deadlines
  const sharedBy = deadline.profiles?.full_name || "Someone"

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200"
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "overdue":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DeadlineMate</h1>
                <p className="text-sm text-gray-600">Shared Deadline</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Shared By Info */}
          <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <User className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">Shared by {sharedBy}</p>
              <p className="text-xs text-blue-700">{format(new Date(sharedDeadline.created_at), "PPP 'at' p")}</p>
            </div>
          </div>

          {/* Deadline Card */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{deadline.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${getPriorityColor(deadline.priority)}`}>{deadline.priority} priority</Badge>
                    <Badge className={`${getStatusColor(deadline.status)}`}>
                      <span className="flex items-center">
                        {getStatusIcon(deadline.status)}
                        <span className="ml-1 capitalize">{deadline.status.replace("_", " ")}</span>
                      </span>
                    </Badge>
                    {deadline.category && <Badge variant="outline">{deadline.category}</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Due Date */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Due Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(deadline.due_date), "EEEE, MMMM do, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {deadline.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{deadline.description}</p>
                  </div>
                </div>
              )}

              {/* Project Link */}
              {deadline.project_link && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Project Resources</h3>
                  <a
                    href={deadline.project_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">View Project</p>
                      <p className="text-sm text-blue-700 truncate max-w-md">{deadline.project_link}</p>
                    </div>
                  </a>
                </div>
              )}

              {/* Call to Action */}
              <div className="pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Want to manage your own deadlines like this?</p>
                  <Link href="/auth">
                    <Button className="bg-emerald-500 hover:bg-emerald-600">
                      <Target className="w-4 h-4 mr-2" />
                      Get Started with DeadlineMate
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Info */}
          {sharedDeadline.expires_at && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Link Expiration</p>
                  <p className="text-sm text-yellow-800">
                    This shared link will expire on {format(new Date(sharedDeadline.expires_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DeadlineMate</span>
            </div>
            <p className="text-gray-600 mb-4">
              Never miss a deadline again. Organize, track, and collaborate on your important tasks.
            </p>
            <Link href="/">
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: SharedDeadlinePageProps) {
  const supabase = createClient()

  const { data: sharedDeadline } = await supabase
    .from("shared_deadlines")
    .select(`
      deadlines (
        title,
        description,
        due_date
      )
    `)
    .eq("share_token", params.token)
    .eq("is_active", true)
    .single()

  if (!sharedDeadline?.deadlines) {
    return {
      title: "Shared Deadline - DeadlineMate",
      description: "View a shared deadline on DeadlineMate",
    }
  }

  const deadline = sharedDeadline.deadlines

  return {
    title: `${deadline.title} - Shared Deadline | DeadlineMate`,
    description:
      deadline.description || `Deadline: ${deadline.title} - Due ${format(new Date(deadline.due_date), "PPP")}`,
    openGraph: {
      title: deadline.title,
      description: deadline.description || `Due ${format(new Date(deadline.due_date), "PPP")}`,
      type: "website",
    },
  }
}
