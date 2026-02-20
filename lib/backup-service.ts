/**
 * Backup Service
 * Servicio completo para generar y gestionar backups de clínicas
 */

import { prisma } from "./prisma"
import { getClinicId } from "./clinic-context"
import * as fs from "fs/promises"
import * as path from "path"
import { createWriteStream } from "fs"
import archiver from "archiver"
import AdmZip from "adm-zip"

export interface BackupData {
  patients: any[]
  appointments: any[]
  medicalRecords: any[]
  professionals: any[]
  billing: any[]
  metadata: {
    clinicId: string
    clinicName: string
    exportedAt: string
    version: string
  }
}

/** Tipo para backup de toda la base de datos: nombre de modelo -> array de registros; _metadata es opcional y no es array */
export type FullDatabaseBackup = {
  [key: string]: unknown[] | { exportedAt: string; version: string; type: "full_database" } | undefined
}

/**
 * Exportar toda la base de datos (todas las tablas) para backup completo
 */
export async function exportFullDatabase(): Promise<FullDatabaseBackup> {
  const exportedAt = new Date().toISOString()
  const version = "1.0.0"

  const [
    Plan,
    Clinic,
    Subscription,
    ClinicUsageDaily,
    ClinicUser,
    RolePermission,
    Invitation,
    ConfiguracionClinica,
    User,
    Profesional,
    Consultorio,
    ConsultorioProfesional,
    HorarioDisponible,
    BloqueoHorario,
    Turno,
    Arancel,
    HistoriaClinica,
    ArchivoHistoriaClinica,
    Notificacion,
    ObraSocial,
    BackupJob,
    BackupLog,
    AuditLog,
  ] = await Promise.all([
    prisma.plan.findMany(),
    prisma.clinic.findMany(),
    prisma.subscription.findMany(),
    prisma.clinicUsageDaily.findMany(),
    prisma.clinicUser.findMany(),
    prisma.rolePermission.findMany(),
    prisma.invitation.findMany(),
    prisma.configuracionClinica.findMany(),
    prisma.user.findMany(),
    prisma.profesional.findMany(),
    prisma.consultorio.findMany(),
    prisma.consultorioProfesional.findMany(),
    prisma.horarioDisponible.findMany(),
    prisma.bloqueoHorario.findMany(),
    prisma.turno.findMany(),
    prisma.arancel.findMany(),
    prisma.historiaClinica.findMany(),
    prisma.archivoHistoriaClinica.findMany(),
    prisma.notificacion.findMany(),
    prisma.obraSocial.findMany(),
    prisma.backupJob.findMany(),
    prisma.backupLog.findMany(),
    prisma.auditLog.findMany(),
  ])

  const result: FullDatabaseBackup = {
    Plan,
    Clinic,
    Subscription,
    ClinicUsageDaily,
    ClinicUser,
    RolePermission,
    Invitation,
    ConfiguracionClinica,
    User,
    Profesional,
    Consultorio,
    ConsultorioProfesional,
    HorarioDisponible,
    BloqueoHorario,
    Turno,
    Arancel,
    HistoriaClinica,
    ArchivoHistoriaClinica,
    Notificacion,
    ObraSocial,
    BackupJob,
    BackupLog,
    AuditLog,
    _metadata: { exportedAt, version, type: "full_database" },
  }
  return result
}

/**
 * Exportar todos los datos de una clínica en formato estructurado
 */
export async function exportClinicData(clinicId: string): Promise<BackupData> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      nombre: true,
    },
  })

  if (!clinic) {
    throw new Error("Clínica no encontrada")
  }

  // Obtener todos los datos de la clínica
  const [patients, appointments, medicalRecords, professionals, subscriptions] = await Promise.all([
    // Pacientes (usuarios con role PACIENTE asociados a la clínica)
    prisma.user.findMany({
      where: {
        clinicId,
        role: "PACIENTE",
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        dni: true,
        fechaNacimiento: true,
        telefono: true,
        direccion: true,
        obraSocialId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // Turnos
    prisma.turno.findMany({
      where: { clinicId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        profesional: {
          select: {
            id: true,
            especialidad: true,
            user: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    }),

    // Historias clínicas
    prisma.historiaClinica.findMany({
      where: { clinicId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
          },
        },
        profesional: {
          select: {
            id: true,
            especialidad: true,
            user: {
              select: {
                nombre: true,
              },
            },
          },
        },
        archivos: {
          select: {
            id: true,
            nombreArchivo: true,
            tipoArchivo: true,
            urlArchivo: true,
            tamano: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        fechaConsulta: "desc",
      },
    }),

    // Profesionales
    prisma.profesional.findMany({
      where: { clinicId },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
        horarios: {
          select: {
            id: true,
            diaSemana: true,
            horaInicio: true,
            horaFin: true,
            duracionTurno: true,
            activo: true,
          },
        },
      },
    }),

    // Suscripciones y facturación
    prisma.subscription.findMany({
      where: { clinicId },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            precioMensual: true,
          },
        },
      },
    }),
  ])

  return {
    patients,
    appointments,
    medicalRecords,
    professionals,
    billing: subscriptions,
    metadata: {
      clinicId: clinic.id,
      clinicName: clinic.nombre,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  }
}

/**
 * Crear archivo ZIP con los datos exportados
 */
export async function createBackupZip(
  backupData: BackupData,
  outputPath: string
): Promise<{ filePath: string; sizeMB: number }> {
  return new Promise((resolve, reject) => {
    try {
      const output = createWriteStream(outputPath)
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Máxima compresión
      })

      output.on("close", () => {
        const sizeMB = archive.pointer() / 1024 / 1024
        resolve({ filePath: outputPath, sizeMB: parseFloat(sizeMB.toFixed(2)) })
      })

      archive.on("error", (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Agregar archivos JSON al ZIP
      archive.append(JSON.stringify(backupData.patients, null, 2), {
        name: "patients.json",
      })
      archive.append(JSON.stringify(backupData.appointments, null, 2), {
        name: "appointments.json",
      })
      archive.append(JSON.stringify(backupData.medicalRecords, null, 2), {
        name: "medical_records.json",
      })
      archive.append(JSON.stringify(backupData.professionals, null, 2), {
        name: "professionals.json",
      })
      archive.append(JSON.stringify(backupData.billing, null, 2), {
        name: "billing.json",
      })
      archive.append(JSON.stringify(backupData.metadata, null, 2), {
        name: "metadata.json",
      })

      archive.finalize()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Crear archivo ZIP con backup completo de toda la base de datos
 */
export async function createFullBackupZip(
  fullData: FullDatabaseBackup,
  outputPath: string
): Promise<{ filePath: string; sizeMB: number }> {
  return new Promise((resolve, reject) => {
    try {
      const output = createWriteStream(outputPath)
      const archive = archiver("zip", {
        zlib: { level: 9 },
      })

      output.on("close", () => {
        const sizeMB = archive.pointer() / 1024 / 1024
        resolve({ filePath: outputPath, sizeMB: parseFloat(sizeMB.toFixed(2)) })
      })

      archive.on("error", (err) => reject(err))
      archive.pipe(output)

      for (const [key, value] of Object.entries(fullData)) {
        if (key === "_metadata" || value === undefined) continue
        if (!Array.isArray(value)) continue
        archive.append(JSON.stringify(value, null, 2), {
          name: `${key}.json`,
        })
      }
      if (fullData._metadata) {
        archive.append(JSON.stringify(fullData._metadata, null, 2), {
          name: "metadata.json",
        })
      }

      archive.finalize()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Normaliza una ruta para el sistema actual (Windows: barras invertidas).
 * Quita comillas que Windows puede incluir al pegar "Copiar como ruta".
 */
function normalizePath(ruta: string): string {
  const trimmed = ruta.trim().replace(/^["']|["']$/g, "")
  if (process.platform === "win32") {
    return trimmed.replace(/\//g, path.sep)
  }
  return trimmed
}

/**
 * Guardar backup en almacenamiento local
 * @param customDir - Ruta configurada por el usuario (ej. ./backups, C:\backups o C:\Users\...\Desktop). Si no se pasa, usa process.cwd()/backups/clinicId
 */
export async function saveBackupLocal(
  filePath: string,
  clinicId: string,
  customDir?: string
): Promise<string> {
  const dirRaw = customDir?.trim().replace(/^["']|["']$/g, "") || ""
  const baseDir = dirRaw
    ? (path.isAbsolute(dirRaw)
        ? normalizePath(dirRaw)
        : path.join(process.cwd(), normalizePath(dirRaw)))
    : path.join(process.cwd(), "backups", clinicId)
  const backupsDir = path.join(baseDir, clinicId)

  await fs.mkdir(backupsDir, { recursive: true })

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const fileName = `backup-${dateStr}.zip`
  const destinationPath = path.join(backupsDir, fileName)

  await fs.copyFile(filePath, destinationPath)

  return destinationPath
}

/**
 * Guardar backup en S3 (preparado para futuro)
 */
export async function saveBackupS3(
  filePath: string,
  clinicId: string
): Promise<string> {
  // TODO: Implementar integración con AWS S3
  // const s3 = new AWS.S3()
  // const key = `backups/${clinicId}/${Date.now()}.zip`
  // await s3.upload({ Bucket: process.env.S3_BUCKET, Key: key, Body: fs.createReadStream(filePath) }).promise()
  // return `s3://${process.env.S3_BUCKET}/${key}`

  throw new Error("S3 storage no implementado aún")
}

/**
 * Guardar backup en Google Cloud Storage (preparado para futuro)
 */
export async function saveBackupGCS(
  filePath: string,
  clinicId: string
): Promise<string> {
  // TODO: Implementar integración con Google Cloud Storage
  // const { Storage } = require("@google-cloud/storage")
  // const storage = new Storage()
  // const bucket = storage.bucket(process.env.GCS_BUCKET)
  // const fileName = `backups/${clinicId}/${Date.now()}.zip`
  // await bucket.upload(filePath, { destination: fileName })
  // return `gs://${process.env.GCS_BUCKET}/${fileName}`

  throw new Error("GCS storage no implementado aún")
}

/**
 * Crear backup completo de toda la base de datos
 * @param clinicId - Se usa para la carpeta de destino en almacenamiento local
 * @param storagePath - Para tipo "local", ruta donde guardar (ej. ./backups o C:\backups)
 */
export async function createBackup(
  clinicId: string,
  storageType: "local" | "s3" | "gcs" = "local",
  storagePath?: string
): Promise<{ fileUrl: string; sizeMB: number }> {
  const fullData = await exportFullDatabase()

  const tempDir = path.join(process.cwd(), "tmp")
  await fs.mkdir(tempDir, { recursive: true })
  const tempFilePath = path.join(tempDir, `backup-full-${Date.now()}.zip`)

  const { filePath, sizeMB } = await createFullBackupZip(fullData, tempFilePath)

  let fileUrl: string

  switch (storageType) {
    case "local":
      fileUrl = await saveBackupLocal(filePath, clinicId, storagePath)
      break
    case "s3":
      fileUrl = await saveBackupS3(filePath, clinicId)
      break
    case "gcs":
      fileUrl = await saveBackupGCS(filePath, clinicId)
      break
    default:
      throw new Error(`Tipo de almacenamiento no soportado: ${storageType}`)
  }

  // 5. Limpiar archivo temporal
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.warn("No se pudo eliminar archivo temporal:", error)
  }

  return { fileUrl, sizeMB }
}

/**
 * Ejecutar backup job
 */
export async function runBackupJob(jobId: string): Promise<void> {
  const job = await prisma.backupJob.findUnique({
    where: { id: jobId },
    include: {
      clinic: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  })

  if (!job) {
    throw new Error("Backup job no encontrado")
  }

  if (job.status !== "active") {
    throw new Error("Backup job está pausado")
  }

  try {
    // Crear backup
    const { fileUrl, sizeMB } = await createBackup(job.clinicId, job.storageType as "local" | "s3" | "gcs")

    // Actualizar job
    await prisma.backupJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: new Date(),
        storagePath: fileUrl,
      },
    })

    // Crear log de éxito
    await prisma.backupLog.create({
      data: {
        jobId,
        executedAt: new Date(),
        fileUrl,
        status: "success",
        sizeMB,
      },
    })
  } catch (error) {
    // Crear log de error
    await prisma.backupLog.create({
      data: {
        jobId,
        executedAt: new Date(),
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Error desconocido",
      },
    })

    throw error
  }
}

/** Modelos y orden de inserción para restaurar (respeta FK) */
const RESTORE_MODEL_ORDER = [
  "Plan",
  "RolePermission",
  "Clinic",
  "ObraSocial",
  "User",
  "Profesional",
  "Consultorio",
  "ConsultorioProfesional",
  "HorarioDisponible",
  "BloqueoHorario",
  "Turno",
  "Arancel",
  "HistoriaClinica",
  "ArchivoHistoriaClinica",
  "Notificacion",
  "ConfiguracionClinica",
  "Invitation",
  "ClinicUser",
  "Subscription",
  "ClinicUsageDaily",
  "BackupJob",
  "BackupLog",
  "AuditLog",
] as const

/** Mapeo modelo -> prisma delegate (camelCase) */
const MODEL_TO_PRISMA: Record<string, keyof typeof prisma> = {
  Plan: "plan",
  Clinic: "clinic",
  Subscription: "subscription",
  ClinicUsageDaily: "clinicUsageDaily",
  ClinicUser: "clinicUser",
  RolePermission: "rolePermission",
  Invitation: "invitation",
  ConfiguracionClinica: "configuracionClinica",
  User: "user",
  Profesional: "profesional",
  Consultorio: "consultorio",
  ConsultorioProfesional: "consultorioProfesional",
  HorarioDisponible: "horarioDisponible",
  BloqueoHorario: "bloqueoHorario",
  Turno: "turno",
  Arancel: "arancel",
  HistoriaClinica: "historiaClinica",
  ArchivoHistoriaClinica: "archivoHistoriaClinica",
  Notificacion: "notificacion",
  ObraSocial: "obraSocial",
  BackupJob: "backupJob",
  BackupLog: "backupLog",
  AuditLog: "auditLog",
}

/** Convierte fechas ISO string a Date en objetos anidados */
function parseDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const [k, v] of Object.entries(result)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      result[k as keyof T] = new Date(v) as T[keyof T]
    }
  }
  return result
}

/**
 * Parsea backup desde buffer (ZIP o JSON)
 * - ZIP: extrae y lee cada Modelo.json
 * - JSON: parsea directamente (formato FullDatabaseBackup)
 */
function parseBackupBuffer(buffer: Buffer): FullDatabaseBackup {
  // Detectar ZIP: magic bytes PK (0x50 0x4B)
  const isZip = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b

  if (isZip) {
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
    const result: FullDatabaseBackup = {}

    for (const entry of entries) {
      if (entry.isDirectory) continue
      const name = entry.entryName.replace(/^[^/]+[/\\]/, "") // quitar subcarpeta si existe
      if (!name.endsWith(".json")) continue

      const content = entry.getData().toString("utf8")
      const key = name === "metadata.json" ? "_metadata" : name.replace(".json", "")
      const parsed = JSON.parse(content)

      if (key === "_metadata") {
        result._metadata = parsed as FullDatabaseBackup["_metadata"]
      } else if (Array.isArray(parsed)) {
        result[key] = parsed
      }
    }

    return result
  }

  // JSON directo
  const parsed = JSON.parse(buffer.toString("utf8"))
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("El archivo JSON no tiene un formato válido")
  }
  return parsed as FullDatabaseBackup
}

/** Vista previa de un backup: tablas con cantidad y muestra de registros */
export type BackupPreview = {
  metadata: { exportedAt?: string; version?: string }
  tables: {
    name: string
    count: number
    sample: Record<string, unknown>[] // máximo 5 registros
  }[]
}

const SAMPLE_SIZE = 5

/**
 * Obtener vista previa de un backup (sin modificar la BD).
 * Útil para mostrar al usuario qué datos se restaurarán.
 */
export function getBackupPreview(buffer: Buffer): BackupPreview {
  const data = parseBackupBuffer(buffer)

  const meta = data._metadata
  const metadata =
    meta && typeof meta === "object" && "exportedAt" in meta
      ? { exportedAt: (meta as { exportedAt?: string }).exportedAt, version: (meta as { version?: string }).version }
      : {}

  const tables: BackupPreview["tables"] = []

  for (const modelName of RESTORE_MODEL_ORDER) {
    const records = data[modelName]
    if (!Array.isArray(records) || records.length === 0) continue

    const sample = records.slice(0, SAMPLE_SIZE).map((r) => r as Record<string, unknown>)
    tables.push({ name: modelName, count: records.length, sample })
  }

  return { metadata, tables }
}

/**
 * Restaurar base de datos desde un archivo de backup (ZIP o JSON).
 * Reemplaza completamente los datos actuales.
 */
export async function restoreFromBackup(buffer: Buffer): Promise<{ restoredTables: number }> {
  const data = parseBackupBuffer(buffer)

  const meta = data._metadata
  if (
    !meta ||
    typeof meta !== "object" ||
    !("type" in meta) ||
    meta.type !== "full_database"
  ) {
    throw new Error(
      "El archivo no es un backup completo válido del sistema. Debe ser un backup generado por este sistema."
    )
  }

  let restoredTables = 0

  await prisma.$transaction(async (tx) => {
    const txPrisma = tx as typeof prisma

    // 1. Vaciar tablas (orden: tablas hijas primero para evitar violación FK al eliminar)
    const tables = RESTORE_MODEL_ORDER.slice().reverse()
    for (const modelName of tables) {
      const delegate = MODEL_TO_PRISMA[modelName]
      if (!delegate) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = txPrisma[delegate] as any
      await model.deleteMany({})
    }

    // 2. Insertar datos en orden respetando FK
    for (const modelName of RESTORE_MODEL_ORDER) {
      const delegate = MODEL_TO_PRISMA[modelName]
      const records = data[modelName]

      if (!delegate || !Array.isArray(records) || records.length === 0) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = txPrisma[delegate] as any
      const parsed = records.map((r: unknown) => parseDates(r as Record<string, unknown>))
      await model.createMany({ data: parsed })
      restoredTables++
    }
  })

  return { restoredTables }
}
