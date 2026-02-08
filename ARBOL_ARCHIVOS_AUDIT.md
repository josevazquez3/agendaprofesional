# Árbol de Archivos - Sistema de Auditoría

## Archivos Creados

### 1. Modelos Prisma
- `prisma/schema.prisma` (modificado)
  - Modelo `AuditLog`: Registro completo de auditoría
  - Campos: id, clinicId, userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent, createdAt
  - Índices optimizados para consultas rápidas

### 2. Servicios y Utilidades
- `lib/audit-service.ts` (nuevo)
  - `logAction()`: Función principal para registrar auditorías
  - `logCreate()`: Registrar creación de entidades
  - `logUpdate()`: Registrar actualización de entidades
  - `logDelete()`: Registrar eliminación de entidades
  - `logLogin()`: Registrar inicio de sesión
  - `logLogout()`: Registrar cierre de sesión
  - `logExport()`: Registrar exportaciones
  - `logDownload()`: Registrar descargas
  - `logPermissionChange()`: Registrar cambios de permisos
  - `getRequestMetadata()`: Extraer IP y User-Agent de requests

- `lib/validations/audit.ts` (nuevo)
  - `auditFilterSchema`: Validación Zod para filtros de auditoría
  - `auditExportSchema`: Validación Zod para exportación

### 3. API Routes
- `app/api/admin/audit/route.ts` (nuevo)
  - `GET`: Listar logs de auditoría con filtros y paginación
  - Protegido: Solo ADMIN y OWNER

- `app/api/admin/audit/export/route.ts` (nuevo)
  - `GET`: Exportar logs de auditoría a CSV
  - Protegido: Solo ADMIN y OWNER

### 4. UI Components
- `app/(dashboard)/dashboard/admin/audit/page.tsx` (nuevo)
  - Server component que obtiene datos iniciales
  - Verifica permisos (solo ADMIN/OWNER)

- `app/(dashboard)/dashboard/admin/audit/audit-page-client.tsx` (nuevo)
  - Client component con toda la lógica interactiva
  - Filtros avanzados (usuario, acción, entidad, fechas)
  - Tabla paginada de logs
  - Modal de detalles con comparación old vs new
  - Exportación a CSV
  - Indicadores visuales por tipo de acción

### 5. Componentes UI Utilizados
- `components/ui/select.tsx` (ya existente - Radix UI)
  - Utilizado para filtros de auditoría

## Archivos Modificados

1. `prisma/schema.prisma`
   - Agregado modelo `AuditLog`
   - Relación con `Clinic` y `User` models
   - Índices para optimización de consultas

## Estructura de Directorios

```
agendaprofesional/
├── prisma/
│   └── schema.prisma (modificado - modelo AuditLog)
├── lib/
│   ├── audit-service.ts (nuevo)
│   └── validations/
│       └── audit.ts (nuevo)
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── audit/
│   │           ├── route.ts (nuevo)
│   │           └── export/
│   │               └── route.ts (nuevo)
│   └── (dashboard)/
│       └── dashboard/
│           └── admin/
│               └── audit/
│                   ├── page.tsx (nuevo)
│                   └── audit-page-client.tsx (nuevo)
└── ARBOL_ARCHIVOS_AUDIT.md (nuevo)
```

## Integración Automática (Ejemplos Implementados)

Se han agregado ejemplos de integración automática en:

1. **Creación de Turnos** (`app/api/turnos/crear/route.ts`):
   - Registra auditoría después de crear un turno exitosamente
   - Usa `logCreate()` con tipo `APPOINTMENT`

2. **Creación de Usuarios** (`app/api/admin/usuarios/crear/route.ts`):
   - Registra auditoría después de crear un usuario
   - Usa `logCreate()` con tipo `USER`

3. **Login** (`lib/auth.ts`):
   - Registra auditoría en el callback `authorize` después de login exitoso
   - Usa `logLogin()` con la primera clínica activa del usuario

### Integración Pendiente en Otros Endpoints

Para completar la integración automática, se debe agregar `audit.logAction()` en:

### Operaciones Críticas a Auditar:

1. **Pacientes** (`app/api/admin/patients/**`):
   - Creación: `logCreate()`
   - Actualización: `logUpdate()`
   - Eliminación: `logDelete()`

2. **Turnos** (`app/api/admin/turnos/**`):
   - Creación: `logCreate()`
   - Actualización: `logUpdate()`
   - Eliminación: `logDelete()`

3. **Historias Clínicas** (`app/api/admin/historias/**`):
   - Creación: `logCreate()`
   - Actualización: `logUpdate()`
   - Eliminación: `logDelete()`

4. **Usuarios** (`app/api/admin/usuarios/**`):
   - Creación: `logCreate()`
   - Actualización: `logUpdate()`
   - Eliminación: `logDelete()`
   - Cambio de roles: `logPermissionChange()`

5. **Autenticación** (`app/api/auth/**`):
   - Login: `logLogin()`
   - Logout: `logLogout()`

6. **Exportaciones** (`app/api/admin/**/export`):
   - Export: `logExport()`

7. **Descargas** (`app/api/admin/**/download`):
   - Download: `logDownload()`

8. **Configuraciones** (`app/api/admin/settings/**`):
   - Cambios críticos: `logUpdate()`

9. **Backups** (`app/api/admin/backups/**`):
   - Creación de backup: `logCreate()`
   - Descarga de backup: `logDownload()`

## Resumen de Funcionalidades

### Backend
- ✅ Modelo de auditoría completo con todos los campos necesarios
- ✅ Servicio de auditoría con funciones helper para cada tipo de acción
- ✅ Captura automática de IP y User-Agent
- ✅ Almacenamiento de valores antiguos y nuevos (JSON)
- ✅ API REST con filtros avanzados y paginación
- ✅ Exportación a CSV
- ✅ Seguridad multi-tenant (solo ADMIN/OWNER)
- ✅ Validaciones Zod en todas las APIs

### Frontend
- ✅ Interfaz admin para visualizar auditorías
- ✅ Filtros por usuario, acción, entidad y fechas
- ✅ Tabla paginada con indicadores visuales
- ✅ Modal de detalles con comparación old vs new
- ✅ Exportación a CSV con filtros aplicados
- ✅ Diseño responsive y profesional

### Seguridad
- ✅ Acceso restringido a ADMIN y OWNER únicamente
- ✅ Validación de permisos en server components y APIs
- ✅ Multi-tenant: solo logs de la clínica activa
- ✅ Índices optimizados para alto volumen

### Cumplimiento Médico
- ✅ Registro completo de todas las acciones
- ✅ Trazabilidad de cambios (old vs new)
- ✅ Información de contexto (IP, User-Agent)
- ✅ Exportación para auditorías externas
- ✅ Retención histórica completa

## Próximos Pasos

1. Ejecutar migración de Prisma:
   ```bash
   npx prisma migrate dev --name add_audit_system
   ```

2. Integrar auditoría automática en operaciones críticas:
   - Agregar `await audit.logAction()` en cada endpoint relevante
   - Importar `audit` desde `lib/audit-service.ts`

3. Probar el sistema:
   - Acceder a `/dashboard/admin/audit`
   - Verificar que solo ADMIN/OWNER puedan acceder
   - Probar filtros y exportación
   - Verificar que los logs se registren correctamente
