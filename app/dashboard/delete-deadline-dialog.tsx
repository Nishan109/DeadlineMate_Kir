"use client"

import type React from "react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Trash2, CheckCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
  created_at: string
  updated_at: string
}

interface DeleteDeadlineDialogProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (deadlineId: string) => void
  onRefresh: () => Promise<void>
  deadline: Deadline | null
  isDemoMode?: boolean
}

export default function DeleteDeadlineDialog({
  isOpen,
  onClose,
  onDelete,
  onRefresh,
  deadline,
  isDemoMode = false,
}: DeleteDeadlineDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!deadline) return

    setIsDeleting(true)

    try {
      if (isDemoMode) {
        // In demo mode, just delete locally
        onDelete(deadline.id)
        setShowSuccess(true)

        // Auto-refresh after success
        setTimeout(async () => {
          setIsRefreshing(true)
          await onRefresh()
          setIsRefreshing(false)
          setShowSuccess(false)
          onClose()
        }, 1500)
      } else {
        const supabase = createClient()

        const { error } = await supabase.from("deadlines").delete().eq("id", deadline.id)

        if (error) {
          console.error("Error deleting deadline:", error)
          alert("Failed to delete deadline. Please try again.")
          return
        }

        onDelete(deadline.id)
        setShowSuccess(true)

        // Auto-refresh after success
        setTimeout(async () => {
          setIsRefreshing(true)
          await onRefresh()
          setIsRefreshing(false)
          setShowSuccess(false)
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to delete deadline. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting && !isRefreshing) {
      setShowSuccess(false)
      onClose()
    }
  }

  if (!deadline) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => (isDeleting || isRefreshing) && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Deadline
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this deadline? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {showSuccess && (
          <div className="flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="text-emerald-800 font-medium">
              {isRefreshing ? "Refreshing dashboard..." : "Deadline deleted successfully!"}
            </span>
            {isRefreshing && <LoadingSpinner size="sm" className="ml-2" />}
          </div>
        )}

        {!showSuccess && (
          <>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>"{deadline.title}"</strong> will be permanently deleted.
                {isDemoMode && " (Demo mode - this is just a simulation)"}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Deadline Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Title:</strong> {deadline.title}
                </p>
                {deadline.description && (
                  <p>
                    <strong>Description:</strong> {deadline.description}
                  </p>
                )}
                <p>
                  <strong>Due Date:</strong> {new Date(deadline.due_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Priority:</strong> {deadline.priority}
                </p>
                <p>
                  <strong>Status:</strong> {deadline.status}
                </p>
                {deadline.category && (
                  <p>
                    <strong>Category:</strong> {deadline.category}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting || isRefreshing}>
            Cancel
          </Button>
          {!showSuccess && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || isRefreshing} type="button">
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Deadline
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
