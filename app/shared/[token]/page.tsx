import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  ExternalLink,
  Share2,
  AlertCircle,
  CheckCircle2,
  Timer,
  User,
  ArrowRight,
  Target,
  Database,
  Bug,
  Settings,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface PageProps {
  params: {
    token: string
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = await createClient()

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
    console.error("Error generating metadata:", error)
    return {
      title: "Shared Deadline - DeadlineMate",
      description: "View shared deadline details on DeadlineMate",
    }
  }
}

export default async function SharedDeadlinePage({ params }: PageProps) {
  // Debug information
  const debugInfo = {
    token: params.token,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  console.log("🔍 SharedDeadlinePage Debug Info:", debugInfo)

  try {
    // Initialize Supabase client with proper error handling
    console.log("🔧 Initializing Supabase client...")
    const supabase = await createClient()

    // Verify the client is properly initialized
    if (!supabase) {
      throw new Error("Supabase client is null or undefined")
    }

    if (typeof supabase.from !== "function") {
      throw new Error("Supabase client is missing 'from' method - client initialization failed")
    }

    console.log("✅ Supabase client initialized successfully")

    // Step 1: Check if this is a demo/preview environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log("🎭 Demo mode detected - showing demo content")

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">DeadlineMate</h1>
                    <p className="text-sm text-gray-600">Shared Deadline (Demo)</p>
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

          {/* Demo Content */}
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Demo Deadline Card */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Sample Project Deadline</CardTitle>
                        <div className="flex items-center space-x-3 mb-4 flex-wrap">
                          <Badge className="bg-red-100 text-red-800 border-red-200 border">high priority</Badge>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">in progress</Badge>
                          <Badge variant="outline" className="bg-gray-50">
                            Development
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Due Date Section */}
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "EEEE, MMMM do, yyyy")}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              5:00 PM
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-blue-600">
                            <Timer className="w-5 h-5 mr-2" />
                            <div className="text-right">
                              <p className="font-medium">7 days left</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        This is a sample deadline created for demonstration purposes. It shows how shared deadlines work
                        in DeadlineMate, including all the features like priority levels, status tracking, and project
                        links.
                      </p>
                    </div>

                    {/* Project Link */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Project Resources</h3>
                      <a
                        href="https://github.com/example/project"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Project
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Demo Notice */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center text-yellow-900">
                      <Settings className="w-5 h-5 mr-2" />
                      Demo Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-yellow-800">
                      This is a demonstration of how shared deadlines work. To enable full functionality, configure your
                      Supabase database.
                    </p>
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-xs text-yellow-900 font-medium mb-1">Setup Required:</p>
                      <p className="text-xs text-yellow-800">Token: {params.token}</p>
                    </div>
                  </CardContent>
                </Card>

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
                      <span className="text-blue-900 font-medium">{format(new Date(), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Views:</span>
                      <span className="text-blue-900 font-medium">Demo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Expires:</span>
                      <span className="text-blue-900 font-medium">Never</span>
                    </div>
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
    }

    // Step 2: Check if the shared_deadlines table exists
    console.log("📋 Step 1: Checking if shared_deadlines table exists...")

    let tableCheck
    let tableError

    try {
      const result = await supabase.from("shared_deadlines").select("id").limit(1)
      tableCheck = result.data
      tableError = result.error
    } catch (err) {
      console.error("❌ Table check failed with exception:", err)
      tableError = err as any
    }

    // Handle client initialization errors
    if (tableError?.code === "CLIENT_INIT_ERROR") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Configuration Required</CardTitle>
              <CardDescription className="text-red-700">Supabase client initialization failed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                  <li>Check your Supabase environment variables</li>
                  <li>Ensure NEXT_PUBLIC_SUPABASE_URL is set</li>
                  <li>Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set</li>
                  <li>Restart your development server</li>
                </ol>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Token:</strong> {params.token}
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Has URL:</strong> {debugInfo.hasSupabaseUrl ? "Yes" : "No"}
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Has Key:</strong> {debugInfo.hasSupabaseKey ? "Yes" : "No"}
                </p>
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

    if (tableError) {
      console.error("❌ Table check failed:", tableError)

      // If table doesn't exist, show a helpful error page
      if (
        tableError.message?.includes("does not exist") ||
        tableError.message?.includes("relation") ||
        tableError.code === "42P01"
      ) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Database Setup Required</CardTitle>
                <CardDescription className="text-red-700">The sharing feature hasn't been set up yet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Setup Instructions:</h4>
                  <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                    <li>Go to your Supabase dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Run the setup-shared-deadlines-supabase.sql script</li>
                    <li>Try accessing the shared link again</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Token:</strong> {params.token}
                  </p>
                  <p className="text-sm text-yellow-800">
                    <strong>Error:</strong> {tableError.message}
                  </p>
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

      // For other errors, show generic error
      throw tableError
    }

    console.log("✅ Table exists, found", tableCheck?.length || 0, "records")

    // Step 3: Look for the specific shared deadline
    console.log("🔍 Step 2: Looking for shared deadline with token:", params.token)

    let sharedDeadline
    let queryError

    try {
      const result = await supabase
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
        .eq("share_token", params.token)
        .eq("is_active", true)
        .single()

      sharedDeadline = result.data
      queryError = result.error
    } catch (err) {
      console.error("❌ Query failed with exception:", err)
      queryError = err as any
    }

    console.log("📊 Query result:", {
      found: !!sharedDeadline,
      error: queryError?.message,
      hasDeadline: !!sharedDeadline?.deadlines,
    })

    if (queryError) {
      console.error("❌ Query error:", queryError)

      // Check if it's a permission error
      if (
        queryError.message?.includes("permission") ||
        queryError.message?.includes("policy") ||
        queryError.code === "42501"
      ) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bug className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-900">Permission Issue</CardTitle>
                <CardDescription className="text-yellow-700">There's a database permission problem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Debug Info:</h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p>
                      <strong>Token:</strong> {params.token}
                    </p>
                    <p>
                      <strong>Error:</strong> {queryError.message}
                    </p>
                    <p>
                      <strong>Code:</strong> {queryError.code}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date().toLocaleString()}
                    </p>
                  </div>
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

      // For "not found" errors, show the not found page
      if (queryError.code === "PGRST116") {
        console.log("❌ No shared deadline found for token:", params.token)
        notFound()
      }

      // For other errors, throw to be caught by the outer try-catch
      throw queryError
    }

    if (!sharedDeadline) {
      console.log("❌ No shared deadline found for token:", params.token)
      notFound()
    }

    // Step 4: Check if expired
    if (sharedDeadline.expires_at && new Date(sharedDeadline.expires_at) < new Date()) {
      console.log("⏰ Shared deadline has expired:", sharedDeadline.expires_at)
      notFound()
    }

    // Step 5: Check if we have deadline data
    const deadline = sharedDeadline.deadlines
    if (!deadline) {
      console.log("❌ No deadline data found for shared deadline")
      notFound()
    }

    console.log("✅ Successfully found deadline:", deadline.title)

    // Step 6: Increment view count (don't await to avoid blocking the page)
    supabase
      .from("shared_deadlines")
      .update({ view_count: (sharedDeadline.view_count || 0) + 1 })
      .eq("id", sharedDeadline.id)
      .then(({ error }) => {
        if (error) {
          console.error("⚠️ Error updating view count:", error)
        } else {
          console.log("📈 View count updated successfully")
        }
      })

    // Calculate deadline status
    const dueDate = new Date(deadline.due_date)
    const now = new Date()
    const isOverdue = dueDate < now && deadline.status !== "completed"
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
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">DeadlineMate</h1>
                  <p className="text-sm text-gray-600">Shared Deadline</p>
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
                      <div className="flex items-center space-x-3 mb-4 flex-wrap">
                        <Badge className={`${getPriorityColor(deadline.priority)} border`}>
                          {deadline.priority} priority
                        </Badge>
                        <Badge className={`${getStatusColor(isOverdue ? "overdue" : deadline.status)} border`}>
                          {isOverdue ? "overdue" : deadline.status.replace("_", " ")}
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
                                    : daysUntilDue > 0
                                      ? `${daysUntilDue} days left`
                                      : "Past due"}
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
    console.error("💥 Unexpected error in SharedDeadlinePage:", error)

    // Show a helpful error page for unexpected errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Something went wrong</CardTitle>
            <CardDescription className="text-red-700">
              An unexpected error occurred while loading this shared deadline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
              <div className="text-sm text-red-800 space-y-1">
                <p>
                  <strong>Token:</strong> {params.token}
                </p>
                <p>
                  <strong>Error:</strong> {error instanceof Error ? error.message : "Unknown error"}
                </p>
                <p>
                  <strong>Time:</strong> {new Date().toLocaleString()}
                </p>
              </div>
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
}
