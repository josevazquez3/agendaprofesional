"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { successAnimation } from "@/lib/animations"
import { useEffect } from "react"
import { iconography, typography } from "@/lib/typography"
import { cn } from "@/lib/utils"

interface SuccessToastProps {
  message: string
  show: boolean
  onClose: () => void
  duration?: number
}

export function SuccessToast({
  message,
  show,
  onClose,
  duration = 3000,
}: SuccessToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={successAnimation}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed bottom-6 right-6 z-50 bg-white/95 border border-[#E2E8F0] rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px]"
        >
          <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
            <CheckCircle className={cn(iconography.header, "text-[#10B981]")} strokeWidth={iconography.strokeWidth} />
          </div>
          <p className={cn(typography.body, "font-medium flex-1")}>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
