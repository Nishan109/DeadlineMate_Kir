"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Tag, Calendar, ArrowRight } from "lucide-react"

interface NextActivity {
  activity_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  start_time: string
  end_time: string
  day_of_week: number
  days_until: number
}

interface NextActivityCardProps {
  activity: NextActivity | null
  formatTime: (time: string) => string
  getColorClass: (color: string) => string
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function NextActivityCard({ activity, formatTime, getColorClass }: NextActivityCardProps) {
  const [timeUntil, setTimeUntil] = useState<string>("")

  useEffect(() => {
    if (!activity) return

    const updateTimeUntil = () => {
      const now = new Date()
      const [startHours, startMinutes] = activity.start_time.split(":").map(Number)

      const startTime = new Date()
      startTime.setHours(startHours, startMinutes, 0, 0)

      // If it's for a future day, add the days
      if (activity.days_until > 0) {
        startTime.setDate(startTime.getDate() + activity.days_until)
      }

      // If the time has passed today, it's for tomorrow
      if (activity.days_until === 0 && startTime.getTime() <= now.getTime()) {
        startTime.setDate(startTime.getDate() + 1)
      }

      const diff = startTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeUntil("Starting now")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntil(`in ${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeUntil(`in ${hours}h ${minutes}m`)
      } else {
        setTimeUntil(`in ${minutes}m`)
      }
    }

    updateTimeUntil()
    const interval = setInterval(updateTimeUntil, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activity])

  if (!activity) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-gray-400" />
            Next Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No upcoming activities</p>
            <p className="text-sm text-gray-400">Your schedule is clear</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTimeUntilText = (daysUntil: number) => {
    if (daysUntil === 0) {
      return "Later today"
    } else if (daysUntil === 1) {
      return "Tomorrow"
    } else {
      return `In ${daysUntil} days`
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
          Next Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={getColorClass(activity.color)}>{activity.title}</Badge>
            {activity.category && (
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {activity.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
          </div>

          {activity.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {activity.location}
            </div>
          )}

          {activity.description && <p className="text-sm text-gray-700 mt-2">{activity.description}</p>}

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">{getTimeUntilText(activity.days_until)}</p>
            <p className="text-xs text-blue-600">
              {DAYS_OF_WEEK[activity.day_of_week]} at {formatTime(activity.start_time)} ({timeUntil})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
