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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  color: string
  is_pinned: boolean
  deadline_id?: string
  created_at: string
  updated_at: string
}

interface Deadline {
  id: string
  title: string
}

interface AddNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (note: Note) => void
  onRefresh: () => Promise<void>
  deadlines: Deadline[]
  userId: string
  isDemoMode?: boolean
}

const colorOptions = [
  { value: "yellow", label: "Yellow", class: "bg-yellow-100 border-yellow-300" },
  { value: "blue", label: "Blue", class: "bg-blue-100 border-blue-300" },
  { value: "green", label: "Green", class: "bg-green-100 border-green-300" },
  { value: "pink", label: "Pink", class: "bg-pink-100 border-pink-300" },
  { value: "purple", label: "Purple", class: "bg-purple-100 border-purple-300" },
  { value: "orange", label: "Orange", class: "bg-orange-100 border-orange-300" },
]

export default function AddNoteDialog({
  isOpen,
  onClose,
  onAdd,
  onRefresh,
  deadlines,
  userId,
  isDemoMode = false,
}: AddNoteDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [color, setColor] = useState("yellow")
  const [isPinned, setIsPinned] = useState(false)
  const [deadlineId, setDeadlineId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const resetForm = () => {
    setTitle("")
    setContent("")
    setTags([])
    setNewTag("")
    setColor("yellow")
    setIsPinned(false)
    setDeadlineId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)

    try {
      if (isDemoMode) {
        // Demo mode: create mock note
        const mockNote: Note = {
          id: `note-${Date.now()}`,
          title: title.trim(),
          content: content.trim(),
          tags,
          color,
          is_pinned: isPinned,
          deadline_id: deadlineId || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        onAdd(mockNote)
        resetForm()
        onClose()
        return
      }

      // Real mode: save to database
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title: title.trim(),
          content: content.trim(),
          tags,
          color,
          is_pinned: isPinned,
          deadline_id: deadlineId || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating note:", error)
        return
      }

      onAdd(data)
      await onRefresh()
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error creating note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Note</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Create a new note to organize your thoughts and ideas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm sm:text-base">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm sm:text-base">
              Content
            </Label>
            <Textarea
              id="content"
              placeholder="Write your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Tags</Label>
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-2 h-2 sm:w-3 sm:h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm sm:text-base h-8 sm:h-9"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 px-2 sm:px-3 bg-transparent"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded border ${option.class}`} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Link to Deadline</Label>
              <Select value={deadlineId} onValueChange={setDeadlineId}>
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Select deadline..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deadline</SelectItem>
                  {deadlines.map((deadline) => (
                    <SelectItem key={deadline.id} value={deadline.id}>
                      <span className="text-sm">{deadline.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
            <Label htmlFor="pinned" className="text-sm sm:text-base">
              Pin this note
            </Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto text-sm sm:text-base bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Note"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
