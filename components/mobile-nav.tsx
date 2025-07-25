"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Target } from "lucide-react"
import Link from "next/link"
import { LoadingButton } from "@/components/loading-button"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden" size="sm">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DeadlineMate</span>
          </div>

          <nav className="flex flex-col space-y-4 mb-8">
            <Link
              href="#features"
              className="text-lg text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-lg text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#contact"
              className="text-lg text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </nav>

          <div className="flex flex-col space-y-3 mt-auto">
            <LoadingButton
              variant="ghost"
              className="w-full justify-start text-lg py-3"
              href="/auth"
              onClick={() => setOpen(false)}
            >
              Sign In
            </LoadingButton>
            <LoadingButton
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-lg py-3"
              href="/auth"
              onClick={() => setOpen(false)}
            >
              Get Started Free
            </LoadingButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
