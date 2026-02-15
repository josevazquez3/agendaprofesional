"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Printer, Paperclip, X } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Profesional {
  id: string
  user: { nombre: string }
  especialidad: string
}

interface Turno {
  id: string
  fecha: string
  hora: string
  estado: string
  profesional?: { user?: { nombre: string }; especialidad?: string }
}

export default function AgregarHistoriaClinicaSecretariaPage() {
  const params = useParams()
  const router = useRouter()
  const pacienteId = params.pacienteId as string
  const printRef = useRef<HTMLDivElement>(null)

  const [pacienteNombre, setPacienteNombre] = useState("")
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [profesionalId, setProfesionalId] = useState("")
  const [fechaAtencion, setFechaAtencion] = useState(
    format(new Date(), "yyyy-MM-dd")
  )
  const [horaAtencion, setHoraAtencion] = useState(
    format(new Date(), "HH:mm")
  )
  const [tipoRegistro, setTipoRegistro] = useState<"sobre_turno" | "turno">(
    "sobre_turno"
  )
  const [turnoId, setTurnoId] = useState("")
  const [notas, setNotas] = useState("")
  const [archivos, setArchivos] = useState<Array<{ nombre: string; contenido: string; tipo: string }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const pacienteRes: Response | null = await fetch(`/api/pacientes/${pacienteId}`).catch(
          () => null
        )
        const [profRes, turnosRes] = await Promise.all([
          fetch("/api/profesionales"),
          fetch(`/api/turnos?pacienteId=${pacienteId}`),
        ])
        if (pacienteRes?.ok) {
          const p = await pacienteRes.json()
          setPacienteNombre(p.nombre || "")
        }
        if (profRes.ok) {
          const data = await profRes.json()
          setProfesionales(Array.isArray(data) ? data : data.profesionales || [])
        }
        if (turnosRes.ok) {
          const data = await turnosRes.json()
          setTurnos(data.turnos || [])
        }
      } catch (e) {
        console.error(e)
        setError("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pacienteId])

  const turnosDelProfesional =
    profesionalId && tipoRegistro === "turno"
      ? turnos.filter((t: Turno) => (t as any).profesionalId === profesionalId)
      : turnos

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      const tipo = ext === "pdf" ? "PDF" : ext === "docx" || ext === "doc" ? "DOCX" : "TEXTO"
      const reader = new FileReader()
      reader.onload = () => {
        const contenido = reader.result as string
        setArchivos((prev) => [
          ...prev,
          { nombre: file.name, contenido, tipo },
        ])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removeArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    if (!profesionalId.trim()) {
      setError("Seleccione el profesional que atendió.")
      return
    }
    setError("")
    setSaving(true)
    try {
      const fechaConsulta = new Date(`${fechaAtencion}T${horaAtencion}:00`).toISOString()
      const estudios = archivos.map((a) => ({
        nombreArchivo: a.nombre,
        contenido: a.contenido,
        tipoArchivo: a.tipo,
      }))
      const res = await fetch("/api/historia-clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId,
          profesionalId,
          turnoId: tipoRegistro === "turno" && turnoId ? turnoId : null,
          fechaConsulta,
          notas: notas.trim() || null,
          diagnostico: null,
          tratamiento: null,
          estudios: estudios.length ? estudios : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      router.push(`/dashboard/secretaria/historia-clinica/${pacienteId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = () => {
    if (printRef.current) {
      const ventana = window.open("", "_blank")
      if (!ventana) return
      ventana.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Agregar historia clínica - ${pacienteNombre}</title></head>
          <body style="font-family: system-ui; padding: 24px;">
            ${printRef.current.innerHTML}
          </body>
        </html>
      `)
      ventana.document.close()
      ventana.print()
      ventana.close()
    } else {
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-[#64748B]">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/secretaria/historia-clinica/${pacienteId}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter">
              Agregar historia clínica
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Paciente: {pacienteNombre || pacienteId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-medium"
            onClick={handleImprimir}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-medium"
            onClick={handleGuardar}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div ref={printRef}>
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader className="border-b border-[#E2E8F0]">
            <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
              Datos del registro
            </CardTitle>
            <p className="text-sm text-[#64748B] mt-1">
              Complete los datos de la atención. Quedará registrado el usuario, fecha y hora para auditoría.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Profesional que atendió *</Label>
                <select
                  className="w-full mt-1 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:ring-[#2563EB]"
                  value={profesionalId}
                  onChange={(e) => {
                    setProfesionalId(e.target.value)
                    setTurnoId("")
                  }}
                >
                  <option value="">Seleccione profesional</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.nombre} - {p.especialidad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fecha de atención *</Label>
                <Input
                  type="date"
                  className="mt-1 rounded-xl"
                  value={fechaAtencion}
                  onChange={(e) => setFechaAtencion(e.target.value)}
                />
              </div>
              <div>
                <Label>Hora de atención *</Label>
                <Input
                  type="time"
                  className="mt-1 rounded-xl"
                  value={horaAtencion}
                  onChange={(e) => setHoraAtencion(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de registro</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    checked={tipoRegistro === "sobre_turno"}
                    onChange={() => {
                      setTipoRegistro("sobre_turno")
                      setTurnoId("")
                    }}
                  />
                  Sobre turno
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    checked={tipoRegistro === "turno"}
                    onChange={() => setTipoRegistro("turno")}
                  />
                  Turno
                </label>
              </div>
            </div>

            {tipoRegistro === "turno" && (
              <div>
                <Label>Turno (opcional)</Label>
                <select
                  className="w-full mt-1 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:ring-[#2563EB]"
                  value={turnoId}
                  onChange={(e) => setTurnoId(e.target.value)}
                >
                  <option value="">Sin vincular a turno</option>
                  {turnosDelProfesional.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {format(new Date(t.fecha), "dd/MM/yyyy", { locale: es })} - {t.hora}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Historia clínica / Observaciones</Label>
              <textarea
                className="mt-1 flex min-h-[140px] w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm focus:ring-[#2563EB]"
                placeholder="Motivo de consulta, observaciones, evolución..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            <div>
              <Label>Adjuntar archivos (PDF, DOCX)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]">
                    <Paperclip className="h-4 w-4" />
                    Seleccionar archivos
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {archivos.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
                  >
                    {a.nombre}
                    <button
                      type="button"
                      onClick={() => removeArchivo(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
