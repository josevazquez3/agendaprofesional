const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("🔧 Reseteando usuario admin...")

    // Buscar usuario admin
    const admin = await prisma.user.findUnique({
      where: { email: "admin@agendaprofesional.com" },
    })

    if (!admin) {
      console.log("❌ Usuario admin no encontrado. Creando...")
      
      // Crear usuario admin
      const adminPassword = await bcrypt.hash("admin123", 10)
      const newAdmin = await prisma.user.create({
        data: {
          email: "admin@agendaprofesional.com",
          password: adminPassword,
          nombre: "Administrador",
          role: "ADMIN",
        },
      })
      console.log("✅ Usuario admin creado exitosamente!")
      console.log("Email: admin@agendaprofesional.com")
      console.log("Contraseña: admin123")
      
      await prisma.$disconnect()
      return
    }

    // Resetear contraseña
    const adminPassword = await bcrypt.hash("admin123", 10)
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: adminPassword,
        role: "ADMIN", // Asegurar que el rol sea ADMIN
      },
    })
    console.log("✅ Contraseña del admin reseteada exitosamente!")
    console.log("Email: admin@agendaprofesional.com")
    console.log("Contraseña: admin123")
    console.log("\n✨ Proceso completado!")
    console.log("\nCredenciales de acceso:")
    console.log("Email: admin@agendaprofesional.com")
    console.log("Contraseña: admin123")
  } catch (error) {
    console.error("❌ Error reseteando admin:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
