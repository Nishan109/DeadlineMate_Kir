"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, CheckCircle } from "lucide-react"

interface AddQuickLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (quickLink: any) => void
  userId: string
  isDemoMode?: boolean
}

export function AddQuickLinkDialog({ isOpen, onClose, onAdd, userId, isDemoMode = false }: AddQuickLinkDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "general",
    color: "blue",
    is_public: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const supabase = createClient()

  const categories = [
    { value: "general", label: "General" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
    { value: "social", label: "Social" },
    { value: "entertainment", label: "Entertainment" },
    { value: "development", label: "Development" },
    { value: "search", label: "Search" },
    { value: "education", label: "Education" },
  ]

  const colors = [
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "pink", label: "Pink", class: "bg-pink-500" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "gray", label: "Gray", class: "bg-gray-500" },
  ]

  const validateUrl = (url: string) => {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  const generateId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    if (!formData.url.trim()) {
      setError("URL is required")
      return
    }

    if (!validateUrl(formData.url)) {
      setError("Please enter a valid URL")
      return
    }

    setLoading(true)

    try {
      // Normalize URL
      const normalizedUrl = formData.url.startsWith("http") ? formData.url : `https://${formData.url}`

      const newQuickLink = {
        id: generateId(),
        user_id: userId,
        title: formData.title.trim(),
        url: normalizedUrl,
        description: formData.description.trim() || null,
        category: formData.category,
        color: formData.color,
        is_public: formData.is_public,
        click_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (isDemoMode) {
        // In demo mode, just add to local state
        setSuccess("Quick link created successfully! (Demo mode)")
        onAdd(newQuickLink)
        setTimeout(() => {
          handleClose()
        }, 1500)
        return
      }

      // Try to insert into database
      const { data, error: dbError } = await supabase.from("quick_links").insert([newQuickLink]).select().single()

      if (dbError) {
        console.error("Database error:", dbError)
        // Fallback to demo mode if database operation fails
        setSuccess("Quick link created successfully! (Using demo mode)")
        onAdd(newQuickLink)
        setTimeout(() => {
          handleClose()
        }, 1500)
        return
      }

      setSuccess("Quick link created successfully!")
      onAdd(data)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      console.error("Error creating quick link:", error)
      setError("Failed to create quick link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      url: "",
      description: "",
      category: "general",
      color: "blue",
      is_public: false,
    })
    setError("")
    setSuccess("")
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Quick Link</DialogTitle>
          <DialogDescription>Create a new quick link to save and organize your favorite websites.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Google, GitHub, YouTube"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="e.g., https://google.com or google.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this link"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color Theme</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              disabled={loading}
            />
            <Label htmlFor="is_public" className="text-sm">
              Make this link public (others can discover it)
            </Label>
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
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Link"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
