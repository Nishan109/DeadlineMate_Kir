import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Trash2, Link2Off, ArrowLeft, Target } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DeadlineMate</h1>
                <p className="text-sm text-gray-600">Shared Deadline</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent">
                Try DeadlineMate
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Deadline Not Found</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              This shared deadline link is invalid, expired, or has been removed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Possible Reasons */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Possible reasons:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span>The link has expired</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <Trash2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span>The deadline was deleted</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <Link2Off className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span>The link is invalid or corrupted</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
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
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Need help? Contact the person who shared this deadline with you.</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2024 DeadlineMate. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <Link href="/auth" className="hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
