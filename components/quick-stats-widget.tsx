"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, TrendingUp, Target } from "lucide-react"

interface QuickStatsWidgetProps {
  stats: {
    total: number
    completed: number
    overdue: number
    upcoming: number
  }
  weeklyProgress?: number
  streak?: number
}

export function QuickStatsWidget({ stats, weeklyProgress = 75, streak = 5 }: QuickStatsWidgetProps) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{completionRate}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completed} of {stats.total} deadlines completed
          </p>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{weeklyProgress}%</div>
          <Progress value={weeklyProgress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">On track for this week's goals</p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{streak} days</div>
          <div className="flex items-center mt-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              🔥 On fire!
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Keep up the great work!</p>
        </CardContent>
      </Card>
    </div>
  )
}
