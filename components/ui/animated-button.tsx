"use client"

import { motion } from "framer-motion"
import { Button, ButtonProps } from "./button"
import { scaleHover } from "@/lib/animations"
import { forwardRef } from "react"

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        variants={scaleHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className="inline-block"
      >
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"
