"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface EliminarTurnosModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (causa: string) => void
  cantidad: number
  /** Título del modal (por defecto "Eliminar Turnos") */
  title?: string
  /** Descripción (por defecto mensaje para turnos) */
  description?: string
  placeholder?: string
}

export function EliminarTurnosModal({
  open,
  onClose,
  onConfirm,
  cantidad,
  title = "Eliminar Turnos",
  description,
  placeholder = "Describe la razón por la cual se eliminan estos turnos...",
}: EliminarTurnosModalProps) {
  const [causa, setCausa] = useState("")
  const [error, setError] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const desc = description ?? `Estás a punto de eliminar ${cantidad} turno${cantidad > 1 ? "s" : ""}. Por favor, indica la causa de eliminación (obligatorio).`

  useEffect(() => {
    if (open) {
      setCausa("")
      setError("")
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = () => {
    if (!causa.trim()) {
      setError("La causa de eliminación es obligatoria")
      return
    }
    onConfirm(causa)
    setCausa("")
    setError("")
  }

  const handleClose = () => {
    setCausa("")
    setError("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="causa">Causa de eliminación *</Label>
              <textarea
                ref={textareaRef}
                id="causa"
                name="causa"
                autoFocus
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={causa}
                onChange={(e) => {
                  setCausa(e.target.value)
                  setError("")
                }}
                placeholder={placeholder}
                required
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
