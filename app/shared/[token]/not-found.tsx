import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight, Clock, Target } from "lucide-react"

export default function SharedDeadlineNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Shared Deadline Not Found</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              The shared deadline you're looking for doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Possible Reasons */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3">This could happen if:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <Clock className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  The shared link has expired
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  The deadline was deleted by its owner
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  The sharing was disabled
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  The link URL is incorrect or incomplete
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Target className="w-4 h-4 mr-2" />
                  Go to DeadlineMate Homepage
                </Button>
              </Link>

              <Link href="/auth" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Sign In to Your Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                If you believe this is an error, please contact the person who shared this deadline with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
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
