"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { pageTransition } from "@/lib/animations"

import type { Session } from "next-auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: Session["user"]
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Persistir estado del sidebar en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState))
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-40">
        <Sidebar
          userRole={user.role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-[260px] bg-white z-50">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <span className="text-xl font-semibold text-[#0F172A] font-inter">
                Agenda Profesional
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar userRole={user.role} />
          </div>
        </div>
      )}

      {/* Topbar */}
      <Topbar
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-[72px] transition-all duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#2563EB] text-white shadow-lg flex items-center justify-center hover:bg-[#1E40AF] transition-all duration-200 ease-out"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  )
}
