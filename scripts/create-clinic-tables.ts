/**
 * Script para crear las tablas faltantes antes de migrar datos
 */

import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { join } from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Creando tablas faltantes...")

  try {
    // Crear tabla Clinic primero
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Clinic (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        colorPrimary TEXT DEFAULT '#2563EB',
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        activo INTEGER DEFAULT 1,
        planId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (planId) REFERENCES Plan(id)
      )
    `)

    console.log("✅ Tabla Clinic creada")

    // Crear tabla Plan si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Plan (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL UNIQUE,
        precioMensual REAL NOT NULL,
        limiteUsuarios INTEGER NOT NULL,
        limiteProfesionales INTEGER NOT NULL,
        limiteTurnosMes INTEGER NOT NULL,
        storageLimitMb INTEGER NOT NULL,
        activo INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    console.log("✅ Tabla Plan creada/verificada")

    // Crear tabla ClinicUser
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ClinicUser (
        id TEXT PRIMARY KEY NOT NULL,
        clinicId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clinicId) REFERENCES Clinic(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
        UNIQUE(clinicId, userId)
      )
    `)

    console.log("✅ Tabla ClinicUser creada")

    // Crear índices
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_clinic_activo ON Clinic(activo)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_clinicuser_clinicId ON ClinicUser(clinicId)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_clinicuser_userId ON ClinicUser(userId)`)

    console.log("✅ Índices creados")

    // Crear clínica por defecto
    const clinicId = `clinic_default_${Date.now()}`
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO Clinic (id, nombre, slug, activo, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      clinicId,
      "Clínica Principal",
      "default",
      1,
      new Date().toISOString(),
      new Date().toISOString()
    )

    console.log("✅ Clínica por defecto creada:", clinicId)

    console.log("✅ Todas las tablas creadas exitosamente")
  } catch (error: any) {
    console.error("❌ Error creando tablas:", error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("🎉 Script completado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error)
    process.exit(1)
  })
