"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Tag, Calendar } from "lucide-react"

interface CurrentActivity {
  activity_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  start_time: string
  end_time: string
  day_of_week: number
}

interface CurrentActivityCardProps {
  activity: CurrentActivity | null
  formatTime: (time: string) => string
  getColorClass: (color: string) => string
}

export function CurrentActivityCard({ activity, formatTime, getColorClass }: CurrentActivityCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  useEffect(() => {
    if (!activity) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const [endHours, endMinutes] = activity.end_time.split(":").map(Number)
      const endTime = new Date()
      endTime.setHours(endHours, endMinutes, 0, 0)

      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Activity ended")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeRemaining(`${minutes}m remaining`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activity])

  if (!activity) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            Current Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No activity in progress</p>
            <p className="text-sm text-gray-400">Enjoy your free time!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Clock className="w-5 h-5 mr-2 text-emerald-600" />
          Current Activity
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

          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
            <p className="text-sm text-emerald-800 font-medium">In Progress</p>
            <p className="text-xs text-emerald-600">{timeRemaining}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
