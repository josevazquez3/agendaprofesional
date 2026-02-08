const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("🔧 Reseteando usuario admin...")

    // Hash de la contraseña
    const hash = await bcrypt.hash("admin123", 10)

    // Buscar si el usuario existe usando SQL raw
    const users = await prisma.$queryRaw`
      SELECT id, email, nombre, role FROM User WHERE email = ${"admin@agendaprofesional.com"}
    `

    if (!users || users.length === 0) {
      // Crear usuario admin usando SQL raw
      console.log("❌ Usuario admin no encontrado. Creando...")
      const userId = `admin_${Date.now()}`
      const now = new Date().toISOString()
      
      await prisma.$executeRaw`
        INSERT INTO User (id, email, password, nombre, role, createdAt, updatedAt) 
        VALUES (${userId}, ${"admin@agendaprofesional.com"}, ${hash}, ${"Administrador"}, ${"ADMIN"}, ${now}, ${now})
      `
      
      console.log("✅ Usuario admin creado exitosamente!")
      console.log("Email: admin@agendaprofesional.com")
      console.log("Contraseña: admin123")
    } else {
      // Actualizar contraseña usando SQL raw
      const user = users[0]
      console.log(`✅ Usuario encontrado: ${user.nombre} (${user.email})`)
      
      await prisma.$executeRaw`
        UPDATE User 
        SET password = ${hash}, role = ${"ADMIN"}, updatedAt = ${new Date().toISOString()} 
        WHERE email = ${"admin@agendaprofesional.com"}
      `
      
      console.log("✅ Contraseña del admin reseteada exitosamente!")
      console.log("Email: admin@agendaprofesional.com")
      console.log("Contraseña: admin123")
    }
  } catch (error) {
    console.error("❌ Error reseteando admin:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("\n✨ Proceso completado!")
    console.log("\nCredenciales de acceso:")
    console.log("Email: admin@agendaprofesional.com")
    console.log("Contraseña: admin123")
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
