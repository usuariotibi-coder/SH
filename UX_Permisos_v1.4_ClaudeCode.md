# Prompt para Claude Code — Actualización v1.4: Ajustes de UX y permisos

## Resumen de cambios

1. Sidebar colapsable con botón de toggle
2. Modal de requerimientos con ancho completo — revisar todos los modales
3. Actividades: selector de responsable desde lista de usuarios de la empresa
4. Actividades: selector de estatus por actividad
5. Campos de información normativa y requerimiento específico: edición inline con control de permisos por rol

---

## Cambio 1 — Sidebar colapsable

### Comportamiento esperado

El sidebar tiene dos estados:

- **Expandido** (por defecto en desktop): muestra icono + texto de cada ítem de navegación. Ancho: `256px`
- **Colapsado**: muestra solo los iconos centrados, sin texto. Ancho: `64px`

El estado se persiste en `localStorage` con la clave `"sh_sidebar_collapsed"` para que se recuerde entre sesiones.

### Botón de toggle

Colocar el botón en la parte inferior del sidebar, antes del selector de empresa. Usar el icono `PanelLeftClose` (expandido) / `PanelLeftOpen` (colapsado) de Lucide React.

```jsx
// En Sidebar.jsx
const [collapsed, setCollapsed] = useLocalStorage('sh_sidebar_collapsed', false);

// Botón toggle en la parte inferior
<button
  onClick={() => setCollapsed(!collapsed)}
  className="flex items-center justify-center w-full p-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
  title={collapsed ? "Expandir menú" : "Colapsar menú"}
>
  {collapsed
    ? <PanelLeftOpen size={18} />
    : <PanelLeftClose size={18} />
  }
  {!collapsed && (
    <span className="ml-2 text-sm">Colapsar menú</span>
  )}
</button>
```

### Transición suave

```css
/* En index.css o con Tailwind transition */
.sidebar {
  transition: width 200ms ease-in-out;
}
```

### Ítems del menú en estado colapsado

Cuando `collapsed = true`:
- Ocultar el texto del ítem (`hidden` o `opacity-0`)
- Centrar el icono horizontalmente
- Mostrar tooltip con el nombre del ítem al hacer hover (usar atributo `title` o un tooltip simple con CSS)
- Ocultar el logo/nombre de la app — mostrar solo el isotipo o las iniciales "SH"

### Layout principal (`AppLayout.jsx`)

El contenido principal debe ajustarse al ancho disponible según el estado del sidebar:

```jsx
<div className="flex h-screen overflow-hidden">
  <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
  <main
    className="flex-1 overflow-y-auto transition-all duration-200"
    style={{ marginLeft: 0 }} // flex-1 maneja el espacio automáticamente
  >
    {children}
  </main>
</div>
```

Usar `flex` en el contenedor principal — cuando el sidebar cambia de ancho, el `flex-1` del main se ajusta automáticamente sin necesidad de calcular márgenes.

### Comportamiento en móvil

En pantallas menores a `768px`:
- El sidebar siempre inicia colapsado (como drawer oculto)
- El botón de toggle en el topbar abre/cierra el sidebar como overlay con backdrop semitransparente
- El estado de colapsado en móvil no se persiste en localStorage (siempre cierra al navegar)

---

## Cambio 2 — Modales con ancho adaptable

### Problema

El modal de requerimientos y posiblemente otros modales tienen un `max-w` fijo que no aprovecha el ancho disponible en pantallas grandes, y en pantallas medianas puede quedar demasiado estrecho para la tabla de actividades.

### Solución — Clases de ancho por tipo de modal

Definir una escala de tamaños de modal y aplicarla consistentemente en toda la app:

```js
// frontend/src/utils/modalSizes.js
export const MODAL_SIZES = {
  sm:   'w-full max-w-md',      // 448px  — confirmaciones, alertas simples
  md:   'w-full max-w-xl',      // 576px  — formularios simples (usuarios, empresas)
  lg:   'w-full max-w-3xl',     // 768px  — formularios medianos (incidentes, capacitaciones)
  xl:   'w-full max-w-5xl',     // 1024px — formularios complejos (requerimientos)
  full: 'w-full max-w-7xl',     // 1280px — vistas de detalle, tablas grandes
};
```

### Aplicar a cada modal existente

Revisar todos los modales de la aplicación y asignar el tamaño correspondiente:

| Modal | Tamaño a usar |
|-------|--------------|
| Crear/Editar Requerimiento | `xl` (`max-w-5xl`) |
| Detalle de Requerimiento (si es modal) | `full` (`max-w-7xl`) |
| Crear/Editar Incidente | `lg` (`max-w-3xl`) |
| Crear/Editar Capacitación | `lg` (`max-w-3xl`) |
| Crear/Editar Simulacro | `lg` (`max-w-3xl`) |
| Crear/Editar Riesgo | `lg` (`max-w-3xl`) |
| Crear/Editar Auditoría | `lg` (`max-w-3xl`) |
| Crear/Editar Mantenimiento | `md` (`max-w-xl`) |
| Crear/Editar CMSH | `md` (`max-w-xl`) |
| Crear/Editar Usuario | `md` (`max-w-xl`) |
| Confirmación / Eliminar | `sm` (`max-w-md`) |
| EventDetailDrawer (Calendario) | drawer lateral 420px, no modal |

### Contenedor base del modal

Asegurarse de que todos los modales usen este patrón de contenedor con scroll interno:

```jsx
// Overlay
<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
  {/* Contenedor del modal */}
  <div className={`relative bg-white rounded-xl shadow-xl my-8 ${MODAL_SIZES.xl} w-full`}>
    {/* Header fijo */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <button onClick={onClose}><X size={20} /></button>
    </div>
    {/* Body con scroll */}
    <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-200px)]">
      {children}
    </div>
    {/* Footer fijo */}
    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-xl">
      <button onClick={onClose}>Cancelar</button>
      <button onClick={onSave}>Guardar</button>
    </div>
  </div>
</div>
```

El `items-start` en el overlay + `my-8` en el modal permite que modales largos sean scrolleables desde la parte superior en lugar de centrarse y quedar cortados.

---

## Cambio 3 — Actividades: selector de responsable desde lista de usuarios

### Contexto

Actualmente el campo `responsible` en `Activity` es un `String` libre. Se mantiene como texto libre en la BD, pero el formulario ahora ofrece un selector de usuarios de la empresa como opción principal, con posibilidad de escribir un nombre libre si el responsable no está en el sistema.

### Nuevo endpoint de usuarios para el selector

```
GET /api/users/select?companyId=
```

Devuelve solo `id`, `name`, `area` y `role` de los usuarios activos de la empresa. No requiere paginación (máximo ~50 usuarios por empresa). Solo accesible por roles con permiso de edición.

```json
[
  { "id": "cuid1", "name": "Ing. Carmen Ruiz Torres", "area": "Seguridad e Higiene" },
  { "id": "cuid2", "name": "Ing. Luis Martínez Ortega", "area": "Producción" }
]
```

### Componente `ResponsibleSelector.jsx`

Crear en `frontend/src/components/ui/ResponsibleSelector.jsx`. Combina un dropdown de usuarios con opción de texto libre:

```jsx
// Props: value (string), onChange (fn), users (array), disabled (bool)

const ResponsibleSelector = ({ value, onChange, users, disabled }) => {
  const [mode, setMode] = useState(() =>
    users.some(u => u.name === value) ? 'select' : 'free'
  );

  return (
    <div className="flex gap-2">
      {mode === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">— Seleccionar usuario —</option>
          {users.map(u => (
            <option key={u.id} value={u.name}>
              {u.name} {u.area ? `(${u.area})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Nombre del responsable"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      )}
      {/* Toggle entre modo select y texto libre */}
      {!disabled && (
        <button
          type="button"
          onClick={() => { setMode(m => m === 'select' ? 'free' : 'select'); onChange(''); }}
          className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap px-2"
          title={mode === 'select' ? 'Escribir nombre libre' : 'Seleccionar de la lista'}
        >
          {mode === 'select' ? 'Nombre libre' : 'Seleccionar'}
        </button>
      )}
    </div>
  );
};
```

El valor que se guarda en `Activity.responsible` sigue siendo el nombre como `String` — no el `id` del usuario. Esto mantiene la compatibilidad con responsables externos y no crea una dependencia FK.

### Usar `ResponsibleSelector` en la tabla de actividades del modal

Reemplazar el `<input type="text">` del campo responsable en cada fila de la tabla de actividades por el componente `ResponsibleSelector`, pasando la lista de usuarios cargada al abrir el modal.

```jsx
// En el modal de requerimientos, al montar:
useEffect(() => {
  if (canEdit) {
    api.get('/users/select').then(res => setUsers(res.data));
  }
}, []);

// En cada fila de actividad:
<ResponsibleSelector
  value={activity.responsible}
  onChange={val => updateActivity(activity.id, 'responsible', val)}
  users={users}
  disabled={!canEdit}
/>
```

---

## Cambio 4 — Actividades: selector de estatus

### Reemplazar el checkbox por un selector de estado

Actualmente cada actividad tiene un checkbox "Completada" que mapea a `isCompleted: boolean`. Reemplazarlo por un selector de estado con cuatro opciones que da más granularidad al seguimiento:

### Nuevo enum en Prisma

```prisma
enum ActivityStatus {
  PENDING       // Pendiente
  IN_PROGRESS   // En proceso
  COMPLETED     // Completada
  BLOCKED       // Bloqueada / En espera
}
```

### Actualizar modelo `Activity`

```prisma
model Activity {
  id              String         @id @default(cuid())
  description     String         @db.Text
  responsible     String
  dueDate         DateTime
  activityStatus  ActivityStatus @default(PENDING)   // ← NUEVO (reemplaza isCompleted)
  completedAt     DateTime?
  notes           String?
  createdAt       DateTime       @default(now())

  requirementId   String
  requirement     Requirement    @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  userId          String
  user            User           @relation(fields: [userId], references: [id])

  evidences       Evidence[]
}
```

Migración:
```bash
npx prisma migrate dev --name add_activity_status_enum
```

**Compatibilidad con datos existentes:** En la migración SQL, antes de eliminar `isCompleted`, copiar su valor al nuevo campo:
```sql
UPDATE "Activity" SET "activityStatus" = 'COMPLETED' WHERE "isCompleted" = true;
UPDATE "Activity" SET "activityStatus" = 'PENDING' WHERE "isCompleted" = false;
ALTER TABLE "Activity" DROP COLUMN "isCompleted";
```
Incluir este SQL como migración manual o en el archivo de migración generado por Prisma.

### Actualizar `computeRequirementStatus` (backend y frontend)

```js
function computeRequirementStatus(activities, currentStatus) {
  if (currentStatus === 'NOT_APPLICABLE') {
    return { status: 'NOT_APPLICABLE', completedAt: null };
  }
  if (!activities || activities.length === 0) return null;

  const now = new Date();
  const allCompleted = activities.every(a => a.activityStatus === 'COMPLETED');
  const anyOverdue   = activities.some(
    a => a.activityStatus !== 'COMPLETED' && new Date(a.dueDate) < now
  );

  if (allCompleted)  return { status: 'COMPLETED',   completedAt: now };
  if (anyOverdue)    return { status: 'OVERDUE',      completedAt: null };

  const anyStarted = activities.some(
    a => a.activityStatus === 'IN_PROGRESS' || a.activityStatus === 'COMPLETED'
  );
  if (anyStarted)    return { status: 'IN_PROGRESS',  completedAt: null };

  return { status: 'PENDING', completedAt: null };
}
```

Cuando `activityStatus` cambia a `COMPLETED`, setear `completedAt = now()`. Cuando cambia a cualquier otro estado, setear `completedAt = null`.

### Selector visual en la tabla de actividades

Reemplazar el checkbox por un `<select>` con colores por estado usando un componente `ActivityStatusSelect`:

```jsx
// frontend/src/components/ui/ActivityStatusSelect.jsx
const STATUS_STYLES = {
  PENDING:     'bg-gray-100 text-gray-700 border-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  COMPLETED:   'bg-green-100 text-green-800 border-green-300',
  BLOCKED:     'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const STATUS_LABELS = {
  PENDING:     'Pendiente',
  IN_PROGRESS: 'En proceso',
  COMPLETED:   'Completada',
  BLOCKED:     'Bloqueada',
};

const ActivityStatusSelect = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className={`text-xs font-medium rounded-md px-2 py-1.5 border cursor-pointer
      focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
      ${STATUS_STYLES[value] || STATUS_STYLES.PENDING}`}
  >
    {Object.entries(STATUS_LABELS).map(([val, label]) => (
      <option key={val} value={val}>{label}</option>
    ))}
  </select>
);
```

### Actualizar la barra de progreso

La barra de progreso de actividades debe contar solo las `COMPLETED`:

```js
const completedCount = activities.filter(a => a.activityStatus === 'COMPLETED').length;
const totalCount = activities.length;
```

### Actualizar el calendario

En `calendar.controller.js`, el filtro de actividades pendientes para el calendario:

```js
// Antes
where: { isCompleted: false }

// Ahora
where: {
  activityStatus: { not: 'COMPLETED' }
}
```

---

## Cambio 5 — Edición inline con control de permisos por rol

### Contexto

Los campos **Requerimiento específico** e **Información de la norma** solo pueden ser editados por usuarios con rol `SH_SPECIALIST` o `ADMIN`. Los demás roles (AREA_MANAGER, AUDITOR, EXECUTIVE) ven estos campos en modo solo lectura.

### Hook de permisos

Crear o actualizar `frontend/src/hooks/usePermissions.js`:

```js
import { useAuthStore } from '../store/auth.store';

export function usePermissions() {
  const { user } = useAuthStore();

  const canEditNormContent = ['ADMIN', 'SH_SPECIALIST'].includes(user?.role);
  const canEditActivities  = ['ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'].includes(user?.role);
  const canViewOnly        = ['AUDITOR', 'EXECUTIVE'].includes(user?.role);

  return { canEditNormContent, canEditActivities, canViewOnly };
}
```

### Diseño de la edición inline

En la vista de detalle del requerimiento (`RequirementDetailPage.jsx`), los campos `specificRequirement` y los cuatro campos de información normativa se muestran como texto de solo lectura por defecto, con un botón de lápiz que activa la edición inline.

#### Componente `InlineEditField.jsx`

Crear en `frontend/src/components/ui/InlineEditField.jsx`:

```jsx
// Props: value, onSave, canEdit, label, multiline, placeholder

const InlineEditField = ({ value, onSave, canEdit, label, multiline = false, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group relative">
        <p className={`text-sm text-gray-700 leading-relaxed ${!value ? 'text-gray-400 italic' : ''}`}>
          {value || placeholder || 'No especificado'}
        </p>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100
              transition-opacity p-1 rounded text-gray-400 hover:text-blue-600
              hover:bg-blue-50"
            title={`Editar ${label}`}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          autoFocus
          className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm
            focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
        />
      ) : (
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm
            focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white
            text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Guardar
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900
            border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
```

#### Uso en `RequirementDetailPage.jsx`

```jsx
const { canEditNormContent } = usePermissions();

// Campo: Requerimiento específico
<div>
  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
    Requerimiento específico
  </h4>
  <InlineEditField
    value={requirement.specificRequirement}
    onSave={val => patchRequirement({ specificRequirement: val })}
    canEdit={canEditNormContent}
    label="requerimiento específico"
    multiline={true}
    placeholder="Sin descripción registrada"
  />
</div>

// Campos de información normativa (mismo patrón para los 4)
<InlineEditField
  value={requirement.normName}
  onSave={val => patchRequirement({ normName: val })}
  canEdit={canEditNormContent}
  label="nombre de la norma"
  multiline={false}
/>
```

#### Función `patchRequirement`

```js
// En RequirementDetailPage.jsx
const patchRequirement = async (fields) => {
  await api.patch(`/requirements/${requirement.id}`, fields);
  setRequirement(prev => ({ ...prev, ...fields }));
  toast.success('Guardado');
};
```

### Nuevo endpoint PATCH

```
PATCH /api/requirements/:id
```

Acepta un body parcial con solo los campos a actualizar. Solo accesible para `ADMIN` y `SH_SPECIALIST` (agregar `requireRole('ADMIN', 'SH_SPECIALIST')` en la ruta).

```js
// requirement.controller.js
async function patchRequirement(req, res) {
  const allowed = ['specificRequirement', 'normName', 'normObjective',
                   'applicabilityJustification', 'applicabilityScope', 'notes'];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const updated = await prisma.requirement.update({
    where: { id: req.params.id },
    data
  });
  res.json(updated);
}
```

### Indicador visual de solo lectura para roles sin permiso

Cuando `canEditNormContent = false`, no mostrar el icono de lápiz en hover. En su lugar, si el usuario es `AUDITOR` o `EXECUTIVE`, mostrar un badge sutil `"Solo lectura"` junto al título de la sección:

```jsx
{!canEditNormContent && (
  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">
    Solo lectura
  </span>
)}
```

---

## Actualizar i18n

En `frontend/src/i18n/es.json`:

```json
"sidebar": {
  "collapse": "Colapsar menú",
  "expand": "Expandir menú"
},
"activities": {
  "status": {
    "PENDING": "Pendiente",
    "IN_PROGRESS": "En proceso",
    "COMPLETED": "Completada",
    "BLOCKED": "Bloqueada"
  },
  "responsible": {
    "selectUser": "— Seleccionar usuario —",
    "freeName": "Nombre libre",
    "selectFromList": "Seleccionar de la lista"
  }
},
"permissions": {
  "readOnly": "Solo lectura",
  "noPermission": "No tienes permiso para editar este campo"
}
```

---

## Checklist de implementación

### Cambio 1 — Sidebar
- [ ] Agregar estado `collapsed` con `useLocalStorage` en `Sidebar.jsx`
- [ ] Implementar toggle con iconos `PanelLeftClose` / `PanelLeftOpen`
- [ ] Ocultar textos y logo en modo colapsado, mostrar solo iconos
- [ ] Agregar tooltips con `title` en los ítems cuando está colapsado
- [ ] Transición CSS `200ms ease-in-out` en el ancho
- [ ] Comportamiento de drawer en móvil con backdrop overlay

### Cambio 2 — Modales
- [ ] Crear `frontend/src/utils/modalSizes.js` con la escala de tamaños
- [ ] Revisar y actualizar todos los modales de la app con el tamaño correspondiente
- [ ] Aplicar patrón `items-start` + `my-8` en overlay + scroll interno en body
- [ ] Header y footer sticky dentro del modal
- [ ] Verificar que el modal de requerimientos use `max-w-5xl`

### Cambio 3 — Selector de responsable
- [ ] Crear endpoint `GET /api/users/select`
- [ ] Crear componente `ResponsibleSelector.jsx`
- [ ] Integrar en la tabla de actividades del modal de requerimientos
- [ ] Cargar lista de usuarios al abrir el modal (solo si `canEdit`)

### Cambio 4 — Estatus de actividad
- [ ] Agregar enum `ActivityStatus` en `schema.prisma`
- [ ] Reemplazar campo `isCompleted: Boolean` por `activityStatus: ActivityStatus`
- [ ] Incluir SQL de migración de datos en la migración de Prisma
- [ ] Actualizar `computeRequirementStatus` en backend y frontend
- [ ] Crear componente `ActivityStatusSelect.jsx`
- [ ] Integrar en tabla de actividades del modal
- [ ] Actualizar barra de progreso para contar solo `COMPLETED`
- [ ] Actualizar filtro en `calendar.controller.js`
- [ ] Actualizar seed con `activityStatus` en lugar de `isCompleted`

### Cambio 5 — Edición inline con permisos
- [ ] Actualizar `usePermissions.js` con `canEditNormContent` y `canEditActivities`
- [ ] Crear componente `InlineEditField.jsx`
- [ ] Integrar en `RequirementDetailPage.jsx` para `specificRequirement` y los 4 campos de norma
- [ ] Crear endpoint `PATCH /api/requirements/:id` con whitelist de campos
- [ ] Aplicar `requireRole('ADMIN', 'SH_SPECIALIST')` en la ruta PATCH
- [ ] Mostrar badge "Solo lectura" para roles sin permiso
- [ ] Actualizar `es.json` y `en.json`

---

## Notas técnicas para Claude Code

- Para `useLocalStorage`, implementar un hook simple si no existe: `const [val, setVal] = useLocalStorage(key, default)` que lee/escribe `localStorage` y sincroniza el estado de React
- El endpoint `GET /api/users/select` solo devuelve usuarios `isActive: true` de la misma `companyId` del usuario autenticado
- El campo `responsible` en `Activity` sigue siendo `String` — `ResponsibleSelector` escribe el nombre (no el id) para mantener compatibilidad con responsables externos
- La migración de `isCompleted → activityStatus` requiere que el SQL de transformación de datos se ejecute **antes** de eliminar la columna `isCompleted`; verificar el orden en el archivo de migración generado
- El componente `InlineEditField` usa `autoFocus` al activar edición — asegurarse de que no cause problemas de accesibilidad con `tabIndex`
- El `PATCH /api/requirements/:id` no recalcula el status del requerimiento (ese campo no está en la whitelist); solo actualiza campos descriptivos

---

*Módulo: UX global + Requerimientos — Actualización v1.4*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL + Prisma*
