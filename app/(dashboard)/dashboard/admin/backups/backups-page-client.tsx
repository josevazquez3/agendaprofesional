"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Download,
  Play,
  Pause,
  Trash2,
  Plus,
  Clock,
  Calendar,
  HardDrive,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { typography, iconography } from "@/lib/typography"

interface BackupJob {
  id: string
  frequency: string
  scheduledTime: string | null
  scheduledDay: number | null
  storageType: string
  storagePath: string | null
  lastRunAt: Date | null
  status: string
  createdAt: Date
  logs: BackupLog[]
  _count: {
    logs: number
  }
}

interface BackupLog {
  id: string
  executedAt: Date
  fileUrl: string | null
  status: string
  sizeMB: number | null
  errorMessage: string | null
}

interface BackupsPageClientProps {
  initialJobs: BackupJob[]
  clinicId: string
}

export function BackupsPageClient({
  initialJobs,
  clinicId,
}: BackupsPageClientProps) {
  const [jobs, setJobs] = useState<BackupJob[]>(initialJobs)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    frequency: "manual",
    scheduledTime: "",
    scheduledDay: "",
    storageType: "local",
  })

  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/backups/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          storageType: formData.storageType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear backup")
      }

      router.refresh()
      setCreateModalOpen(false)
    } catch (error) {
      console.error("Error creando backup:", error)
      alert(error instanceof Error ? error.message : "Error al crear backup")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: formData.frequency,
          scheduledTime: formData.scheduledTime || null,
          scheduledDay: formData.scheduledDay ? parseInt(formData.scheduledDay) : null,
          storageType: formData.storageType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear backup job")
      }

      router.refresh()
      setCreateModalOpen(false)
      setFormData({
        frequency: "manual",
        scheduledTime: "",
        scheduledDay: "",
        storageType: "local",
      })
    } catch (error) {
      console.error("Error creando backup job:", error)
      alert(error instanceof Error ? error.message : "Error al crear backup job")
    } finally {
      setLoading(false)
    }
  }

  const handleRunJob = async (jobId: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/backups/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al ejecutar backup")
      }

      router.refresh()
    } catch (error) {
      console.error("Error ejecutando backup:", error)
      alert(error instanceof Error ? error.message : "Error al ejecutar backup")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/backups/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus === "active" ? "paused" : "active",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar estado")
      }

      router.refresh()
    } catch (error) {
      console.error("Error actualizando estado:", error)
      alert(error instanceof Error ? error.message : "Error al actualizar estado")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este backup job?")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/backups/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar backup job")
      }

      router.refresh()
    } catch (error) {
      console.error("Error eliminando backup job:", error)
      alert(error instanceof Error ? error.message : "Error al eliminar backup job")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (logId: string) => {
    window.open(`/api/admin/backups/download/${logId}`, "_blank")
  }

  const handleRestore = async () => {
    if (!restoreFile) {
      alert("Selecciona un archivo de backup (ZIP o JSON)")
      return
    }
    if (
      !confirm(
        "⚠️ ADVERTENCIA: Restaurar reemplazará TODOS los datos actuales de la base de datos. Esta acción no se puede deshacer. ¿Continuar?"
      )
    ) {
      return
    }

    try {
      setRestoreLoading(true)
      const formData = new FormData()
      formData.append("file", restoreFile)

      const response = await fetch("/api/admin/backups/restore", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al restaurar")
      }

      alert(data.message + "\n\nSerás redirigido para iniciar sesión de nuevo.")
      setRestoreFile(null)
      router.refresh()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error restaurando:", error)
      alert(error instanceof Error ? error.message : "Error al restaurar el backup")
    } finally {
      setRestoreLoading(false)
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      manual: "Manual",
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
    }
    return labels[frequency] || frequency
  }

  const getStorageLabel = (storageType: string) => {
    const labels: Record<string, string> = {
      local: "Servidor Local",
      s3: "AWS S3",
      gcs: "Google Cloud Storage",
    }
    return labels[storageType] || storageType
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups del Sistema"
        subtitle="Gestión de backups automáticos y manuales"
        action={
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Backup
          </Button>
        }
      />

      {/* Restaurar backup */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurar base de datos
          </CardTitle>
          <p className="text-sm text-[#64748B] mt-1">
            Sube un archivo ZIP o JSON generado por el backup del sistema para reemplazar la base de datos actual.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-100/80 text-amber-800 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Esta acción eliminará todos los datos actuales y los reemplazará con los del archivo. Es irreversible.
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="restore-file">Archivo de backup (.zip o .json)</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".zip,.json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                className="rounded-xl mt-1"
              />
            </div>
            <Button
              onClick={handleRestore}
              disabled={restoreLoading || !restoreFile}
              variant="destructive"
              className="rounded-xl"
            >
              {restoreLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar base de datos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-6 text-center">
              <Database className="h-12 w-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-sm text-[#64748B] mb-4">
                No hay backups configurados
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                variant="outline"
                className="rounded-xl"
              >
                Crear Primer Backup
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Frecuencia
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Horario
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Almacenamiento
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Última Ejecución
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-[#0F172A]">
                          {getFrequencyLabel(job.frequency)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          {job.scheduledTime && (
                            <>
                              <Clock className="h-4 w-4" />
                              {job.scheduledTime}
                            </>
                          )}
                          {job.scheduledDay !== null && job.frequency === "weekly" && (
                            <span className="ml-2">
                              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][job.scheduledDay]}
                            </span>
                          )}
                          {job.scheduledDay !== null && job.frequency === "monthly" && (
                            <span className="ml-2">Día {job.scheduledDay}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <HardDrive className="h-4 w-4" />
                          {getStorageLabel(job.storageType)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {job.lastRunAt ? (
                          <span className="text-sm text-[#64748B]">
                            {format(new Date(job.lastRunAt), "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        ) : (
                          <span className="text-sm text-[#64748B]">Nunca</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={job.status === "active" ? "default" : "secondary"}
                        >
                          {job.status === "active" ? "Activo" : "Pausado"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunJob(job.id)}
                            disabled={loading}
                            className="rounded-xl"
                            title="Ejecutar ahora"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(job.id, job.status)}
                            disabled={loading}
                            className="rounded-xl"
                            title={job.status === "active" ? "Pausar" : "Activar"}
                          >
                            {job.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={loading}
                            className="rounded-xl text-[#EF4444] hover:text-[#DC2626]"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Backups */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ejecuciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Tamaño
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {jobs.flatMap((job) =>
                    job.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#0F172A]">
                            {format(new Date(log.executedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#64748B]">
                            {log.sizeMB ? `${log.sizeMB} MB` : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {log.status === "success" ? (
                            <Badge variant="default" className="bg-[#10B981]">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Exitoso
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {log.status === "success" && log.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(log.id)}
                              className="rounded-xl"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          )}
                          {log.errorMessage && (
                            <span className="text-xs text-[#EF4444]" title={log.errorMessage}>
                              {log.errorMessage.substring(0, 50)}...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Crear Backup */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className={cn(typography.pageTitle)}>
              Crear Backup
            </DialogTitle>
            <DialogDescription className={cn(typography.subtitle)}>
              Configura un backup automático o ejecuta uno manual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="frequency">Frecuencia</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.frequency !== "manual" && (
              <>
                <div>
                  <Label htmlFor="scheduledTime">Horario (HH:mm)</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>

                {formData.frequency === "weekly" && (
                  <div>
                    <Label htmlFor="scheduledDay">Día de la Semana</Label>
                    <Select
                      value={formData.scheduledDay}
                      onValueChange={(value) =>
                        setFormData({ ...formData, scheduledDay: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona un día" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Lunes</SelectItem>
                        <SelectItem value="1">Martes</SelectItem>
                        <SelectItem value="2">Miércoles</SelectItem>
                        <SelectItem value="3">Jueves</SelectItem>
                        <SelectItem value="4">Viernes</SelectItem>
                        <SelectItem value="5">Sábado</SelectItem>
                        <SelectItem value="6">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frequency === "monthly" && (
                  <div>
                    <Label htmlFor="scheduledDay">Día del Mes (1-31)</Label>
                    <Input
                      id="scheduledDay"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.scheduledDay}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledDay: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="storageType">Almacenamiento</Label>
              <Select
                value={formData.storageType}
                onValueChange={(value) =>
                  setFormData({ ...formData, storageType: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Servidor Local</SelectItem>
                  <SelectItem value="s3" disabled>
                    AWS S3 (Próximamente)
                  </SelectItem>
                  <SelectItem value="gcs" disabled>
                    Google Cloud Storage (Próximamente)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#E2E8F0]">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            {formData.frequency === "manual" ? (
              <Button
                onClick={handleCreateBackup}
                disabled={loading}
                className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Crear Backup Ahora
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCreateJob}
                disabled={loading || !formData.scheduledTime}
                className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Crear Backup Programado
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
