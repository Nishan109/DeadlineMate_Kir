"use client"

import { useState } from "react"
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

  const generateShareLink = async () => {
    if (!deadline) return

    setIsLoading(true)

    try {
      if (isDemoMode) {
        // In demo mode, generate a mock share URL
        const mockToken = Math.random().toString(36).substring(2, 15)
        const mockUrl = `${window.location.origin}/shared/${mockToken}`
        setShareUrl(mockUrl)
        setShareGenerated(true)
      } else {
        const supabase = createClient()

        // Generate expiration date
        const expiresAt =
          expirationDays === "never"
            ? null
            : new Date(Date.now() + Number.parseInt(expirationDays) * 24 * 60 * 60 * 1000)

        // Create shared deadline record
        const { data, error } = await supabase
          .from("shared_deadlines")
          .insert({
            deadline_id: deadline.id,
            share_token: crypto.randomUUID().replace(/-/g, "").substring(0, 16),
            expires_at: expiresAt?.toISOString(),
            is_active: true,
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating share link:", error)
          alert("Failed to create share link. Please try again.")
          return
        }

        const shareUrl = `${window.location.origin}/shared/${data.share_token}`
        setShareUrl(shareUrl)
        setShareGenerated(true)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create share link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
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
    setShareUrl("")
    setShareGenerated(false)
    setCopied(false)
    setExpirationDays("7")
    setIncludeDescription(true)
    setIncludeProjectLink(true)
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
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
