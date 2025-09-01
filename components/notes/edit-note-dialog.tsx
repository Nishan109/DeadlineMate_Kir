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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import { RichTextEditor } from "./rich-text-editor" // add rich text editor

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

interface EditNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (note: Note) => void
  onRefresh: () => Promise<void>
  note: Note | null
  deadlines: Deadline[]
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

export default function EditNoteDialog({
  isOpen,
  onClose,
  onUpdate,
  onRefresh,
  note,
  deadlines,
  isDemoMode = false,
}: EditNoteDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [color, setColor] = useState("yellow")
  const [isPinned, setIsPinned] = useState(false)
  const [deadlineId, setDeadlineId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [editorHtml, setEditorHtml] = useState<string>("") // cache HTML for editor surface

  // Populate form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags)
      setColor(note.color)
      setIsPinned(note.is_pinned)
      setDeadlineId(note.deadline_id || "")
      setEditorHtml(note.content || "") // seed editor with current content
    }
  }, [note])

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
    setEditorHtml("") // reset editor HTML
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !note) return

    setIsLoading(true)

    try {
      const updatedNote: Note = {
        ...note,
        title: title.trim(),
        content: content.trim(),
        tags,
        color,
        is_pinned: isPinned,
        deadline_id: deadlineId || undefined,
        updated_at: new Date().toISOString(),
      }

      if (isDemoMode) {
        // Demo mode: just update locally
        onUpdate(updatedNote)
        onClose()
        return
      }

      // Real mode: save to database
      const supabase = createClient()
      const { error } = await supabase
        .from("notes")
        .update({
          title: title.trim(),
          content: content.trim(),
          tags,
          color,
          is_pinned: isPinned,
          deadline_id: deadlineId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id)

      if (error) {
        console.error("Error updating note:", error)
        return
      }

      onUpdate(updatedNote)
      await onRefresh()
      onClose()
    } catch (error) {
      console.error("Error updating note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!note) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Note</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">Make changes to your note.</DialogDescription>
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
            <RichTextEditor
              value={editorHtml}
              onChange={(html, plain) => {
                setEditorHtml(html)
                setContent(plain)
              }}
              placeholder="Write your note content here..."
            />
            <p className="text-xs text-muted-foreground">Formatting is supported; we’ll save the text content.</p>
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
              <Select value={deadlineId || "none"} onValueChange={setDeadlineId}>
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
                  Updating...
                </>
              ) : (
                "Update Note"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
