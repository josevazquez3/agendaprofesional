# EmailService - Arquitectura de Emails

## Descripción

Sistema centralizado de envío de emails con arquitectura modular y escalable. Soporta múltiples proveedores (Gmail SMTP, SMTP genérico, Resend) con configuración dinámica.

## Arquitectura

```
services/email/
├── types.ts                 # Tipos e interfaces
├── email.config.ts          # Configuración centralizada
├── email.service.ts          # Servicio principal (singleton)
├── email-templates.ts       # Templates y helper sendSystemEmail
├── providers/
│   ├── base.provider.ts     # Clase base abstracta
│   ├── gmail.provider.ts    # Provider Gmail SMTP
│   ├── smtp.provider.ts     # Provider SMTP genérico
│   └── resend.provider.ts   # Provider Resend (fallback)
└── index.ts                 # Punto de entrada
```

## Características

- ✅ **Singleton Pattern**: Transporters reutilizados (no se crean conexiones nuevas en cada envío)
- ✅ **Retry Automático**: Configurable (maxRetries: 2, retryDelay: 1000ms)
- ✅ **Fallback Automático**: Si un proveedor falla, intenta con otros
- ✅ **Configuración Dinámica**: Desde DB o variables de entorno
- ✅ **Seguridad**: Credenciales nunca expuestas en logs o frontend
- ✅ **Escalable**: Listo para agregar colas de envío en el futuro

## Uso

### Envío básico

```typescript
import { sendEmail } from "@/services/email"

const result = await sendEmail({
  to: "usuario@example.com",
  subject: "Asunto",
  html: "<p>Contenido HTML</p>",
})
```

### Usar templates del sistema

```typescript
import { sendSystemEmail } from "@/services/email"

// Email de confirmación de turno
await sendSystemEmail("turno-confirmado", paciente.email, {
  pacienteNombre: paciente.nombre,
  profesionalNombre: profesional.nombre,
  fecha: "2026-02-10",
  hora: "10:00",
  consultorio: "Consultorio 1",
})

// Email de cancelación
await sendSystemEmail("turno-cancelado", paciente.email, {
  pacienteNombre: paciente.nombre,
  profesionalNombre: profesional.nombre,
  fecha: "2026-02-10",
  hora: "10:00",
  motivo: "Cancelado por el paciente",
})
```

### Probar conexión

```typescript
import { emailService } from "@/services/email"

const result = await emailService.testConnection("gmail")
if (result.success) {
  console.log("Conexión exitosa con", result.provider)
}
```

## Configuración

### Desde Base de Datos (Recomendado)

La configuración se guarda en la tabla `ConfiguracionSistema` y se carga automáticamente.

### Desde Variables de Entorno

```env
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=Agenda Profesional

# O para SMTP genérico
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=usuario@example.com
SMTP_PASSWORD=contraseña
SMTP_SECURE=true

# Resend (fallback)
RESEND_API_KEY=re_xxxxx
```

## Providers

### Gmail Provider

- **Host**: `smtp.gmail.com`
- **Puerto**: `587`
- **Seguridad**: `TLS`
- **Requisitos**: Verificación en 2 pasos + App Password

### SMTP Provider

- Soporta cualquier servidor SMTP
- Configuración manual completa

### Resend Provider

- Servicio de email; puede usarse como único proveedor (solo con `RESEND_API_KEY`).
- **Pruebas**: Si no defines `EMAIL_FROM`, se usa `onboarding@resend.dev` (dominio de prueba de Resend).
- **Producción**: Verifica tu dominio en [Resend](https://resend.com/domains) y define `EMAIL_FROM=noreply@tudominio.com`.

## Retry Logic

El sistema intenta reenviar automáticamente si falla:

1. Intento inicial con proveedor activo
2. Si falla, espera `retryDelay` (default: 1000ms)
3. Reintenta hasta `maxRetries` veces (default: 2)
4. Si todos los reintentos fallan, intenta con otros proveedores disponibles

## Seguridad

- ✅ Las contraseñas nunca se exponen en logs
- ✅ Las credenciales nunca llegan al frontend
- ✅ Los providers se crean solo en el backend
- ✅ Logging seguro (solo muestra proveedor y destinatario)

## Sistema de Colas (Queue-Ready)

El sistema ahora soporta envío de emails tanto en modo **sincrónico** como **asíncrono** mediante cola.

### Modo Sincrónico (Sync)

```typescript
import { sendEmail } from "@/services/email"

// Envío inmediato (bloquea hasta completar)
const result = await sendEmail({
  to: "usuario@example.com",
  subject: "Asunto",
  html: "<p>Contenido</p>",
}, 0, "sync")
```

### Modo Cola (Queue)

```typescript
import { sendEmail } from "@/services/email"

// Envío asíncrono (retorna inmediatamente, procesa en background)
const result = await sendEmail({
  to: "usuario@example.com",
  subject: "Asunto",
  html: "<p>Contenido</p>",
}, 0, "queue")
```

### Usar Cola con Templates

```typescript
import { sendSystemEmail } from "@/services/email"

// Enviar a cola (no bloquea)
await sendSystemEmail(
  "turno-confirmado",
  paciente.email,
  { pacienteNombre: "Juan", ... },
  undefined,
  "queue" // Modo cola
)
```

### Características de la Cola

- ✅ **Cola en memoria**: Funciona sin infraestructura externa
- ✅ **Worker interno**: Procesa jobs cada 5 segundos (configurable)
- ✅ **Prioridades**: `high`, `normal`, `low`
- ✅ **Retry automático**: Con exponential backoff
- ✅ **Métricas**: Jobs pendientes, procesados, fallidos
- ✅ **No bloquea**: El servidor principal nunca se bloquea

### Configuración de la Cola

Variables de entorno:

```env
EMAIL_QUEUE_INTERVAL_MS=5000          # Intervalo del worker (ms)
EMAIL_QUEUE_MAX_CONCURRENT=3         # Jobs simultáneos máximos
EMAIL_QUEUE_MAX_RETRIES=2            # Reintentos por job
EMAIL_QUEUE_RETRY_DELAY_MS=1000      # Delay base para retry (ms)
```

### Métricas de la Cola

```typescript
import { emailQueue } from "@/services/email"

const metrics = emailQueue.getMetrics()
console.log(metrics)
// {
//   pending: 5,
//   processing: 2,
//   completed: 100,
//   failed: 3,
//   totalProcessed: 103,
//   lastError: "...",
//   lastProcessedAt: Date,
//   averageProcessingTime: 250
// }
```

### Estado de un Job

```typescript
import { emailQueue } from "@/services/email"

const status = emailQueue.getJobStatus("email_1234567890_abc123")
console.log(status.status) // "pending" | "processing" | "completed" | "failed"
```

### API Endpoints

- `GET /api/email/queue/metrics` - Obtener métricas (solo ADMIN)
- `GET /api/email/queue/job/[jobId]` - Estado de un job (solo ADMIN)

### Migración Futura a Redis/BullMQ

La arquitectura está preparada para migrar fácilmente a:

- **Redis / BullMQ**: Reemplazar `email.queue.ts` con adaptador BullMQ
- **AWS SQS**: Implementar adaptador SQS
- **RabbitMQ**: Implementar adaptador RabbitMQ

La interfaz `EmailJob` y los métodos `enqueueEmail()` / `processEmailQueue()` permanecen iguales.

## Escalabilidad Futura

La arquitectura está lista para:

- ✅ Colas de envío (Bull, RabbitMQ, etc.) - **IMPLEMENTADO**
- Rate limiting por proveedor
- ✅ Métricas y monitoreo - **IMPLEMENTADO**
- Múltiples cuentas por proveedor
- Templates avanzados con variables

## Migración desde código legacy

El código existente que usa `sendEmail` de `lib/email.ts` sigue funcionando.
Para nuevo código, usar `sendSystemEmail` de `services/email/email-templates.ts`.
