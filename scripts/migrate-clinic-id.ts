/**
 * Script para migrar datos existentes agregando clinicId
 * Ejecutar antes de hacer prisma db push
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Iniciando migración de clinicId...")

  try {
    // 1. Crear clínica por defecto si no existe
    let defaultClinic = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      slug: string
    }>>(
      `SELECT id, nombre, slug FROM Clinic WHERE slug = 'default' LIMIT 1`
    )

    let clinicId: string

    if (defaultClinic.length === 0) {
      console.log("📦 Creando clínica por defecto...")
      const newClinicId = `clinic_default_${Date.now()}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO Clinic (id, nombre, slug, activo, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        newClinicId,
        "Clínica Principal",
        "default",
        1,
        new Date().toISOString(),
        new Date().toISOString()
      )
      clinicId = newClinicId
      console.log("✅ Clínica por defecto creada:", clinicId)
    } else {
      clinicId = defaultClinic[0].id
      console.log("✅ Usando clínica existente:", clinicId)
    }

    // 2. Verificar si las columnas clinicId ya existen
    const tables = [
      { name: "Consultorio", hasData: true },
      { name: "HistoriaClinica", hasData: true },
      { name: "ObraSocial", hasData: true },
      { name: "Profesional", hasData: true },
      { name: "Turno", hasData: true },
    ]

    for (const table of tables) {
      try {
        // Intentar agregar la columna clinicId si no existe
        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${table.name} ADD COLUMN clinicId TEXT`
        )
        console.log(`✅ Columna clinicId agregada a ${table.name}`)
      } catch (error: any) {
        if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
          console.log(`ℹ️  Columna clinicId ya existe en ${table.name}`)
        } else {
          console.error(`❌ Error agregando columna a ${table.name}:`, error.message)
        }
      }

      // Actualizar registros existentes con clinicId por defecto
      try {
        const result = await prisma.$executeRawUnsafe(
          `UPDATE ${table.name} SET clinicId = ? WHERE clinicId IS NULL`,
          clinicId
        )
        console.log(`✅ Actualizados registros en ${table.name}`)
      } catch (error: any) {
        console.error(`❌ Error actualizando ${table.name}:`, error.message)
      }
    }

    // 3. Crear índices si no existen
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_consultorio_clinicId ON Consultorio(clinicId)",
      "CREATE INDEX IF NOT EXISTS idx_historiaclinica_clinicId ON HistoriaClinica(clinicId)",
      "CREATE INDEX IF NOT EXISTS idx_obrasocial_clinicId ON ObraSocial(clinicId)",
      "CREATE INDEX IF NOT EXISTS idx_profesional_clinicId ON Profesional(clinicId)",
      "CREATE INDEX IF NOT EXISTS idx_turno_clinicId ON Turno(clinicId)",
    ]

    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql)
        console.log(`✅ Índice creado/verificado`)
      } catch (error: any) {
        console.log(`ℹ️  Índice ya existe o error:`, error.message)
      }
    }

    console.log("✅ Migración completada exitosamente")
  } catch (error) {
    console.error("❌ Error en migración:", error)
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
