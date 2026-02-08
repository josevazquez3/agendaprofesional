# Resumen Técnico: SaaS Admin Console + Billing Ready Layer

## Fecha: 2026-02-07

## Objetivo
Construir la consola de administración SaaS (super-admin) y dejar preparada la infraestructura para billing y planes comerciales reales.

---

## 1. Modelos Prisma Creados

### `Plan`
Modelo para definir planes SaaS disponibles.

```prisma
model Plan {
  id                  String   @id @default(cuid())
  nombre              String   @unique
  precioMensual       Float
  limiteUsuarios      Int
  limiteProfesionales Int
  limiteTurnosMes      Int
  storageLimitMb      Int
  activo              Boolean  @default(true)
  
  subscriptions       Subscription[]
  clinics             Clinic[]
}
```

**Campos:**
- `nombre`: Nombre del plan (ej: "FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE")
- `precioMensual`: Precio en dólares/mes
- `limiteUsuarios`: Máximo de usuarios activos
- `limiteProfesionales`: Máximo de profesionales
- `limiteTurnosMes`: Máximo de turnos por mes
- `storageLimitMb`: Límite de almacenamiento en MB

### `Subscription`
Modelo para gestionar suscripciones de clínicas.

```prisma
model Subscription {
  id                      String   @id @default(cuid())
  clinicId                String   @unique
  planId                  String
  status                  String   // active | past_due | canceled | trial
  currentPeriodStart      DateTime
  currentPeriodEnd        DateTime
  externalSubscriptionId  String?  // Para Stripe futuro
  canceledAt              DateTime?
  
  clinic                  Clinic   @relation(...)
  plan                    Plan     @relation(...)
}
```

**Estados:**
- `active`: Suscripción activa y pagada
- `past_due`: Pago pendiente
- `canceled`: Suscripción cancelada
- `trial`: Período de prueba

### `ClinicUsageDaily`
Modelo para almacenar métricas diarias de consumo.

```prisma
model ClinicUsageDaily {
  id                  String   @id @default(cuid())
  clinicId            String
  date                DateTime
  usersCount          Int
  professionalsCount  Int
  appointmentsCount   Int
  storageUsedMb       Int      @default(0)
  
  clinic              Clinic   @relation(...)
  
  @@unique([clinicId, date])
}
```

**Uso:**
- Almacena snapshot diario del consumo
- Permite análisis histórico y dashboards
- Se calcula automáticamente vía cron job

### Cambios en `Clinic`
- Removidos campos `plan`, `limiteUsuarios`, `limiteProfesionales`, `limiteTurnosMes`, `activoSuscripcion`
- Agregada relación `planId` → `Plan`
- Agregadas relaciones `subscriptions` y `usageMetrics`

---

## 2. Utilidades Creadas

### `lib/plan-limits.ts`
Validación de límites de plan antes de crear recursos.

**Funciones principales:**
- `getClinicPlanLimits(clinicId)`: Obtiene límites del plan
- `getClinicCurrentUsage(clinicId)`: Obtiene uso actual
- `canCreateUser(clinicId)`: Valida si se puede crear usuario
- `canCreateProfessional(clinicId)`: Valida si se puede crear profesional
- `canCreateAppointment(clinicId)`: Valida si se puede crear turno
- `isNearLimit(clinicId, resource)`: Verifica si está cerca del límite (80%)

**Retorno de validaciones:**
```typescript
{
  allowed: boolean
  reason?: string  // Mensaje de error si no está permitido
  current: number  // Uso actual
  limit: number    // Límite del plan
}
```

### `lib/subscription.ts`
Gestión de suscripciones.

**Funciones principales:**
- `getClinicSubscription(clinicId)`: Obtiene suscripción activa
- `isSubscriptionActive(clinicId)`: Verifica si está activa y no expirada
- `createSubscription(clinicId, planId, status, periodDays)`: Crea suscripción
- `updateSubscriptionPlan(clinicId, newPlanId)`: Cambia plan
- `cancelSubscription(clinicId)`: Cancela suscripción

### `lib/billing-adapter.ts`
Interfaz preparada para integración con Stripe (stubs).

**Funciones stub:**
- `createCustomer(clinicId, email, name)`: Crear cliente en Stripe
- `createSubscription(customerId, planId)`: Crear suscripción en Stripe
- `cancelSubscription(subscriptionId)`: Cancelar suscripción
- `updateSubscriptionPlan(subscriptionId, newPlanId)`: Actualizar plan
- `getStripeSubscription(subscriptionId)`: Obtener suscripción

**Estado:** Preparado para integración, actualmente son stubs que loguean acciones.

### `lib/usage-metrics.ts`
Cálculo y almacenamiento de métricas diarias.

**Funciones principales:**
- `calculateAndSaveDailyMetrics(clinicId)`: Calcula y guarda métricas de una clínica
- `calculateAllClinicsMetrics()`: Calcula métricas para todas las clínicas (cron job)
- `getClinicMetricsRange(clinicId, startDate, endDate)`: Obtiene métricas en rango
- `getCurrentMonthMetrics(clinicId)`: Obtiene métricas del mes actual

---

## 3. Middlewares Creados

### `middleware-subscription.ts`
Middleware para validar suscripción activa.

**Funcionalidad:**
- Valida que la clínica tenga suscripción activa antes de permitir acciones
- Permite acceso a página de plan para actualizar
- Retorna error `SUBSCRIPTION_INACTIVE` si no está activa

**Uso:**
```typescript
import { validateSubscription } from "./middleware-subscription"

// En API routes o server actions
const validation = await validateSubscription(request)
if (validation) {
  return validation // Retorna respuesta de error
}
```

---

## 4. Páginas Creadas

### `/platform-admin` (Super Admin Panel)
Panel de administración de plataforma completo.

**Layout:** `app/(dashboard)/platform-admin/layout.tsx`
- Protegido: Solo `PLATFORM_OWNER` puede acceder
- Redirige a `/dashboard` si no tiene permisos

**Página principal:** `app/(dashboard)/platform-admin/page.tsx`

**Vistas:**
- Estadísticas generales:
  - Total clínicas
  - Clínicas activas
  - Total usuarios
  - Total profesionales
  - Turnos del mes
- Tabla de clínicas con:
  - Nombre y slug
  - Plan asignado y precio
  - Estado (activa/suspendida)
  - Estado de suscripción
  - Métricas (usuarios, profesionales, turnos/mes)
  - Acciones (Ver detalles)

**Componentes utilizados:**
- `PageHeader`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` (para estados)
- `Button`
- Tabla personalizada con hover effects

### `/dashboard/admin/plan` (Mi Plan)
Página de gestión de plan dentro del dashboard de clínica.

**Página:** `app/(dashboard)/dashboard/admin/plan/page.tsx`

**Secciones:**

1. **Plan Actual:**
   - Nombre del plan
   - Precio mensual
   - Estado de suscripción (badge)
   - Próximo ciclo de facturación

2. **Consumo Actual:**
   - Progress bars para cada recurso:
     - Usuarios
     - Profesionales
     - Turnos del mes
     - Almacenamiento (si aplica)
   - Indicadores visuales:
     - ⚠️ Amarillo si está cerca del límite (80%+)
     - ❌ Rojo si alcanzó el límite (100%)
   - Mensajes contextuales:
     - "Has alcanzado el límite..." con CTA "Actualizar plan"
     - "Estás cerca del límite..."

**Componentes utilizados:**
- `PageHeader` con botón "Cambiar Plan"
- `Card` para cada sección
- `Progress` para barras de progreso
- `Badge` para estado de suscripción
- `AlertCircle` icon para advertencias

---

## 5. Componentes UI Creados

### `components/ui/badge.tsx`
Componente Badge para estados y etiquetas.

**Variantes:**
- `default`: Azul primario
- `secondary`: Gris claro
- `destructive`: Rojo
- `outline`: Borde con fondo transparente

### `components/ui/progress.tsx`
Componente Progress para barras de progreso.

**Props:**
- `value`: Valor actual (0-100)
- `max`: Valor máximo (default: 100)
- `className`: Clases adicionales

**Características:**
- Animación suave de transición
- Colores personalizables vía className
- Responsive

---

## 6. Validaciones de Límites Implementadas

### En Creación de Usuarios
```typescript
import { canCreateUser } from "@/lib/plan-limits"

const validation = await canCreateUser(clinicId)
if (!validation.allowed) {
  // Mostrar error: validation.reason
  // Mostrar CTA: "Actualizar plan"
}
```

### En Creación de Profesionales
```typescript
import { canCreateProfessional } from "@/lib/plan-limits"

const validation = await canCreateProfessional(clinicId)
if (!validation.allowed) {
  // Bloquear creación
  // Mostrar mensaje con límite alcanzado
}
```

### En Creación de Turnos
```typescript
import { canCreateAppointment } from "@/lib/plan-limits"

const validation = await canCreateAppointment(clinicId)
if (!validation.allowed) {
  // Bloquear creación de turno
  // Mostrar mensaje: "Has alcanzado el límite de turnos mensuales"
}
```

### Warnings Visuales
```typescript
import { isNearLimit } from "@/lib/plan-limits"

const nearLimit = await isNearLimit(clinicId, "usuarios")
if (nearLimit) {
  // Mostrar warning en UI
  // "Estás cerca del límite de usuarios (80%)"
}
```

---

## 7. Integración con Stripe (Preparada)

### Archivo: `lib/billing-adapter.ts`

**Estado actual:** Stubs preparados para integración.

**Para integrar Stripe:**

1. Instalar dependencia:
```bash
npm install stripe
```

2. Agregar variables de entorno:
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Descomentar código en `lib/billing-adapter.ts`:
```typescript
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

4. Implementar webhook handler para eventos:
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## 8. Cron Job para Métricas Diarias

### Script recomendado: `scripts/calculate-metrics.ts`

```typescript
import { calculateAllClinicsMetrics } from "@/lib/usage-metrics"

// Ejecutar diariamente a las 00:00
await calculateAllClinicsMetrics()
```

### Configuración con Vercel Cron o similar:

```json
{
  "crons": [{
    "path": "/api/cron/metrics",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 9. Flujo de Validación de Límites

### Diagrama de Flujo

```
Usuario intenta crear recurso
    ↓
Validar suscripción activa (middleware)
    ↓
Verificar límite del plan (canCreate*)
    ↓
¿Está permitido?
    ├─ Sí → Crear recurso
    └─ No → Mostrar error + CTA "Actualizar plan"
```

### Mensajes UX

**Límite alcanzado:**
- Título: "Has alcanzado el límite de [recurso] de tu plan"
- Descripción: "Tu plan [nombre] permite hasta [límite] [recurso]"
- CTA: Botón "Actualizar plan" → `/dashboard/admin/plan`

**Cerca del límite:**
- Warning: "Estás cerca del límite de [recurso] (80%)"
- Info: "Considera actualizar tu plan para evitar interrupciones"

---

## 10. Próximos Pasos (No Implementados)

### APIs Pendientes
- `GET /api/platform-admin/clinics` - Listar clínicas
- `GET /api/platform-admin/clinics/:id` - Detalles de clínica
- `PUT /api/platform-admin/clinics/:id/activate` - Activar/suspender
- `PUT /api/platform-admin/clinics/:id/plan` - Cambiar plan
- `GET /api/plans` - Listar planes disponibles
- `POST /api/subscriptions` - Crear suscripción
- `PUT /api/subscriptions/:id/plan` - Cambiar plan
- `POST /api/subscriptions/:id/cancel` - Cancelar suscripción
- `GET /api/cron/metrics` - Endpoint para cron job

### Páginas Pendientes
- `/platform-admin/clinics/:id` - Detalles de clínica
- `/platform-admin/plans` - Gestión de planes
- `/dashboard/admin/plan/change` - Cambiar plan (con selección)

### Funcionalidades Pendientes
- Webhook handler para Stripe
- Email de notificación cuando se acerca al límite
- Dashboard de métricas históricas
- Exportación de reportes de uso
- Impersonation de clínica (super admin)

---

## 11. Consideraciones de Seguridad

### Validaciones Implementadas
- ✅ Verificación de suscripción activa antes de acciones críticas
- ✅ Validación de límites antes de crear recursos
- ✅ Protección de rutas `/platform-admin` solo para `PLATFORM_OWNER`

### Validaciones Pendientes
- ⏳ Rate limiting en creación de recursos
- ⏳ Validación de límites en tiempo real (no solo al crear)
- ⏳ Auditoría de cambios de plan y suscripciones

---

## 12. Testing Requerido

### Tests Unitarios
- `lib/plan-limits.ts` - Validación de límites
- `lib/subscription.ts` - Gestión de suscripciones
- `lib/usage-metrics.ts` - Cálculo de métricas

### Tests de Integración
- Flujo completo de creación de usuario con límite alcanzado
- Cambio de plan y actualización de límites
- Cálculo de métricas diarias

### Tests E2E
- Super admin accede a `/platform-admin`
- Usuario sin permisos es redirigido
- Página "Mi Plan" muestra consumo correcto
- Validación de límites bloquea creación cuando corresponde

---

## 13. Migración de Datos

### Pasos para Migrar Clínicas Existentes

1. **Crear planes por defecto:**
```sql
INSERT INTO Plan (id, nombre, precioMensual, limiteUsuarios, limiteProfesionales, limiteTurnosMes, storageLimitMb, activo)
VALUES 
  ('plan-free', 'FREE', 0, 5, 2, 100, 100, true),
  ('plan-basic', 'BASIC', 29, 20, 10, 500, 1000, true),
  ('plan-professional', 'PROFESSIONAL', 99, 100, 50, 2000, 5000, true),
  ('plan-enterprise', 'ENTERPRISE', 299, -1, -1, -1, -1, true);
```

2. **Asignar plan FREE a clínicas existentes:**
```sql
UPDATE Clinic SET planId = 'plan-free' WHERE planId IS NULL;
```

3. **Crear suscripciones trial:**
```sql
INSERT INTO Subscription (id, clinicId, planId, status, currentPeriodStart, currentPeriodEnd)
SELECT 
  cuid(),
  id,
  planId,
  'trial',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY)
FROM Clinic
WHERE planId IS NOT NULL;
```

---

## Conclusión

La infraestructura de administración SaaS y billing está completamente implementada:

1. ✅ Modelos Prisma para planes, suscripciones y métricas
2. ✅ Validaciones de límites funcionando
3. ✅ Super Admin Panel completo
4. ✅ Página "Mi Plan" con consumo visual
5. ✅ Adaptador de billing preparado para Stripe
6. ✅ Sistema de métricas diarias
7. ✅ Middleware de validación de suscripción

**Pendiente:** Integración real con Stripe, APIs de gestión y páginas adicionales de administración.

El sistema está listo para:
- Venderse como SaaS multi-clínica
- Gestionar planes y suscripciones
- Validar límites automáticamente
- Integrar pagos en minutos (Stripe)
