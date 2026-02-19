# Migración SQL crudo → Prisma (Neon PostgreSQL)

## Completado

- **lib/auth.ts** – Login y clinicUser con Prisma (`findUnique`, `findFirst`).
- **lib/user-helpers.ts** – `getUsers`, `countUsers`, `getUserById`, `getUserByEmail`, `getUserByDni` con Prisma.
- **lib/obra-social-helpers.ts** – `getObrasSociales`, `getObraSocialById`, `getObraSocialByNombre`, `getObraSocialByCodigo` con Prisma.
- **lib/profesional-helpers.ts** – `getProfesionales`, `countProfesionales`, `getProfesionalById`, `getProfesionalByUserId` con Prisma.
- **app/api/profesionales/[id]/route.ts** – Ya usa solo Prisma.
- **app/api/profesionales/[id]/exportar/pdf/route.ts** – Consultorios, horarios y aranceles con Prisma.
- **app/api/profesionales/[id]/exportar/doc/route.ts** – Idem.
- **app/api/turnos/route.ts** – Profesional por userId con Prisma.
- **app/api/turnos/[id]/route.ts** – Profesional con Prisma.
- **app/api/turnos/[id]/editar/route.ts** – Profesional con Prisma.
- **app/api/admin/usuarios/[id]/route.ts** – Profesional con Prisma (GET y PUT).
- **app/api/obras-sociales** – POST, GET [id], PUT, DELETE ya migrados antes.
- **app/api/turnos/cancelar/route.ts** – Update turno, User telefono, User SECRETARIA/ADMIN con Prisma.
- **app/api/turnos/completar/route.ts** – ClinicUser con Prisma.
- **app/(dashboard)/dashboard/admin/audit/page.tsx** – ClinicUser y User con Prisma.

## Pendiente de migrar

Estos archivos siguen usando `$queryRawUnsafe` / `$executeRawUnsafe` y deben pasarse a Prisma para Neon/PostgreSQL:

| Archivo | Uso |
|---------|-----|
| **lib/turno-helpers.ts** | `getTurnos`, `getTurnoById`, conteos y varias consultas raw (origen de muchos 500 si se usa SQLite-style). |
| **app/api/turnos/crear/route.ts** | Varias consultas raw al crear turnos. |
| **app/api/turnos/completar/route.ts** | — (hecho: clinicUser). |
| **app/api/turnos/eliminar/route.ts** | ALTER TABLE (SQLite) y borrado; en Postgres suele hacerse por migraciones. |
| ~~app/api/horarios/dias-disponibles/route.ts~~ | **Hecho:** Prisma + UTC. |
| ~~app/api/horarios/disponibles/route.ts~~ | **Hecho:** Prisma + UTC. |
| **app/api/historia-clinica/route.ts** | executeRawUnsafe. |
| **app/api/historia-clinica/[id]/route.ts** | Varios executeRawUnsafe. |
| **app/api/historia-clinica/exportar/pdf/route.ts** | Registros, profesionales, usuarios, archivos. |
| **app/api/historia-clinica/paciente/[pacienteId]/route.ts** | ALTER TABLE (SQLite). |
| **app/api/historia-clinica/migrar-turnos/route.ts** | queryRawUnsafe. |
| **app/api/historia-clinica/profesional/pacientes/route.ts** | queryRawUnsafe. |
| **app/(dashboard)/dashboard/profesional/turnos/[id]/page.tsx** | Varias consultas raw. |
| **app/(dashboard)/dashboard/paciente/turnos/[id]/page.tsx** | Turno, consultorio. |
| **app/(dashboard)/dashboard/paciente/turnos/[id]/imprimir/page.tsx** | Varias consultas raw. |
| **app/(dashboard)/dashboard/admin/audit/page.tsx** | — (hecho). |
| **lib/configuracion-helpers.ts** | Configuración clave-valor; en Postgres conviene usar una tabla mapeada en Prisma. |
| **scripts/create-clinic-tables.ts** | Script de migración (SQLite). |
| **scripts/migrate-clinic-id.ts** | Script de migración. |

Recomendación: migrar primero **lib/turno-helpers.ts** y las rutas de **turnos** (crear, cancelar, completar, eliminar); luego historia-clínica y páginas del dashboard.

---

## Calendario y horarios al crear turno

- Si **no se ven días en azul** ni horarios al elegir fecha: el profesional debe tener al menos un **HorarioDisponible** (día + rango de hora) en la base de datos.
- Opciones:
  1. **Editar profesional** → sección "Horarios de atención" → agregar día (ej. Lunes 09:00–13:00, duración 30 min).
  2. Ejecutar el seed para crear un profesional de prueba con horario: `npm run db:seed`. Se crea "Profesional Prueba - Medicina General" con Lunes 09:00–13:00.
