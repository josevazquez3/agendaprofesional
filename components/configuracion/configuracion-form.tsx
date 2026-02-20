"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Bell,
  Calendar,
  Mail,
  MessageSquare,
  Shield,
  Database,
  Save,
  CheckCircle,
  FolderOpen,
  FolderPlus,
  Copy,
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

  const handleBrowseFolder = () => {
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
        text: `Copia creada correctamente. ${data.sizeMB != null ? `Tamaño: ${data.sizeMB} MB. ` : ""}Ubicación: ${ubicacion}`,
      })
      setTimeout(() => setBackupMessage(null), 8000)
    } catch (e) {
      setBackupMessage({ type: "error", text: "Error de conexión al generar la copia." })
    } finally {
      setBackupRunning(false)
    }
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

      {/* Configuración SMTP Avanzada (para otros proveedores) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración SMTP Avanzada
          </CardTitle>
          <CardDescription>
            Configuración manual para otros proveedores SMTP (si no usas Gmail)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emailSmtpHost">Servidor SMTP</Label>
            <Input
              id="emailSmtpHost"
              value={config.emailSmtpHost}
              onChange={(e) => updateConfig("emailSmtpHost", e.target.value)}
              placeholder="smtp.example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emailSmtpPort">Puerto SMTP</Label>
              <Input
                id="emailSmtpPort"
                type="number"
                value={config.emailSmtpPort}
                onChange={(e) =>
                  updateConfig("emailSmtpPort", parseInt(e.target.value))
                }
              />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label htmlFor="emailSmtpSecure">Conexión segura (TLS)</Label>
              <input
                type="checkbox"
                id="emailSmtpSecure"
                checked={config.emailSmtpSecure}
                onChange={(e) => updateConfig("emailSmtpSecure", e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="emailSmtpUser">Usuario SMTP</Label>
            <Input
              id="emailSmtpUser"
              value={config.emailSmtpUser}
              onChange={(e) => updateConfig("emailSmtpUser", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emailSmtpPassword">Contraseña SMTP</Label>
            <Input
              id="emailSmtpPassword"
              type="password"
              value={config.emailSmtpPassword}
              onChange={(e) => updateConfig("emailSmtpPassword", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuración de WhatsApp
          </CardTitle>
          <CardDescription>
            Configura la integración con WhatsApp Business API
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
                  <option value="twilio">Twilio</option>
                  <option value="360dialog">360dialog</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
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
                <Label htmlFor="whatsappPhoneNumber">Número de WhatsApp</Label>
                <Input
                  id="whatsappPhoneNumber"
                  value={config.whatsappPhoneNumber}
                  onChange={(e) => updateConfig("whatsappPhoneNumber", e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
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
                    title="Seleccionar carpeta"
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
                <>Ruta completa donde se guardarán los backups. Puedes usar el Escritorio: <code className="bg-[#F1F5F9] px-1 rounded">C:\Users\TuUsuario\Desktop</code> (o <code className="bg-[#F1F5F9] px-1 rounded">...\Escritorio</code>). También: <code className="bg-[#F1F5F9] px-1 rounded">./backups</code> o <code className="bg-[#F1F5F9] px-1 rounded">C:\backups</code>.</>
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
                  Los backups se guardarán en: <strong>{config.backupStoragePath || "./backups"}</strong>
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
    </div>
  )
}
