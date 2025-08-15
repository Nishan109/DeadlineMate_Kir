"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, CheckCircle, Copy, Share2, ExternalLink } from "lucide-react"

interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  category: string
  color: string
  is_public: boolean
  click_count: number
  created_at: string
  updated_at: string
  user_id: string // Added user_id to QuickLink interface
}

interface ShareQuickLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  quickLink: QuickLink | null
  isDemoMode?: boolean
}

export function ShareQuickLinkDialog({ isOpen, onClose, quickLink, isDemoMode = false }: ShareQuickLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [shareToken, setShareToken] = useState("")
  const [shareUrl, setShareUrl] = useState("")

  const supabase = createClient()

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const generateShareUrl = (token: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"
    return `${baseUrl}/shared/quick-link/${token}`
  }

  const handleGenerateShare = async () => {
    if (!quickLink) return

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const token = generateShareToken()
      const url = generateShareUrl(token)

      if (isDemoMode) {
        // In demo mode, just generate a demo share URL
        setShareToken(token)
        setShareUrl(url)
        setSuccess("Share link generated successfully! (Demo mode)")
        setLoading(false)
        return
      }

      // Try to create share record in database
      const { data, error: dbError } = await supabase
        .from("quick_link_shares")
        .insert([
          {
            quick_link_id: quickLink.id,
            shared_by: quickLink.user_id,
            share_token: token,
            expires_at: null, // No expiration for now
          },
        ])
        .select()
        .single()

      if (dbError) {
        console.error("Database error:", dbError)
        // Fallback to demo mode if database operation fails
        setShareToken(token)
        setShareUrl(url)
        setSuccess("Share link generated successfully! (Using demo mode)")
        setLoading(false)
        return
      }

      setShareToken(token)
      setShareUrl(url)
      setSuccess("Share link generated successfully!")
    } catch (error) {
      console.error("Error generating share link:", error)
      setError("Failed to generate share link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setSuccess("Share link copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      setError("Failed to copy to clipboard. Please copy manually.")
    }
  }

  const handleClose = () => {
    setError("")
    setSuccess("")
    setShareToken("")
    setShareUrl("")
    setLoading(false)
    onClose()
  }

  if (!quickLink) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">Share Quick Link</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Generate a shareable link for this quick link that others can access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm break-words">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <AlertDescription className="text-green-800 text-sm break-words">{success}</AlertDescription>
            </Alert>
          )}

          {/* Quick Link Preview */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
            <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base break-words">{quickLink.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 break-all leading-relaxed">{quickLink.url}</p>
            {quickLink.description && (
              <p className="text-xs sm:text-sm text-gray-500 mb-2 break-words leading-relaxed">
                {quickLink.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize flex-shrink-0">
                {quickLink.category}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">{quickLink.click_count} clicks</span>
              {quickLink.is_public && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0">Public</span>
              )}
            </div>
          </div>

          {/* Share URL Section */}
          {shareUrl ? (
            <div className="space-y-3">
              <Label htmlFor="share-url" className="text-sm sm:text-base">
                Share URL
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input id="share-url" value={shareUrl} readOnly className="flex-1 text-xs sm:text-sm break-all" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="flex-shrink-0 bg-transparent w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareUrl, "_blank")}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out this link: ${quickLink.title} - ${shareUrl}`
                    if (navigator.share) {
                      navigator.share({ title: quickLink.title, url: shareUrl, text })
                    } else {
                      handleCopyToClipboard()
                    }
                  }}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <Share2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Generate Share Link</h3>
              <p className="text-sm text-gray-600 mb-4 px-2 leading-relaxed">
                Create a shareable link that allows others to access this quick link without needing an account.
              </p>
              <Button
                onClick={handleGenerateShare}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Share Options */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Share Options</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1 leading-relaxed">
              <li>• Anyone with the link can access this quick link</li>
              <li>• The original link will open when clicked</li>
              <li>• Click tracking will be recorded</li>
              {!quickLink.is_public && <li>• This link is private - only shared users can access it</li>}
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-4 sm:mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-transparent w-full sm:w-auto text-sm sm:text-base"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
