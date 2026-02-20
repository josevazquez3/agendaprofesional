"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Eye, FileText } from "lucide-react"
import Link from "next/link"
import { ExportarRegistroButton } from "./exportar-registro-button"

interface MedicalRecordItemProps {
  id: string
  fechaConsulta: Date
  profesional: {
    nombre: string
    especialidad: string
  }
  motivoConsulta?: string | null
  diagnostico?: string | null
  tratamiento?: string | null
  notas?: string | null
  turno?: {
    fecha: Date
    hora: string
    estado: string
    motivoEliminacion?: string | null
    eliminadoAt?: Date | null
  } | null
  archivos?: Array<{
    id: string
    nombreArchivo: string
    tipoArchivo: string
    urlArchivo: string
  }>
  basePath: string
  pacienteId: string
  pacienteNombre: string
}

export function MedicalRecordItem({
  id,
  fechaConsulta,
  profesional,
  motivoConsulta,
  diagnostico,
  tratamiento,
  notas,
  turno,
  archivos = [],
  basePath,
  pacienteId,
  pacienteNombre,
}: MedicalRecordItemProps) {
  return (
    <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]"></div>
              <div>
                <h3 className="text-base font-semibold text-[#0F172A] font-inter">
                  {profesional.nombre}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {profesional.especialidad}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#64748B] ml-5">
              {format(new Date(fechaConsulta), "dd/MM/yyyy 'a las' HH:mm")}
            </p>
          </div>
          <Link href={`${basePath}/editar`}>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver detalle
            </Button>
          </Link>
        </div>

        {/* Información del turno si existe */}
        {turno && (
          <div className="mb-4 ml-5">
            <p className="text-xs text-[#64748B]">
              Turno: {format(new Date(turno.fecha), "dd/MM/yyyy")} - {turno.hora}
            </p>
            {turno.estado === "ELIMINADO" && (
              <div className="mt-2 p-2 bg-[#FEE2E2]/20 border border-[#FECACA] rounded-lg">
                <p className="text-xs font-semibold text-[#991B1B] mb-1">
                  ⚠️ Turno Eliminado
                </p>
                {turno.motivoEliminacion && (
                  <p className="text-xs text-[#991B1B]">
                    Causa: {turno.motivoEliminacion}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="space-y-3 ml-5">
          {motivoConsulta && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">
                Motivo de consulta
              </h4>
              <p className="text-sm text-[#0F172A]">{motivoConsulta}</p>
            </div>
          )}

          {diagnostico && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">
                Diagnóstico
              </h4>
              <p className="text-sm text-[#0F172A]">{diagnostico}</p>
            </div>
          )}

          {tratamiento && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">
                Tratamiento
              </h4>
              <p className="text-sm text-[#0F172A] whitespace-pre-wrap">
                {tratamiento}
              </p>
            </div>
          )}

          {notas && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">
                Observaciones
              </h4>
              <p className="text-sm text-[#64748B] whitespace-pre-wrap">
                {notas}
              </p>
            </div>
          )}

          {archivos.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                Estudios adjuntos ({archivos.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {archivos.slice(0, 3).map((archivo) => (
                  <a
                    key={archivo.id}
                    href={archivo.urlArchivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:text-[#1E40AF] underline"
                  >
                    {archivo.nombreArchivo}
                  </a>
                ))}
                {archivos.length > 3 && (
                  <span className="text-xs text-[#64748B]">
                    +{archivos.length - 3} más
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <ExportarRegistroButton
              pacienteId={pacienteId}
              registroId={id}
              pacienteNombre={pacienteNombre}
              nombreProfesional={profesional.nombre}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
