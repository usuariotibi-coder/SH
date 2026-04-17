# Prompt para Claude Code — Módulo: Calendario de Eventos SH

## Objetivo

Agregar un **módulo de Calendario** a la aplicación de Seguridad e Higiene. El calendario consolida en una sola vista todas las fechas compromiso y vencimientos de los diferentes módulos de la app, permitiendo al usuario ver de un vistazo qué está próximo a vencer y qué ya está vencido.

---

## Fuentes de eventos (qué módulos aportan fechas)

El calendario debe leer fechas de las siguientes entidades ya existentes en la base de datos:

| Módulo | Campo de fecha | Etiqueta del evento | Color |
|--------|---------------|---------------------|-------|
| Requirement | `dueDate` | Requerimiento: {code} | Azul |
| Activity | `dueDate` | Actividad: {description truncada 40 chars} | Azul claro |
| Incident | — | No aplica (no tiene fecha futura) | — |
| Training | `expirationDate` | Capacitación vence: {name} | Verde |
| Drill | `plannedDate` (si `isCompleted = false`) | Simulacro planeado: {type} | Amarillo |
| Maintenance | `nextDate` | Mantenimiento: {name} | Naranja |
| Risk | `targetDate` | Control de riesgo: {hazard truncado} | Rojo |
| Audit | `auditDate` (si `status = PLANNED` o `IN_PROGRESS`) | Auditoría: {title truncado} | Morado |
| CMSHMeeting | `nextMeeting` | Reunión CMSH | Verde olivo |
| FiveS | — | No aplica (son retrospectivas) | — |

---

## Backend

### Nuevo endpoint

```
GET /api/calendar?companyId=&start=&end=
```

- Parámetros opcionales: `start` (ISO date) y `end` (ISO date) para filtrar por rango
- Si no se pasan, devuelve eventos de los próximos **90 días** + los últimos **30 días** (para mostrar vencidos)
- Respeta el `companyId` del usuario autenticado (o el seleccionado por el ADMIN)
- Aplica los permisos del rol: AREA_MANAGER solo ve eventos de su área

### Estructura de cada evento en la respuesta

```json
{
  "id": "req-cuid123",
  "title": "NOM-017-STPS-2008 — EPP",
  "date": "2025-06-15T00:00:00.000Z",
  "type": "requirement",
  "status": "IN_PROGRESS",
  "severity": "overdue" | "urgent" | "upcoming" | "normal",
  "module": "Requerimientos",
  "area": "Producción",
  "sourceId": "cuid123",
  "url": "/requirements/cuid123"
}
```

**Lógica de `severity`:**
- `overdue`: fecha ya pasó (date < hoy)
- `urgent`: vence en los próximos 7 días
- `upcoming`: vence en los próximos 8–30 días
- `normal`: vence en más de 30 días

### Archivo a crear

`backend/src/controllers/calendar.controller.js`

```js
// Pseudocódigo de la lógica central
async function getCalendarEvents(req, res) {
  const { companyId, start, end } = resolveParams(req);
  
  const rangeStart = start ?? subDays(new Date(), 30);
  const rangeEnd   = end   ?? addDays(new Date(), 90);

  const [requirements, activities, trainings, drills,
         maintenances, risks, audits, cmshMeetings] = await Promise.all([
    prisma.requirement.findMany({
      where: { companyId, dueDate: { gte: rangeStart, lte: rangeEnd } },
      select: { id, code, name, dueDate, status, responsibleArea }
    }),
    prisma.activity.findMany({
      where: {
        requirement: { companyId },
        dueDate: { gte: rangeStart, lte: rangeEnd },
        isCompleted: false
      },
      select: { id, description, dueDate, requirement: { select: { id } } }
    }),
    // ... mismo patrón para cada modelo
  ]);

  const events = [
    ...mapRequirements(requirements),
    ...mapActivities(activities),
    ...mapTrainings(trainings),
    ...mapDrills(drills),
    ...mapMaintenances(maintenances),
    ...mapRisks(risks),
    ...mapAudits(audits),
    ...mapCMSHMeetings(cmshMeetings),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({ events, total: events.length });
}
```

`backend/src/routes/calendar.routes.js` — registrar en `app.js` como `/api/calendar`

---

## Frontend

### Ruta nueva

```
/calendar
```

Agregar al sidebar con icono `Calendar` de Lucide React, entre el Dashboard y Requerimientos.

### Archivo principal

`frontend/src/pages/calendar/CalendarPage.jsx`

### Librería de calendario

Usar **`react-big-calendar`** con el adaptador de date-fns:

```bash
npm install react-big-calendar date-fns
```

Importar estilos base y sobreescribir con Tailwind/CSS variables del proyecto para que combine con el diseño existente.

---

## Diseño y UX del calendario

### Layout general de la página

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (existente)                                      │
├──────────┬──────────────────────────────────────────────┤
│          │  [◄ Mes anterior]  Mayo 2025  [Mes siguiente ►] │
│ SIDEBAR  │  [Semana] [Mes] [Agenda]    [Hoy]            │
│          │─────────────────────────────────────────────  │
│          │  Panel de leyenda de colores (horizontal)     │
│          │─────────────────────────────────────────────  │
│          │                                               │
│          │         CALENDARIO (react-big-calendar)       │
│          │                                               │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

### Vistas disponibles

- **Mes** (vista por defecto)
- **Semana**
- **Agenda** (lista de eventos próximos, ideal para móvil)

### Panel de leyenda (encima del calendario)

Mostrar pills horizontales con el color y nombre de cada tipo de evento. Al hacer clic en un tipo, filtrar/ocultar ese tipo en el calendario (toggle).

```
● Requerimientos  ● Actividades  ● Capacitaciones  ● Simulacros
● Mantenimientos  ● Riesgos      ● Auditorías       ● Reunión CMSH
```

### Colores de los eventos (usar variables CSS del proyecto)

Definir con transparencia para no saturar visualmente:

```css
/* Colores base por tipo de módulo */
.event-requirement   { background: #1a4a6b; }   /* --color-primary */
.event-activity      { background: #2563a8; }   /* --color-primary-light */
.event-training      { background: #16a34a; }   /* --color-success */
.event-drill         { background: #d97706; }   /* --color-warning */
.event-maintenance   { background: #e8622a; }   /* --color-accent */
.event-risk          { background: #dc2626; }   /* --color-danger */
.event-audit         { background: #7c3aed; }   /* purple */
.event-cmsh          { background: #4d7c0f; }   /* olive */

/* Sobreescritura por severity — borde izquierdo grueso */
.event-overdue  { border-left: 4px solid #dc2626; opacity: 0.9; }
.event-urgent   { border-left: 4px solid #f59e0b; }
.event-upcoming { border-left: 4px solid #3b82f6; }
```

### Comportamiento de los eventos en el calendario

**En vista mes:**
- Mostrar el texto corto del evento (máx. 35 chars)
- Si hay más de 3 eventos en un día, mostrar "+N más" clickeable
- Los eventos vencidos (overdue) deben tener fondo con opacidad reducida y una rayita diagonal sutil (CSS pattern)

**En vista semana:**
- Mostrar título completo del evento
- Indicador de severity como punto de color a la izquierda

**En vista agenda:**
- Listar todos los eventos agrupados por fecha
- Mostrar: icono del módulo + título + área + badge de severity

### Modal de detalle del evento (al hacer clic en cualquier evento)

Mostrar un modal lateral (drawer desde la derecha, 400px de ancho) con:

```
┌────────────────────────────────────────┐
│  [icono módulo]  Mantenimiento         │  ← tipo
│  ✕                                     │  ← cerrar
├────────────────────────────────────────┤
│  Montacargas #1                        │  ← título
│  ⚠ VENCIDO hace 8 días                │  ← severity badge
│                                        │
│  📅 Fecha: 15 mayo 2025               │
│  🏭 Área: Almacén                     │
│  👤 Responsable: Ing. Torres          │
│  📋 Módulo: Mantenimiento preventivo  │
│                                        │
│  [Ver detalle completo →]             │  ← link al módulo
└────────────────────────────────────────┘
```

El botón "Ver detalle completo" navega a la URL correspondiente del módulo (usando el campo `url` del evento).

### Panel de resumen (encima del calendario, debajo de la leyenda)

4 tarjetas pequeñas con contadores del mes visible:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  🔴  12  │ │  🟡   5  │ │  🔵  18  │ │  ✅   8  │
│ Vencidos │ │ Urgentes │ │ Próximos │ │Completad.│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Los contadores cambian al navegar entre meses (filtrar los eventos por el mes visible).

---

## Componentes a crear

### `CalendarPage.jsx`
Página principal. Maneja el estado del mes visible, los filtros de tipo activos y el evento seleccionado.

### `CalendarToolbar.jsx`
Barra de navegación personalizada que reemplaza el toolbar por defecto de react-big-calendar. Incluye los botones de mes anterior/siguiente, el título del mes/semana, los botones de vista (Mes/Semana/Agenda) y el botón "Hoy".

### `CalendarEventItem.jsx`
Componente personalizado para renderizar cada evento dentro del calendario. Recibe el evento y muestra el punto de severity + título truncado.

### `CalendarLegend.jsx`
Panel de leyenda con pills filtrables. Mantiene estado de qué tipos están activos.

### `CalendarSummaryCards.jsx`
Las 4 tarjetas de contadores. Recibe los eventos del mes visible y calcula los totales.

### `EventDetailDrawer.jsx`
Drawer lateral que se abre al hacer clic en un evento. Muestra el detalle y el link al módulo.

---

## Integración con el sistema de alertas existente

El calendario **no reemplaza** el panel de alertas del dashboard — lo complementa. La diferencia es:

- **Panel de alertas**: lista plana de los N eventos más urgentes, siempre visible en el dashboard
- **Calendario**: vista temporal completa, navegable por mes/semana, con todos los eventos

En el panel de alertas existente, agregar un link "Ver en calendario →" que navegue a `/calendar` con el filtro del tipo de alerta preseleccionado (usando query params: `/calendar?type=maintenance&severity=overdue`).

---

## Ajustes al seed de datos

Si el seed de datos de prueba ya fue ejecutado, verificar que existan eventos en distintos rangos de fecha para que el calendario se vea poblado. Si no, agregar en el seed:

- 3 maintenances con `nextDate` en los próximos 7 días (urgentes)
- 2 requirements con `dueDate` en los próximos 5 días
- 1 training con `expirationDate` en los próximos 3 días
- 1 CMSHMeeting con `nextMeeting` en los próximos 15 días
- 1 drill con `plannedDate` en los próximos 20 días y `isCompleted: false`

---

## Internacionalización

Agregar en `frontend/src/i18n/es.json`:

```json
"calendar": {
  "title": "Calendario de eventos",
  "views": { "month": "Mes", "week": "Semana", "agenda": "Agenda" },
  "today": "Hoy",
  "severity": {
    "overdue": "Vencido",
    "urgent": "Urgente",
    "upcoming": "Próximo",
    "normal": "Programado"
  },
  "summary": {
    "overdue": "Vencidos",
    "urgent": "Urgentes",
    "upcoming": "Próximos",
    "completed": "Completados"
  },
  "noEvents": "No hay eventos en este período",
  "viewDetail": "Ver detalle completo"
}
```

Y el equivalente en `en.json`.

---

## Checklist de implementación

- [ ] Instalar `react-big-calendar` y `date-fns` en el frontend
- [ ] Crear `calendar.controller.js` y `calendar.routes.js` en el backend
- [ ] Registrar la ruta `/api/calendar` en `app.js`
- [ ] Crear `CalendarPage.jsx` con las vistas Mes/Semana/Agenda
- [ ] Crear `CalendarToolbar.jsx` personalizado
- [ ] Crear `CalendarEventItem.jsx` con colores por tipo y severity
- [ ] Crear `CalendarLegend.jsx` con filtros toggleables
- [ ] Crear `CalendarSummaryCards.jsx` con contadores reactivos al mes visible
- [ ] Crear `EventDetailDrawer.jsx` con link al módulo
- [ ] Sobreescribir estilos de react-big-calendar para que coincidan con el diseño del proyecto
- [ ] Agregar ruta `/calendar` en `App.jsx`
- [ ] Agregar ítem en `Sidebar.jsx` con icono Calendar
- [ ] Agregar link "Ver en calendario" en el panel de alertas del dashboard
- [ ] Agregar claves de i18n en es.json y en.json
- [ ] Soporte para query param `?type=&severity=` para llegar con filtro preseleccionado

---

*Módulo: Calendario de Eventos — Actualización v1.1*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL*
