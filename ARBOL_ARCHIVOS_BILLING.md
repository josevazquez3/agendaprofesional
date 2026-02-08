# Árbol de Archivos - Billing Production Layer

## Archivos Creados

```
prisma/
  seed.ts                                    [MODIFICADO] - Seed con planes SaaS

lib/
  validations/
    billing.ts                               [NUEVO] - Validaciones Zod para billing
  billing-adapter.ts                         [MODIFICADO] - Integración Stripe real
  plan-limits.ts                             [MODIFICADO] - Soporte límites ilimitados (-1)

app/api/
  platform/
    plans/
      route.ts                               [NUEVO] - GET, POST /api/platform/plans
      [id]/
        route.ts                             [NUEVO] - PATCH /api/platform/plans/:id
    subscriptions/
      route.ts                               [NUEVO] - GET /api/platform/subscriptions
      [id]/
        change-plan/
          route.ts                           [NUEVO] - PATCH /api/platform/subscriptions/:id/change-plan
        cancel/
          route.ts                           [NUEVO] - POST /api/platform/subscriptions/:id/cancel
  webhooks/
    stripe/
      route.ts                               [NUEVO] - POST /api/webhooks/stripe
  internal/
    cron/
      calculate-metrics/
        route.ts                             [NUEVO] - POST /api/internal/cron/calculate-metrics

app/(dashboard)/dashboard/admin/plan/
  page.tsx                                   [MODIFICADO] - Server component
  plan-page-client.tsx                       [NUEVO] - Client component con acciones billing

components/
  billing/
    plan-selector-modal.tsx                  [NUEVO] - Modal selección de plan

vercel.json                                  [NUEVO] - Configuración cron job

package.json                                 [MODIFICADO] - Agregado stripe dependency

docs/
  BILLING_PRODUCTION_COMPLETE.md             [NUEVO] - Documentación técnica completa
```

## Archivos Modificados

- `prisma/seed.ts` - Agregado creación de planes y clínica por defecto
- `lib/billing-adapter.ts` - Integración real con Stripe (removidos stubs)
- `lib/plan-limits.ts` - Soporte para límites ilimitados (-1)
- `package.json` - Agregado `stripe` dependency
- `app/(dashboard)/dashboard/admin/plan/page.tsx` - Separado en server/client components

## Total

- **Archivos nuevos:** 9
- **Archivos modificados:** 5
- **Total líneas de código:** ~1,500+
