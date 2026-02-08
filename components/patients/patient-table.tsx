"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { format } from "date-fns"
import { PatientAvatar } from "./patient-avatar"
import { PatientQuickPreview } from "./patient-quick-preview"
import { ClinicalIndicators } from "./clinical-indicators"
import { Button } from "@/components/ui/button"
import { Eye, Edit, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface Paciente {
  id: string
  nombre: string
  dni: string | null
  email: string
  telefono: string | null
  fechaNacimiento?: Date | null
  alergias?: string | null
  enfermedadesCronicas?: string | null
  obraSocial?: string | null
  obraSocialRel?: {
    nombre: string
  } | null
  ultimaVisita?: Date | null
}

interface PatientTableProps {
  pacientes: Paciente[]
  basePath: string
  showActions?: boolean
}

export function PatientTable({
  pacientes,
  basePath,
  showActions = true,
}: PatientTableProps) {
  if (pacientes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#64748B]">No hay pacientes disponibles</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="overflow-x-auto"
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Paciente
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Documento
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Teléfono
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Email
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Obra social
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Última visita
            </th>
            {showActions && (
              <th className="text-right py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {pacientes.map((paciente) => (
            <motion.tr
              key={paciente.id}
              variants={staggerItem}
              className="hover:bg-slate-50 transition-colors duration-150 ease-out"
            >
              <td className="py-5 px-6">
                <PatientQuickPreview
                  paciente={{
                    id: paciente.id,
                    nombre: paciente.nombre,
                    dni: paciente.dni,
                    telefono: paciente.telefono,
                    email: paciente.email,
                    fechaNacimiento: paciente.fechaNacimiento,
                    alergias: paciente.alergias,
                    enfermedadesCronicas: paciente.enfermedadesCronicas,
                  }}
                  ultimaConsulta={paciente.ultimaVisita}
                  basePath={basePath}
                >
                  <div className="flex items-center space-x-3 cursor-pointer group">
                    <PatientAvatar name={paciente.nombre} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          {paciente.nombre}
                        </span>
                        <ClinicalIndicators
                          alergias={paciente.alergias}
                          enfermedadesCronicas={paciente.enfermedadesCronicas}
                        />
                      </div>
                    </div>
                  </div>
                </PatientQuickPreview>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#64748B]">
                  {paciente.dni || "-"}
                </span>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#64748B]">
                  {paciente.telefono || "-"}
                </span>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#64748B]">{paciente.email}</span>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#64748B]">
                  {paciente.obraSocialRel?.nombre ||
                    paciente.obraSocial ||
                    "-"}
                </span>
              </td>
              <td className="py-5 px-6">
                {paciente.ultimaVisita ? (
                  <span className="text-sm text-[#64748B]">
                    {format(new Date(paciente.ultimaVisita), "dd/MM/yyyy")}
                  </span>
                ) : (
                  <span className="text-sm text-[#64748B]">-</span>
                )}
              </td>
              {showActions && (
                <td className="py-5 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/admin/pacientes/${paciente.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                        title="Ver ficha"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/usuarios/${paciente.id}/editar`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/historia-clinica/${paciente.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                        title="Historial clínico"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
