"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Share2,
  Copy,
  CheckCircle,
  ExternalLink,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

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

interface ShareDeadlineDialogProps {
  isOpen: boolean
  onClose: () => void
  deadline: Deadline | null
  isDemoMode?: boolean
}

// Fallback function for generating random tokens
function generateRandomToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Safe token generation with fallback
function generateShareToken(): string {
  try {
    // Try to use crypto.randomUUID if available
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "").substring(0, 16)
    }
    // Fallback to Math.random based generation
    return generateRandomToken()
  } catch (error) {
    console.warn("Failed to generate crypto UUID, using fallback:", error)
    return generateRandomToken()
  }
}

export default function ShareDeadlineDialog({
  isOpen,
  onClose,
  deadline,
  isDemoMode = false,
}: ShareDeadlineDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [expirationDays, setExpirationDays] = useState("7")
  const [includeDescription, setIncludeDescription] = useState(true)
  const [includeProjectLink, setIncludeProjectLink] = useState(true)
  const [shareGenerated, setShareGenerated] = useState(false)

  const resetState = () => {
    setIsLoading(false)
    setShareUrl("")
    setCopied(false)
    setExpirationDays("7")
    setIncludeDescription(true)
    setIncludeProjectLink(!!deadline?.project_link)
    setShareGenerated(false)
  }

  useEffect(() => {
    if (isOpen) {
      resetState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deadline?.id])

  const generateShareLink = async () => {
    if (!deadline) return

    setIsLoading(true)

    try {
      if (isDemoMode) {
        // In demo mode, generate a mock share URL
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay
        const mockToken = generateShareToken()
        const mockUrl = `${window.location.origin}/shared/${mockToken}`
        setShareUrl(mockUrl)
        setShareGenerated(true)
        toast({
          title: "Share link generated!",
          description: "Your deadline share link is ready to use. (Demo mode - link won't be functional)",
        })
      } else {
        console.log("🔄 Starting share link generation process...")

        // Initialize Supabase client
        const supabase = createClient()

        if (!supabase) {
          throw new Error("Failed to initialize Supabase client")
        }

        console.log("✅ Supabase client initialized")

        // First, verify the user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error("❌ Authentication failed:", authError)
          toast({
            title: "Authentication required",
            description: "Please log in to share deadlines.",
            variant: "destructive",
          })
          return
        }

        console.log("✅ User authenticated:", user.id)
        console.log("📋 Creating share for deadline:", deadline.id)

        // Check if the shared_deadlines table exists by trying to query it
        const { error: tableCheckError } = await supabase.from("shared_deadlines").select("id").limit(1)

        if (
          tableCheckError &&
          (tableCheckError.message?.includes("does not exist") || tableCheckError.code === "42P01")
        ) {
          console.error("❌ Table doesn't exist:", tableCheckError)
          toast({
            title: "Feature not available",
            description: "The sharing feature is not yet set up. Please run the database migration first.",
            variant: "destructive",
          })
          return
        }

        console.log("✅ Table exists, proceeding with share creation")

        // Generate expiration date
        const expiresAt =
          expirationDays === "never"
            ? null
            : new Date(Date.now() + Number.parseInt(expirationDays) * 24 * 60 * 60 * 1000)

        // Generate a secure token
        const shareToken = generateShareToken()

        console.log("🔑 Generated share token:", shareToken)
        console.log("⏰ Expiration:", expiresAt?.toISOString() || "Never")

        // Create shared deadline record with explicit user ID
        const { data, error } = await supabase
          .from("shared_deadlines")
          .insert({
            deadline_id: deadline.id,
            share_token: shareToken,
            expires_at: expiresAt?.toISOString(),
            is_active: true,
            created_by: user.id, // Explicitly set the user ID
          })
          .select()
          .single()

        console.log("📊 Insert result:", { success: !!data, error: error?.message })

        if (error) {
          console.error("❌ Error creating share link:", error)

          // Provide more specific error messages
          if (
            error.message?.includes("row-level security") ||
            error.message?.includes("policy") ||
            error.code === "42501"
          ) {
            toast({
              title: "Permission denied",
              description: "You can only share your own deadlines. Make sure you're the owner of this deadline.",
              variant: "destructive",
            })
          } else if (error.message?.includes("foreign key") || error.code === "23503") {
            toast({
              title: "Invalid deadline",
              description: "The deadline you're trying to share doesn't exist or has been deleted.",
              variant: "destructive",
            })
          } else if (error.message?.includes("does not exist") || error.code === "42P01") {
            toast({
              title: "Database not ready",
              description: "Please run the database migration script first.",
              variant: "destructive",
            })
          } else if (
            error.message?.includes("duplicate key") ||
            error.message?.includes("unique") ||
            error.code === "23505"
          ) {
            // If token collision (very rare), try again with a new token
            console.log("🔄 Token collision detected, retrying...")
            setTimeout(() => generateShareLink(), 100)
            return
          } else {
            toast({
              title: "Failed to create share link",
              description: error.message || "Please try again later.",
              variant: "destructive",
            })
          }
          return
        }

        if (!data) {
          console.error("❌ No data returned from insert")
          toast({
            title: "Failed to create share link",
            description: "No data was returned. Please try again.",
            variant: "destructive",
          })
          return
        }

        const shareUrl = `${window.location.origin}/shared/${data.share_token}`
        console.log("✅ Generated share URL:", shareUrl)

        setShareUrl(shareUrl)
        setShareGenerated(true)
        toast({
          title: "Share link generated!",
          description: "Your deadline share link is ready to use.",
        })
      }
    } catch (error) {
      console.error("💥 Unexpected error:", error)
      toast({
        title: "Failed to create share link",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Deadline Shared: ${deadline?.title}`)
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share this deadline with you:\n\n${deadline?.title}\nDue: ${deadline ? format(new Date(deadline.due_date), "PPP 'at' p") : ""}\n\nView details: ${shareUrl}\n\nBest regards`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `📅 *Deadline Shared*\n\n*${deadline?.title}*\nDue: ${deadline ? format(new Date(deadline.due_date), "PPP 'at' p") : ""}\n\nView details: ${shareUrl}`,
    )
    window.open(`https://wa.me/?text=${message}`)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!deadline) return null

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          resetState()
        }
      }}
    >
      <DialogContent key={deadline?.id || "new"} className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <Share2 className="w-5 h-5 mr-2" />
            Share Deadline
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Create a shareable link for your deadline that colleagues can view.
            {isDemoMode && " (Demo mode - link won't be functional)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deadline Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 truncate">{deadline.title}</h3>
              <Badge className={`text-xs ${getPriorityColor(deadline.priority)}`}>{deadline.priority}</Badge>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(deadline.due_date), "PPP")}
              <Clock className="w-4 h-4 ml-3 mr-1" />
              {format(new Date(deadline.due_date), "p")}
            </div>

            {deadline.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deadline.description}</p>}

            {deadline.category && (
              <Badge variant="outline" className="text-xs">
                {deadline.category}
              </Badge>
            )}
          </div>

          {!shareGenerated ? (
            <>
              {/* Share Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiration" className="text-sm font-medium">
                    Link Expiration
                  </Label>
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Include in shared view:</Label>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm">Description</span>
                      <span className="text-xs text-gray-500">Share deadline details</span>
                    </div>
                    <Switch checked={includeDescription} onCheckedChange={setIncludeDescription} />
                  </div>

                  {deadline.project_link && (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm">Project Link</span>
                        <span className="text-xs text-gray-500">Share project resources</span>
                      </div>
                      <Switch checked={includeProjectLink} onCheckedChange={setIncludeProjectLink} />
                    </div>
                  )}
                </div>

                {expirationDays === "never" && (
                  <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Security Notice:</strong> Links that never expire can be accessed indefinitely. Consider
                      setting an expiration date for better security.
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={generateShareLink}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating Link...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Generated Share Link */}
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                  <span className="text-emerald-800 font-medium text-sm">Share link generated successfully!</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Share Link</Label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="flex-1 bg-gray-50 text-sm" />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 bg-transparent"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  {copied && <p className="text-xs text-green-600">Link copied to clipboard!</p>}
                </div>

                {/* Quick Share Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Share</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={shareViaEmail}
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center bg-transparent"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      onClick={shareViaWhatsApp}
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center bg-transparent"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                {/* Link Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <ExternalLink className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Link Details:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Expires: {expirationDays === "never" ? "Never" : `${expirationDays} day(s)`}</li>
                        <li>• Includes description: {includeDescription ? "Yes" : "No"}</li>
                        {deadline.project_link && <li>• Includes project link: {includeProjectLink ? "Yes" : "No"}</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto bg-transparent">
            {shareGenerated ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
