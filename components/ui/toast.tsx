"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"
import { successAnimation } from "@/lib/animations"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { iconography, typography } from "@/lib/typography"

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type?: ToastType
  show: boolean
  onClose: () => void
  duration?: number
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-[#D1FAE5]",
    iconColor: "text-[#10B981]",
    borderColor: "border-[#A7F3D0]",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-[#FEE2E2]",
    iconColor: "text-[#EF4444]",
    borderColor: "border-[#FECACA]",
  },
  info: {
    icon: Info,
    bgColor: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
    borderColor: "border-[#BFDBFE]",
  },
}

export function Toast({
  message,
  type = "success",
  show,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const config = toastConfig[type]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={successAnimation}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed bottom-6 right-6 z-50 bg-white/95 border border-[#E2E8F0] rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-[400px]"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              config.bgColor
            )}
          >
            <Icon className={cn(iconography.header, config.iconColor)} strokeWidth={iconography.strokeWidth} />
          </div>
          <p className={cn(typography.body, "font-medium flex-1")}>{message}</p>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <X className={iconography.text} strokeWidth={iconography.strokeWidth} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para usar toasts fácilmente
export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    show: boolean
  }>({
    message: "",
    type: "success",
    show: false,
  })

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type, show: true })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }))
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
