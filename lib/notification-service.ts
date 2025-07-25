"use client"

interface NotificationServiceConfig {
  vapidPublicKey?: string
  serviceWorkerPath?: string
}

class NotificationService {
  private config: NotificationServiceConfig
  private registration: ServiceWorkerRegistration | null = null

  constructor(config: NotificationServiceConfig = {}) {
    this.config = {
      serviceWorkerPath: "/sw.js",
      ...config,
    }
  }

  // Initialize service worker and push notifications
  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications are not supported")
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register(this.config.serviceWorkerPath!)
      console.log("Service Worker registered successfully")

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return false
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications")
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.config.vapidPublicKey) {
      console.error("Service worker not registered or VAPID key missing")
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey),
      })

      return subscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return null
    }
  }

  // Show local notification
  showNotification(title: string, options: NotificationOptions = {}): void {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      })
    }
  }

  // Schedule notification (for deadline reminders)
  scheduleNotification(title: string, body: string, scheduledTime: Date): void {
    const now = new Date().getTime()
    const scheduledTimeMs = scheduledTime.getTime()
    const delay = scheduledTimeMs - now

    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, { body })
      }, delay)
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

export const notificationService = new NotificationService()
