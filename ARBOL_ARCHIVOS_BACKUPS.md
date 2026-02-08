# Árbol de Archivos - Sistema de Backups

## Archivos Creados

### 1. Modelos Prisma
- `prisma/schema.prisma` (modificado)
  - Modelo `BackupJob`: Configuración de backups programados
  - Modelo `BackupLog`: Historial de ejecuciones de backups

### 2. Servicios y Utilidades
- `lib/backup-service.ts` (nuevo)
  - `exportClinicData()`: Exporta todos los datos de una clínica
  - `createBackupZip()`: Genera archivo ZIP con los datos
  - `saveBackupLocal()`: Guarda backup en servidor local
  - `saveBackupS3()`: Preparado para AWS S3 (stub)
  - `saveBackupGCS()`: Preparado para Google Cloud Storage (stub)
  - `createBackup()`: Función principal para crear backup completo
  - `runBackupJob()`: Ejecuta un backup job específico

- `lib/backup-scheduler.ts` (nuevo)
  - `shouldRunBackupJob()`: Verifica si un job debe ejecutarse
  - `runScheduledBackups()`: Ejecuta todos los backups programados

- `lib/validations/backup.ts` (nuevo)
  - `createBackupJobSchema`: Validación Zod para crear backup job
  - `updateBackupJobSchema`: Validación Zod para actualizar backup job
  - `runBackupSchema`: Validación Zod para ejecutar backup

### 3. API Routes
- `app/api/admin/backups/route.ts` (nuevo)
  - `GET`: Listar backup jobs de la clínica
  - `POST`: Crear nuevo backup job

- `app/api/admin/backups/run/route.ts` (nuevo)
  - `POST`: Ejecutar backup manualmente (ahora)

- `app/api/admin/backups/[id]/route.ts` (nuevo)
  - `PATCH`: Actualizar backup job
  - `DELETE`: Eliminar backup job

- `app/api/admin/backups/download/[logId]/route.ts` (nuevo)
  - `GET`: Descargar archivo de backup

- `app/api/internal/cron/run-backups/route.ts` (nuevo)
  - `POST`: Endpoint para cron job (ejecuta backups programados)
  - `GET`: Endpoint alternativo para desarrollo/testing

### 4. UI Components
- `app/(dashboard)/dashboard/admin/backups/page.tsx` (nuevo)
  - Server component que obtiene datos iniciales

- `app/(dashboard)/dashboard/admin/backups/backups-page-client.tsx` (nuevo)
  - Client component con toda la lógica interactiva
  - Tabla de backup jobs configurados
  - Historial de ejecuciones
  - Modal para crear/editar backups
  - Botones de acción (ejecutar, pausar, eliminar, descargar)

- `components/ui/select.tsx` (modificado)
  - Componente Select completo usando Radix UI
  - SelectTrigger, SelectContent, SelectItem, SelectValue

### 5. Configuración
- `package.json` (modificado)
  - Agregado `archiver`: "^7.0.1"
  - Agregado `@types/archiver`: "^6.0.2" (devDependencies)

- `vercel.json` (modificado)
  - Agregado cron job: `/api/internal/cron/run-backups` (cada hora)

## Archivos Modificados

1. `prisma/schema.prisma`
   - Agregados modelos `BackupJob` y `BackupLog`
   - Relación con `Clinic` model

2. `package.json`
   - Dependencia `archiver` agregada
   - Tipo `@types/archiver` agregado

3. `vercel.json`
   - Cron job para backups agregado

4. `components/ui/select.tsx`
   - Reemplazado con implementación completa de Radix UI Select

## Estructura de Directorios

```
agendaprofesional/
├── prisma/
│   └── schema.prisma (modificado)
├── lib/
│   ├── backup-service.ts (nuevo)
│   ├── backup-scheduler.ts (nuevo)
│   └── validations/
│       └── backup.ts (nuevo)
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── backups/
│   │   │       ├── route.ts (nuevo)
│   │   │       ├── run/
│   │   │       │   └── route.ts (nuevo)
│   │   │       ├── [id]/
│   │   │       │   └── route.ts (nuevo)
│   │   │       └── download/
│   │   │           └── [logId]/
│   │   │               └── route.ts (nuevo)
│   │   └── internal/
│   │       └── cron/
│   │           └── run-backups/
│   │               └── route.ts (nuevo)
│   └── (dashboard)/
│       └── dashboard/
│           └── admin/
│               └── backups/
│                   ├── page.tsx (nuevo)
│                   └── backups-page-client.tsx (nuevo)
├── components/
│   └── ui/
│       └── select.tsx (modificado)
├── package.json (modificado)
└── vercel.json (modificado)
```

## Resumen de Funcionalidades

### Backend
- ✅ Exportación completa de datos clínicos (pacientes, turnos, historias clínicas, profesionales, facturación)
- ✅ Generación de archivos ZIP comprimidos
- ✅ Almacenamiento local funcional
- ✅ Preparado para AWS S3 y Google Cloud Storage
- ✅ Sistema de scheduling (diario, semanal, mensual)
- ✅ Logging completo de ejecuciones
- ✅ API REST completa para gestión de backups

### Frontend
- ✅ Interfaz admin para gestionar backups
- ✅ Crear backup jobs programados
- ✅ Ejecutar backups manuales
- ✅ Ver historial de ejecuciones
- ✅ Descargar backups
- ✅ Pausar/activar backup jobs
- ✅ Eliminar backup jobs

### Infraestructura
- ✅ Cron job configurado en Vercel
- ✅ Compatible con node-cron para desarrollo local
- ✅ Validaciones Zod en todas las APIs
- ✅ Seguridad multi-tenant (solo ADMIN puede gestionar backups)
