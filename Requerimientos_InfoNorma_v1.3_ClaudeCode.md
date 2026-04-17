# Prompt para Claude Code — Actualización v1.3: Información normativa en Requerimientos

## Objetivo

Agregar cuatro campos informativos al modelo y formulario de **Requerimientos** para documentar el contexto normativo de cada requerimiento:

- **Nombre de la norma** (`normName`) — nombre oficial completo de la norma o disposición legal
- **Objetivo de la norma** (`normObjective`) — qué busca lograr o prevenir la norma
- **Justificación de aplicabilidad** (`applicabilityJustification`) — por qué aplica esta norma a la empresa/centro de trabajo
- **Alcance de aplicación** (`applicabilityScope`) — a qué áreas, procesos, puestos o actividades aplica dentro de la organización

Estos campos son **informativos y opcionales**, no afectan la lógica de estados ni el calendario.

---

## 1. Cambios en la base de datos

### Actualizar modelo `Requirement` en `schema.prisma`

Agregar los cuatro campos después de `specificRequirement`:

```prisma
model Requirement {
  id                        String            @id @default(cuid())
  code                      String
  name                      String
  specificRequirement       String            @db.Text
  normName                  String?           @db.Text  // ← NUEVO
  normObjective             String?           @db.Text  // ← NUEVO
  applicabilityJustification String?          @db.Text  // ← NUEVO
  applicabilityScope        String?           @db.Text  // ← NUEVO
  legalSource               LegalSource
  legalBasis                String?
  area                      String?
  status                    RequirementStatus @default(PENDING)
  dueDate                   DateTime?
  completedAt               DateTime?
  responsibleArea           String?
  notes                     String?           @db.Text
  createdAt                 DateTime          @default(now())
  updatedAt                 DateTime          @updatedAt

  companyId   String
  company     Company     @relation(fields: [companyId], references: [id])
  createdById String
  createdBy   User        @relation(fields: [createdById], references: [id])

  activities  Activity[]
  evidences   Evidence[]
}
```

Ejecutar la migración:

```bash
cd backend
npx prisma migrate dev --name add_norm_fields_to_requirement
```

---

## 2. Cambios en el backend

### `requirement.controller.js`

Incluir los cuatro campos nuevos en todas las operaciones:

- `POST /api/requirements` — aceptar y guardar los cuatro campos (opcionales)
- `PUT /api/requirements/:id` — aceptar y actualizar los cuatro campos
- `GET /api/requirements/:id` — ya los devolverá automáticamente con Prisma
- `GET /api/requirements` (listado) — **no incluir** estos campos en el listado para no inflar la respuesta; solo en el detalle individual

En la validación del body, los cuatro campos son opcionales (`string | undefined`), sin longitud mínima obligatoria.

---

## 3. Cambios en el frontend — Modal de requerimiento

### Posición de la nueva sección en el formulario

El modal queda organizado en estas secciones en orden:

```
1. Código + Fuente legal
2. Nombre
3. Requerimiento específico           ← ya existe
4. ─────────────────────────────────
   INFORMACIÓN DE LA NORMA            ← SECCIÓN NUEVA (colapsable)
   • Nombre de la norma
   • Objetivo de la norma
   • Justificación de aplicabilidad
   • Alcance de aplicación
   ─────────────────────────────────
5. Base legal + Área
6. Estado + Fecha compromiso global
7. Área responsable
8. Actividades de cumplimiento        ← ya existe (v1.2)
9. Notas
```

### Diseño de la sección "Información de la norma"

La sección debe ser **colapsable** para no sobrecargar visualmente el modal cuando no se necesita editar esa información. Usar un acordeón simple con chevron:

```jsx
// Componente NormInfoSection dentro del modal
const [normExpanded, setNormExpanded] = useState(false);

<div className="border border-gray-200 rounded-lg overflow-hidden">
  {/* Header colapsable */}
  <button
    type="button"
    onClick={() => setNormExpanded(!normExpanded)}
    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
  >
    <div className="flex items-center gap-2">
      <BookOpen size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-gray-700">
        Información de la norma
      </span>
      {/* Indicador de campos con datos */}
      {hasNormData && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          Completado
        </span>
      )}
    </div>
    <ChevronDown
      size={16}
      className={`text-gray-400 transition-transform ${normExpanded ? 'rotate-180' : ''}`}
    />
  </button>

  {/* Contenido expandible */}
  {normExpanded && (
    <div className="px-4 py-4 space-y-4 border-t border-gray-200">

      {/* Nombre de la norma */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la norma
        </label>
        <input
          type="text"
          name="normName"
          value={formData.normName || ''}
          onChange={handleChange}
          placeholder="Ej: Norma Oficial Mexicana NOM-017-STPS-2008, Equipo de protección personal..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Objetivo de la norma */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivo de la norma
        </label>
        <textarea
          name="normObjective"
          value={formData.normObjective || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Describir qué busca prevenir o regular esta norma..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Justificación de aplicabilidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Justificación de aplicabilidad
        </label>
        <textarea
          name="applicabilityJustification"
          value={formData.applicabilityJustification || ''}
          onChange={handleChange}
          rows={3}
          placeholder="¿Por qué aplica esta norma a la empresa? Ej: La empresa cuenta con procesos de soldadura y esmerilado que generan riesgo de proyección de partículas..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Alcance de aplicación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alcance de aplicación
        </label>
        <textarea
          name="applicabilityScope"
          value={formData.applicabilityScope || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Áreas, puestos, procesos o actividades a los que aplica dentro de la organización. Ej: Aplica a los operadores del área de producción, soldadores, esmeriladores y personal de mantenimiento..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

    </div>
  )}
</div>
```

**Lógica de `hasNormData`:**
```js
const hasNormData = !!(
  formData.normName ||
  formData.normObjective ||
  formData.applicabilityJustification ||
  formData.applicabilityScope
);
```

Cuando el acordeón está cerrado y `hasNormData = true`, mostrar el badge "Completado" en el header para que el usuario sepa que hay información registrada sin necesidad de expandirlo.

### Estado inicial del acordeón

- Al **crear** un nuevo requerimiento: cerrado por defecto
- Al **editar** un requerimiento existente: abierto automáticamente si `hasNormData = true`, cerrado si todos los campos están vacíos

```js
const [normExpanded, setNormExpanded] = useState(
  !!(initialData?.normName || initialData?.normObjective ||
     initialData?.applicabilityJustification || initialData?.applicabilityScope)
);
```

---

## 4. Vista de detalle del requerimiento

En `RequirementDetailPage.jsx`, mostrar los cuatro campos como sección de solo lectura con el mismo diseño de acordeón (pero sin edición inline — la edición sigue siendo desde el modal).

Formato de visualización:

```
┌─────────────────────────────────────────────────────┐
│  📖  Información de la norma                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Nombre de la norma                                 │
│  Norma Oficial Mexicana NOM-017-STPS-2008,          │
│  Equipo de protección personal - selección, uso...  │
│                                                     │
│  Objetivo de la norma                               │
│  Establecer los requisitos mínimos para que los     │
│  patrones seleccionen, adquieran y proporcionen...  │
│                                                     │
│  Justificación de aplicabilidad                     │
│  La empresa realiza procesos de manufactura         │
│  metalmecánica que incluyen...                      │
│                                                     │
│  Alcance de aplicación                              │
│  Aplica a todos los trabajadores del área de        │
│  producción, mantenimiento y almacén...             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Si alguno de los campos está vacío, mostrar en su lugar el texto `"No especificado"` en gris tenue.

---

## 5. Actualizar i18n

En `frontend/src/i18n/es.json`, dentro del namespace de requerimientos:

```json
"requirements": {
  "normInfo": {
    "sectionTitle": "Información de la norma",
    "completed": "Completado",
    "normName": "Nombre de la norma",
    "normNamePlaceholder": "Nombre oficial completo de la norma o disposición legal",
    "normObjective": "Objetivo de la norma",
    "normObjectivePlaceholder": "¿Qué busca prevenir o regular esta norma?",
    "applicabilityJustification": "Justificación de aplicabilidad",
    "applicabilityJustificationPlaceholder": "¿Por qué aplica esta norma a la empresa?",
    "applicabilityScope": "Alcance de aplicación",
    "applicabilityScopePlaceholder": "Áreas, puestos o procesos a los que aplica",
    "notSpecified": "No especificado"
  }
}
```

Equivalente en `en.json`.

---

## 6. Actualizar el seed de datos

En `backend/prisma/seed.js`, agregar los cuatro campos a al menos **5 requerimientos** de la empresa principal (los que tienen estado COMPLETED o IN_PROGRESS) para que la sección se vea poblada en las pruebas. Ejemplo para NOM-017:

```js
{
  code: 'NOM-017-STPS-2008',
  name: 'Equipo de Protección Personal',
  specificRequirement: 'Cumplimiento de NOM-017-STPS-2008...',
  normName: 'Norma Oficial Mexicana NOM-017-STPS-2008, Equipo de protección personal-Selección, uso y manejo en los centros de trabajo.',
  normObjective: 'Establecer los requisitos mínimos para que los patrones seleccionen, adquieran y proporcionen a sus trabajadores el equipo de protección personal correspondiente para protegerlos de los agentes del medio ambiente de trabajo que puedan dañar su integridad física y su salud.',
  applicabilityJustification: 'La empresa realiza procesos de manufactura metalmecánica que incluyen maquinado, soldadura, esmerilado y manejo de materiales, actividades que exponen al personal a riesgos de proyección de partículas, ruido, sustancias químicas y esfuerzo físico.',
  applicabilityScope: 'Aplica a todos los trabajadores del área de producción, mantenimiento y almacén. Incluye personal de planta, supervisores y contratistas que realicen actividades dentro de las instalaciones.',
  // ...resto de campos
}
```

---

## Checklist de implementación

### Base de datos
- [ ] Agregar `normName`, `normObjective`, `applicabilityJustification`, `applicabilityScope` en `schema.prisma`
- [ ] Ejecutar migración con Prisma
- [ ] Actualizar seed con datos de ejemplo en al menos 5 requerimientos

### Backend
- [ ] Aceptar y guardar los cuatro campos en `POST /api/requirements`
- [ ] Aceptar y actualizar los cuatro campos en `PUT /api/requirements/:id`
- [ ] Confirmar que `GET /api/requirements/:id` los devuelve
- [ ] Excluir los cuatro campos del listado `GET /api/requirements` (select explícito)

### Frontend
- [ ] Agregar los cuatro campos al estado del formulario (`formData`)
- [ ] Crear sección colapsable "Información de la norma" en el modal
- [ ] Implementar lógica `hasNormData` y badge "Completado"
- [ ] Inicializar acordeón abierto si ya hay datos al editar
- [ ] Mostrar sección de solo lectura en `RequirementDetailPage.jsx`
- [ ] Mostrar "No especificado" cuando un campo está vacío en la vista de detalle
- [ ] Actualizar `es.json` y `en.json`

---

## Nota técnica

Los cuatro campos son `String? @db.Text` (nullable, sin longitud máxima en BD). No requieren validación de longitud mínima — el usuario puede dejar cualquiera en blanco. No afectan el cálculo de estado del requerimiento ni la lógica del calendario introducidos en versiones anteriores.

---

*Módulo: Requerimientos — Actualización v1.3*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL + Prisma*
