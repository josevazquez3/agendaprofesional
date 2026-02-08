/**
 * Sistema de Permisos RBAC (Role-Based Access Control)
 * Permisos granulares por rol y recurso
 */

import { prisma } from "./prisma"

export type Resource =
  | "turnos"
  | "pacientes"
  | "profesionales"
  | "historia_clinica"
  | "obras_sociales"
  | "configuracion"
  | "usuarios"
  | "reportes"

export type Action = "create" | "read" | "update" | "delete"

export type ClinicRole =
  | "OWNER"
  | "ADMIN"
  | "SECRETARIA"
  | "PROFESIONAL"
  | "FACTURACION"
  | "LECTURA"

/**
 * Verificar si un rol tiene permiso para una acción en un recurso
 */
export async function can(
  role: ClinicRole,
  action: Action,
  resource: Resource
): Promise<boolean> {
  // OWNER tiene todos los permisos
  if (role === "OWNER") {
    return true
  }

  // Verificar permiso específico
  const permission = await prisma.rolePermission.findUnique({
    where: {
      role_resource_action: {
        role,
        resource,
        action,
      },
    },
  })

  return permission !== null
}

/**
 * Inicializar permisos por defecto
 */
export async function initializeDefaultPermissions() {
  const defaultPermissions: Array<{
    role: ClinicRole
    resource: Resource
    action: Action
  }> = [
    // ADMIN - Todos los permisos excepto eliminar clínica
    { role: "ADMIN", resource: "turnos", action: "create" },
    { role: "ADMIN", resource: "turnos", action: "read" },
    { role: "ADMIN", resource: "turnos", action: "update" },
    { role: "ADMIN", resource: "turnos", action: "delete" },
    { role: "ADMIN", resource: "pacientes", action: "create" },
    { role: "ADMIN", resource: "pacientes", action: "read" },
    { role: "ADMIN", resource: "pacientes", action: "update" },
    { role: "ADMIN", resource: "pacientes", action: "delete" },
    { role: "ADMIN", resource: "profesionales", action: "create" },
    { role: "ADMIN", resource: "profesionales", action: "read" },
    { role: "ADMIN", resource: "profesionales", action: "update" },
    { role: "ADMIN", resource: "profesionales", action: "delete" },
    { role: "ADMIN", resource: "historia_clinica", action: "create" },
    { role: "ADMIN", resource: "historia_clinica", action: "read" },
    { role: "ADMIN", resource: "historia_clinica", action: "update" },
    { role: "ADMIN", resource: "obras_sociales", action: "create" },
    { role: "ADMIN", resource: "obras_sociales", action: "read" },
    { role: "ADMIN", resource: "obras_sociales", action: "update" },
    { role: "ADMIN", resource: "obras_sociales", action: "delete" },
    { role: "ADMIN", resource: "configuracion", action: "read" },
    { role: "ADMIN", resource: "configuracion", action: "update" },
    { role: "ADMIN", resource: "usuarios", action: "create" },
    { role: "ADMIN", resource: "usuarios", action: "read" },
    { role: "ADMIN", resource: "usuarios", action: "update" },
    { role: "ADMIN", resource: "reportes", action: "read" },

    // SECRETARIA - Gestión de turnos y pacientes
    { role: "SECRETARIA", resource: "turnos", action: "create" },
    { role: "SECRETARIA", resource: "turnos", action: "read" },
    { role: "SECRETARIA", resource: "turnos", action: "update" },
    { role: "SECRETARIA", resource: "turnos", action: "delete" },
    { role: "SECRETARIA", resource: "pacientes", action: "create" },
    { role: "SECRETARIA", resource: "pacientes", action: "read" },
    { role: "SECRETARIA", resource: "pacientes", action: "update" },
    { role: "SECRETARIA", resource: "profesionales", action: "read" },
    { role: "SECRETARIA", resource: "historia_clinica", action: "read" },
    { role: "SECRETARIA", resource: "obras_sociales", action: "read" },
    { role: "SECRETARIA", resource: "reportes", action: "read" },

    // PROFESIONAL - Solo lectura y creación de historias clínicas
    { role: "PROFESIONAL", resource: "turnos", action: "read" },
    { role: "PROFESIONAL", resource: "turnos", action: "update" },
    { role: "PROFESIONAL", resource: "pacientes", action: "read" },
    { role: "PROFESIONAL", resource: "historia_clinica", action: "create" },
    { role: "PROFESIONAL", resource: "historia_clinica", action: "read" },
    { role: "PROFESIONAL", resource: "historia_clinica", action: "update" },

    // FACTURACION - Solo lectura de turnos y pacientes
    { role: "FACTURACION", resource: "turnos", action: "read" },
    { role: "FACTURACION", resource: "pacientes", action: "read" },
    { role: "FACTURACION", resource: "obras_sociales", action: "read" },
    { role: "FACTURACION", resource: "reportes", action: "read" },

    // LECTURA - Solo lectura de todo
    { role: "LECTURA", resource: "turnos", action: "read" },
    { role: "LECTURA", resource: "pacientes", action: "read" },
    { role: "LECTURA", resource: "profesionales", action: "read" },
    { role: "LECTURA", resource: "historia_clinica", action: "read" },
    { role: "LECTURA", resource: "obras_sociales", action: "read" },
    { role: "LECTURA", resource: "reportes", action: "read" },
  ]

  for (const perm of defaultPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_resource_action: {
          role: perm.role,
          resource: perm.resource,
          action: perm.action,
        },
      },
      create: perm,
      update: {},
    })
  }
}

/**
 * Obtener rol del usuario en una clínica
 */
export async function getUserClinicRole(
  userId: string,
  clinicId: string
): Promise<ClinicRole | null> {
  const clinicUser = await prisma.clinicUser.findUnique({
    where: {
      clinicId_userId: {
        clinicId,
        userId,
      },
    },
  })

  return (clinicUser?.role as ClinicRole) || null
}
