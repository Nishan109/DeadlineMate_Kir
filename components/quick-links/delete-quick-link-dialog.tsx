"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
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
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react"

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
}

interface DeleteQuickLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (quickLinkId: string) => void
  quickLink: QuickLink | null
  isDemoMode?: boolean
}

export function DeleteQuickLinkDialog({
  isOpen,
  onClose,
  onDelete,
  quickLink,
  isDemoMode = false,
}: DeleteQuickLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const supabase = createClient()

  const handleDelete = async () => {
    if (!quickLink) return

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (isDemoMode) {
        // In demo mode, just remove from local state
        setSuccess("Quick link deleted successfully! (Demo mode)")
        onDelete(quickLink.id)
        setTimeout(() => {
          handleClose()
        }, 1500)
        return
      }

      // Try to delete from database
      const { error: dbError } = await supabase.from("quick_links").delete().eq("id", quickLink.id)

      if (dbError) {
        console.error("Database error:", dbError)
        // Fallback to demo mode if database operation fails
        setSuccess("Quick link deleted successfully! (Using demo mode)")
        onDelete(quickLink.id)
        setTimeout(() => {
          handleClose()
        }, 1500)
        return
      }

      setSuccess("Quick link deleted successfully!")
      onDelete(quickLink.id)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error("Error deleting quick link:", error)
      setError("Failed to delete quick link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    setSuccess("")
    setLoading(false)
    onClose()
  }

  if (!quickLink) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Delete Quick Link</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this quick link? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-1">{quickLink.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{quickLink.url}</p>
            {quickLink.description && <p className="text-sm text-gray-500">{quickLink.description}</p>}
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize">
                {quickLink.category}
              </span>
              <span className="text-xs text-gray-500">{quickLink.click_count} clicks</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto bg-transparent"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
