const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  try {
    // Verificar si el usuario admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@agendaprofesional.com" },
    })

    if (existingAdmin) {
      console.log("El usuario admin ya existe.")
      console.log("Email: admin@agendaprofesional.com")
      console.log("Si olvidaste la contraseña, puedes resetearla desde aquí.")
      return
    }

    // Crear usuario admin
    const adminPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
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
    console.log("ID:", admin.id)
  } catch (error) {
    console.error("❌ Error creando usuario admin:", error)
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
