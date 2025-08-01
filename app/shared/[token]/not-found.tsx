import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Trash2, Link2Off, ArrowLeft, Target } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
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
          {/* Possible Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="font-semibold text-gray-900 mb-3">Possible reasons:</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                The link has expired
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                The deadline was deleted
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Link2Off className="w-4 h-4 mr-2 text-gray-500" />
                The link is invalid or corrupted
              </div>
            </div>
          </div>

          {/* Actions */}
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

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Need help? Contact the person who shared this deadline with you.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
