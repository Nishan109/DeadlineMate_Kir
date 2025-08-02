"use client"

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
import { AlertTriangle } from "lucide-react"
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

interface DeleteNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (noteId: string) => void
  onRefresh: () => Promise<void>
  note: Note | null
  isDemoMode?: boolean
}

export default function DeleteNoteDialog({
  isOpen,
  onClose,
  onDelete,
  onRefresh,
  note,
  isDemoMode = false,
}: DeleteNoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!note) return

    setIsLoading(true)

    try {
      if (isDemoMode) {
        // Demo mode: just delete locally
        onDelete(note.id)
        onClose()
        return
      }

      // Real mode: delete from database
      const supabase = createClient()
      const { error } = await supabase.from("notes").delete().eq("id", note.id)

      if (error) {
        console.error("Error deleting note:", error)
        return
      }

      onDelete(note.id)
      await onRefresh()
      onClose()
    } catch (error) {
      console.error("Error deleting note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!note) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Note</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>"{note.title}"</strong>? This will permanently remove the note and
            all its content.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
