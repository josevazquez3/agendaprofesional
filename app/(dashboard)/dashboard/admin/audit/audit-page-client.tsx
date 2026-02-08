"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Search,
  Filter,
  User,
  Calendar,
  Activity,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  oldValues: any
  newValues: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: {
    id: string
    nombre: string
    email: string
    role: string
  }
}

interface AuditPageClientProps {
  initialLogs: AuditLog[]
  users: Array<{
    id: string
    nombre: string
    email: string
    role: string
  }>
  initialTotal: number
  clinicId: string
}

export function AuditPageClient({
  initialLogs,
  users,
  initialTotal,
  clinicId,
}: AuditPageClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Filtros
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
  })

  const limit = 50

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (filters.userId) params.append("userId", filters.userId)
      if (filters.action) params.append("action", filters.action)
      if (filters.entityType) params.append("entityType", filters.entityType)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/admin/audit?${params.toString()}`)
      if (!response.ok) throw new Error("Error al obtener logs")

      const data = await response.json()
      setLogs(data.logs)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error("Error obteniendo logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.userId) params.append("userId", filters.userId)
    if (filters.action) params.append("action", filters.action)
    if (filters.entityType) params.append("entityType", filters.entityType)
    if (filters.startDate) params.append("startDate", filters.startDate)
    if (filters.endDate) params.append("endDate", filters.endDate)

    window.open(`/api/admin/audit/export?${params.toString()}`, "_blank")
  }

  const handleResetFilters = () => {
    setFilters({
      userId: "",
      action: "",
      entityType: "",
      startDate: "",
      endDate: "",
    })
    setPage(1)
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-[#10B981]",
      UPDATE: "bg-[#3B82F6]",
      DELETE: "bg-[#EF4444]",
      LOGIN: "bg-[#8B5CF6]",
      LOGOUT: "bg-[#64748B]",
      EXPORT: "bg-[#F59E0B]",
      DOWNLOAD: "bg-[#06B6D4]",
      PERMISSION_CHANGE: "bg-[#EC4899]",
    }
    return colors[action] || "bg-[#64748B]"
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Crear",
      UPDATE: "Actualizar",
      DELETE: "Eliminar",
      LOGIN: "Iniciar Sesión",
      LOGOUT: "Cerrar Sesión",
      EXPORT: "Exportar",
      DOWNLOAD: "Descargar",
      PERMISSION_CHANGE: "Cambiar Permisos",
    }
    return labels[action] || action
  }

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      PATIENT: "Paciente",
      APPOINTMENT: "Turno",
      MEDICAL_RECORD: "Historia Clínica",
      USER: "Usuario",
      BILLING: "Facturación",
      SETTINGS: "Configuración",
      FILE: "Archivo",
      BACKUP: "Backup",
      PLAN: "Plan",
    }
    return labels[entityType] || entityType
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría del Sistema"
        subtitle="Registro completo de todas las acciones realizadas en el sistema"
        action={
          <Button
            onClick={handleExport}
            className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        }
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="userId">Usuario</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) =>
                  setFilters({ ...filters, userId: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nombre} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Acción</Label>
              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters({ ...filters, action: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE">Crear</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                  <SelectItem value="LOGIN">Iniciar Sesión</SelectItem>
                  <SelectItem value="LOGOUT">Cerrar Sesión</SelectItem>
                  <SelectItem value="EXPORT">Exportar</SelectItem>
                  <SelectItem value="DOWNLOAD">Descargar</SelectItem>
                  <SelectItem value="PERMISSION_CHANGE">
                    Cambiar Permisos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entityType">Tipo de Entidad</Label>
              <Select
                value={filters.entityType}
                onValueChange={(value) =>
                  setFilters({ ...filters, entityType: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las entidades</SelectItem>
                  <SelectItem value="PATIENT">Paciente</SelectItem>
                  <SelectItem value="APPOINTMENT">Turno</SelectItem>
                  <SelectItem value="MEDICAL_RECORD">Historia Clínica</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="BILLING">Facturación</SelectItem>
                  <SelectItem value="SETTINGS">Configuración</SelectItem>
                  <SelectItem value="FILE">Archivo</SelectItem>
                  <SelectItem value="BACKUP">Backup</SelectItem>
                  <SelectItem value="PLAN">Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="rounded-xl"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registros de Auditoría ({total.toLocaleString()})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-sm text-[#64748B]">
                No se encontraron registros de auditoría
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        Fecha
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        Usuario
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        Acción
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        Entidad
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        IP
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedLog(log)
                          setDetailModalOpen(true)
                        }}
                      >
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#0F172A]">
                            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                              locale: es,
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#0F172A]">
                              {log.user.nombre}
                            </span>
                            <span className="text-xs text-[#64748B]">
                              {log.user.email}
                            </span>
                            <Badge variant="secondary" className="w-fit mt-1">
                              {log.user.role}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            className={cn(
                              "text-white",
                              getActionColor(log.action)
                            )}
                          >
                            {getActionLabel(log.action)}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm text-[#0F172A]">
                              {getEntityLabel(log.entityType)}
                            </span>
                            {log.entityId && (
                              <span className="text-xs text-[#64748B] font-mono">
                                {log.entityId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#64748B] font-mono">
                            {log.ipAddress || "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLog(log)
                              setDetailModalOpen(true)
                            }}
                            className="rounded-xl"
                          >
                            Ver Detalles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0]">
                  <div className="text-sm text-[#64748B]">
                    Mostrando {(page - 1) * limit + 1} -{" "}
                    {Math.min(page * limit, total)} de {total} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-[#0F172A] px-3">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || loading}
                      className="rounded-xl"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Auditoría</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#64748B] uppercase">
                    Fecha y Hora
                  </Label>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {format(new Date(selectedLog.createdAt), "dd/MM/yyyy HH:mm:ss", {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-[#64748B] uppercase">Usuario</Label>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {selectedLog.user.nombre} ({selectedLog.user.email})
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-[#64748B] uppercase">Acción</Label>
                  <Badge
                    className={cn("text-white", getActionColor(selectedLog.action))}
                  >
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-[#64748B] uppercase">
                    Tipo de Entidad
                  </Label>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {getEntityLabel(selectedLog.entityType)}
                  </p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <Label className="text-xs text-[#64748B] uppercase">ID Entidad</Label>
                    <p className="text-sm font-mono text-[#0F172A]">
                      {selectedLog.entityId}
                    </p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <Label className="text-xs text-[#64748B] uppercase">IP Address</Label>
                    <p className="text-sm font-mono text-[#0F172A]">
                      {selectedLog.ipAddress}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.userAgent && (
                <div>
                  <Label className="text-xs text-[#64748B] uppercase">User Agent</Label>
                  <p className="text-sm text-[#0F172A] break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {selectedLog.oldValues && (
                    <div>
                      <Label className="text-xs text-[#64748B] uppercase mb-2 block">
                        Valores Anteriores
                      </Label>
                      <pre className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs overflow-auto max-h-64">
                        {typeof selectedLog.oldValues === 'string' 
                          ? JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)
                          : JSON.stringify(selectedLog.oldValues, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValues && (
                    <div>
                      <Label className="text-xs text-[#64748B] uppercase mb-2 block">
                        Valores Nuevos
                      </Label>
                      <pre className="bg-[#F0FDF4] border border-[#10B981] rounded-xl p-4 text-xs overflow-auto max-h-64">
                        {typeof selectedLog.newValues === 'string'
                          ? JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)
                          : JSON.stringify(selectedLog.newValues, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
