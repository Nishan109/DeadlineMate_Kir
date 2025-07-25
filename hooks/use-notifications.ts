"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"

interface Notification {
  id: string
  type: "deadline_due" | "deadline_overdue" | "reminder" | "system"
  title: string
  message: string
  deadline_id?: string
  deadline_title?: string
  created_at: string
  read: boolean
  priority: "low" | "medium" | "high"
}

interface UseNotificationsProps {
  userId: string
  isDemoMode?: boolean
}

export function useNotifications({ userId, isDemoMode = false }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (isDemoMode) {
      setLoading(false)
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
        console.error("Error fetching notifications:", error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read).length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, isDemoMode])

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (isDemoMode) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId)
          .eq("user_id", userId)

        if (!error) {
          setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    },
    [userId, isDemoMode],
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (isDemoMode) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [userId, isDemoMode])

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (isDemoMode) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === notificationId)
          if (notification && !notification.read) {
            setUnreadCount((count) => Math.max(0, count - 1))
          }
          return prev.filter((n) => n.id !== notificationId)
        })
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", userId)

        if (!error) {
          setNotifications((prev) => {
            const notification = prev.find((n) => n.id === notificationId)
            if (notification && !notification.read) {
              setUnreadCount((count) => Math.max(0, count - 1))
            }
            return prev.filter((n) => n.id !== notificationId)
          })
        }
      } catch (error) {
        console.error("Error deleting notification:", error)
      }
    },
    [userId, isDemoMode],
  )

  // Create notification
  const createNotification = useCallback(
    async (notification: Omit<Notification, "id" | "created_at" | "read">) => {
      if (isDemoMode) {
        const newNotification: Notification = {
          ...notification,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          read: false,
        }
        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)
        return newNotification
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("notifications")
          .insert({
            ...notification,
            user_id: userId,
            read: false,
          })
          .select()
          .single()

        if (!error && data) {
          setNotifications((prev) => [data, ...prev])
          setUnreadCount((prev) => prev + 1)
          return data
        }
      } catch (error) {
        console.error("Error creating notification:", error)
      }
    },
    [userId, isDemoMode],
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  }
}
