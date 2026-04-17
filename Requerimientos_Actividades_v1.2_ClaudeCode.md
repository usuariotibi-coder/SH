# Prompt para Claude Code — Actualización v1.2: Modal de Requerimientos con Actividades inline

## Objetivo

Modificar el modal de **Editar / Crear Requerimiento** para:

1. Renombrar el campo `description` → `specificRequirement` (requerimiento específico)
2. Incorporar la gestión de **actividades directamente dentro del modal** (crear, editar, eliminar sin salir del formulario)
3. Agregar campo `responsible` al modelo `Activity`
4. Implementar lógica automática de estado del requerimiento basada en el estado de sus actividades
5. Actualizar el **calendario** para incluir las actividades como eventos independientes

---

## 1. Cambios en la base de datos (Prisma)

### 1.1 Migración en el modelo `Requirement`

Renombrar el campo `description` a `specificRequirement` en `schema.prisma`:

```prisma
model Requirement {
  // ...
  specificRequirement String @db.Text   // antes: description
  // resto sin cambios
}
```

Crear la migración con nombre descriptivo:
```bash
cd backend
npx prisma migrate dev --name rename_description_to_specific_requirement
```

### 1.2 Agregar campo `responsible` al modelo `Activity`

```prisma
model Activity {
  id              String    @id @default(cuid())
  description     String    @db.Text
  responsible     String                        // ← NUEVO: nombre o área responsable
  dueDate         DateTime
  completedAt     DateTime?
  isCompleted     Boolean   @default(false)
  notes           String?
  createdAt       DateTime  @default(now())

  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  evidences       Evidence[]
}
```

Migración:
```bash
npx prisma migrate dev --name add_responsible_to_activity
```

---

## 2. Lógica de estado automático del requerimiento

### Regla de negocio (implementar en backend Y en frontend para feedback inmediato)

El campo `status` del requerimiento **NO se edita manualmente** cuando existen actividades. Se calcula automáticamente con estas reglas de prioridad (de mayor a menor):

```
Si status = NOT_APPLICABLE           → mantener NOT_APPLICABLE (override manual)
Si no tiene actividades              → status manual (comportamiento actual)
Si tiene actividades:
  Si TODAS isCompleted = true        → COMPLETED  (setear completedAt = now())
  Si alguna dueDate < hoy AND !isCompleted → OVERDUE
  Si al menos una !isCompleted       → IN_PROGRESS
  Si todas isCompleted = false y ninguna vencida → PENDING
```

### 2.1 Función utilitaria (crear en `backend/src/utils/requirementStatus.utils.js`)

```js
/**
 * Calcula el status de un requerimiento basado en sus actividades.
 * @param {Activity[]} activities - actividades del requerimiento
 * @param {string} currentStatus - status actual (para respetar NOT_APPLICABLE)
 * @returns {{ status: RequirementStatus, completedAt: Date|null }}
 */
function computeRequirementStatus(activities, currentStatus) {
  if (currentStatus === 'NOT_APPLICABLE') {
    return { status: 'NOT_APPLICABLE', completedAt: null };
  }
  if (!activities || activities.length === 0) {
    return null; // sin actividades: no recalcular, respetar valor manual
  }

  const now = new Date();
  const allCompleted = activities.every(a => a.isCompleted);
  const anyOverdue   = activities.some(a => !a.isCompleted && new Date(a.dueDate) < now);

  if (allCompleted)  return { status: 'COMPLETED',    completedAt: now };
  if (anyOverdue)    return { status: 'OVERDUE',      completedAt: null };

  const anyInProgress = activities.some(a => a.isCompleted);
  if (anyInProgress) return { status: 'IN_PROGRESS',  completedAt: null };

  return { status: 'PENDING', completedAt: null };
}

module.exports = { computeRequirementStatus };
```

### 2.2 Aplicar el recálculo en el backend

Invocar `computeRequirementStatus` en los siguientes endpoints:

- `PUT /api/requirements/:id` — al guardar el requerimiento
- `PUT /api/activities/:id` — al marcar una actividad como completada / cambiar su fecha
- `POST /api/activities` — al crear una nueva actividad
- `DELETE /api/activities/:id` — al eliminar una actividad

En cada caso, después de la operación sobre la actividad, buscar todas las actividades del requerimiento padre y recalcular su status.

---

## 3. Cambios en el backend

### 3.1 Actualizar `requirement.controller.js`

- Cambiar todas las referencias de `description` → `specificRequirement` en los `select`, `create` y `update`
- En `PUT /api/requirements/:id`: si el body incluye el campo `status` Y el requerimiento tiene actividades, **ignorar el status del body** y usar el calculado por `computeRequirementStatus` (excepto si el valor enviado es `NOT_APPLICABLE`)
- El endpoint `GET /api/requirements/:id` debe incluir las actividades en la respuesta:

```js
// En el select del findUnique
include: {
  activities: {
    orderBy: { dueDate: 'asc' }
  },
  evidences: true,
  createdBy: { select: { id: true, name: true } }
}
```

### 3.2 Actualizar `activity.controller.js`

Asegurarse de que todos los endpoints de actividades (`POST`, `PUT`, `DELETE`) disparen el recálculo del status del requerimiento padre al finalizar.

```js
// Patrón a usar en cada handler de actividad
const activities = await prisma.activity.findMany({
  where: { requirementId }
});
const computed = computeRequirementStatus(activities, requirement.status);
if (computed) {
  await prisma.requirement.update({
    where: { id: requirementId },
    data: { status: computed.status, completedAt: computed.completedAt }
  });
}
```

### 3.3 Actualizar el endpoint del calendario

En `calendar.controller.js`, la consulta de actividades debe filtrar solo las que **no están completadas** (`isCompleted: false`) para no mostrar actividades ya cerradas en el calendario:

```js
prisma.activity.findMany({
  where: {
    requirement: { companyId },
    dueDate: { gte: rangeStart, lte: rangeEnd },
    isCompleted: false   // ← solo pendientes
  },
  include: {
    requirement: { select: { id: true, code: true, responsibleArea: true } }
  }
})
```

El evento de calendario para una actividad ahora incluye el campo `responsible`:

```json
{
  "id": "act-cuid123",
  "title": "Actividad: Inspección de guardas de maquinaria",
  "date": "2025-06-20T00:00:00.000Z",
  "type": "activity",
  "status": "pending",
  "severity": "upcoming",
  "module": "Actividades",
  "area": "Producción",
  "responsible": "Ing. Torres",
  "parentCode": "NOM-004-STPS-1999",
  "sourceId": "req-cuid123",
  "url": "/requirements/req-cuid123"
}
```

---

## 4. Cambios en el frontend

### 4.1 Renombrar el campo en el formulario

En `RequirementDetailPage.jsx` y en el componente de formulario/modal del requerimiento:

- Cambiar el label de `"Descripción"` → `"Requerimiento específico"`
- Cambiar el `name` del campo de `description` → `specificRequirement`
- Actualizar la validación (el campo sigue siendo requerido)
- Actualizar el estado local del formulario y el payload que se envía al backend

### 4.2 Campo de estado deshabilitado cuando hay actividades

En el formulario del requerimiento, el dropdown de `Estado`:

```jsx
<select
  name="status"
  disabled={activities.length > 0 && formData.status !== 'NOT_APPLICABLE'}
  title={activities.length > 0 ? "El estado se calcula automáticamente según las actividades" : ""}
>
  ...opciones...
</select>

{activities.length > 0 && formData.status !== 'NOT_APPLICABLE' && (
  <p className="text-xs text-gray-500 mt-1">
    El estado se calcula automáticamente según el avance de las actividades.
  </p>
)}
```

La opción `NOT_APPLICABLE` sigue siendo seleccionable manualmente siempre (habilitar solo esa opción o dejar el select habilitado solo si el status actual es NOT_APPLICABLE).

### 4.3 Sección de actividades dentro del modal

Agregar debajo del campo de `specificRequirement` y antes de las `Notas`, una sección de actividades con este layout:

```
─────────────────────────────────────────────────
Actividades de cumplimiento
─────────────────────────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ #  │ Descripción           │ Responsable │ Fecha comp. │ Estado │ Acciones │
├────┼───────────────────────┼─────────────┼─────────────┼────────┼──────────┤
│ 1  │ [input text]          │ [input]     │ [date]      │ [chk]  │  [🗑]   │
│ 2  │ [input text]          │ [input]     │ [date]      │ [chk]  │  [🗑]   │
└──────────────────────────────────────────────────────────────┘

[+ Agregar actividad]
```

Especificaciones de la tabla de actividades:

- Cada fila es editable directamente (inputs inline, sin abrir otro modal)
- Columna **Descripción**: `<input type="text">` — requerido, mínimo 10 chars
- Columna **Responsable**: `<input type="text">` — requerido
- Columna **Fecha compromiso**: `<input type="date">` — requerido
- Columna **Estado**: checkbox con label "Completada" — al marcar, registrar `completedAt = now()` localmente
- Columna **Acciones**: botón de eliminar (icono `Trash2` de Lucide) — con confirmación inline (cambiar el icono a una `X` roja por 2 segundos antes de eliminar, o un tooltip "¿Eliminar?")

**Actividades nuevas vs. existentes:**
- Las actividades que ya existen en BD tienen `id` real
- Las actividades recién añadidas en el formulario tienen un `id` temporal prefijado con `"new-"` (ej: `"new-1"`, `"new-2"`)
- Al guardar el requerimiento (botón "Guardar" del modal principal), se envía todo en una sola llamada:

```json
PUT /api/requirements/:id
{
  "code": "NOM-033-STPS-2015",
  "specificRequirement": "...",
  "legalSource": "NOM",
  "activities": [
    { "id": "cuid-existente", "description": "...", "responsible": "...", "dueDate": "...", "isCompleted": true },
    { "id": "new-1", "description": "...", "responsible": "...", "dueDate": "...", "isCompleted": false },
    { "id": "new-2", "description": "...", "responsible": "...", "dueDate": "...", "isCompleted": false }
  ]
}
```

El backend interpreta:
- IDs sin prefijo `"new-"` → `upsert` (actualizar si existe)
- IDs con prefijo `"new-"` → `create`
- Actividades existentes que ya no estén en el array → `delete` (comparar IDs del array con los de BD)

### 4.4 Indicador de progreso de actividades

Encima de la tabla de actividades, mostrar una barra de progreso:

```jsx
// Ejemplo: 2 de 5 actividades completadas
<div className="mb-3">
  <div className="flex justify-between text-xs text-gray-500 mb-1">
    <span>Avance de actividades</span>
    <span>{completedCount} de {totalCount} completadas</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="h-2 rounded-full transition-all"
      style={{
        width: `${(completedCount / totalCount) * 100}%`,
        backgroundColor: allCompleted ? '#16a34a' : '#2563a8'
      }}
    />
  </div>
</div>
```

Solo mostrar si `totalCount > 0`.

### 4.5 Preview del estado calculado

Al lado del dropdown de Estado (cuando está deshabilitado), mostrar el estado que resultaría del cálculo con el `StatusPill` correspondiente. Esto da feedback inmediato al usuario mientras agrega o completa actividades sin necesidad de guardar.

```jsx
{activities.length > 0 && (
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs text-gray-500">Estado calculado:</span>
    <StatusPill status={computedStatus} />
  </div>
)}
```

Implementar la función `computeRequirementStatus` también en el frontend (mismo archivo lógico, sin dependencias de Prisma — solo recibe un array de objetos actividad).

### 4.6 Comportamiento responsive del modal

El modal que contiene la tabla de actividades necesita más espacio. Ajustar:

- Ancho del modal: `max-w-3xl` (antes era `max-w-xl` o `max-w-2xl`)
- Alto máximo con scroll interno: `max-h-[90vh] overflow-y-auto`
- En móvil (<768px): la tabla colapsa a tarjetas verticales apiladas, una por actividad

---

## 5. Actualizar textos i18n

En `frontend/src/i18n/es.json`, dentro del namespace de requerimientos:

```json
"requirements": {
  "specificRequirement": "Requerimiento específico",
  "activities": {
    "title": "Actividades de cumplimiento",
    "addButton": "+ Agregar actividad",
    "description": "Descripción",
    "responsible": "Responsable",
    "dueDate": "Fecha compromiso",
    "completed": "Completada",
    "deleteConfirm": "¿Eliminar esta actividad?",
    "progress": "Avance de actividades",
    "progressOf": "de",
    "noActivities": "Sin actividades registradas. Agrega al menos una para el seguimiento.",
    "statusAutomatic": "El estado se calcula automáticamente según el avance de las actividades."
  }
}
```

Equivalente en `en.json`.

---

## 6. Actualizar el seed de datos

En `backend/prisma/seed.js`, agregar el campo `responsible` a todas las actividades existentes. Ejemplo:

```js
// Antes
{ description: "Inventariar EPP por área", dueDate: ..., isCompleted: true }

// Después
{ description: "Inventariar EPP por área", responsible: "Ing. Torres / SH", dueDate: ..., isCompleted: true }
```

Asignar responsables ficticios coherentes con el área del requerimiento.

---

## 7. Checklist de implementación

### Base de datos
- [ ] Renombrar `description` → `specificRequirement` en `schema.prisma`
- [ ] Agregar campo `responsible` en modelo `Activity`
- [ ] Ejecutar ambas migraciones con Prisma
- [ ] Actualizar `seed.js` con el campo `responsible`

### Backend
- [ ] Crear `backend/src/utils/requirementStatus.utils.js` con `computeRequirementStatus`
- [ ] Actualizar `requirement.controller.js`: renombrar campo, incluir actividades en GET, aplicar recálculo en PUT
- [ ] Actualizar `activity.controller.js`: aplicar recálculo del status padre en POST, PUT, DELETE
- [ ] Actualizar `calendar.controller.js`: filtrar `isCompleted: false`, agregar campo `responsible` y `parentCode` al evento de actividad
- [ ] Actualizar `PUT /api/requirements/:id` para manejar el array `activities` con lógica upsert/create/delete

### Frontend
- [ ] Renombrar campo `description` → `specificRequirement` en el formulario del modal
- [ ] Deshabilitar el dropdown de Estado cuando hay actividades (excepto NOT_APPLICABLE)
- [ ] Implementar `computeRequirementStatus` en utilidades del frontend
- [ ] Agregar sección de tabla de actividades inline en el modal
- [ ] Implementar barra de progreso de actividades
- [ ] Agregar preview del estado calculado junto al dropdown
- [ ] Ampliar el modal a `max-w-3xl` con scroll interno
- [ ] Implementar vista responsive en tarjetas para móvil
- [ ] Actualizar `es.json` y `en.json` con los nuevos textos

---

## Notas técnicas para Claude Code

- El campo `responsible` en `Activity` es un `String` libre — no es una FK a `User`, ya que el responsable puede ser un área, un contratista externo o una persona que no tiene usuario en el sistema
- La operación de guardar el requerimiento con sus actividades debe ser atómica: usar `prisma.$transaction([...])` para que si falla cualquier upsert/delete de actividad, no se guarde nada a medias
- Para la lógica de delete de actividades "huérfanas": `const idsToKeep = activities.filter(a => !a.id.startsWith('new-')).map(a => a.id); await prisma.activity.deleteMany({ where: { requirementId, id: { notIn: idsToKeep } } })`
- El campo `specificRequirement` reemplaza a `description` — en la migración de Prisma usar `@map` o simplemente renombrar; si hay datos existentes, crear la migración con cuidado para no perder datos: `ALTER TABLE "Requirement" RENAME COLUMN "description" TO "specificRequirement"`
- El calendario ya existía con el mapeo de actividades — con estos cambios solo se agrega el campo `responsible` al evento; no hay cambios estructurales en el componente del calendario

---

*Módulo: Requerimientos — Actualización v1.2*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL + Prisma*
