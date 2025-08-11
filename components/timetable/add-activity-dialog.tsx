"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  timetableId?: string
  onActivityAdded: () => void
}

const DAYS_OF_WEEK = [
  { short: "Sun", full: "Sunday", value: 0 },
  { short: "Mon", full: "Monday", value: 1 },
  { short: "Tue", full: "Tuesday", value: 2 },
  { short: "Wed", full: "Wednesday", value: 3 },
  { short: "Thu", full: "Thursday", value: 4 },
  { short: "Fri", full: "Friday", value: 5 },
  { short: "Sat", full: "Saturday", value: 6 },
]

const COLOR_OPTIONS = [
  { name: "Red", value: "red", class: "bg-red-100 text-red-800 border-red-200" },
  { name: "Orange", value: "orange", class: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { name: "Green", value: "green", class: "bg-green-100 text-green-800 border-green-200" },
  { name: "Blue", value: "blue", class: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { name: "Purple", value: "purple", class: "bg-purple-100 text-purple-800 border-purple-200" },
  { name: "Pink", value: "pink", class: "bg-pink-100 text-pink-800 border-pink-200" },
  { name: "Gray", value: "gray", class: "bg-gray-100 text-gray-800 border-gray-200" },
]

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
}

export function AddActivityDialog({ isOpen, onClose, timetableId, onActivityAdded }: AddActivityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    color: "blue",
    location: "",
  })
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      day_of_week: 1, // Monday
      start_time: "09:00",
      end_time: "10:00",
      is_recurring: true,
    },
  ])

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.title.trim()) {
      setError("Activity title is required")
      return
    }

    if (!timetableId) {
      setError("No timetable selected. Please try refreshing the page.")
      return
    }

    for (const schedule of schedules) {
      if (schedule.start_time >= schedule.end_time) {
        setError("End time must be after start time for all schedules")
        return
      }
    }

    setLoading(true)
    try {
      const { data: tableCheck } = await supabase.from("activities").select("id").limit(1)

      if (!tableCheck) {
        setSuccess(
          "Demo Mode: Activity would be created successfully! Run the database migration to enable real functionality.",
        )
        setTimeout(() => {
          resetForm()
          onActivityAdded()
          onClose()
        }, 2000)
        return
      }

      const { data: activity, error: activityError } = await supabase
        .from("activities")
        .insert({
          timetable_id: timetableId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category.trim() || null,
          color: formData.color,
          location: formData.location.trim() || null,
        })
        .select()
        .single()

      if (activityError) {
        console.error("Activity creation error:", activityError)
        throw new Error(`Failed to create activity: ${activityError.message}`)
      }

      const scheduleInserts = schedules.map((schedule) => ({
        activity_id: activity.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_recurring: schedule.is_recurring,
        recurrence_pattern: "weekly",
        is_active: true,
      }))

      const { error: scheduleError } = await supabase.from("activity_schedules").insert(scheduleInserts)

      if (scheduleError) {
        console.error("Schedule creation error:", scheduleError)
        throw new Error(`Failed to create schedules: ${scheduleError.message}`)
      }

      setSuccess("Activity created successfully!")

      setTimeout(() => {
        resetForm()
        onActivityAdded()
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error creating activity:", error)
      setError(error instanceof Error ? error.message : "Failed to create activity. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      color: "blue",
      location: "",
    })
    setSchedules([
      {
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:00",
        is_recurring: true,
      },
    ])
    setError(null)
    setSuccess(null)
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:00",
        is_recurring: true,
      },
    ])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, field: keyof Schedule, value: any) => {
    setSchedules(schedules.map((schedule, i) => (i === index ? { ...schedule, [field]: value } : schedule)))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Activity</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Create a new activity for your timetable with custom scheduling.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm sm:text-base">
                Activity Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Math Class, Gym Workout, Team Meeting"
                required
                className="text-sm sm:text-base"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the activity"
                rows={3}
                className="text-sm sm:text-base"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">
                  Category
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Work, Study, Exercise"
                  className="text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm sm:text-base">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Room 101, Gym, Online"
                  className="text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">Color Theme</Label>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    disabled={loading}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border-2 transition-all disabled:opacity-50 ${
                      formData.color === color.value
                        ? `${color.class} border-current`
                        : `${color.class} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base font-medium">Schedule</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSchedule}
                disabled={loading}
                className="text-xs sm:text-sm bg-transparent"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm sm:text-base">Time Slot {index + 1}</h4>
                    {schedules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Day of Week</Label>
                      <select
                        value={schedule.day_of_week}
                        onChange={(e) => updateSchedule(index, "day_of_week", Number.parseInt(e.target.value))}
                        disabled={loading}
                        className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.full}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => updateSchedule(index, "start_time", e.target.value)}
                        disabled={loading}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">End Time</Label>
                      <Input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => updateSchedule(index, "end_time", e.target.value)}
                        disabled={loading}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`recurring-${index}`}
                      checked={schedule.is_recurring}
                      onCheckedChange={(checked) => updateSchedule(index, "is_recurring", checked)}
                      disabled={loading}
                    />
                    <Label htmlFor={`recurring-${index}`} className="text-xs sm:text-sm">
                      Repeat weekly
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto text-sm bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()} className="w-full sm:w-auto text-sm">
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Create Activity
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
