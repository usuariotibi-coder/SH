# Prompt para Claude Code — Actualización v1.5: Módulo de Brigadas + corrección de internacionalización completa

---

## Parte 1 — Módulo de Brigadas de emergencia

### Contexto normativo

Las brigadas de emergencia son equipos de respuesta operativa requeridos por la **NOM-002-STPS-2010** (prevención y protección contra incendios) y los **Programas Internos de Protección Civil** (PIPC). Son entidades distintas a la CMSH (NOM-019-STPS-2011): la CMSH es un órgano de vigilancia normativa, las brigadas son equipos de acción. Deben tener su propio módulo, no estar subordinadas a la CMSH.

### Brigadas predefinidas del sistema

El sistema maneja estas **cuatro brigadas fijas** (no configurables por el usuario):

| Clave | Nombre | Descripción |
|-------|--------|-------------|
| `FIRST_AID` | Brigada de primeros auxilios | Atención de lesionados, traslado y estabilización |
| `EVACUATION` | Brigada de evacuación | Guía y control de evacuación de personal |
| `FIRE_FIGHTING` | Brigada contra incendios | Combate de conatos, manejo de extintores y equipo |
| `SEARCH_RESCUE` | Brigada de búsqueda y rescate | Localización y rescate de personas atrapadas |

### Modelo de datos — Nuevas entidades en `schema.prisma`

```prisma
enum BrigadeType {
  FIRST_AID
  EVACUATION
  FIRE_FIGHTING
  SEARCH_RESCUE
}

enum BrigadeMemberRole {
  COORDINATOR    // Jefe de brigada
  DEPUTY         // Subjefe / suplente
  MEMBER         // Brigadista
}

model Brigade {
  id          String      @id @default(cuid())
  type        BrigadeType @unique // Una brigada de cada tipo por empresa
  description String?     @db.Text
  objectives  String?     @db.Text
  meetingPoint String?    // Punto de reunión asignado
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  companyId String
  company   Company  @relation(fields: [companyId], references: [id])

  members   BrigadeMember[]
}

model BrigadeMember {
  id           String            @id @default(cuid())
  memberRole   BrigadeMemberRole @default(MEMBER)
  employeeName String            // Nombre libre o tomado de User
  employeeArea String?
  employeePosition String?       // Puesto de trabajo
  phone        String?
  startDate    DateTime          @default(now())
  endDate      DateTime?
  isActive     Boolean           @default(true)
  certificationDate DateTime?    // Fecha de última capacitación como brigadista
  certificationExpiry DateTime?  // Vencimiento de la certificación
  notes        String?

  brigadeId String
  brigade   Brigade @relation(fields: [brigadeId], references: [id], onDelete: Cascade)

  // Relación opcional con usuario del sistema
  userId    String?
  user      User?   @relation(fields: [userId], references: [id])
}
```

Agregar en el modelo `Company`:
```prisma
brigades Brigade[]
```

Agregar en el modelo `User`:
```prisma
brigadeMemberships BrigadeMember[]
```

Migración:
```bash
npx prisma migrate dev --name add_brigades_module
```

### Endpoints del backend

```
GET    /api/brigades                     → Lista las 4 brigadas de la empresa con sus miembros
GET    /api/brigades/:type               → Detalle de una brigada (FIRST_AID, EVACUATION, etc.)
PUT    /api/brigades/:type               → Actualizar descripción, objetivos, punto de reunión
POST   /api/brigades/:type/members       → Agregar integrante a la brigada
PUT    /api/brigades/:type/members/:id   → Editar integrante
DELETE /api/brigades/:type/members/:id   → Eliminar integrante (soft delete: isActive = false)
```

Permisos:
- `GET`: todos los roles autenticados
- `PUT`, `POST`, `DELETE`: solo `ADMIN` y `SH_SPECIALIST`

**Inicialización automática de brigadas:** Al crear una nueva empresa, crear automáticamente los 4 registros de `Brigade` (uno por tipo) con `isActive: true` y sin miembros. Hacer esto en el controller de creación de empresa (`company.controller.js`).

### Navegación

Agregar ítem **"Brigadas"** en el sidebar con icono `ShieldAlert` de Lucide React, debajo de "CMSH" en el grupo de módulos normativos.

Ruta: `/brigades`

---

### Frontend — Página de Brigadas (`/brigades`)

#### Layout general de la página

```
┌─────────────────────────────────────────────────────────────┐
│  Brigadas de emergencia                        [i] NOM-002  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌───────┐ │
│  │ 🚑 Primeros  │ │ 🚶 Evacuación│ │ 🔥 Incend│ │🔍 B&R │ │
│  │   auxilios   │ │              │ │  ios     │ │       │ │
│  │  6 integr.   │ │  8 integr.   │ │ 5 integr.│ │3 int. │ │
│  └──────────────┘ └──────────────┘ └──────────┘ └───────┘ │
│                                                             │
│  ─── Brigada de primeros auxilios ────────────────────── ▼ │
│                                                             │
│  [Punto de reunión: Estacionamiento norte]  [✎ editar]     │
│                                                             │
│  ┌──────┬─────────────┬───────────┬──────────┬──────────┐  │
│  │ Rol  │ Nombre      │ Área      │ Certif.  │ Acciones │  │
│  ├──────┼─────────────┼───────────┼──────────┼──────────┤  │
│  │ Jefe │ Ing. Ruiz   │ SH        │ ✅ vigente│  [✎][🗑]│  │
│  │ Suplente│ Sr. Pérez│ Producción│ ⚠️ vence  │  [✎][🗑]│  │
│  │ Miem.│ Sra. López  │ Admón.    │ ❌ vencida│  [✎][🗑]│  │
│  └──────┴─────────────┴───────────┴──────────┴──────────┘  │
│                                [+ Agregar integrante]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tarjetas de resumen (parte superior)

4 tarjetas, una por brigada, con:
- Icono representativo de la brigada
- Nombre de la brigada
- Número de integrantes activos
- Indicador visual si hay certificaciones vencidas (punto rojo) o próximas a vencer (punto amarillo)
- Al hacer clic, hace scroll suave a la sección de esa brigada (o activa el acordeón)

#### Sección por brigada (acordeón)

Cada brigada se muestra como un panel acordeón expandible. Por defecto, el primero está expandido.

Cada panel tiene:

1. **Header del acordeón**: nombre de la brigada + contador de integrantes + indicador de estado de certificaciones + chevron

2. **Descripción y punto de reunión** (editable inline con `InlineEditField` del cambio 5 de v1.4, solo para `ADMIN` y `SH_SPECIALIST`)

3. **Tabla de integrantes** con columnas:
   - Rol en brigada (badge: Jefe / Suplente / Brigadista)
   - Nombre del integrante
   - Puesto de trabajo
   - Área
   - Teléfono
   - Fecha de certificación / vencimiento (con indicador de color)
   - Acciones: editar, desactivar

4. **Botón "Agregar integrante"** al pie de cada tabla

#### Regla de unicidad de roles en cada brigada

- Cada brigada puede tener **máximo 1 Jefe** y **máximo 1 Suplente**
- No hay límite de Brigadistas
- Al intentar agregar un segundo Jefe, mostrar error: "Esta brigada ya tiene un Jefe asignado. Cambia el rol del integrante actual antes de asignar uno nuevo."

#### Modal de agregar / editar integrante

Campos del formulario:

```
Seleccionar de la lista de usuarios    [toggle: Nombre libre]
──────────────────────────────────────────────────────────────
Nombre *         [ResponsibleSelector — reusar componente v1.4]
Puesto de trabajo
Área
Teléfono
Rol en la brigada *   [Jefe de brigada | Suplente | Brigadista]
Fecha de certificación
Fecha de vencimiento de certificación
Notas
```

Usar el componente `ResponsibleSelector` de la v1.4 para el campo de nombre (selector de usuarios de la empresa con opción de texto libre).

#### Indicadores de certificación

Calcular el estado de la certificación de cada integrante:

```js
function getCertificationStatus(expiryDate) {
  if (!expiryDate) return 'none';         // Sin fecha → sin indicador
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0)   return 'expired';       // Vencida → rojo
  if (days <= 30) return 'expiring';      // Vence en ≤30 días → amarillo
  return 'valid';                          // Vigente → verde
}
```

Mostrar en la tabla:
- `valid`: badge verde "Vigente" + fecha
- `expiring`: badge amarillo "Vence pronto" + fecha
- `expired`: badge rojo "Vencida" + fecha
- `none`: texto gris "Sin registro"

#### Integrantes en múltiples brigadas

Un mismo trabajador puede aparecer en más de una brigada sin restricción. En la tabla de cada brigada se muestra su nombre normalmente. No hay validación que lo impida — es una práctica común en empresas pequeñas donde el mismo personal cubre varios roles de emergencia.

Para dar visibilidad, en el modal de edición de un integrante, mostrar un indicador:

```
ℹ️ Este integrante también pertenece a: Brigada de evacuación
```

(Consultar `BrigadeMember` por `userId` si tiene vinculación, o por `employeeName` como fallback.)

---

### Conexión con el calendario

Agregar al `calendar.controller.js` los vencimientos de certificaciones de brigadistas como eventos:

```js
prisma.brigadeMember.findMany({
  where: {
    brigade: { companyId },
    isActive: true,
    certificationExpiry: { gte: rangeStart, lte: rangeEnd }
  },
  include: { brigade: { select: { type: true } } }
})
```

Evento generado:
```json
{
  "id": "brig-cuid123",
  "title": "Cert. vence: Ing. Ruiz (Brigada primeros auxilios)",
  "date": "2025-07-10T00:00:00.000Z",
  "type": "brigade",
  "severity": "urgent | upcoming | overdue",
  "module": "Brigadas",
  "area": "Seguridad e Higiene",
  "url": "/brigades"
}
```

Color del evento en el calendario: `#0891b2` (cyan-600) — diferente a todos los tipos existentes.

Agregar en la leyenda del calendario: `● Brigadas`.

---

### Seed de datos para brigadas

En `backend/prisma/seed.js`, para la empresa "Manufacturas del Norte":

Crear las 4 brigadas con integrantes realistas:

**Brigada de primeros auxilios (6 integrantes):**
- Jefe: `Lic. Carmen Ruiz Torres` — área SH — cert. vigente (vence en 8 meses)
- Suplente: `Sra. Adriana Flores Medina` — área Producción — cert. vence en 25 días (para activar alerta)
- 4 brigadistas de distintas áreas — mezcla de cert. vigentes y una vencida

**Brigada de evacuación (8 integrantes):**
- Jefe: `Ing. Luis Martínez Ortega` — área Producción
- Suplente: `Sr. Manuel Vargas Reyes` — área Almacén
- 6 brigadistas — cert. vigentes
- Punto de reunión: `Estacionamiento principal, zona norte`

**Brigada contra incendios (5 integrantes):**
- Jefe: `Ing. Roberto Salinas Mendoza` — área Operaciones
- 4 brigadistas — cert. vigentes
- Punto de reunión: `Punto de reunión B — Puerta lateral`

**Brigada de búsqueda y rescate (4 integrantes):**
- Jefe: `Sr. Juan Pérez Hernández` — área Producción — cert. vencida hace 15 días (para activar alerta)
- 3 brigadistas

---

## Parte 2 — Corrección de internacionalización completa

### Problema

El cambio de idioma (ES/EN) actualmente solo afecta los textos del sidebar y el topbar. Todos los textos hardcodeados en las páginas internas (`pages/`) y componentes (`components/`) no están usando las claves de i18next, por lo que no cambian al cambiar el idioma.

### Solución

Auditar **todos los archivos de páginas y componentes** y reemplazar cada texto visible hardcodeado por la función `t()` de i18next con su clave correspondiente.

### Implementación

#### 1. Hook `useTranslation` en todos los componentes

Asegurarse de que **cada componente y página** que tenga texto visible importe y use el hook:

```js
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
```

#### 2. Estructura completa de `es.json`

Crear o completar el archivo `frontend/src/i18n/es.json` con **todas** las claves de la aplicación:

```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Eliminar",
    "add": "Agregar",
    "close": "Cerrar",
    "search": "Buscar",
    "filter": "Filtrar",
    "export": "Exportar",
    "loading": "Cargando...",
    "noData": "Sin datos registrados",
    "notSpecified": "No especificado",
    "readOnly": "Solo lectura",
    "confirm": "Confirmar",
    "back": "Regresar",
    "next": "Siguiente",
    "previous": "Anterior",
    "of": "de",
    "total": "Total",
    "actions": "Acciones",
    "status": "Estado",
    "date": "Fecha",
    "area": "Área",
    "responsible": "Responsable",
    "notes": "Notas",
    "name": "Nombre",
    "description": "Descripción",
    "createdAt": "Fecha de creación",
    "updatedAt": "Última actualización",
    "yes": "Sí",
    "no": "No",
    "optional": "Opcional",
    "required": "Requerido",
    "completed": "Completado",
    "pending": "Pendiente",
    "inProgress": "En proceso",
    "overdue": "Vencido",
    "notApplicable": "No aplica"
  },
  "nav": {
    "dashboard": "Dashboard",
    "requirements": "Requerimientos",
    "incidents": "Incidentes",
    "cmsh": "Comisión Mixta (CMSH)",
    "brigades": "Brigadas",
    "training": "Capacitación",
    "drills": "Simulacros",
    "fiveS": "Metodología 5S",
    "maintenance": "Mantenimiento",
    "risks": "Gestión de riesgos",
    "audits": "Auditorías internas",
    "program": "Programa SH",
    "calendar": "Calendario",
    "users": "Usuarios",
    "companies": "Empresas",
    "collapse": "Colapsar menú",
    "expand": "Expandir menú"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "loginButton": "Entrar",
    "loginError": "Correo o contraseña incorrectos",
    "sessionExpired": "Tu sesión ha expirado, inicia sesión nuevamente"
  },
  "dashboard": {
    "title": "Dashboard ejecutivo",
    "kpi": {
      "complianceRate": "Cumplimiento normativo",
      "incidentsMonth": "Incidentes del mes",
      "trainingsCompleted": "Capacitaciones realizadas",
      "drillsCompleted": "Simulacros realizados",
      "fiveSScore": "Puntaje promedio 5S",
      "overdueRequirements": "Requerimientos vencidos"
    },
    "charts": {
      "requirementsByStatus": "Requerimientos por estado",
      "incidentsByMonth": "Incidentes por mes",
      "complianceByArea": "Cumplimiento por área",
      "fiveSByArea": "Tendencia 5S por área"
    },
    "alerts": {
      "title": "Alertas",
      "viewAll": "Ver en calendario",
      "noAlerts": "Sin alertas activas"
    }
  },
  "requirements": {
    "title": "Requerimientos legales",
    "new": "Nuevo requerimiento",
    "edit": "Editar requerimiento",
    "detail": "Detalle del requerimiento",
    "code": "Código normativo",
    "name": "Nombre",
    "specificRequirement": "Requerimiento específico",
    "legalSource": "Fuente legal",
    "legalBasis": "Base legal",
    "dueDate": "Fecha compromiso",
    "responsibleArea": "Área responsable",
    "status": "Estado",
    "statuses": {
      "PENDING": "Pendiente",
      "IN_PROGRESS": "En proceso",
      "COMPLETED": "Cumplido",
      "OVERDUE": "Vencido",
      "NOT_APPLICABLE": "No aplica"
    },
    "legalSources": {
      "NOM": "NOM",
      "IMSS": "IMSS",
      "STPS": "STPS",
      "SEMARNAT": "SEMARNAT",
      "CIVIL_PROTECTION": "Protección Civil",
      "MUNICIPAL": "Municipal",
      "OTHER": "Otro"
    },
    "normInfo": {
      "sectionTitle": "Información de la norma",
      "completed": "Completado",
      "normName": "Nombre de la norma",
      "normObjective": "Objetivo de la norma",
      "applicabilityJustification": "Justificación de aplicabilidad",
      "applicabilityScope": "Alcance de aplicación"
    },
    "activities": {
      "title": "Actividades de cumplimiento",
      "add": "+ Agregar actividad",
      "description": "Descripción",
      "responsible": "Responsable",
      "dueDate": "Fecha compromiso",
      "status": "Estado",
      "statuses": {
        "PENDING": "Pendiente",
        "IN_PROGRESS": "En proceso",
        "COMPLETED": "Completada",
        "BLOCKED": "Bloqueada"
      },
      "progress": "Avance",
      "progressOf": "de",
      "completedLabel": "completadas",
      "noActivities": "Sin actividades. Agrega al menos una para el seguimiento.",
      "statusAutomatic": "El estado se calcula automáticamente según el avance de las actividades.",
      "deleteConfirm": "¿Eliminar esta actividad?"
    }
  },
  "incidents": {
    "title": "Incidentes y accidentes",
    "new": "Registrar incidente",
    "edit": "Editar incidente",
    "folio": "Folio",
    "type": "Tipo",
    "types": {
      "ACCIDENT": "Accidente",
      "INCIDENT": "Incidente",
      "NEAR_MISS": "Casi accidente",
      "OCCUPATIONAL_DISEASE": "Enfermedad profesional"
    },
    "severity": "Gravedad",
    "severities": {
      "MINOR": "Leve",
      "MODERATE": "Moderado",
      "SERIOUS": "Grave",
      "FATAL": "Fatal"
    },
    "occurredAt": "Fecha del evento",
    "rootCause": "Causa raíz",
    "correctiveAction": "Acción correctiva",
    "lostDays": "Días perdidos",
    "imssReport": "Aviso IMSS",
    "isClosed": "Cerrado"
  },
  "cmsh": {
    "title": "Comisión Mixta de SH",
    "members": "Integrantes",
    "meetings": "Actas de reunión",
    "newMember": "Agregar integrante",
    "newMeeting": "Registrar acta",
    "roles": {
      "PRESIDENT": "Presidente",
      "SECRETARY": "Secretario",
      "WORKER_REP": "Rep. trabajadores",
      "EMPLOYER_REP": "Rep. empresa"
    }
  },
  "brigades": {
    "title": "Brigadas de emergencia",
    "subtitle": "Equipos de respuesta operativa",
    "normReference": "NOM-002-STPS-2010 / PIPC",
    "types": {
      "FIRST_AID": "Primeros auxilios",
      "EVACUATION": "Evacuación",
      "FIRE_FIGHTING": "Contra incendios",
      "SEARCH_RESCUE": "Búsqueda y rescate"
    },
    "memberRole": "Rol en brigada",
    "memberRoles": {
      "COORDINATOR": "Jefe de brigada",
      "DEPUTY": "Subjefe / Suplente",
      "MEMBER": "Brigadista"
    },
    "meetingPoint": "Punto de reunión",
    "certification": "Certificación",
    "certificationDate": "Fecha de certificación",
    "certificationExpiry": "Vencimiento de certificación",
    "certStatus": {
      "valid": "Vigente",
      "expiring": "Vence pronto",
      "expired": "Vencida",
      "none": "Sin registro"
    },
    "membersCount": "integrantes",
    "addMember": "Agregar integrante",
    "editMember": "Editar integrante",
    "noMembers": "Sin integrantes registrados",
    "coordinatorExists": "Esta brigada ya tiene un Jefe asignado",
    "alsoBelongsTo": "Este integrante también pertenece a"
  },
  "training": {
    "title": "Capacitación",
    "new": "Registrar capacitación",
    "instructor": "Instructor",
    "durationHours": "Duración (horas)",
    "participants": "Participantes",
    "participantCount": "Número de participantes",
    "normReference": "Norma de referencia",
    "expirationDate": "Fecha de vencimiento",
    "isCompleted": "Realizada"
  },
  "drills": {
    "title": "Simulacros",
    "new": "Registrar simulacro",
    "types": {
      "FIRE": "Incendio",
      "EARTHQUAKE": "Sismo",
      "CHEMICAL_SPILL": "Derrame químico",
      "MEDICAL_EMERGENCY": "Emergencia médica",
      "EVACUATION": "Evacuación",
      "OTHER": "Otro"
    },
    "plannedDate": "Fecha planeada",
    "executedDate": "Fecha ejecutada",
    "participantCount": "Participantes",
    "evacuationTime": "Tiempo de evacuación",
    "observations": "Observaciones",
    "correctives": "Acciones correctivas",
    "isCompleted": "Ejecutado"
  },
  "fiveS": {
    "title": "Metodología 5S",
    "new": "Nueva auditoría 5S",
    "seiri": "Seiri (Clasificar)",
    "seiton": "Seiton (Ordenar)",
    "seiso": "Seiso (Limpiar)",
    "seiketsu": "Seiketsu (Estandarizar)",
    "shitsuke": "Shitsuke (Disciplina)",
    "totalScore": "Puntaje total",
    "auditorName": "Auditor",
    "actionPlan": "Plan de acción"
  },
  "maintenance": {
    "title": "Mantenimiento preventivo",
    "new": "Registrar mantenimiento",
    "types": {
      "EPP": "Equipo de protección personal",
      "EXTINGUISHER": "Extintores",
      "FIRST_AID_KIT": "Botiquín",
      "ELECTRICAL": "Instalación eléctrica",
      "EQUIPMENT": "Equipo / maquinaria",
      "VEHICLE": "Vehículo",
      "OTHER": "Otro"
    },
    "statuses": {
      "SCHEDULED": "Programado",
      "IN_PROGRESS": "En proceso",
      "COMPLETED": "Completado",
      "OVERDUE": "Vencido"
    },
    "frequency": "Frecuencia",
    "lastDate": "Último mantenimiento",
    "nextDate": "Próximo mantenimiento",
    "responsible": "Responsable"
  },
  "risks": {
    "title": "Gestión de riesgos",
    "new": "Registrar riesgo",
    "hazard": "Peligro identificado",
    "probability": "Probabilidad",
    "severity": "Severidad",
    "riskLevel": "Nivel de riesgo",
    "levels": {
      "LOW": "Bajo",
      "MEDIUM": "Medio",
      "HIGH": "Alto",
      "CRITICAL": "Crítico"
    },
    "currentControls": "Controles existentes",
    "proposedControls": "Controles propuestos",
    "isControlled": "Controlado",
    "targetDate": "Fecha compromiso de control"
  },
  "audits": {
    "title": "Auditorías internas",
    "new": "Nueva auditoría",
    "auditorName": "Auditor",
    "auditDate": "Fecha de auditoría",
    "statuses": {
      "PLANNED": "Planeada",
      "IN_PROGRESS": "En proceso",
      "COMPLETED": "Completada"
    },
    "score": "Puntuación",
    "findings": "Hallazgos",
    "correctives": "Acciones correctivas",
    "checklist": "Lista de verificación"
  },
  "program": {
    "title": "Programa de SH",
    "year": "Año",
    "objectives": "Objetivos",
    "scope": "Alcance",
    "budget": "Presupuesto",
    "responsible": "Responsable del programa",
    "approvedBy": "Aprobado por",
    "approvedAt": "Fecha de aprobación"
  },
  "calendar": {
    "title": "Calendario de eventos",
    "views": {
      "month": "Mes",
      "week": "Semana",
      "agenda": "Agenda"
    },
    "today": "Hoy",
    "noEvents": "Sin eventos en este período",
    "viewDetail": "Ver detalle completo",
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
    "modules": {
      "requirement": "Requerimientos",
      "activity": "Actividades",
      "training": "Capacitaciones",
      "drill": "Simulacros",
      "maintenance": "Mantenimiento",
      "risk": "Riesgos",
      "audit": "Auditorías",
      "cmsh": "Reunión CMSH",
      "brigade": "Brigadas"
    }
  },
  "users": {
    "title": "Usuarios",
    "new": "Nuevo usuario",
    "edit": "Editar usuario",
    "email": "Correo electrónico",
    "name": "Nombre completo",
    "role": "Rol",
    "roles": {
      "ADMIN": "Administrador",
      "SH_SPECIALIST": "Especialista SH",
      "AREA_MANAGER": "Responsable de área",
      "AUDITOR": "Auditor",
      "EXECUTIVE": "Dirección"
    },
    "isActive": "Activo",
    "activate": "Activar",
    "deactivate": "Desactivar",
    "changePassword": "Cambiar contraseña"
  },
  "companies": {
    "title": "Empresas",
    "new": "Nueva empresa",
    "rfc": "RFC",
    "industry": "Industria",
    "address": "Dirección",
    "isActive": "Activa"
  },
  "errors": {
    "generic": "Ocurrió un error. Intenta nuevamente.",
    "notFound": "Registro no encontrado",
    "unauthorized": "No tienes permiso para realizar esta acción",
    "networkError": "Error de conexión. Verifica tu internet.",
    "validationError": "Por favor corrige los errores en el formulario"
  }
}
```

#### 3. Archivo `en.json` — traducción completa al inglés

Crear `frontend/src/i18n/en.json` con las mismas claves traducidas al inglés. Claves clave:

```json
{
  "common": {
    "save": "Save", "cancel": "Cancel", "edit": "Edit", "delete": "Delete",
    "add": "Add", "close": "Close", "search": "Search", "filter": "Filter",
    "loading": "Loading...", "noData": "No records found",
    "notSpecified": "Not specified", "readOnly": "Read only",
    "status": "Status", "date": "Date", "area": "Area", "responsible": "Responsible",
    "notes": "Notes", "name": "Name", "description": "Description",
    "yes": "Yes", "no": "No", "optional": "Optional", "required": "Required"
  },
  "nav": {
    "dashboard": "Dashboard", "requirements": "Requirements",
    "incidents": "Incidents", "cmsh": "Joint Committee (CMSH)",
    "brigades": "Emergency Brigades", "training": "Training",
    "drills": "Drills", "fiveS": "5S Methodology",
    "maintenance": "Maintenance", "risks": "Risk Management",
    "audits": "Internal Audits", "program": "SH Program",
    "calendar": "Calendar", "users": "Users", "companies": "Companies",
    "collapse": "Collapse menu", "expand": "Expand menu"
  },
  "requirements": {
    "title": "Legal Requirements",
    "statuses": {
      "PENDING": "Pending", "IN_PROGRESS": "In progress",
      "COMPLETED": "Completed", "OVERDUE": "Overdue", "NOT_APPLICABLE": "Not applicable"
    },
    "activities": {
      "statuses": {
        "PENDING": "Pending", "IN_PROGRESS": "In progress",
        "COMPLETED": "Completed", "BLOCKED": "Blocked"
      }
    }
  },
  "brigades": {
    "title": "Emergency Brigades",
    "types": {
      "FIRST_AID": "First aid", "EVACUATION": "Evacuation",
      "FIRE_FIGHTING": "Fire fighting", "SEARCH_RESCUE": "Search & rescue"
    },
    "memberRoles": {
      "COORDINATOR": "Brigade leader", "DEPUTY": "Deputy leader", "MEMBER": "Member"
    },
    "certStatus": {
      "valid": "Valid", "expiring": "Expiring soon", "expired": "Expired", "none": "No record"
    }
  }
}
```

Completar el resto de las claves en `en.json` siguiendo el mismo patrón.

#### 4. Regla de qué NO se traduce

Hacer explícito en el código con un comentario cuando un texto viene de la base de datos y no debe pasarse por `t()`:

```jsx
{/* Texto de base de datos — no traducir */}
<p>{requirement.specificRequirement}</p>

{/* Texto de interfaz — usar t() */}
<label>{t('requirements.specificRequirement')}</label>
```

Los siguientes tipos de datos **nunca** se traducen:
- Nombres propios (empresas, usuarios, responsables)
- Textos ingresados por el usuario (descripciones, notas, observaciones)
- Códigos de normas (NOM-017-STPS-2008)
- Fechas (usar `Intl.DateTimeFormat` con el locale activo en lugar de traducir)

#### 5. Formateo de fechas con locale

Reemplazar cualquier formateo hardcodeado de fechas por:

```js
// frontend/src/utils/formatDate.js
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import i18n from '../i18n';

export function formatDate(date, pattern = 'dd/MM/yyyy') {
  if (!date) return '—';
  const locale = i18n.language === 'es' ? es : enUS;
  return format(new Date(date), pattern, { locale });
}

export function formatDateLong(date) {
  const locale = i18n.language === 'es' ? es : enUS;
  return format(new Date(date), 'PPP', { locale });
  // ES: "15 de junio de 2025" / EN: "June 15, 2025"
}
```

Usar `formatDate` y `formatDateLong` en todos los componentes en lugar de `.toLocaleDateString()`.

#### 6. Selector de idioma mejorado

El `LanguageSwitcher` en el topbar debe:
- Usar `i18n.changeLanguage('es' | 'en')` de react-i18next
- Persistir la preferencia en `localStorage` con clave `"sh_language"`
- Mostrar la bandera o código del idioma activo: `ES 🇲🇽` / `EN 🇺🇸`
- Al cambiar el idioma, la re-renderización es automática — todos los componentes que usen `useTranslation()` actualizarán sus textos sin necesidad de recargar la página

```jsx
// En LanguageSwitcher.jsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('sh_language', next);
  };

  return (
    <button onClick={toggle} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100">
      <span>{i18n.language === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}</span>
    </button>
  );
};
```

Inicializar i18n con el idioma guardado:

```js
// frontend/src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import en from './en.json';

const savedLang = localStorage.getItem('sh_language') || 'es';

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: savedLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false }
});

export default i18n;
```

---

## Checklist de implementación

### Módulo Brigadas — Base de datos
- [ ] Agregar enum `BrigadeType`, `BrigadeMemberRole` y modelos `Brigade`, `BrigadeMember` en `schema.prisma`
- [ ] Actualizar `Company` y `User` con las nuevas relaciones
- [ ] Ejecutar migración con Prisma
- [ ] Agregar creación automática de 4 brigadas al crear empresa en `company.controller.js`
- [ ] Agregar datos de brigadas en `seed.js`

### Módulo Brigadas — Backend
- [ ] Crear `brigade.controller.js` con los 5 endpoints
- [ ] Crear `brigade.routes.js`
- [ ] Registrar ruta en `app.js`
- [ ] Agregar vencimientos de certificaciones en `calendar.controller.js`

### Módulo Brigadas — Frontend
- [ ] Crear `BrigadesPage.jsx` con tarjetas de resumen + acordeones por brigada
- [ ] Crear modal de agregar/editar integrante con `ResponsibleSelector`
- [ ] Implementar `getCertificationStatus` con badges de color
- [ ] Agregar ítem "Brigadas" en `Sidebar.jsx`
- [ ] Agregar ruta `/brigades` en `App.jsx`
- [ ] Agregar color `brigade` en leyenda del `CalendarLegend.jsx`

### Internacionalización
- [ ] Completar `es.json` con todas las claves de la app
- [ ] Crear `en.json` completo con traducción al inglés
- [ ] Actualizar `i18n/index.js` para leer preferencia de `localStorage`
- [ ] Agregar `useTranslation()` y `t()` en **todas** las páginas y componentes con texto visible
- [ ] Reemplazar formateo de fechas por `formatDate` / `formatDateLong` con locale dinámico
- [ ] Actualizar `LanguageSwitcher` con banderas y persistencia
- [ ] Verificar que el cambio de idioma actualice toda la UI sin recargar la página

---

## Notas técnicas para Claude Code

- Las 4 brigadas se crean automáticamente con la empresa y **no se pueden eliminar** — solo se pueden desactivar individualmente (`isActive: false`)
- El campo `type` en `Brigade` tiene restricción `@unique` por empresa — la BD garantiza que no haya dos brigadas del mismo tipo para la misma empresa (el constraint real es a nivel `companyId + type`, usar `@@unique([companyId, type])` en el modelo)
- Para el `@@unique` en Brigade: `@@unique([companyId, type])`
- El calendario ya tiene la estructura de eventos — solo agregar el case `'brigade'` en el mapper del frontend y el color en la leyenda
- Al auditar el `i18n`, priorizar primero las páginas con más texto visible: `RequirementsPage`, `DashboardPage`, `IncidentsPage`; luego los formularios y modales
- Los enums de Prisma (`ActivityStatus`, `BrigadeType`, etc.) deben tener sus etiquetas en los archivos de i18n — nunca renderizar el valor del enum directamente en la UI

---

*Módulos: Brigadas + Internacionalización completa — Actualización v1.5*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL + Prisma*
