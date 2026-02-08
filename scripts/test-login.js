const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function testLogin(email, password) {
  try {
    console.log(`\n🔍 Probando login para: ${email}`)
    
    // Buscar usuario usando SQL raw
    const users = await prisma.$queryRaw`
      SELECT id, email, password, nombre, role 
      FROM User 
      WHERE email = ${email}
      LIMIT 1
    `
    
    const user = users && users.length > 0 ? users[0] : null

    if (!user) {
      console.log("❌ Usuario no encontrado")
      return false
    }

    console.log(`✅ Usuario encontrado: ${user.nombre} (${user.role})`)
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`)

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password)
    
    if (isValid) {
      console.log("✅ Contraseña válida")
      return true
    } else {
      console.log("❌ Contraseña inválida")
      return false
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
    console.error(error.stack)
    return false
  }
}

async function main() {
  try {
    console.log("🧪 Test de autenticación\n")
    
    // Test con admin
    await testLogin("admin@agendaprofesional.com", "admin123")
    
    // Listar todos los usuarios
    console.log("\n📋 Todos los usuarios en la base de datos:")
    const users = await prisma.$queryRaw`
      SELECT email, nombre, role FROM User LIMIT 10
    `
    
    if (users && users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.nombre}) - ${u.role}`)
      })
    } else {
      console.log("   ⚠️  No hay usuarios")
    }
    
  } catch (error) {
    console.error("❌ Error general:", error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
