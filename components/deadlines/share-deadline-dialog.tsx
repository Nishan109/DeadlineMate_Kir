"use client"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { useEffect, useState } from "react"

// ... existing code where component is defined ...

export function ShareDeadlineDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  deadlineId: string
  // ... existing props ...
}) {
  const { open, onOpenChange, deadlineId } = props

  // ... existing state declarations ...
  const [shareUrl, setShareUrl] = useState<string>("")
  const [shareId, setShareId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // Reset all transient state to avoid showing previous item data
    try {
      setShareUrl("")
      setShareId(null)
      setCopied(false)
      setSuccess(false)
      setLoading(false)
      setError(null)
      // If you fetch an existing share for this deadline, do it here:
      // void fetchExistingShareFor(deadlineId)
    } catch {
      // no-op; just make sure nothing crashes on reset
    }
  }, [open, deadlineId])

  return (
    // ... existing Dialog wrapper ...
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={deadlineId}>{/* ... existing dialog UI ... */}</DialogContent>
    </Dialog>
  )
}
