import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de base de datos...")

  // Crear planes SaaS
  console.log("📦 Creando planes...")

  const plans = [
    {
      id: "plan-starter",
      nombre: "Starter",
      precioMensual: 0,
      limiteUsuarios: 5,
      limiteProfesionales: 2,
      limiteTurnosMes: 100,
      storageLimitMb: 100,
      activo: true,
    },
    {
      id: "plan-professional",
      nombre: "Professional",
      precioMensual: 49,
      limiteUsuarios: 25,
      limiteProfesionales: 10,
      limiteTurnosMes: 1000,
      storageLimitMb: 2000,
      activo: true,
    },
    {
      id: "plan-enterprise",
      nombre: "Enterprise",
      precioMensual: 149,
      limiteUsuarios: -1, // Ilimitado
      limiteProfesionales: -1, // Ilimitado
      limiteTurnosMes: -1, // Ilimitado
      storageLimitMb: 10000,
      activo: true,
    },
  ]

  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { id: planData.id },
      update: planData,
      create: planData,
    })
    console.log(`  ✅ Plan creado/actualizado: ${plan.nombre}`)
  }

  // Crear usuario admin si no existe
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@agendaprofesional.com" },
    update: {},
    create: {
      email: "admin@agendaprofesional.com",
      password: adminPassword,
      nombre: "Administrador",
      role: "ADMIN",
    },
  })
  console.log("  ✅ Usuario admin creado/actualizado")

  // Crear clínica por defecto si no existe
  const defaultClinic = await prisma.clinic.findFirst({
    where: { slug: "default" },
  })

  if (!defaultClinic) {
    console.log("🏥 Creando clínica por defecto...")
    const clinic = await prisma.clinic.create({
      data: {
        nombre: "Clínica Principal",
        slug: "default",
        activo: true,
        planId: "plan-starter",
      },
    })
    console.log(`  ✅ Clínica creada: ${clinic.nombre}`)

    // Asociar admin a la clínica como OWNER
    await prisma.clinicUser.upsert({
      where: {
        clinicId_userId: {
          clinicId: clinic.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        userId: admin.id,
        role: "OWNER",
        activo: true,
      },
    })
    console.log("  ✅ Admin asociado a clínica como OWNER")

    // Crear suscripción trial para clínica por defecto
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 30) // 30 días de trial

    await prisma.subscription.create({
      data: {
        clinicId: clinic.id,
        planId: "plan-starter",
        status: "trial",
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
      },
    })
    console.log("  ✅ Suscripción trial creada")
  }

  // Obtener clínica para crear profesional de prueba con horarios
  const clinic = await prisma.clinic.findFirst({
    where: { slug: "default" },
  })

  if (clinic) {
    const profesionalEmail = "profesional@agendaprofesional.com"
    let userProf = await prisma.user.findUnique({
      where: { email: profesionalEmail },
    })
    if (!userProf) {
      const profPassword = await bcrypt.hash("profesional123", 10)
      userProf = await prisma.user.create({
        data: {
          email: profesionalEmail,
          password: profPassword,
          nombre: "Profesional Prueba",
          role: "PROFESIONAL",
        },
      })
      console.log("  ✅ Usuario profesional de prueba creado")
    }

    await prisma.clinicUser.upsert({
      where: {
        clinicId_userId: { clinicId: clinic.id, userId: userProf.id },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        userId: userProf.id,
        role: "PROFESIONAL",
        activo: true,
      },
    })

    let profesional = await prisma.profesional.findFirst({
      where: { userId: userProf.id, clinicId: clinic.id },
    })
    if (!profesional) {
      profesional = await prisma.profesional.create({
        data: {
          userId: userProf.id,
          clinicId: clinic.id,
          especialidad: "Medicina General",
          atiendeObraSocial: true,
        },
      })
      console.log("  ✅ Profesional de prueba creado")
    }

    const horariosIniciales = [
      { diaSemana: "LUNES", horaInicio: "09:00", horaFin: "13:00" },
      { diaSemana: "MIERCOLES", horaInicio: "09:00", horaFin: "13:00" },
      { diaSemana: "VIERNES", horaInicio: "09:00", horaFin: "17:00" },
    ]
    for (const h of horariosIniciales) {
      const existe = await prisma.horarioDisponible.findFirst({
        where: { profesionalId: profesional.id, diaSemana: h.diaSemana, activo: true },
      })
      if (!existe) {
        await prisma.horarioDisponible.create({
          data: {
            profesionalId: profesional.id,
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            duracionTurno: 30,
            activo: true,
          },
        })
        console.log(`  ✅ Horario de prueba creado (${h.diaSemana})`)
      }
    }
  }

  // Asignar horarios por defecto a TODOS los profesionales que no tengan ninguno (ej. hernan - radiologo)
  const profesionalesSinHorarios = await prisma.profesional.findMany({
    where: {
      horarios: { none: {} },
    },
    select: { id: true, especialidad: true },
  })
  const horariosPorDefecto = [
    { diaSemana: "LUNES", horaInicio: "09:00", horaFin: "13:00" },
    { diaSemana: "MIERCOLES", horaInicio: "09:00", horaFin: "13:00" },
    { diaSemana: "VIERNES", horaInicio: "09:00", horaFin: "17:00" },
  ]
  for (const p of profesionalesSinHorarios) {
    for (const h of horariosPorDefecto) {
      await prisma.horarioDisponible.create({
        data: {
          profesionalId: p.id,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          duracionTurno: 30,
          activo: true,
        },
      })
    }
    console.log(`  ✅ Horarios por defecto asignados a profesional (${p.especialidad})`)
  }

  console.log("✨ Seed completado exitosamente!")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
