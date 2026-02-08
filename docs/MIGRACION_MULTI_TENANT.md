# Resumen Técnico: Migración a Arquitectura Multi-Tenant SaaS

## Fecha: 2026-02-07

## Objetivo
Convertir el sistema de gestión médica en un SaaS multi-tenant listo para comercializar a múltiples clínicas con branding independiente, roles avanzados y control de permisos granular.

---

## 1. Cambios en Prisma Schema

### Nuevos Modelos Creados

#### `Clinic`
Modelo principal para representar cada clínica en el sistema multi-tenant.

```prisma
model Clinic {
  id                String   @id @default(cuid())
  nombre            String
  slug              String   @unique  // Para subdominios (clinicA.app.com)
  logo              String?
  colorPrimary      String?  @default("#2563EB")
  direccion         String?
  telefono          String?
  email             String?
  activo            Boolean  @default(true)
  
  // Campos SaaS
  plan              String   @default("FREE")
  limiteUsuarios   Int?
  limiteProfesionales Int?
  limiteTurnosMes   Int?
  activoSuscripcion Boolean  @default(false)
  
  // Relaciones
  usuarios          ClinicUser[]
  pacientes        User[]
  profesionales    Profesional[]
  turnos           Turno[]
  historiasClinicas HistoriaClinica[]
  obrasSociales    ObraSocial[]
  consultorios     Consultorio[]
  configuracion    ConfiguracionClinica?
  invitaciones     Invitation[]
}
```

#### `ClinicUser`
Relación many-to-many entre User y Clinic con rol específico por clínica.

```prisma
model ClinicUser {
  id            String   @id @default(cuid())
  clinicId      String
  userId        String
  role          String   // OWNER | ADMIN | SECRETARIA | PROFESIONAL | FACTURACION | LECTURA
  activo        Boolean  @default(true)
  
  clinic        Clinic   @relation(...)
  user          User     @relation(...)
  
  @@unique([clinicId, userId])
}
```

#### `RolePermission`
Sistema RBAC granular para permisos por rol, recurso y acción.

```prisma
model RolePermission {
  id            String   @id @default(cuid())
  role          String   // OWNER | ADMIN | SECRETARIA | PROFESIONAL | FACTURACION | LECTURA
  resource      String   // turnos | pacientes | profesionales | historia_clinica | obras_sociales | configuracion
  action        String   // create | read | update | delete
  
  @@unique([role, resource, action])
}
```

#### `Invitation`
Sistema de invitaciones para agregar usuarios a clínicas.

```prisma
model Invitation {
  id            String   @id @default(cuid())
  clinicId      String
  email         String
  role          String
  token         String   @unique
  aceptada      Boolean  @default(false)
  expiraEn      DateTime
}
```

#### `ConfiguracionClinica`
Configuración específica por clínica.

```prisma
model ConfiguracionClinica {
  id                String   @id @default(cuid())
  clinicId          String   @unique
  horarioAtencionInicio String?
  horarioAtencionFin   String?
  duracionTurnoDefault Int?   @default(30)
  especialidadesActivas String?  // JSON array
}
```

### Modelos Modificados

#### `User`
- Agregado campo `clinicId` (opcional, para pacientes)
- Agregada relación `clinicPaciente` con Clinic
- Agregada relación `clinicUsers` con ClinicUser

#### `Profesional`
- Agregado campo `clinicId` (requerido)
- Agregada relación `clinic` con Clinic

#### `Turno`
- Agregado campo `clinicId` (requerido)
- Agregada relación `clinic` con Clinic
- Agregado índice `@@index([clinicId])`

#### `HistoriaClinica`
- Agregado campo `clinicId` (requerido)
- Agregada relación `clinic` con Clinic
- Agregado índice `@@index([clinicId])`

#### `ObraSocial`
- Agregado campo `clinicId` (requerido)
- Agregada relación `clinic` con Clinic
- Cambiado `@@unique([nombre])` a `@@unique([clinicId, nombre])` (permite mismo nombre en diferentes clínicas)

#### `Consultorio`
- Agregado campo `clinicId` (requerido)
- Agregada relación `clinic` con Clinic
- Agregado índice `@@index([clinicId])`

---

## 2. Middlewares Creados

### `middleware.ts`
Middleware de Next.js para determinar clínica activa y validar acceso.

**Funcionalidad:**
- Detecta subdominio desde headers (`clinicA.app.com`)
- Valida sesión de usuario
- Agrega header `x-clinic-slug` para uso en server components
- Protege rutas `/dashboard` y `/api/dashboard`

**Ubicación:** `middleware.ts` (raíz del proyecto)

---

## 3. Utilidades y Helpers Creados

### `lib/clinic-context.ts`
Utilidades para manejar el contexto de clínica activa.

**Funciones principales:**
- `getActiveClinic()`: Determina clínica activa desde subdominio o session
- `getClinicId()`: Obtiene ID de clínica activa
- `userBelongsToClinic()`: Verifica pertenencia de usuario a clínica

**Estrategia de determinación:**
1. Subdominio (clinicA.app.com)
2. Session clinicId (si está guardado)
3. Primera clínica activa del usuario

### `lib/permissions.ts`
Sistema RBAC completo con permisos granulares.

**Funciones principales:**
- `can(role, action, resource)`: Verifica permiso
- `initializeDefaultPermissions()`: Inicializa permisos por defecto
- `getUserClinicRole()`: Obtiene rol del usuario en una clínica

**Roles definidos:**
- `OWNER`: Todos los permisos
- `ADMIN`: Gestión completa excepto eliminar clínica
- `SECRETARIA`: Gestión de turnos y pacientes
- `PROFESIONAL`: Lectura de turnos, creación/lectura de historias clínicas
- `FACTURACION`: Solo lectura de turnos, pacientes y obras sociales
- `LECTURA`: Solo lectura de todo

**Recursos:**
- `turnos`, `pacientes`, `profesionales`, `historia_clinica`, `obras_sociales`, `configuracion`, `usuarios`, `reportes`

**Acciones:**
- `create`, `read`, `update`, `delete`

### `lib/prisma-clinic.ts`
Helpers para filtrar queries por clinicId automáticamente.

**Funciones:**
- `withClinicFilter(where)`: Agrega filtro clinicId a un where clause
- `createClinicWhere(additionalWhere)`: Crea where clause con clinicId

---

## 4. Componentes React Creados

### `components/clinic/clinic-branding.tsx`
Componente para aplicar branding dinámico de la clínica.

**Funcionalidad:**
- Aplica CSS variables dinámicas (`--brand-primary`, `--brand-primary-hover`)
- Calcula color hover automáticamente (oscurece 10%)
- Se ejecuta automáticamente cuando cambia `colorPrimary`

### `components/clinic/clinic-provider.tsx`
Provider React para contexto de clínica.

**Funcionalidad:**
- Proporciona contexto de clínica activa a toda la aplicación
- Integra `ClinicBranding` automáticamente
- Hook `useClinic()` para acceder al contexto

---

## 5. Cambios en CSS Global

### `app/globals.css`
Agregadas variables CSS para branding dinámico:

```css
:root {
  --brand-primary: #2563EB;
  --brand-primary-hover: #1E40AF;
}
```

Estas variables son sobrescritas dinámicamente por `ClinicBranding`.

---

## 6. Cambios en Auth

### `lib/auth.ts`
**No modificado directamente**, pero el sistema está preparado para:
- Agregar `clinicId` al token JWT en el futuro
- Validar pertenencia a clínica en callbacks
- Asociar usuarios a clínicas en registro

---

## 7. Seguridad Multi-Tenant

### Filtros Automáticos
Todas las queries deben filtrar por `clinicId`:

```typescript
// Ejemplo de uso
const turnos = await prisma.turno.findMany({
  where: {
    clinicId: await getClinicId(),
    // ... otros filtros
  }
})
```

### Validación de Acceso
- Middleware valida sesión antes de acceder a rutas protegidas
- `userBelongsToClinic()` verifica pertenencia antes de operaciones críticas
- Permisos RBAC bloquean acciones no autorizadas

---

## 8. Migración de Datos Existente

### Pasos Requeridos

1. **Crear clínica por defecto:**
   ```sql
   INSERT INTO Clinic (id, nombre, slug, activo, plan) 
   VALUES ('default-clinic-id', 'Clínica Principal', 'default', true, 'FREE');
   ```

2. **Asociar usuarios existentes:**
   ```sql
   -- Crear ClinicUser para cada usuario ADMIN/SECRETARIA/PROFESIONAL
   INSERT INTO ClinicUser (id, clinicId, userId, role, activo)
   SELECT cuid(), 'default-clinic-id', id, role, true
   FROM User WHERE role IN ('ADMIN', 'SECRETARIA', 'PROFESIONAL');
   ```

3. **Asociar pacientes:**
   ```sql
   UPDATE User SET clinicId = 'default-clinic-id' WHERE role = 'PACIENTE';
   ```

4. **Asociar profesionales:**
   ```sql
   UPDATE Profesional SET clinicId = 'default-clinic-id';
   ```

5. **Asociar turnos:**
   ```sql
   UPDATE Turno SET clinicId = (
     SELECT clinicId FROM Profesional WHERE Profesional.id = Turno.profesionalId
   );
   ```

6. **Asociar historias clínicas:**
   ```sql
   UPDATE HistoriaClinica SET clinicId = (
     SELECT clinicId FROM Profesional WHERE Profesional.id = HistoriaClinica.profesionalId
   );
   ```

7. **Asociar obras sociales:**
   ```sql
   UPDATE ObraSocial SET clinicId = 'default-clinic-id';
   ```

8. **Asociar consultorios:**
   ```sql
   UPDATE Consultorio SET clinicId = 'default-clinic-id';
   ```

---

## 9. Próximos Pasos (No Implementados)

### APIs Pendientes
- `POST /api/clinics` - Crear clínica
- `GET /api/clinics/:id` - Obtener clínica
- `PUT /api/clinics/:id` - Actualizar clínica
- `POST /api/invitations` - Enviar invitación
- `GET /api/invitations/:token` - Aceptar invitación
- `GET /api/clinics/:id/configuracion` - Obtener configuración
- `PUT /api/clinics/:id/configuracion` - Actualizar configuración

### Páginas Pendientes
- `/dashboard/admin/clinica/configuracion` - Configuración de clínica
- `/dashboard/admin/clinica/branding` - Gestión de branding
- `/dashboard/admin/clinica/usuarios` - Gestión de usuarios de la clínica
- `/dashboard/admin/clinica/invitaciones` - Gestión de invitaciones

### Funcionalidades Pendientes
- Selector de clínica (si usuario pertenece a múltiples)
- Validación de límites de plan (usuarios, profesionales, turnos)
- Integración con sistema de pagos
- Dashboard de métricas por clínica

---

## 10. Consideraciones de Despliegue

### Variables de Entorno
```env
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://app.tudominio.com
```

### Configuración de Subdominios
Para producción, configurar DNS wildcard:
- `*.app.tudominio.com` → servidor de aplicación
- Cada clínica accede vía `clinicA.app.tudominio.com`

### Base de Datos
- SQLite actualmente (desarrollo)
- Migrar a PostgreSQL/MySQL para producción multi-tenant
- Considerar índices adicionales en `clinicId` para performance

---

## 11. Testing Requerido

### Tests Unitarios
- `lib/clinic-context.ts` - Determinación de clínica activa
- `lib/permissions.ts` - Sistema RBAC
- `lib/prisma-clinic.ts` - Filtros automáticos

### Tests de Integración
- Flujo completo de creación de clínica
- Invitación y registro de usuario
- Aplicación de branding dinámico
- Filtrado automático por clinicId

### Tests de Seguridad
- Validación de acceso cruzado entre clínicas
- Verificación de permisos RBAC
- Protección de rutas protegidas

---

## 12. Documentación de Uso

### Para Desarrolladores

**Obtener clínica activa:**
```typescript
import { getActiveClinic } from "@/lib/clinic-context"

const clinic = await getActiveClinic()
```

**Verificar permisos:**
```typescript
import { can, getUserClinicRole } from "@/lib/permissions"

const role = await getUserClinicRole(userId, clinicId)
const hasPermission = await can(role, "create", "turnos")
```

**Filtrar queries:**
```typescript
import { getClinicId } from "@/lib/clinic-context"

const clinicId = await getClinicId()
const turnos = await prisma.turno.findMany({
  where: { clinicId, /* otros filtros */ }
})
```

---

## Conclusión

La arquitectura multi-tenant está completamente implementada a nivel de schema y utilidades base. El sistema está listo para:

1. ✅ Múltiples clínicas en la misma plataforma
2. ✅ Branding independiente por clínica
3. ✅ Roles empresariales avanzados
4. ✅ Sistema de permisos granular (RBAC)
5. ✅ Estructura preparada para facturación SaaS

**Pendiente:** Implementación de APIs, páginas de administración y migración de datos existentes.
