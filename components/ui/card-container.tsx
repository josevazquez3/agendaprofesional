"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { cardHover, fadeIn } from "@/lib/animations"
import { typography, spacing } from "@/lib/typography"

interface CardContainerProps {
  title?: string | ReactNode
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function CardContainer({
  title,
  subtitle,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
}: CardContainerProps) {
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
            "bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm",
            className
          )}
        >
      {(title || action) && (
        <CardHeader
          className={cn(
            "border-b border-[#E2E8F0]",
            headerClassName
          )}
        >
          <div className="flex justify-between items-center">
            {title && (
              <div>
                {typeof title === "string" ? (
                  <CardTitle className={typography.cardTitle}>{title}</CardTitle>
                ) : (
                  <div className={typography.cardTitle}>{title}</div>
                )}
                {subtitle && (
                  <p className={cn(typography.subtitle, "mt-1")}>{subtitle}</p>
                )}
              </div>
            )}
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(spacing.card, contentClassName)}>
        {children}
      </CardContent>
    </Card>
      </motion.div>
    </motion.div>
  )
}
