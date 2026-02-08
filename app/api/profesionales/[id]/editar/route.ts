import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserByEmail, getUserByDni } from "@/lib/user-helpers"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      nombre, 
      email, 
      telefono, 
      dni, 
      especialidad, 
      matricula, 
      atiendeObraSocial,
      obraSocial,
      fotoPerfil,
      tieneArancel,
      arancelMonto,
      arancelDescripcion
    } = body

    // Verificar que el profesional existe
    const profesional = await prisma.profesional.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== profesional.user.email) {
      const emailUser = await getUserByEmail(email)
      if (emailUser && emailUser.id !== profesional.userId) {
        return NextResponse.json(
          { error: "El email ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI ya está en uso por otro usuario
    if (dni && dni !== profesional.user.dni) {
      const dniUser = await getUserByDni(dni)
      if (dniUser && dniUser.id !== profesional.userId) {
        return NextResponse.json(
          { error: "El DNI ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Verificar si la matrícula ya está en uso por otro profesional
    if (matricula && matricula !== profesional.matricula) {
      const matriculaExists = await prisma.profesional.findFirst({
        where: {
          matricula,
          id: {
            not: params.id,
          },
        },
      })

      if (matriculaExists) {
        return NextResponse.json(
          { error: "La matrícula ya está en uso por otro profesional" },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: profesional.userId },
      data: {
        nombre: nombre || profesional.user.nombre,
        email: email || profesional.user.email,
        telefono: telefono !== undefined ? telefono : profesional.user.telefono,
        dni: dni !== undefined ? dni : profesional.user.dni,
        obraSocial: obraSocial !== undefined ? obraSocial : profesional.user.obraSocial,
        fotoPerfil: fotoPerfil !== undefined ? fotoPerfil : profesional.user.fotoPerfil,
      },
    })

    // Actualizar profesional
    const profesionalActualizado = await prisma.profesional.update({
      where: { id: params.id },
      data: {
        especialidad: especialidad || profesional.especialidad,
        matricula: matricula !== undefined ? matricula : profesional.matricula,
        atiendeObraSocial:
          atiendeObraSocial !== undefined
            ? atiendeObraSocial
            : profesional.atiendeObraSocial,
      },
      include: {
        user: {
          select: {
            nombre: true,
            email: true,
            telefono: true,
            dni: true,
          },
        },
      },
    })

    // Gestionar arancel
    if (tieneArancel && arancelMonto) {
      // Desactivar aranceles anteriores
      await prisma.arancel.updateMany({
        where: {
          profesionalId: params.id,
          activo: true,
        },
        data: {
          activo: false,
        },
      })

      // Crear o actualizar arancel activo
      const arancelExistente = await prisma.arancel.findFirst({
        where: {
          profesionalId: params.id,
          monto: parseFloat(arancelMonto),
        },
      })

      if (arancelExistente) {
        // Reactivar arancel existente
        await prisma.arancel.update({
          where: { id: arancelExistente.id },
          data: {
            activo: true,
            descripcion: arancelDescripcion || arancelExistente.descripcion,
          },
        })
      } else {
        // Crear nuevo arancel
        await prisma.arancel.create({
          data: {
            profesionalId: params.id,
            monto: parseFloat(arancelMonto),
            descripcion: arancelDescripcion || null,
            activo: true,
          },
        })
      }
    } else if (tieneArancel === false) {
      // Desactivar todos los aranceles si no tiene arancel
      await prisma.arancel.updateMany({
        where: {
          profesionalId: params.id,
          activo: true,
        },
        data: {
          activo: false,
        },
      })
    }

    return NextResponse.json({
      message: "Profesional actualizado exitosamente",
      profesional: profesionalActualizado,
    })
  } catch (error: any) {
    console.error("Error actualizando profesional:", error)
    return NextResponse.json(
      { error: "Error al actualizar profesional" },
      { status: 500 }
    )
  }
}
