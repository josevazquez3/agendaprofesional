# Auditoría QA – Sistema de Historia Clínica / Evoluciones

**Rol:** QA Master (10+ años de experiencia)

**Fecha:** 2026-02-06

**Objetivo del documento**
Evaluar de forma integral el estado actual del sistema de Historia Clínica / Evoluciones, validando funcionalidad, UX, seguridad, arquitectura, manejo de errores y preparación para producción.

---

## 1. Visión general del sistema

El sistema auditado corresponde al flujo completo de **Historia Clínica / Evoluciones Médicas**, que incluye:

* Creación de evoluciones clínicas
* Edición de registros médicos
* Visualización de historial completo
* Gestión de estudios médicos asociados
* Relación con turnos y profesionales
* Exportación (PDF, DOC)

**Roles involucrados:**
* ADMIN
* SECRETARIA
* PROFESIONAL
* PACIENTE (solo lectura)

**Estado general:** 🔴 **CRÍTICO - REQUIERE CORRECCIONES ANTES DE PRODUCCIÓN**

---

## 2. Flujo funcional

### 2.1 Crear Evolución

**Ruta:** `/dashboard/historia-clinica/nueva`

**Flujo:**
1. Usuario selecciona paciente mediante búsqueda
2. Redirige a página de edición según rol
3. Formulario permite crear nueva evolución

**Evaluación:**

✅ **Funcionalidades correctas:**
* Búsqueda de paciente funcional
* Redirección según rol implementada
* Validación de selección de paciente

❌ **Problemas detectados:**

**CRÍTICO 1: Falta `clinicId` en creación**
- **Ubicación:** `app/api/historia-clinica/route.ts` línea 79
- **Problema:** El schema de Prisma requiere `clinicId` (campo obligatorio), pero la API POST no lo incluye
- **Impacto:** Error de base de datos al crear historia clínica
- **Código afectado:**
```typescript
// Línea 79 - FALTA clinicId
const historiaClinica = await prisma.historiaClinica.create({
  data: {
    pacienteId,
    profesionalId: profesionalIdFinal,
    turnoId: turnoId || null,
    fechaConsulta,
    notas: notas || null,
    diagnostico: diagnostico || null,
    tratamiento: tratamiento || null,
    // ❌ FALTA: clinicId
  },
})
```

**CRÍTICO 2: Mismo problema en `turnos/completar`**
- **Ubicación:** `app/api/turnos/completar/route.ts` línea 97
- **Problema:** Similar falta de `clinicId` al crear historia clínica desde turno completado

**Estado:** 🔴 **BLOQUEANTE**

---

### 2.2 Editar Evolución

**Rutas:**
* `/dashboard/admin/historia-clinica/[pacienteId]/editar`
* `/dashboard/profesional/historia-clinica/[pacienteId]/editar`

**Evaluación:**

✅ **Funcionalidades correctas:**
* Carga de datos existentes
* Formulario de edición funcional
* Gestión de estudios asociados
* Actualización de campos principales

❌ **Problemas detectados:**

**CRÍTICO 3: Sin validación de ownership**
- **Ubicación:** `app/api/historia-clinica/[id]/route.ts` línea 26
- **Problema:** Un PROFESIONAL puede editar cualquier historia clínica, no solo las suyas
- **Impacto:** Violación de seguridad - acceso no autorizado a datos médicos
- **Código afectado:**
```typescript
// Línea 26 - NO verifica que el profesional sea el dueño
const historiaClinica = await prisma.historiaClinica.update({
  where: { id: params.id },
  data: { ... }
})
```

**CRÍTICO 4: Sin control de concurrencia**
- **Problema:** Dos usuarios pueden editar simultáneamente el mismo registro
- **Impacto:** Pérdida de datos - último guardado sobrescribe cambios anteriores
- **Solución requerida:** Implementar optimistic locking o versionado

**MEDIO 5: Manejo de errores genérico**
- **Ubicación:** `app/api/historia-clinica/[id]/route.ts` línea 136
- **Problema:** Mensajes de error no específicos
- **Código afectado:**
```typescript
if (!response.ok) {
  throw new Error("Error al guardar cambios") // ❌ Muy genérico
}
```

**Estado:** 🔴 **BLOQUEANTE**

---

### 2.3 Visualizar Evolución

**Rutas:**
* `/dashboard/admin/historia-clinica/[pacienteId]`
* `/dashboard/profesional/historia-clinica/[pacienteId]`
* `/dashboard/secretaria/historia-clinica/[pacienteId]`
* `/dashboard/paciente/historia-clinica`

**Evaluación:**

✅ **Funcionalidades correctas:**
* Visualización cronológica (orden descendente)
* Información completa de profesional
* Estudios adjuntos visibles
* Relación con turnos mostrada

✅ **Permisos correctos:**
* PACIENTE solo ve sus propias historias
* PROFESIONAL ve todas las historias del paciente
* ADMIN/SECRETARIA acceso completo

**Estado:** 🟢 **Aprobado**

---

## 3. Seguridad

### 3.1 Autenticación y Autorización

**Evaluación:**

✅ **Correcto:**
* Verificación de sesión en todas las APIs
* Control de acceso por rol implementado
* PACIENTE solo accede a sus propios datos

❌ **Problemas detectados:**

**CRÍTICO 6: Profesional puede editar cualquier historia**
- **Detalle:** Ver CRÍTICO 3
- **Riesgo:** Alto - violación de privacidad médica

**MEDIO 7: Sin validación de clínica**
- **Problema:** No se verifica que el usuario pertenezca a la misma clínica que el registro
- **Impacto:** En entorno multi-tenant, posibles accesos cruzados

**Estado:** 🔴 **BLOQUEANTE**

---

### 3.2 Exposición de Datos Sensibles

**Evaluación:**

✅ **Correcto:**
* No se exponen errores técnicos al frontend
* Datos sensibles no aparecen en logs públicos

**Estado:** 🟢 **Aprobado**

---

## 4. Validaciones

### 4.1 Frontend

**Evaluación:**

✅ **Correcto:**
* Validación de campos requeridos
* Feedback inmediato al usuario
* Estados disabled apropiados

**Estado:** 🟢 **Aprobado**

### 4.2 Backend

**Evaluación:**

✅ **Correcto:**
* Validación de existencia de paciente
* Validación de existencia de profesional
* Validación de permisos por rol

❌ **Problemas detectados:**

**CRÍTICO 8: Falta validación de clinicId**
- **Problema:** No se valida que clinicId exista antes de crear registro
- **Impacto:** Posibles errores de integridad referencial

**MEDIO 9: Validación de turnoId inconsistente**
- **Problema:** Se acepta turnoId pero no se valida que el turno pertenezca al paciente/profesional correcto
- **Impacto:** Posible inconsistencia de datos

**Estado:** 🔴 **BLOQUEANTE**

---

## 5. UX / UI

### 5.1 Estados Cubiertos

**Evaluación:**

✅ **Correcto:**
* Estado de carga durante fetch
* Mensaje cuando no hay historias clínicas
* Feedback al guardar cambios
* Manejo de errores con alertas

**MEDIO 10: Prevención de pérdida de datos**
- **Problema:** No hay confirmación antes de cerrar formulario con cambios sin guardar
- **Impacto:** Posible pérdida de trabajo del usuario

**Estado:** 🟡 **Mejorable**

---

## 6. Manejo de Errores

### 6.1 Frontend

**Evaluación:**

✅ **Correcto:**
* Try-catch en operaciones async
* Mensajes de error mostrados al usuario
* Estados de error manejados

**MEDIO 11: Mensajes genéricos**
- **Problema:** "Error al guardar cambios" no es específico
- **Impacto:** Usuario no sabe qué falló exactamente

**Estado:** 🟡 **Mejorable**

### 6.2 Backend

**Evaluación:**

✅ **Correcto:**
* Try-catch en todas las operaciones
* Status codes apropiados (400, 401, 404, 500)
* Logging de errores en consola

**MEDIO 12: Errores silenciosos posibles**
- **Problema:** Si falla la creación de estudios durante edición, el registro principal se actualiza pero los estudios no
- **Impacto:** Estado inconsistente

**Estado:** 🟡 **Mejorable**

---

## 7. Relaciones y Consistencia

### 7.1 Relación Paciente ↔ Profesional

**Evaluación:**

✅ **Correcto:**
* Relación bien definida en schema
* Foreign keys con cascade delete
* Índices apropiados

**Estado:** 🟢 **Aprobado**

### 7.2 Relación Evolución ↔ Estudios

**Evaluación:**

✅ **Correcto:**
* Cascade delete implementado
* Relación uno-a-muchos correcta

**MEDIO 13: Estudios huérfanos posibles**
- **Problema:** Si falla la transacción parcialmente, pueden quedar estudios sin historia clínica
- **Impacto:** Datos inconsistentes

**Estado:** 🟡 **Mejorable**

### 7.3 Relación Evolución ↔ Turno

**Evaluación:**

✅ **Correcto:**
* Relación opcional bien manejada
* Unique constraint en turnoId apropiado

**MEDIO 14: Validación de turno inconsistente**
- **Problema:** Se puede crear historia clínica con turnoId de otro paciente/profesional
- **Impacto:** Inconsistencia de datos

**Estado:** 🟡 **Mejorable**

---

## 8. Edge Cases Críticos

### 8.1 Casos Cubiertos

✅ **Cubiertos:**
* Paciente sin historias clínicas
* Evolución sin estudios
* Error de red durante guardado
* Usuario no autenticado

### 8.2 Casos NO Cubiertos

❌ **NO cubiertos:**

**CRÍTICO 15: Edición simultánea**
- **Escenario:** Dos profesionales editan el mismo registro al mismo tiempo
- **Resultado:** Último guardado sobrescribe el primero
- **Solución requerida:** Optimistic locking o versionado

**CRÍTICO 16: Falta clinicId**
- **Escenario:** Crear evolución sin clinicId
- **Resultado:** Error de base de datos
- **Solución requerida:** Obtener clinicId de sesión/clínica activa

**MEDIO 17: Estudio huérfano**
- **Escenario:** Error parcial al guardar estudios
- **Resultado:** Estudios sin historia clínica asociada
- **Solución requerida:** Transacciones atómicas

**MEDIO 18: Turno eliminado**
- **Escenario:** Turno asociado se elimina después de crear evolución
- **Resultado:** Historia clínica con turnoId inválido
- **Solución requerida:** Validación o manejo de referencias rotas

**Estado:** 🔴 **CRÍTICO**

---

## 9. APIs

### 9.1 Endpoints Auditados

**POST `/api/historia-clinica`**
- ✅ Validación de permisos
- ❌ Falta clinicId (CRÍTICO)
- ❌ Sin validación de ownership para profesionales

**PUT `/api/historia-clinica/[id]`**
- ✅ Validación de permisos básica
- ❌ Sin validación de ownership (CRÍTICO)
- ❌ Sin control de concurrencia (CRÍTICO)
- 🟡 Manejo de estudios podría mejorar

**DELETE `/api/historia-clinica/[id]`**
- ✅ Solo ADMIN/SECRETARIA
- ✅ Implementado correctamente

**GET `/api/historia-clinica/paciente/[pacienteId]`**
- ✅ Validación de permisos correcta
- ✅ PACIENTE solo ve sus propias historias
- ✅ Orden cronológico correcto

**Estado:** 🔴 **BLOQUEANTE**

---

## 10. Preparación para Producción

### 10.1 Checklist QA

- [ ] ❌ Flujos principales cubiertos (BLOQUEADO por falta clinicId)
- [ ] ❌ Casos negativos controlados (BLOQUEADO por permisos)
- [x] ✅ UX consistente
- [ ] ❌ Seguridad aplicada (BLOQUEADO por validación de ownership)
- [x] ✅ Código mantenible

### 10.2 Riesgo Residual

🔴 **ALTO**

**Riesgos críticos identificados:**
1. Error de base de datos por falta de clinicId
2. Violación de seguridad por falta de validación de ownership
3. Pérdida de datos por ediciones simultáneas

---

## 11. Conclusión QA

**Resultado final:** 🔴 **NO APROBADO PARA PRODUCCIÓN**

### 11.1 Resumen de Problemas

**Críticos (BLOQUEANTES):**
1. ❌ Falta `clinicId` en creación de historia clínica (2 ubicaciones)
2. ❌ Sin validación de ownership - profesional puede editar cualquier historia
3. ❌ Sin control de concurrencia - pérdida de datos posible

**Medios (MEJORABLES):**
4. 🟡 Mensajes de error genéricos
5. 🟡 Sin prevención de pérdida de datos en frontend
6. 🟡 Validación de turnoId inconsistente
7. 🟡 Posibles estudios huérfanos

### 11.2 Acciones Requeridas

**ANTES DE PRODUCCIÓN (OBLIGATORIO):**

1. **Agregar clinicId en creación:**
   - `app/api/historia-clinica/route.ts` línea 79
   - `app/api/turnos/completar/route.ts` línea 97
   - Obtener de sesión/clínica activa

2. **Validar ownership en edición:**
   - `app/api/historia-clinica/[id]/route.ts` línea 26
   - Verificar que `historiaClinica.profesionalId === session.profesionalId` para rol PROFESIONAL

3. **Implementar control de concurrencia:**
   - Agregar campo `version` o `updatedAt` check
   - Validar antes de actualizar

**MEJORAS RECOMENDADAS:**

4. Mensajes de error específicos
5. Confirmación antes de cerrar formulario con cambios
6. Validación de turnoId contra paciente/profesional
7. Transacciones atómicas para estudios

---

## 12. Recomendaciones Futuras (no bloqueantes)

* Tests E2E del flujo completo
* Métricas de creación/edición de evoluciones
* Auditoría de cambios (log de quién editó qué)
* Versionado de historias clínicas
* Exportación masiva de historias clínicas
* Búsqueda avanzada en historias clínicas

---

**Firma QA:**
QA Master – 10 años de experiencia

**Fecha de auditoría:** 2026-02-06

**Próxima revisión:** Después de corrección de críticos
