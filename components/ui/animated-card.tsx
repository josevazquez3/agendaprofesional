"use client"

import { motion } from "framer-motion"
import { Card, CardProps } from "./card"
import { cardHover, fadeIn } from "@/lib/animations"
import { forwardRef } from "react"

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode
  delay?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={cardHover}
        initial="rest"
        whileHover="hover"
        className="inline-block w-full"
      >
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay }}
        >
          <Card className={className} {...props}>
            {children}
          </Card>
        </motion.div>
      </motion.div>
    )
  }
)

AnimatedCard.displayName = "AnimatedCard"
