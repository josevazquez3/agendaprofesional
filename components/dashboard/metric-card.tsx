"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { cardHover, fadeIn } from "@/lib/animations"
import { typography, spacing, iconography } from "@/lib/typography"

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconColor?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  icon,
  iconColor = "#2563EB",
  className,
}: MetricCardProps) {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="w-full"
    >
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card
          className={cn(
            "bg-white border border-[#E2E8F0] rounded-2xl shadow-sm",
            className
          )}
        >
          <CardContent className={spacing.card}>
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                {icon}
              </div>
              <p className={cn(typography.secondary, "mb-2")}>{title}</p>
              <p className="text-2xl lg:text-3xl font-bold text-[#0F172A] font-inter">
                {value}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
