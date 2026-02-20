"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Bell,
  Calendar,
  MessageSquare,
  Shield,
  Database,
  Save,
  CheckCircle,
  FolderOpen,
  FolderPlus,
  Copy,
  Upload,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { GmailSmtpConfig } from "./gmail-smtp-config"

interface ConfiguracionSistema {
  notificacionesEmail: boolean
  notificacionesWhatsApp: boolean
  notificacionesInApp: boolean
  recordatorioTurnoHoras: number
  duracionTurnoDefault: number
  anticipacionMinimaHoras: number
  anticipacionMaximaDias: number
  permitirCancelacionOnline: boolean
  horasCancelacionMinimas: number
  emailFrom: string
  emailFromName: string
  emailSmtpHost: string
  emailSmtpPort: number
  emailSmtpUser: string
  emailSmtpPassword: string
  emailSmtpSecure: boolean
  whatsappEnabled: boolean
  whatsappProvider: string
  whatsappAccountSid: string
  whatsappAuthToken: string
  whatsappPhoneNumber: string
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  backupAutomatico: boolean
  backupFrecuencia: string
  backupHora: string
  backupDiaSemana: number
  backupDiaMes: number
  backupRetencionDias: number
  backupStorageType: string
  backupStoragePath: string
}

export function ConfiguracionForm() {
  const [config, setConfig] = useState<ConfiguracionSistema | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderCreated, setFolderCreated] = useState(false)
  const [backupRunning, setBackupRunning] = useState(false)
  const [backupMessage, setBackupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPastePathHint, setShowPastePathHint] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    metadata: { exportedAt?: string; version?: string }
    tables: { name: string; count: number; sample: Record<string, unknown>[] }[]
  } | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)
  const backupPathInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/configuracion")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setSaved(false)

    try {
      const response = await fetch("/api/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert("Error al guardar la configuración")
      }
    } catch (error) {
      console.error("Error guardando configuración:", error)
      alert("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof ConfiguracionSistema, value: any) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
    setFolderCreated(false)
  }

  const handleCreateFolder = async () => {
    if (!config || !config.backupStoragePath) {
      alert("Por favor, ingresa una ruta de almacenamiento primero")
      return
    }

    setCreatingFolder(true)
    setFolderCreated(false)

    try {
      const response = await fetch("/api/configuracion/crear-carpeta-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruta: config.backupStoragePath }),
      })

      const data = await response.json()

      if (response.ok) {
        // Usar la ruta real donde se creó la carpeta como ruta de almacenamiento
        if (data.ruta) {
          setConfig((c) => (c ? { ...c, backupStoragePath: data.ruta } : c))
        }
        setFolderCreated(true)
        setTimeout(() => setFolderCreated(false), 5000)
      } else {
        alert(data.error || "Error al crear la carpeta")
      }
    } catch (error) {
      console.error("Error creando carpeta:", error)
      alert("Error al crear la carpeta")
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleBrowseFolder = async () => {
    const supportsPicker =
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window

    if (supportsPicker) {
      try {
        await (window as any).showDirectoryPicker()
        setShowPastePathHint(true)
        setTimeout(() => backupPathInputRef.current?.focus(), 150)
        setTimeout(() => setShowPastePathHint(false), 10000)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        const isBlocked =
          err?.name === "SecurityError" ||
          err?.message?.includes("archivos del sistema") ||
          err?.message?.includes("system files")
        const msg = isBlocked
          ? "El navegador no permite elegir esa carpeta (protección de carpetas del sistema). Elige una subcarpeta como Escritorio o Documentos, o escribe la ruta manualmente en el campo de arriba (por ejemplo C:\\Users\\TuUsuario\\Desktop)."
          : "No se pudo abrir el selector de carpeta. " + (err?.message || "Escribe o pega la ruta en el campo de arriba.")
        alert(msg)
      }
      return
    }

    const msg =
      "Para guardar los backups en cualquier carpeta (incluido el Escritorio):\n\n" +
      "1. Abre el Explorador de archivos y ve a la carpeta deseada (ej. Escritorio: abre 'Este equipo' → 'Escritorio').\n\n" +
      "2. Haz clic en la barra de direcciones para ver la ruta completa. Copia la ruta (Ctrl+C) o clic derecho en la carpeta → 'Copiar como ruta'.\n\n" +
      "3. Pega la ruta en el campo 'Ruta de Almacenamiento' de esta página.\n\n" +
      "Ejemplos:\n" +
      "• Escritorio: C:\\Users\\TuUsuario\\Desktop\n" +
      "• O si Windows está en español: C:\\Users\\TuUsuario\\Escritorio\n\n" +
      "4. Pulsa 'Hacer copia' para generar el backup en esa carpeta."
    alert(msg)
  }

  const handleRunBackup = async () => {
    if (!config) return
    if (config.backupStorageType === "local" && !config.backupStoragePath?.trim()) {
      setBackupMessage({ type: "error", text: "Ingresa la ruta de almacenamiento antes de hacer la copia." })
      return
    }
    setBackupRunning(true)
    setBackupMessage(null)
    try {
      const response = await fetch("/api/admin/backups/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageType: config.backupStorageType || "local",
          storagePath: config.backupStoragePath?.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setBackupMessage({ type: "error", text: data.error || "Error al generar la copia de seguridad." })
        return
      }
      const ubicacion = data.fileUrl || config.backupStoragePath || "./backups"
      setBackupMessage({
        type: "success",
        text: `Copia creada correctamente. ${data.sizeMB != null ? `Tamaño: ${data.sizeMB} MB. ` : ""}Archivo guardado en: ${ubicacion}. Abre esa ruta en el Explorador para ver el .zip.`,
      })
      setTimeout(() => setBackupMessage(null), 8000)
    } catch (e) {
      setBackupMessage({ type: "error", text: "Error de conexión al generar la copia." })
    } finally {
      setBackupRunning(false)
    }
  }

  const handlePreview = async () => {
    if (!restoreFile) {
      alert("Selecciona un archivo ZIP de backup")
      return
    }
    setPreviewLoading(true)
    setPreviewData(null)
    try {
      const formData = new FormData()
      formData.append("file", restoreFile)
      const response = await fetch("/api/admin/backups/preview", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al cargar vista previa")
      setPreviewData(data)
      setPreviewIndex(0)
      setPreviewOpen(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al cargar vista previa")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile) return
    if (
      !confirm(
        "⚠️ ADVERTENCIA: Restaurar reemplazará TODOS los datos actuales de la base de datos. Esta acción no se puede deshacer. ¿Continuar?"
      )
    ) {
      return
    }

    setPreviewOpen(false)
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
      setPreviewData(null)
      router.refresh()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error restaurando:", error)
      alert(error instanceof Error ? error.message : "Error al restaurar el backup")
    } finally {
      setRestoreLoading(false)
    }
  }

  const TABLE_LABELS: Record<string, string> = {
    Plan: "Planes",
    Clinic: "Clínicas",
    User: "Usuarios",
    Profesional: "Profesionales",
    Turno: "Turnos",
    HistoriaClinica: "Historias clínicas",
    Consultorio: "Consultorios",
    HorarioDisponible: "Horarios",
    Arancel: "Aranceles",
    ObraSocial: "Obras sociales",
    Notificacion: "Notificaciones",
    ConfiguracionClinica: "Configuración clínica",
    Invitation: "Invitaciones",
    ClinicUser: "Usuarios de clínica",
    Subscription: "Suscripciones",
    BackupJob: "Jobs de backup",
    BackupLog: "Logs de backup",
    AuditLog: "Registros de auditoría",
    RolePermission: "Permisos",
    ClinicUsageDaily: "Uso diario",
    ConsultorioProfesional: "Consultorio-Profesional",
    BloqueoHorario: "Bloqueos de horario",
    ArchivoHistoriaClinica: "Archivos historia clínica",
  }

  if (loading) {
    return <div className="text-center py-8">Cargando configuración...</div>
  }

  if (!config) {
    return <div className="text-center py-8">Error al cargar configuración</div>
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuración de Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo se envían las notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notificacionesEmail">Notificaciones por Email</Label>
            <input
              type="checkbox"
              id="notificacionesEmail"
              checked={config.notificacionesEmail}
              onChange={(e) => updateConfig("notificacionesEmail", e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notificacionesWhatsApp">Notificaciones por WhatsApp</Label>
            <input
              type="checkbox"
              id="notificacionesWhatsApp"
              checked={config.notificacionesWhatsApp}
              onChange={(e) => updateConfig("notificacionesWhatsApp", e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notificacionesInApp">Notificaciones en la App</Label>
            <input
              type="checkbox"
              id="notificacionesInApp"
              checked={config.notificacionesInApp}
              onChange={(e) => updateConfig("notificacionesInApp", e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div>
            <Label htmlFor="recordatorioTurnoHoras">
              Recordatorio de turno (horas antes)
            </Label>
            <Input
              id="recordatorioTurnoHoras"
              type="number"
              value={config.recordatorioTurnoHoras}
              onChange={(e) =>
                updateConfig("recordatorioTurnoHoras", parseInt(e.target.value))
              }
              min={1}
              max={168}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Turnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Parámetros de Turnos
          </CardTitle>
          <CardDescription>
            Configura los parámetros relacionados con los turnos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="duracionTurnoDefault">
              Duración por defecto de turnos (minutos)
            </Label>
            <Input
              id="duracionTurnoDefault"
              type="number"
              value={config.duracionTurnoDefault}
              onChange={(e) =>
                updateConfig("duracionTurnoDefault", parseInt(e.target.value))
              }
              min={15}
              max={120}
            />
          </div>
          <div>
            <Label htmlFor="anticipacionMinimaHoras">
              Anticipación mínima para agendar (horas)
            </Label>
            <Input
              id="anticipacionMinimaHoras"
              type="number"
              value={config.anticipacionMinimaHoras}
              onChange={(e) =>
                updateConfig("anticipacionMinimaHoras", parseInt(e.target.value))
              }
              min={0}
            />
          </div>
          <div>
            <Label htmlFor="anticipacionMaximaDias">
              Anticipación máxima para agendar (días)
            </Label>
            <Input
              id="anticipacionMaximaDias"
              type="number"
              value={config.anticipacionMaximaDias}
              onChange={(e) =>
                updateConfig("anticipacionMaximaDias", parseInt(e.target.value))
              }
              min={1}
              max={365}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="permitirCancelacionOnline">
              Permitir cancelación online
            </Label>
            <input
              type="checkbox"
              id="permitirCancelacionOnline"
              checked={config.permitirCancelacionOnline}
              onChange={(e) =>
                updateConfig("permitirCancelacionOnline", e.target.checked)
              }
              className="h-4 w-4"
            />
          </div>
          {config.permitirCancelacionOnline && (
            <div>
              <Label htmlFor="horasCancelacionMinimas">
                Horas mínimas antes de cancelar
              </Label>
              <Input
                id="horasCancelacionMinimas"
                type="number"
                value={config.horasCancelacionMinimas}
                onChange={(e) =>
                  updateConfig("horasCancelacionMinimas", parseInt(e.target.value))
                }
                min={0}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración Gmail SMTP (Guida y simplificada) */}
      <GmailSmtpConfig
        config={{
          emailFrom: config.emailFrom,
          emailFromName: config.emailFromName,
          emailSmtpHost: config.emailSmtpHost,
          emailSmtpPort: config.emailSmtpPort,
          emailSmtpUser: config.emailSmtpUser,
          emailSmtpPassword: config.emailSmtpPassword,
          emailSmtpSecure: config.emailSmtpSecure,
        }}
        onConfigChange={(field, value) => updateConfig(field as keyof ConfiguracionSistema, value)}
      />

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuración de WhatsApp
          </CardTitle>
          <CardDescription>
            Elige un proveedor. <strong>CallMeBot</strong> es la opción más sencilla (solo 1 clave, gratis para uso personal).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsappEnabled">Habilitar WhatsApp</Label>
            <input
              type="checkbox"
              id="whatsappEnabled"
              checked={config.whatsappEnabled}
              onChange={(e) => updateConfig("whatsappEnabled", e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          {config.whatsappEnabled && (
            <>
              <div>
                <Label htmlFor="whatsappProvider">Proveedor</Label>
                <select
                  id="whatsappProvider"
                  value={config.whatsappProvider}
                  onChange={(e) => updateConfig("whatsappProvider", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                >
                  <option value="callmebot">CallMeBot (sencillo, 1 clave)</option>
                  <option value="twilio">Twilio (Business API)</option>
                  <option value="360dialog">360dialog</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              {config.whatsappProvider === "callmebot" ? (
                <div>
                  <Label htmlFor="whatsappAccountSid">API Key de CallMeBot</Label>
                  <Input
                    id="whatsappAccountSid"
                    value={config.whatsappAccountSid}
                    onChange={(e) => updateConfig("whatsappAccountSid", e.target.value)}
                    placeholder="Tu API key de CallMeBot"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtén tu clave gratis en{" "}
                    <a
                      href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] underline"
                    >
                      callmebot.com
                    </a>
                    : agrega el bot a WhatsApp, envía el mensaje de activación y usa la API key que te devuelve. Uso personal.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="whatsappAccountSid">Account SID / API Key</Label>
                    <Input
                      id="whatsappAccountSid"
                      value={config.whatsappAccountSid}
                      onChange={(e) => updateConfig("whatsappAccountSid", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsappAuthToken">Auth Token / API Secret</Label>
                    <Input
                      id="whatsappAuthToken"
                      type="password"
                      value={config.whatsappAuthToken}
                      onChange={(e) => updateConfig("whatsappAuthToken", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsappPhoneNumber">Número de WhatsApp (remitente)</Label>
                    <Input
                      id="whatsappPhoneNumber"
                      value={config.whatsappPhoneNumber}
                      onChange={(e) => updateConfig("whatsappPhoneNumber", e.target.value)}
                      placeholder="+5491112345678"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Número con código de país (ej. +54 9 11 1234-5678 para Argentina).
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>
            Configura los parámetros de seguridad del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="passwordMinLength">
              Longitud mínima de contraseña
            </Label>
            <Input
              id="passwordMinLength"
              type="number"
              value={config.passwordMinLength}
              onChange={(e) =>
                updateConfig("passwordMinLength", parseInt(e.target.value))
              }
              min={6}
              max={32}
            />
          </div>
          <div className="space-y-2">
            <Label>Requisitos de contraseña</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="passwordRequireUppercase" className="font-normal">
                Requerir mayúsculas
              </Label>
              <input
                type="checkbox"
                id="passwordRequireUppercase"
                checked={config.passwordRequireUppercase}
                onChange={(e) =>
                  updateConfig("passwordRequireUppercase", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="passwordRequireLowercase" className="font-normal">
                Requerir minúsculas
              </Label>
              <input
                type="checkbox"
                id="passwordRequireLowercase"
                checked={config.passwordRequireLowercase}
                onChange={(e) =>
                  updateConfig("passwordRequireLowercase", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="passwordRequireNumbers" className="font-normal">
                Requerir números
              </Label>
              <input
                type="checkbox"
                id="passwordRequireNumbers"
                checked={config.passwordRequireNumbers}
                onChange={(e) =>
                  updateConfig("passwordRequireNumbers", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="passwordRequireSpecial" className="font-normal">
                Requerir caracteres especiales
              </Label>
              <input
                type="checkbox"
                id="passwordRequireSpecial"
                checked={config.passwordRequireSpecial}
                onChange={(e) =>
                  updateConfig("passwordRequireSpecial", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sessionTimeoutMinutes">
              Tiempo de sesión (minutos)
            </Label>
            <Input
              id="sessionTimeoutMinutes"
              type="number"
              value={config.sessionTimeoutMinutes}
              onChange={(e) =>
                updateConfig("sessionTimeoutMinutes", parseInt(e.target.value))
              }
              min={15}
              max={1440}
            />
          </div>
          <div>
            <Label htmlFor="maxLoginAttempts">
              Intentos máximos de login
            </Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={config.maxLoginAttempts}
              onChange={(e) =>
                updateConfig("maxLoginAttempts", parseInt(e.target.value))
              }
              min={3}
              max={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup (solo manual) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup y Mantenimiento
          </CardTitle>
          <CardDescription>
            Configura dónde se guardan las copias de seguridad. Los backups se realizan de forma manual desde la sección Backups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backupRetencionDias">
              Retención de backups (días)
            </Label>
            <Input
              id="backupRetencionDias"
              type="number"
              value={config.backupRetencionDias}
              onChange={(e) =>
                updateConfig("backupRetencionDias", parseInt(e.target.value))
              }
              min={7}
              max={365}
              className="mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Cuántos días conservar los backups generados manualmente
            </p>
          </div>
          <div className="pt-2 border-t border-[#E2E8F0]">
            <Label htmlFor="backupStorageType" className="text-base font-semibold">
              Tipo de Almacenamiento
            </Label>
            <select
              id="backupStorageType"
              value={config.backupStorageType}
              onChange={(e) => updateConfig("backupStorageType", e.target.value)}
              className="flex h-10 w-full mt-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            >
              <option value="local">Almacenamiento Local</option>
              <option value="s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
            </select>
            <p className="text-xs text-[#64748B] mt-1">
              Selecciona dónde se guardarán los backups manuales
            </p>
          </div>
          <div>
            <Label htmlFor="backupStoragePath">
              Ruta de Almacenamiento
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                ref={backupPathInputRef}
                id="backupStoragePath"
                type="text"
                value={config.backupStoragePath}
                onChange={(e) => updateConfig("backupStoragePath", e.target.value)}
                placeholder={config.backupStorageType === "local" ? "./backups" : "mi-bucket-backups"}
                className="flex-1"
              />
              {config.backupStorageType === "local" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBrowseFolder}
                    className="border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    title="Seleccionar carpeta (elige Escritorio, Documentos o una subcarpeta; el navegador puede bloquear carpetas del sistema)"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder || !config.backupStoragePath}
                    className="border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    title="Crear carpeta si no existe"
                  >
                    {creatingFolder ? (
                      "Creando..."
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4 mr-1" />
                        Crear Carpeta
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            {showPastePathHint && (
              <div className="mt-2 p-3 bg-[#EFF6FF] border border-[#2563EB]/30 rounded-lg">
                <p className="text-sm text-[#1E40AF]">
                  Carpeta elegida. Pega aquí la ruta: en el Explorador de Windows, clic derecho en la carpeta que seleccionaste → <strong>Copiar como ruta</strong>, y pégala en el campo de arriba (Ctrl+V).
                </p>
              </div>
            )}
            {folderCreated && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Carpeta creada exitosamente en: {config.backupStoragePath}
                </p>
              </div>
            )}
            <p className="text-xs text-[#64748B] mt-2">
              {config.backupStorageType === "local" && (
                <>
                  Ruta completa donde se guardarán los backups. Si al usar &quot;Seleccionar carpeta&quot; el navegador dice que no puede abrir la carpeta (contiene archivos del sistema), elige una subcarpeta como <strong>Escritorio</strong> o <strong>Documentos</strong>, o escribe la ruta a mano abajo. Ejemplos: Escritorio <code className="bg-[#F1F5F9] px-1 rounded">C:\Users\TuUsuario\Desktop</code> (o <code className="bg-[#F1F5F9] px-1 rounded">...\Escritorio</code>), <code className="bg-[#F1F5F9] px-1 rounded">./backups</code> o <code className="bg-[#F1F5F9] px-1 rounded">C:\backups</code>.
                </>
              )}
              {config.backupStorageType === "s3" && (
                <>Nombre del bucket de S3. Ejemplo: <code className="bg-[#F1F5F9] px-1 rounded">mi-bucket-backups</code></>
              )}
              {config.backupStorageType === "gcs" && (
                <>Nombre del bucket de GCS. Ejemplo: <code className="bg-[#F1F5F9] px-1 rounded">mi-bucket-backups</code></>
              )}
            </p>
            <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <p className="text-sm font-medium text-[#0F172A] mb-1">
                📁 Ubicación actual de backups:
              </p>
              <p className="text-sm text-[#64748B] font-mono break-all">
                {config.backupStorageType === "local"
                  ? config.backupStoragePath || "./backups"
                  : `${config.backupStorageType.toUpperCase()}: ${config.backupStoragePath || "no configurado"}`
                }
              </p>
              {config.backupStorageType === "local" && (
                <p className="text-xs text-[#64748B] mt-2">
                  Los backups se guardan en una subcarpeta con el ID de la clínica: <strong>{config.backupStoragePath || "./backups"}</strong> → carpeta <code className="bg-[#F1F5F9] px-1 rounded">[id-clínica]</code> → archivo <code className="bg-[#F1F5F9] px-1 rounded">backup-xxx.zip</code>. Revisa esa ruta completa tras hacer la copia.
                </p>
              )}
            </div>
            <div className="pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                onClick={handleRunBackup}
                disabled={backupRunning || (config.backupStorageType === "local" && !config.backupStoragePath?.trim())}
                className="bg-[#2563EB] hover:bg-[#1E40AF]"
              >
                {backupRunning ? (
                  "Generando copia..."
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Hacer copia
                  </>
                )}
              </Button>
              <p className="text-xs text-[#64748B] mt-2">
                Genera una copia de seguridad ahora y la guarda en la carpeta configurada arriba.
              </p>
              {backupMessage && (
                <div
                  className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                    backupMessage.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {backupMessage.type === "success" ? (
                    <CheckCircle className="h-5 w-5 shrink-0" />
                  ) : (
                    <span className="text-red-600 font-medium">Error</span>
                  )}
                  <span className="text-sm">{backupMessage.text}</span>
                </div>
              )}
            </div>

            {/* Restaurar backup */}
            <div className="pt-6 mt-6 border-t border-[#E2E8F0]">
              <p className="text-sm font-medium text-[#0F172A] mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Restaurar base de datos
              </p>
              <p className="text-xs text-[#64748B] mb-3">
                Sube un archivo ZIP generado por el backup del sistema para reemplazar la base de datos actual.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Esta acción eliminará todos los datos actuales y los reemplazará con los del archivo. Es irreversible.</span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="restore-file">Archivo de backup (.zip)</Label>
                  <Input
                    id="restore-file"
                    type="file"
                    accept=".zip,.json"
                    onChange={(e) => {
                      setRestoreFile(e.target.files?.[0] ?? null)
                      setPreviewData(null)
                    }}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewLoading || !restoreFile}
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Vista previa"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleRestore}
                  disabled={restoreLoading || !restoreFile}
                  variant="destructive"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <div className="flex justify-end gap-4">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Configuración guardada</span>
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2563EB] hover:bg-[#1E40AF]"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>

      {/* Modal Vista previa del backup */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl">
          <DialogHeader>
            <DialogTitle>Vista previa del backup</DialogTitle>
            <DialogDescription>
              Revisa qué datos contiene el backup. Usa las flechas para navegar entre tablas.
            </DialogDescription>
          </DialogHeader>

          {previewData && previewData.tables.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="font-medium text-[#0F172A]">
                    {TABLE_LABELS[previewData.tables[previewIndex]?.name] ||
                      previewData.tables[previewIndex]?.name}
                  </span>
                  <span className="text-[#64748B] ml-2">
                    ({previewData.tables[previewIndex]?.count} registros)
                  </span>
                  <p className="text-xs text-[#64748B] mt-1">
                    {previewIndex + 1} de {previewData.tables.length}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPreviewIndex((i) =>
                      Math.min(previewData.tables.length - 1, i + 1)
                    )
                  }
                  disabled={previewIndex === previewData.tables.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] p-4">
                <p className="text-xs text-[#64748B] mb-3">
                  Muestra de hasta 5 registros:
                </p>
                <div className="space-y-3">
                  {previewData.tables[previewIndex]?.sample.map((record, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-[#E2E8F0] text-sm"
                    >
                      {Object.entries(record)
                        .filter(
                          ([k, v]) =>
                            v !== null &&
                            v !== undefined &&
                            v !== "" &&
                            !k.toLowerCase().includes("password")
                        )
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex gap-2 py-1"
                          >
                            <span className="text-[#64748B] font-medium min-w-[120px]">
                              {key}:
                            </span>
                            <span className="text-[#0F172A] truncate max-w-[280px]" title={String(value)}>
                              {typeof value === "object" && value !== null
                                ? JSON.stringify(value)
                                : /^\d{4}-\d{2}-\d{2}T/.test(String(value))
                                  ? new Date(String(value)).toLocaleString("es-AR")
                                  : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              {previewData.metadata?.exportedAt && (
                <p className="text-xs text-[#64748B] mt-2">
                  Backup exportado: {previewData.metadata.exportedAt}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRestore}
                  disabled={restoreLoading}
                >
                  {restoreLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    "Restaurar base de datos"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[#64748B]">
              No hay datos para mostrar
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
