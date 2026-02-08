"use client"

import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { successAnimation } from "@/lib/animations"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { iconography, typography } from "@/lib/typography"
import { Button } from "./button"

interface UndoToastProps {
  message: string
  show: boolean
  onClose: () => void
  onUndo: () => void
  duration?: number
}

export function UndoToast({
  message,
  show,
  onClose,
  onUndo,
  duration = 5000,
}: UndoToastProps) {
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
          className="fixed bottom-6 right-6 z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[320px] max-w-[400px]"
        >
          <p className={cn(typography.body, "flex-1")}>{message}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onUndo()
              onClose()
            }}
            className="rounded-lg text-[#2563EB] hover:bg-[#EFF6FF] h-8 px-3"
          >
            <RotateCcw className={cn(iconography.text, "mr-1.5")} strokeWidth={iconography.strokeWidth} />
            Deshacer
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
