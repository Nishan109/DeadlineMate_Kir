"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  href,
  variant = "default",
  size = "default",
  loadingText = "Loading...",
  children,
  className,
  onClick,
  ...props
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (href) {
      e.preventDefault()
      setIsLoading(true)

      // Add a small delay for better UX
      setTimeout(() => {
        router.push(href)
      }, 300)
    } else if (onClick) {
      setIsLoading(true)
      try {
        await onClick(e)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
