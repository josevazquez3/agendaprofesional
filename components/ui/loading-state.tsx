"use client"

import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  rows?: number
  className?: string
  variant?: "card" | "table" | "metric" | "timeline"
}

export function LoadingState({
  rows = 3,
  className,
  variant = "card",
}: LoadingStateProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-0", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse border-b border-[#E2E8F0] py-4 px-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#E2E8F0] rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#E2E8F0] rounded w-1/4"></div>
                <div className="h-3 bg-[#E2E8F0] rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-[#E2E8F0] rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === "metric") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm"
          >
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-[#E2E8F0] rounded w-24"></div>
                    <div className="h-8 bg-[#E2E8F0] rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-[#E2E8F0] rounded-xl"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (variant === "timeline") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Card
            key={index}
            className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm"
          >
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-[#E2E8F0] rounded w-32"></div>
                  <div className="h-6 bg-[#E2E8F0] rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#E2E8F0] rounded w-full"></div>
                  <div className="h-3 bg-[#E2E8F0] rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Default: card variant
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, index) => (
        <Card
          key={index}
          className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm mb-4"
        >
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#E2E8F0] rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#E2E8F0] rounded w-3/4"></div>
                  <div className="h-3 bg-[#E2E8F0] rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#E2E8F0] rounded w-full"></div>
                <div className="h-3 bg-[#E2E8F0] rounded w-5/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
