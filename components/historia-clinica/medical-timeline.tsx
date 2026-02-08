"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MedicalRecordItem } from "./medical-record-item"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface HistoriaClinicaRegistro {
  id: string
  fechaConsulta: Date | string
  notas: string | null
  diagnostico: string | null
  tratamiento: string | null
  motivo?: string | null
  profesional: {
    user: {
      nombre: string
    }
    especialidad: string
  }
  turno?: {
    fecha: Date | string
    hora: string
    estado: string
    motivo?: string | null
    motivoEliminacion?: string | null
    eliminadoAt?: Date | string | null
  } | null
  archivos?: Array<{
    id: string
    nombreArchivo: string
    tipoArchivo: string
    urlArchivo: string
  }>
}

interface MedicalTimelineProps {
  registros: HistoriaClinicaRegistro[]
  basePath: string
}

export function MedicalTimeline({
  registros,
  basePath,
}: MedicalTimelineProps) {
  const [visibleItems, setVisibleItems] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Lazy load: mostrar solo primeros 10 items inicialmente
  const displayedRegistros = registros.slice(0, visibleItems)
  const hasMore = visibleItems < registros.length

  useEffect(() => {
    if (!hasMore) return

    // Intersection Observer para cargar más cuando se acerca al final
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true)
          setTimeout(() => {
            setVisibleItems((prev) => Math.min(prev + 10, registros.length))
            setIsLoading(false)
          }, 300)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current && loadMoreRef.current) {
        observerRef.current.unobserve(loadMoreRef.current)
      }
    }
  }, [hasMore, isLoading, registros.length])

  if (registros.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#64748B]">
          No hay registros médicos disponibles
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {displayedRegistros.map((registro, index) => (
        <motion.div
          key={registro.id}
          variants={staggerItem}
          className="relative"
        >
          {/* Línea vertical del timeline */}
          {index < registros.length - 1 && (
            <div className="absolute left-[9px] top-12 bottom-0 w-0.5 bg-[#E2E8F0]"></div>
          )}
          <MedicalRecordItem
            id={registro.id}
            fechaConsulta={
              typeof registro.fechaConsulta === "string"
                ? new Date(registro.fechaConsulta)
                : registro.fechaConsulta
            }
            profesional={{
              nombre: registro.profesional.user.nombre,
              especialidad: registro.profesional.especialidad,
            }}
            motivoConsulta={registro.motivo || registro.turno?.motivo || null}
            diagnostico={registro.diagnostico}
            tratamiento={registro.tratamiento}
            notas={registro.notas}
            turno={
              registro.turno
                ? {
                    fecha:
                      typeof registro.turno.fecha === "string"
                        ? new Date(registro.turno.fecha)
                        : registro.turno.fecha,
                    hora: registro.turno.hora,
                    estado: registro.turno.estado,
                    motivoEliminacion: registro.turno.motivoEliminacion || null,
                    eliminadoAt: registro.turno.eliminadoAt
                      ? typeof registro.turno.eliminadoAt === "string"
                        ? new Date(registro.turno.eliminadoAt)
                        : registro.turno.eliminadoAt
                      : null,
                  }
                : null
            }
            archivos={registro.archivos || []}
            basePath={basePath}
          />
        </motion.div>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="text-center py-4">
          {isLoading && (
            <p className="text-sm text-[#64748B]">Cargando más registros...</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
