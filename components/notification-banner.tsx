"use client"

import { useState, useEffect } from "react"
import { X, Calendar, AlertTriangle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface Deadline {
  id: string
  title: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  category?: string
}

interface NotificationBannerProps {
  deadlines: Deadline[]
  isDemoMode?: boolean
}

export function NotificationBanner({ deadlines = [], isDemoMode = false }: NotificationBannerProps) {
  const [dismissedToday, setDismissedToday] = useState<Set<string>>(new Set())

  // Load dismissed notifications from localStorage
  useEffect(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem(`dismissed-notifications-${today}`)
    if (stored) {
      try {
        setDismissedToday(new Set(JSON.parse(stored)))
      } catch (error) {
        console.error("Error parsing dismissed notifications:", error)
      }
    }
  }, [])

  // Save dismissed notifications to localStorage
  const saveDismissed = (dismissed: Set<string>) => {
    const today = new Date().toDateString()
    localStorage.setItem(`dismissed-notifications-${today}`, JSON.stringify(Array.from(dismissed)))
  }

  // Dismiss notification
  const dismissNotification = (deadlineId: string) => {
    const newDismissed = new Set(dismissedToday)
    newDismissed.add(deadlineId)
    setDismissedToday(newDismissed)
    saveDismissed(newDismissed)
  }

  // Filter deadlines to show notifications for
  const getNotificationDeadlines = () => {
    if (!Array.isArray(deadlines)) return []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return deadlines
      .filter((deadline) => {
        if (deadline.status === "completed") return false
        if (dismissedToday.has(deadline.id)) return false

        const dueDate = new Date(deadline.due_date)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

        // Show notifications for:
        // 1. Overdue deadlines
        // 2. Due today
        // 3. High priority due tomorrow
        return (
          dueDateOnly < today || // Overdue
          dueDateOnly.getTime() === today.getTime() || // Due today
          (deadline.priority === "high" && dueDateOnly.getTime() === tomorrow.getTime()) // High priority due tomorrow
        )
      })
      .sort((a, b) => {
        // Sort by due date, then by priority
        const dateA = new Date(a.due_date)
        const dateB = new Date(b.due_date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  const notificationDeadlines = getNotificationDeadlines()

  if (notificationDeadlines.length === 0) {
    return null
  }

  const getNotificationVariant = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    if (dueDateOnly < today) return "destructive" // Overdue
    if (dueDateOnly.getTime() === today.getTime()) return "default" // Due today
    return "default" // Due tomorrow (high priority)
  }

  const getNotificationIcon = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    if (dueDateOnly < today) return <AlertTriangle className="h-4 w-4" />
    if (dueDateOnly.getTime() === today.getTime()) return <Calendar className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const getNotificationMessage = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const timeString = dueDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

    if (dueDateOnly < today) {
      const daysOverdue = Math.floor((today.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24))
      return `"${deadline.title}" was due ${daysOverdue === 1 ? "yesterday" : `${daysOverdue} days ago`}`
    }
    if (dueDateOnly.getTime() === today.getTime()) {
      return `"${deadline.title}" is due today at ${timeString}`
    }
    return `High priority: "${deadline.title}" is due tomorrow at ${timeString}`
  }

  return (
    <div className="space-y-2">
      {notificationDeadlines.slice(0, 3).map((deadline) => (
        <Alert key={deadline.id} variant={getNotificationVariant(deadline)} className="relative">
          <div className="flex items-center space-x-2">
            {getNotificationIcon(deadline)}
            <AlertDescription className="flex-1">{getNotificationMessage(deadline)}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotification(deadline.id)}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
      {notificationDeadlines.length > 3 && (
        <Alert>
          <AlertDescription className="text-center text-sm text-gray-600">
            And {notificationDeadlines.length - 3} more deadline{notificationDeadlines.length - 3 !== 1 ? "s" : ""} need
            your attention
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
