"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, BellRing, Check, Settings, Trash2, Calendar, Clock, AlertTriangle, Info, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Notification {
  id: string
  title: string
  message: string
  type: "deadline_today" | "deadline_overdue" | "deadline_upcoming" | "general"
  is_read: boolean
  created_at: string
  deadline_id?: string
  user_id: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  deadline_reminders: boolean
  reminder_hours: number
}

interface NotificationSystemProps {
  userId: string
  isDemoMode?: boolean
}

export function NotificationSystem({ userId, isDemoMode = false }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    deadline_reminders: true,
    reminder_hours: 24,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default")

  // Demo notifications for demo mode
  const demoNotifications: Notification[] = [
    {
      id: "demo-1",
      title: "Deadline Today",
      message: "Your project proposal is due today at 5:00 PM",
      type: "deadline_today",
      is_read: false,
      created_at: new Date().toISOString(),
      deadline_id: "demo-deadline-1",
      user_id: userId,
    },
    {
      id: "demo-2",
      title: "Upcoming Deadline",
      message: "Math assignment due in 2 days",
      type: "deadline_upcoming",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      deadline_id: "demo-deadline-2",
      user_id: userId,
    },
    {
      id: "demo-3",
      title: "Overdue Reminder",
      message: "Book report was due yesterday",
      type: "deadline_overdue",
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      deadline_id: "demo-deadline-3",
      user_id: userId,
    },
  ]

  // Check push notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (isDemoMode) {
      setNotifications(demoNotifications)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error loading notifications:", error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, isDemoMode])

  // Load settings
  const loadSettings = useCallback(async () => {
    if (isDemoMode) {
      // Load from localStorage in demo mode
      const stored = localStorage.getItem("notification-settings")
      if (stored) {
        try {
          setSettings(JSON.parse(stored))
        } catch (error) {
          console.error("Error parsing stored settings:", error)
        }
      }
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading settings:", error)
        return
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? false,
          deadline_reminders: data.deadline_reminders ?? true,
          reminder_hours: data.reminder_hours ?? 24,
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }, [userId, isDemoMode])

  // Initial load
  useEffect(() => {
    loadNotifications()
    loadSettings()
  }, [loadNotifications, loadSettings])

  // Auto-refresh notifications
  useEffect(() => {
    if (isDemoMode) return

    const interval = setInterval(loadNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [loadNotifications, isDemoMode])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))

    if (isDemoMode) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      if (error) {
        console.error("Error marking notification as read:", error)
        // Revert optimistic update
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n)))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    if (isDemoMode) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        // Revert optimistic update
        loadNotifications()
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    // Optimistically update UI
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    if (isDemoMode) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) {
        console.error("Error deleting notification:", error)
        // Revert optimistic update
        loadNotifications()
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  // Clear all notifications
  const clearAllNotifications = async () => {
    const currentNotifications = [...notifications]

    // Optimistically update UI
    setNotifications([])

    if (isDemoMode) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

      if (error) {
        console.error("Error clearing all notifications:", error)
        // Revert optimistic update
        setNotifications(currentNotifications)
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  // Update settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    if (isDemoMode) {
      localStorage.setItem("notification-settings", JSON.stringify(updatedSettings))
      return
    }

    try {
      const supabase = createClient()

      // First try to update existing settings
      const { data: existingData, error: selectError } = await supabase
        .from("notification_settings")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Error checking existing settings:", selectError)
        return
      }

      let error
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("notification_settings")
          .update({
            email_notifications: updatedSettings.email_notifications,
            push_notifications: updatedSettings.push_notifications,
            deadline_reminders: updatedSettings.deadline_reminders,
            reminder_hours: updatedSettings.reminder_hours,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
        error = updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("notification_settings").insert({
          user_id: userId,
          email_notifications: updatedSettings.email_notifications,
          push_notifications: updatedSettings.push_notifications,
          deadline_reminders: updatedSettings.deadline_reminders,
          reminder_hours: updatedSettings.reminder_hours,
        })
        error = insertError
      }

      if (error) {
        console.error("Error updating settings:", error)
        // Revert optimistic update
        setSettings(settings)
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      // Revert optimistic update
      setSettings(settings)
    }
  }

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications")
      return
    }

    const permission = await Notification.requestPermission()
    setPushPermission(permission)

    if (permission === "granted") {
      updateSettings({ push_notifications: true })
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deadline_today":
        return <Calendar className="h-4 w-4 text-orange-500" />
      case "deadline_overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "deadline_upcoming":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2">
            {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 px-2 text-xs">
                  Mark all read
                </Button>
              )}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                    <DialogDescription>Configure how you want to receive notifications.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <div className="flex items-center space-x-2">
                        {pushPermission !== "granted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={requestPushPermission}
                            className="text-xs bg-transparent"
                          >
                            Enable
                          </Button>
                        )}
                        <Switch
                          id="push-notifications"
                          checked={settings.push_notifications && pushPermission === "granted"}
                          onCheckedChange={(checked) => updateSettings({ push_notifications: checked })}
                          disabled={pushPermission !== "granted"}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                      <Switch
                        id="deadline-reminders"
                        checked={settings.deadline_reminders}
                        onCheckedChange={(checked) => updateSettings({ deadline_reminders: checked })}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
              <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.is_read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearAllNotifications}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Notifications
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
