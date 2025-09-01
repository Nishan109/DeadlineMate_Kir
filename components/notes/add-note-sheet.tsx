"use client"

import * as React from "react"
import { X, Plus, Tag, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "./rich-text-editor"
import { cn } from "@/lib/utils"

type Deadline = { id: string; title: string }
type NoteColor = "yellow" | "green" | "blue" | "red" | "gray" | "purple"

export type NoteDraft = {
  title: string
  contentHtml: string
  contentText: string
  tags: string[]
  color: NoteColor
  deadlineId: string | null
  pinned: boolean
}

type AddNoteSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: NoteDraft) => Promise<void> | void
  deadlines?: Deadline[]
  defaultColor?: NoteColor
}

export default function AddNoteSheet({
  open,
  onOpenChange,
  onSubmit,
  deadlines = [],
  defaultColor = "yellow",
}: AddNoteSheetProps) {
  const [title, setTitle] = React.useState("")
  const [contentHtml, setContentHtml] = React.useState("")
  const [contentText, setContentText] = React.useState("")
  const [tagInput, setTagInput] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [color, setColor] = React.useState<NoteColor>(defaultColor)
  const [deadlineId, setDeadlineId] = React.useState<string | null>(null)
  const [pinned, setPinned] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      // Reset when closing
      setTitle("")
      setContentHtml("")
      setContentText("")
      setTagInput("")
      setTags([])
      setColor(defaultColor)
      setDeadlineId(null)
      setPinned(false)
      setSubmitting(false)
    }
  }, [open, defaultColor])

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  const handleCreate = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        contentHtml,
        contentText,
        tags,
        color,
        deadlineId,
        pinned,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("fixed inset-0 z-50", open ? "block" : "hidden")}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-l-xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add New Note</h2>
            <p className="text-sm text-muted-foreground">Create a new note to organize your thoughts and ideas.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-24 pt-4">
          {/* Title */}
          <div className="mb-4 space-y-2">
            <Label htmlFor="note-title" className="text-sm">
              Title
            </Label>
            <Input
              id="note-title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="mb-6 space-y-2">
            <Label className="text-sm">Content</Label>
            <RichTextEditor
              value={contentHtml}
              onChange={(html, text) => {
                setContentHtml(html)
                setContentText(text)
              }}
              placeholder="Write your note content here..."
            />
          </div>

          {/* Tags */}
          <div className="mb-6 space-y-2">
            <Label className="text-sm">Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="secondary" className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
                  >
                    <Tag className="h-3 w-3" />
                    {t}
                    <button
                      className="rounded-full bg-muted-foreground/10 px-1 text-muted-foreground hover:bg-muted-foreground/20"
                      onClick={() => removeTag(t)}
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color + Link to Deadline */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Color</Label>
              <Select value={color} onValueChange={(v: NoteColor) => setColor(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Link to Deadline</Label>
              <Select value={deadlineId ?? "none"} onValueChange={(v) => setDeadlineId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No deadline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deadline</SelectItem>
                  {deadlines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pin */}
          <div className="mb-6 flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <Pin className="h-4 w-4" />
              </div>
              <div>
                <Label className="text-sm">Pin this note</Label>
                <p className="text-xs text-muted-foreground">Pinned notes will appear at the top of your list.</p>
              </div>
            </div>
            <Switch checked={pinned} onCheckedChange={setPinned} />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-4 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || submitting}>
            {submitting ? "Creating..." : "Create Note"}
          </Button>
        </div>
      </div>
    </div>
  )
}
