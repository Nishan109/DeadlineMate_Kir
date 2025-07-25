// Service Worker for push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "deadlinemate-notification",
      data: data.data || {},
      actions: [
        {
          action: "view",
          title: "View Deadline",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "view") {
    // Open the app to the specific deadline
    event.waitUntil(clients.openWindow("/dashboard"))
  } else if (event.action === "dismiss") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/dashboard"))
  }
})

self.addEventListener("notificationclose", (event) => {
  // Track notification dismissal if needed
  console.log("Notification was closed", event)
})
