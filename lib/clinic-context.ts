/**
 * Clinic Context
 * Utilidades para manejar el contexto de clínica activa en multi-tenant
 */

import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export interface ActiveClinic {
  id: string
  nombre: string
  slug: string
  logo?: string | null
  colorPrimary?: string | null
}

/**
 * Determinar clínica activa desde:
 * 1. Subdominio (clinicA.app.com)
 * 2. Session clinicId
 * 3. Primera clínica del usuario
 */
export async function getActiveClinic(): Promise<ActiveClinic | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }

    // 1. Intentar obtener desde subdominio
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const subdomain = host.split(".")[0]

    if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
      const clinic = await prisma.clinic.findUnique({
        where: { slug: subdomain },
        select: {
          id: true,
          nombre: true,
          slug: true,
          logo: true,
          colorPrimary: true,
        },
      })

      if (clinic) {
        // Verificar que el usuario pertenece a esta clínica
        const clinicUser = await prisma.clinicUser.findUnique({
          where: {
            clinicId_userId: {
              clinicId: clinic.id,
              userId: session.user.id,
            },
          },
        })

        if (clinicUser && clinicUser.activo) {
          return clinic
        }
      }
    }

    // 2. Intentar obtener desde session (si está guardado)
    // Por ahora, obtener la primera clínica activa del usuario
    const clinicUser = await prisma.clinicUser.findFirst({
      where: {
        userId: session.user.id,
        activo: true,
      },
      include: {
        clinic: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            logo: true,
            colorPrimary: true,
          },
        },
      },
    })

    if (clinicUser) {
      return clinicUser.clinic
    }

    return null
  } catch (error) {
    console.error("Error obteniendo clínica activa:", error)
    return null
  }
}

/**
 * Obtener clinicId del contexto actual
 */
export async function getClinicId(): Promise<string | null> {
  const clinic = await getActiveClinic()
  return clinic?.id || null
}

/**
 * Verificar si el usuario pertenece a una clínica
 */
export async function userBelongsToClinic(
  userId: string,
  clinicId: string
): Promise<boolean> {
  const clinicUser = await prisma.clinicUser.findUnique({
    where: {
      clinicId_userId: {
        clinicId,
        userId,
      },
    },
  })

  return clinicUser !== null && clinicUser.activo
}
