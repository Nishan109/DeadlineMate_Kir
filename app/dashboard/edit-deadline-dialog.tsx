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
import { Calendar, Clock, CheckCircle, LinkIcon } from "lucide-react"
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
  project_link?: string
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
    project_link: "",
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
        project_link: deadline.project_link || "",
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
        project_link: formData.project_link || undefined,
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
            project_link: formData.project_link || null,
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
        className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => (isLoading || isRefreshing) && e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Edit Deadline</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Update your deadline information.
            {isDemoMode && " (Demo mode - changes won't be saved)"}
          </DialogDescription>
        </DialogHeader>

        {showSuccess && (
          <div className="flex items-center justify-center p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
            <span className="text-emerald-800 font-medium text-sm">
              {isRefreshing ? "Refreshing dashboard..." : "Deadline updated successfully!"}
            </span>
            {isRefreshing && <LoadingSpinner size="sm" className="ml-2" />}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="edit-title"
                placeholder="Enter deadline title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={isLoading || isRefreshing}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Add details about this deadline"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
                disabled={isLoading || isRefreshing}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project_link" className="text-sm font-medium">
                Project Link
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="edit-project_link"
                  type="url"
                  className="pl-10 w-full"
                  placeholder="https://github.com/user/project"
                  value={formData.project_link}
                  onChange={(e) => handleInputChange("project_link", e.target.value)}
                  disabled={isLoading || isRefreshing}
                />
              </div>
              <p className="text-xs text-gray-500">
                Add a link to your project repository, design files, or related resources
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date" className="text-sm font-medium">
                  Due Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="edit-due_date"
                    type="date"
                    className="pl-10 w-full"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                    required
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-due_time" className="text-sm font-medium">
                  Due Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="edit-due_time"
                    type="time"
                    className="pl-10 w-full"
                    value={formData.due_time}
                    onChange={(e) => handleInputChange("due_time", e.target.value)}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                  disabled={isLoading || isRefreshing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  disabled={isLoading || isRefreshing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-medium">
                Category
              </Label>
              <Input
                id="edit-category"
                placeholder="e.g., Work, School, Personal"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                disabled={isLoading || isRefreshing}
                className="w-full"
              />
            </div>
          </form>
        </div>

        <DialogFooter className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isRefreshing}
              className="w-full sm:w-auto bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
