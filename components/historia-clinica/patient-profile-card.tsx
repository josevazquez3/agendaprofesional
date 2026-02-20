"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientAvatar } from "@/components/patients/patient-avatar"
import { Phone, Mail, FileText, Heart } from "lucide-react"
import { format } from "date-fns"

interface PatientProfileCardProps {
  paciente: {
    nombre: string
    dni: string | null
    email: string
    telefono: string | null
    fechaNacimiento: Date | null
    obraSocial?: string | null
    obraSocialRel?: {
      nombre: string
    } | null
  }
  profesionalAsignado?: {
    nombre: string
    especialidad: string
  } | null
}

export function PatientProfileCard({
  paciente,
  profesionalAsignado,
}: PatientProfileCardProps) {
  const calcularEdad = (fechaNacimiento: Date | null) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const edad = calcularEdad(paciente.fechaNacimiento)

  return (
    <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
      <CardHeader className="border-b border-[#E2E8F0]">
        <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
          Perfil del Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-6">
          <PatientAvatar name={paciente.nombre} size="lg" className="mb-4" />
          <h2 className="text-xl font-semibold text-[#0F172A] font-inter text-center">
            {paciente.nombre}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#64748B] mb-1">Documento</p>
              <p className="text-sm font-medium text-[#0F172A]">
                {paciente.dni || "No registrado"}
              </p>
            </div>
          </div>

          {edad !== null && (
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#64748B] mb-1">Edad</p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {edad} años
                  {paciente.fechaNacimiento && (
                    <span className="text-[#64748B] ml-2">
                      ({format(new Date(paciente.fechaNacimiento), "dd/MM/yyyy")})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {paciente.telefono && (
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#64748B] mb-1">Teléfono</p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {paciente.telefono}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#64748B] mb-1">Email</p>
              <p className="text-sm font-medium text-[#0F172A]">
                {paciente.email}
              </p>
            </div>
          </div>

          {(paciente.obraSocialRel?.nombre || paciente.obraSocial) && (
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#64748B] mb-1">Obra Social</p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {paciente.obraSocialRel?.nombre || paciente.obraSocial}
                </p>
              </div>
            </div>
          )}

          {profesionalAsignado && (
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#64748B] mb-1">
                  Profesional asignado
                </p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {profesionalAsignado.nombre}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {profesionalAsignado.especialidad}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
