import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, Target, Clock } from "lucide-react"

export default function SharedDeadlineNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Deadline Not Found</CardTitle>
            <CardDescription className="text-gray-600">
              This shared deadline link is invalid, expired, or has been removed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-900 mb-2">Possible reasons:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  The link has expired
                </li>
                <li className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-gray-400" />
                  The deadline was deleted
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-gray-400" />
                  The link is invalid or corrupted
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Target className="w-4 h-4 mr-2" />
                  Try DeadlineMate
                </Button>
              </Link>
              <Link href="/auth" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">Need help? Contact the person who shared this deadline with you.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
