const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Conexión a la base de datos exitosa')
    
    // Verificar si existen usuarios
    const userCount = await prisma.user.count()
    console.log(`📊 Usuarios en la base de datos: ${userCount}`)
    
    if (userCount === 0) {
      console.log('⚠️  No hay usuarios en la base de datos. Ejecuta: npm run db:seed')
    } else {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          nombre: true,
          role: true
        }
      })
      console.log('\n👥 Usuarios existentes:')
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.nombre}) - ${user.role}`)
      })
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:')
    console.error(error.message)
    console.log('\n💡 Soluciones posibles:')
    console.log('1. Verifica que PostgreSQL esté instalado y corriendo')
    console.log('2. Verifica la configuración de DATABASE_URL en el archivo .env')
    console.log('3. Asegúrate de que la base de datos "agenda_profesional" exista')
    console.log('4. Ejecuta: createdb agenda_profesional (si usas PostgreSQL local)')
  }
}

checkDatabase()
