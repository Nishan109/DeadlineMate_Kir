"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pin, Edit, Trash2, MoreHorizontal, Calendar, Clock, LinkIcon, Tag, X } from "lucide-react"
import { format } from "date-fns"

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

interface ViewNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  deadlines: Deadline[]
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onTogglePin: (noteId: string) => void
}

// Get color classes for the header
const getHeaderColorClasses = (color: string) => {
  switch (color) {
    case "yellow":
      return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900"
    case "blue":
      return "bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900"
    case "green":
      return "bg-gradient-to-r from-green-400 to-green-500 text-green-900"
    case "pink":
      return "bg-gradient-to-r from-pink-400 to-pink-500 text-pink-900"
    case "purple":
      return "bg-gradient-to-r from-purple-400 to-purple-500 text-purple-900"
    case "orange":
      return "bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900"
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900"
  }
}

// Get background color classes for content
const getContentColorClasses = (color: string) => {
  switch (color) {
    case "yellow":
      return "bg-yellow-50/50"
    case "blue":
      return "bg-blue-50/50"
    case "green":
      return "bg-green-50/50"
    case "pink":
      return "bg-pink-50/50"
    case "purple":
      return "bg-purple-50/50"
    case "orange":
      return "bg-orange-50/50"
    default:
      return "bg-gray-50/50"
  }
}

export default function ViewNoteDialog({
  isOpen,
  onClose,
  note,
  deadlines,
  onEdit,
  onDelete,
  onTogglePin,
}: ViewNoteDialogProps) {
  if (!note) return null

  const linkedDeadline = deadlines.find((d) => d.id === note.deadline_id)
  const headerColorClasses = getHeaderColorClasses(note.color)
  const contentColorClasses = getContentColorClasses(note.color)

  const handleEdit = () => {
    onEdit(note)
    onClose()
  }

  const handleDelete = () => {
    onDelete(note)
    onClose()
  }

  const handleTogglePin = () => {
    onTogglePin(note.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Color-coded Header */}
        <div className={`${headerColorClasses} px-6 py-4 relative`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                {note.is_pinned && <Pin className="w-5 h-5 flex-shrink-0 mt-1" />}
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight break-words">
                  {note.title}
                </DialogTitle>
              </div>

              {/* Metadata in header */}
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {format(new Date(note.created_at), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated {format(new Date(note.updated_at), "MMM dd, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-current hover:bg-black/10">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleTogglePin}>
                    <Pin className="w-4 h-4 mr-2" />
                    {note.is_pinned ? "Unpin Note" : "Pin Note"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-current hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`${contentColorClasses} flex-1 overflow-hidden`}>
          <ScrollArea className="h-[60vh] px-6 py-4">
            {/* Tags Section */}
            {note.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Deadline Section */}
            {linkedDeadline && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Linked Deadline</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{linkedDeadline.title}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Note Content */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Content</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">{note.content}</div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer with quick actions */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {note.content.length} characters • {note.tags.length} tags
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
