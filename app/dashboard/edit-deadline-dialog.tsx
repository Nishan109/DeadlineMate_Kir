"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CheckCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import { format } from "date-fns"

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

interface EditDeadlineDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (deadline: Deadline) => void
  onRefresh: () => Promise<void>
  deadline: Deadline | null
  isDemoMode?: boolean
}

export default function EditDeadlineDialog({
  isOpen,
  onClose,
  onUpdate,
  onRefresh,
  deadline,
  isDemoMode = false,
}: EditDeadlineDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "pending" as "pending" | "in_progress" | "completed" | "overdue",
    category: "",
  })

  // Populate form when deadline changes
  useEffect(() => {
    if (deadline) {
      const dueDate = new Date(deadline.due_date)
      setFormData({
        title: deadline.title,
        description: deadline.description || "",
        due_date: format(dueDate, "yyyy-MM-dd"),
        due_time: format(dueDate, "HH:mm"),
        priority: deadline.priority,
        status: deadline.status,
        category: deadline.category || "",
      })
    }
  }, [deadline])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!deadline) return

    setIsLoading(true)

    try {
      // Combine date and time
      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time || "23:59"}`)

      const updatedDeadline: Deadline = {
        ...deadline,
        title: formData.title,
        description: formData.description || undefined,
        due_date: dueDateTime.toISOString(),
        priority: formData.priority,
        status: formData.status,
        category: formData.category || undefined,
        updated_at: new Date().toISOString(),
      }

      if (isDemoMode) {
        // In demo mode, just update locally
        onUpdate(updatedDeadline)
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

        const { data, error } = await supabase
          .from("deadlines")
          .update({
            title: formData.title,
            description: formData.description || null,
            due_date: dueDateTime.toISOString(),
            priority: formData.priority,
            status: formData.status,
            category: formData.category || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", deadline.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating deadline:", error)
          alert("Failed to update deadline. Please try again.")
          return
        }

        onUpdate(data)
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
      alert("Failed to update deadline. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    if (!isLoading && !isRefreshing) {
      setShowSuccess(false)
      onClose()
    }
  }

  if (!deadline) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => (isLoading || isRefreshing) && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Deadline</DialogTitle>
          <DialogDescription>
            Update your deadline information.
            {isDemoMode && " (Demo mode - changes won't be saved)"}
          </DialogDescription>
        </DialogHeader>

        {showSuccess && (
          <div className="flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="text-emerald-800 font-medium">
              {isRefreshing ? "Refreshing dashboard..." : "Deadline updated successfully!"}
            </span>
            {isRefreshing && <LoadingSpinner size="sm" className="ml-2" />}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="Enter deadline title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              disabled={isLoading || isRefreshing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Add details about this deadline"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              disabled={isLoading || isRefreshing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="edit-due_date"
                  type="date"
                  className="pl-10"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                  required
                  disabled={isLoading || isRefreshing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-due_time">Due Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="edit-due_time"
                  type="time"
                  className="pl-10"
                  value={formData.due_time}
                  onChange={(e) => handleInputChange("due_time", e.target.value)}
                  disabled={isLoading || isRefreshing}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
                disabled={isLoading || isRefreshing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={isLoading || isRefreshing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              placeholder="e.g., Work, School, Personal"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              disabled={isLoading || isRefreshing}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading || isRefreshing}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={isLoading || isRefreshing || showSuccess}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Updated!
                </>
              ) : (
                "Update Deadline"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
