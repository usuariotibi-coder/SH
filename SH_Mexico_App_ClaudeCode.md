# Instrucciones para Claude Code — App de Seguridad e Higiene México

> Documento generado para ser usado con **Claude Code desde VS Code**.
> Genera una aplicación web fullstack completa para el seguimiento de requerimientos legales de Seguridad e Higiene en México.

---

## Contexto del proyecto

Aplicación web para el seguimiento y cumplimiento de requerimientos legales y normativos de Seguridad e Higiene en México (NOMs, IMSS, STPS). Diseñada para ser **general** (aplica a cualquier industria), **multiempresa** (varios centros de trabajo en una misma instancia) y con **información confidencial**, por lo que requiere autenticación robusta y control de acceso por roles.

El despliegue se realizará en **Railway**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Base de datos | PostgreSQL (Railway plugin) |
| ORM | Prisma |
| Autenticación | JWT + bcrypt |
| Almacenamiento de archivos | Cloudinary (fotos, PDFs, documentos) |
| Estilos | Tailwind CSS v3 |
| Estado global | Zustand |
| Peticiones HTTP | Axios |
| Notificaciones/Alertas | react-hot-toast |
| Gráficas | Recharts |
| Internacionalización | i18next (Español/Inglés) |
| Variables de entorno | dotenv |

---

## Estructura de carpetas del proyecto

```
sh-mexico/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── company.controller.js
│   │   │   ├── requirement.controller.js
│   │   │   ├── activity.controller.js
│   │   │   ├── evidence.controller.js
│   │   │   ├── incident.controller.js
│   │   │   ├── cmsh.controller.js
│   │   │   ├── training.controller.js
│   │   │   ├── drill.controller.js
│   │   │   ├── fiveS.controller.js
│   │   │   ├── maintenance.controller.js
│   │   │   ├── audit.controller.js
│   │   │   ├── risk.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── company.routes.js
│   │   │   ├── requirement.routes.js
│   │   │   ├── incident.routes.js
│   │   │   ├── cmsh.routes.js
│   │   │   ├── training.routes.js
│   │   │   ├── drill.routes.js
│   │   │   ├── fiveS.routes.js
│   │   │   ├── maintenance.routes.js
│   │   │   ├── audit.routes.js
│   │   │   ├── risk.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── services/
│   │   │   ├── cloudinary.service.js
│   │   │   └── notification.service.js
│   │   ├── utils/
│   │   │   ├── jwt.utils.js
│   │   │   └── pagination.utils.js
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.config.js
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── FileUploader.jsx
│   │   │   │   ├── StatusPill.jsx
│   │   │   │   └── DatePicker.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── shared/
│   │   │       ├── AlertsPanel.jsx
│   │   │       ├── CompanySelector.jsx
│   │   │       └── LanguageSwitcher.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── requirements/
│   │   │   │   ├── RequirementsPage.jsx
│   │   │   │   └── RequirementDetailPage.jsx
│   │   │   ├── incidents/
│   │   │   │   ├── IncidentsPage.jsx
│   │   │   │   └── IncidentDetailPage.jsx
│   │   │   ├── cmsh/
│   │   │   │   └── CMSHPage.jsx
│   │   │   ├── training/
│   │   │   │   └── TrainingPage.jsx
│   │   │   ├── drills/
│   │   │   │   └── DrillsPage.jsx
│   │   │   ├── fiveS/
│   │   │   │   └── FiveSPage.jsx
│   │   │   ├── maintenance/
│   │   │   │   └── MaintenancePage.jsx
│   │   │   ├── risks/
│   │   │   │   └── RisksPage.jsx
│   │   │   ├── audits/
│   │   │   │   └── AuditsPage.jsx
│   │   │   ├── program/
│   │   │   │   └── ProgramPage.jsx
│   │   │   └── admin/
│   │   │       ├── UsersPage.jsx
│   │   │       └── CompaniesPage.jsx
│   │   ├── store/
│   │   │   ├── auth.store.js
│   │   │   └── company.store.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── usePermissions.js
│   │   ├── i18n/
│   │   │   ├── es.json
│   │   │   └── en.json
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   └── statusColors.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── railway.json
└── README.md
```

---

## Modelo de base de datos (Prisma Schema)

Crea el archivo `backend/prisma/schema.prisma` con los siguientes modelos:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Multiempresa ────────────────────────────────────────────────────────────

model Company {
  id          String   @id @default(cuid())
  name        String
  rfc         String?
  address     String?
  industry    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users        User[]
  requirements Requirement[]
  incidents    Incident[]
  trainings    Training[]
  drills       Drill[]
  fiveS        FiveS[]
  maintenances Maintenance[]
  risks        Risk[]
  audits       Audit[]
  cmshMembers  CMSHMember[]
  cmshMeetings CMSHMeeting[]
  program      SHProgram?
}

// ─── Usuarios y roles ────────────────────────────────────────────────────────

enum Role {
  ADMIN
  SH_SPECIALIST
  AREA_MANAGER
  AUDITOR
  EXECUTIVE
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(AREA_MANAGER)
  area      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  createdRequirements Requirement[]
  createdIncidents    Incident[]
  createdTrainings    Training[]
  activities          Activity[]
}

// ─── Requerimientos legales ──────────────────────────────────────────────────

enum RequirementStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  OVERDUE
  NOT_APPLICABLE
}

enum LegalSource {
  NOM
  IMSS
  STPS
  SEMARNAT
  CIVIL_PROTECTION
  MUNICIPAL
  OTHER
}

model Requirement {
  id              String            @id @default(cuid())
  code            String            // Ej: NOM-017-STPS-2008
  name            String
  description     String            @db.Text
  legalSource     LegalSource
  legalBasis      String?           // Artículo, fracción, etc.
  area            String?
  status          RequirementStatus @default(PENDING)
  dueDate         DateTime?
  completedAt     DateTime?
  responsibleArea String?
  notes           String?           @db.Text
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])

  activities Activity[]
  evidences  Evidence[]
}

model Activity {
  id          String   @id @default(cuid())
  description String   @db.Text
  dueDate     DateTime
  completedAt DateTime?
  isCompleted Boolean  @default(false)
  notes       String?
  createdAt   DateTime @default(now())

  requirementId String
  requirement   Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id])

  evidences Evidence[]
}

// ─── Evidencias (archivos en Cloudinary) ────────────────────────────────────

enum EvidenceType {
  PHOTO
  PDF
  DOCUMENT
  VIDEO
  OTHER
}

model Evidence {
  id            String       @id @default(cuid())
  fileName      String
  fileUrl       String       // URL de Cloudinary
  publicId      String       // ID en Cloudinary para eliminación
  fileType      EvidenceType
  fileSizeKb    Int?
  uploadedAt    DateTime     @default(now())
  description   String?

  requirementId String?
  requirement   Requirement? @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  activityId    String?
  activity      Activity?    @relation(fields: [activityId], references: [id], onDelete: Cascade)
  incidentId    String?
  incident      Incident?    @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  drillId       String?
  drill         Drill?       @relation(fields: [drillId], references: [id], onDelete: Cascade)
  fiveSId       String?
  fiveS         FiveS?       @relation(fields: [fiveSId], references: [id], onDelete: Cascade)
  auditId       String?
  audit         Audit?       @relation(fields: [auditId], references: [id], onDelete: Cascade)
}

// ─── Incidentes y accidentes ─────────────────────────────────────────────────

enum IncidentType {
  ACCIDENT
  INCIDENT
  NEAR_MISS
  OCCUPATIONAL_DISEASE
}

enum IncidentSeverity {
  MINOR
  MODERATE
  SERIOUS
  FATAL
}

model Incident {
  id              String           @id @default(cuid())
  folio           String           @unique
  type            IncidentType
  severity        IncidentSeverity
  occurredAt      DateTime
  area            String
  description     String           @db.Text
  injuredName     String?
  injuredPosition String?
  rootCause       String?          @db.Text
  correctiveAction String?         @db.Text
  imssReportNo    String?          // Número aviso ST-7 o ST-9
  lostDays        Int?             @default(0)
  isReportedIMSS  Boolean          @default(false)
  isClosed        Boolean          @default(false)
  closedAt        DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])

  evidences Evidence[]
}

// ─── Comisión Mixta de Seguridad e Higiene ────────────────────────────────────

enum CMSHRole {
  PRESIDENT
  SECRETARY
  WORKER_REP
  EMPLOYER_REP
}

model CMSHMember {
  id        String   @id @default(cuid())
  name      String
  position  String
  cmshRole  CMSHRole
  email     String?
  phone     String?
  startDate DateTime
  endDate   DateTime?
  isActive  Boolean  @default(true)

  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}

model CMSHMeeting {
  id          String   @id @default(cuid())
  meetingDate DateTime
  location    String
  agenda      String   @db.Text
  agreements  String?  @db.Text
  attendees   String?  @db.Text
  nextMeeting DateTime?
  createdAt   DateTime @default(now())

  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}

// ─── Capacitación ─────────────────────────────────────────────────────────────

model Training {
  id              String    @id @default(cuid())
  name            String
  description     String?   @db.Text
  instructor      String
  trainingDate    DateTime
  durationHours   Float
  location        String?
  normReference   String?   // NOM relacionada
  participants    String    @db.Text // JSON array de nombres
  participantCount Int      @default(0)
  expirationDate  DateTime? // Para capacitaciones con vigencia
  isCompleted     Boolean   @default(true)
  createdAt       DateTime  @default(now())

  companyId   String
  company     Company @relation(fields: [companyId], references: [id])
  createdById String
  createdBy   User    @relation(fields: [createdById], references: [id])
}

// ─── Simulacros ────────────────────────────────────────────────────────────────

enum DrillType {
  FIRE
  EARTHQUAKE
  CHEMICAL_SPILL
  MEDICAL_EMERGENCY
  EVACUATION
  OTHER
}

model Drill {
  id              String    @id @default(cuid())
  type            DrillType
  plannedDate     DateTime
  executedDate    DateTime?
  participantCount Int?
  evacuationTime  Int?      // segundos
  observations    String?   @db.Text
  correctives     String?   @db.Text
  isCompleted     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  evidences Evidence[]
}

// ─── Metodología 5S ──────────────────────────────────────────────────────────

model FiveS {
  id          String   @id @default(cuid())
  area        String
  auditDate   DateTime
  seiriScore  Int      // Clasificar (1-5)
  seitonScore Int      // Ordenar (1-5)
  seisoScore  Int      // Limpiar (1-5)
  seiketsuScore Int    // Estandarizar (1-5)
  shitsuke    Int      // Disciplina (1-5)
  totalScore  Float    @default(0)
  observations String? @db.Text
  actionPlan  String?  @db.Text
  auditorName String
  createdAt   DateTime @default(now())

  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  evidences Evidence[]
}

// ─── Mantenimiento preventivo ─────────────────────────────────────────────────

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  OVERDUE
}

enum MaintenanceType {
  EPP
  EXTINGUISHER
  FIRST_AID_KIT
  ELECTRICAL
  EQUIPMENT
  VEHICLE
  OTHER
}

model Maintenance {
  id              String            @id @default(cuid())
  name            String
  type            MaintenanceType
  description     String?
  frequency       String            // "mensual", "trimestral", etc.
  lastDate        DateTime?
  nextDate        DateTime
  status          MaintenanceStatus @default(SCHEDULED)
  responsible     String
  completedAt     DateTime?
  observations    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}

// ─── Gestión de riesgos ───────────────────────────────────────────────────────

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Risk {
  id              String    @id @default(cuid())
  area            String
  hazard          String    // Peligro identificado
  riskDescription String    @db.Text
  probability     Int       // 1-5
  severity        Int       // 1-5
  riskLevel       RiskLevel
  currentControls String?   @db.Text
  proposedControls String?  @db.Text
  responsible     String?
  targetDate      DateTime?
  isControlled    Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}

// ─── Auditorías internas ──────────────────────────────────────────────────────

enum AuditStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
}

model Audit {
  id           String      @id @default(cuid())
  title        String
  auditDate    DateTime
  area         String
  auditorName  String
  status       AuditStatus @default(PLANNED)
  checklist    String      @db.Text // JSON con preguntas y respuestas
  score        Float?
  findings     String?     @db.Text
  correctives  String?     @db.Text
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  evidences Evidence[]
}

// ─── Programa SH (PSH) ────────────────────────────────────────────────────────

model SHProgram {
  id          String   @id @default(cuid())
  year        Int
  objectives  String   @db.Text
  scope       String?  @db.Text
  budget      Float?
  responsible String
  approvedBy  String?
  approvedAt  DateTime?
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  companyId String  @unique
  company   Company @relation(fields: [companyId], references: [id])
}
```

---

## Variables de entorno

Crea `backend/.env.example`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=sh-mexico

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

Crea `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Módulos y funcionalidades a implementar

### 1. Autenticación y gestión de usuarios

**Endpoints backend:**
- `POST /api/auth/login` — Login con email/password, devuelve JWT
- `POST /api/auth/logout`
- `GET /api/auth/me` — Perfil del usuario autenticado
- `PUT /api/auth/change-password`

**Endpoints de usuarios (solo ADMIN):**
- `GET /api/users` — Listar usuarios de la empresa
- `POST /api/users` — Crear usuario (ADMIN)
- `PUT /api/users/:id` — Editar usuario
- `PATCH /api/users/:id/toggle` — Activar/Desactivar usuario
- `DELETE /api/users/:id`

**Roles y permisos:**

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `ADMIN` | Superusuario del sistema | Todo, gestión de empresas y usuarios |
| `SH_SPECIALIST` | Especialista SH | Lectura y escritura en todos los módulos de su empresa |
| `AREA_MANAGER` | Responsable de área | Solo puede ver y editar requerimientos/actividades de su área |
| `AUDITOR` | Solo lectura | Puede ver todo pero no modificar |
| `EXECUTIVE` | Dirección | Solo acceso al dashboard ejecutivo y KPIs |

Implementa el middleware `role.middleware.js` con una función `requireRole(...roles)` que valide el JWT y el rol antes de cada ruta protegida.

### 2. Gestión de empresas y centros de trabajo

- CRUD completo de empresas (solo ADMIN)
- Al hacer login, el usuario ve solo los datos de su empresa
- Selector de empresa en el topbar para el ADMIN

### 3. Módulo de Requerimientos Legales

Es el módulo central. Cada requerimiento debe tener:

- **Código normativo** (Ej: NOM-017-STPS-2008)
- **Nombre y descripción** detallada del requerimiento
- **Fuente legal** (NOM, IMSS, STPS, SEMARNAT, Protección Civil, Municipal, Otro)
- **Base legal** (artículo, fracción, párrafo específico)
- **Área responsable**
- **Estado**: Pendiente / En proceso / Cumplido / Vencido / No aplica
- **Fecha compromiso**
- **Notas adicionales**

**Actividades de cumplimiento** (sub-módulo dentro de cada requerimiento):
- Descripción de la actividad
- Responsable
- Fecha compromiso
- Estado (completada / pendiente)
- Evidencias adjuntas

**Evidencias** (carga de archivos):
- Upload a Cloudinary desde el frontend
- Soportar: JPG, PNG, PDF, DOCX, XLSX
- Mostrar preview de imágenes
- Mostrar icono para PDFs y documentos
- Permitir eliminar evidencias (también en Cloudinary)

**Catálogo preconfigurado de NOMs** — Incluir las siguientes normas como datos semilla (`prisma/seed.js`):
```
NOM-001-STPS-2008 — Edificios, locales, instalaciones y áreas
NOM-002-STPS-2010 — Condiciones de seguridad, prevención y protección contra incendios
NOM-004-STPS-1999 — Sistemas de protección y dispositivos de seguridad en maquinaria
NOM-005-STPS-1998 — Manejo, transporte y almacenamiento de sustancias peligrosas
NOM-006-STPS-2014 — Manejo y almacenamiento de materiales
NOM-009-STPS-2011 — Trabajos en altura
NOM-010-STPS-2014 — Agentes químicos contaminantes del ambiente laboral
NOM-011-STPS-2001 — Ruido
NOM-012-STPS-2012 — Seguridad en procesos de sustancias químicas peligrosas
NOM-013-STPS-1993 — Radiaciones no ionizantes
NOM-014-STPS-2000 — Presión manométrica
NOM-015-STPS-2001 — Condiciones térmicas elevadas o abatidas
NOM-016-STPS-2001 — Operación y mantenimiento de ferrocarriles
NOM-017-STPS-2008 — Equipo de protección personal
NOM-018-STPS-2015 — Sistema armonizado para identificar peligros SGA
NOM-019-STPS-2011 — Comisiones de Seguridad e Higiene
NOM-020-STPS-2011 — Recipientes sujetos a presión y generadores de vapor
NOM-021-STPS-1994 — Recipientes criogénicos portátiles
NOM-022-STPS-2015 — Electricidad estática
NOM-023-STPS-2012 — Trabajos en minas
NOM-024-STPS-2001 — Vibraciones
NOM-025-STPS-2008 — Iluminación
NOM-026-STPS-2008 — Colores y señales de seguridad
NOM-027-STPS-2008 — Actividades de soldadura y corte
NOM-028-STPS-2012 — Seguridad en procesos y equipos con sustancias químicas peligrosas
NOM-029-STPS-2011 — Mantenimiento de instalaciones eléctricas
NOM-030-STPS-2009 — Servicios preventivos de seguridad y salud en el trabajo
NOM-031-STPS-2011 — Construcción
NOM-032-STPS-2008 — Minas subterráneas de carbón
NOM-033-STPS-2015 — Trabajos en espacios confinados
NOM-034-STPS-2016 — Acceso y desarrollo de actividades de trabajadores con discapacidad
NOM-035-STPS-2018 — Factores de riesgo psicosocial
NOM-036-1-STPS-2018 — Factores de riesgo ergonómico, parte 1
```

### 4. Módulo de Incidentes y Accidentes

- Folio automático por empresa (INC-2024-001)
- Tipo: Accidente / Incidente / Casi accidente / Enfermedad profesional
- Gravedad: Leve / Moderado / Grave / Fatal
- Investigación de causa raíz (método de los 5 Porqués)
- Acciones correctivas y preventivas
- Control de reporte al IMSS (ST-7 / ST-9)
- Días perdidos
- Estado: Abierto / Cerrado
- Evidencias fotográficas

### 5. Comisión Mixta de Seguridad e Higiene (CMSH)

- Registro de integrantes con sus roles (Presidente, Secretario, Representante Trabajadores, Representante Empresa)
- Fechas de vigencia del cargo
- Registro de actas de reunión
- Orden del día
- Acuerdos y compromisos
- Programación de próxima reunión
- Alerta cuando la reunión mensual no se ha registrado

### 6. Capacitación

- Registro de cursos/pláticas
- Instructor (interno o externo)
- NOM de referencia (ej: NOM-019, NOM-017)
- Lista de participantes (con campo para importar desde texto separado por comas)
- Duración en horas
- Fecha de vencimiento/renovación de la capacitación
- Alerta cuando una capacitación está próxima a vencer

### 7. Simulacros

- Tipo: Incendio, Sismo, Derrame, Emergencia médica, Evacuación, Otro
- Fecha planeada vs ejecutada
- Número de participantes
- Tiempo de evacuación (en segundos, mostrar como mm:ss)
- Observaciones y acciones correctivas
- Evidencias fotográficas/video
- Historial de simulacros por año

### 8. Metodología 5S

- Auditorías periódicas por área
- Calificación de cada S (1 al 5):
  - Seiri (Clasificar)
  - Seiton (Ordenar)
  - Seiso (Limpiar)
  - Seiketsu (Estandarizar)
  - Shitsuke (Disciplina)
- Puntaje total calculado automáticamente
- Observaciones y plan de acción
- Gráfica radar/spider con los resultados
- Historial de auditorías para ver tendencia
- Evidencias fotográficas (antes/después)

### 9. Mantenimiento Preventivo

- Catálogo de equipos/elementos con mantenimiento programado
- Tipos: EPP, Extintores, Botiquines, Instalaciones eléctricas, Equipos, Vehículos, Otro
- Frecuencia: semanal, mensual, trimestral, semestral, anual
- Fecha último mantenimiento y próxima fecha
- Estado: Programado / En proceso / Completado / Vencido
- Alerta 15 días antes del vencimiento

### 10. Gestión de Riesgos

- Identificación de peligros por área
- Matriz de evaluación de riesgos (Probabilidad × Severidad)
- Nivel de riesgo: Bajo / Medio / Alto / Crítico
- Controles existentes y propuestos
- Estado de control
- Tabla con código de colores según nivel de riesgo

### 11. Auditorías Internas

- Checklist configurable en formato JSON (preguntas Sí/No/Parcial con peso)
- Puntaje automático
- Hallazgos y no conformidades
- Acciones correctivas
- Evidencias fotográficas en campo
- Estado: Planeada / En proceso / Completada

### 12. Programa de Seguridad e Higiene (PSH)

- Un PSH por empresa por año
- Objetivos generales
- Alcance
- Presupuesto
- Responsable del programa
- Aprobado por
- Integra automáticamente los indicadores del año

### 13. Dashboard ejecutivo

- **Indicadores en tarjetas (KPIs)**:
  - % de cumplimiento de requerimientos
  - Número de incidentes del mes / año
  - Tasa de frecuencia y gravedad de accidentes
  - Capacitaciones realizadas vs planeadas
  - Simulacros realizados vs planeados
  - Puntaje promedio 5S

- **Gráficas (Recharts)**:
  - Donut: Estado de requerimientos (Pendiente / En proceso / Cumplido / Vencido)
  - Barras: Incidentes por mes (últimos 12 meses)
  - Barras horizontales: Cumplimiento por área
  - Línea: Tendencia de puntaje 5S por área

- **Panel de alertas** — Sidebar con items ordenados por urgencia:
  - Requerimientos vencidos o próximos a vencer (< 15 días)
  - Mantenimientos vencidos
  - Capacitaciones próximas a vencer
  - CMSH: reunión del mes no registrada
  - Simulacros planeados no ejecutados

### 14. Sistema de alertas y notificaciones

Implementa un servicio `notification.service.js` que:
- Calcule diariamente las alertas de vencimiento
- Las almacene en una tabla `Alert` en PostgreSQL
- Las exponga vía `GET /api/alerts` filtradas por empresa y usuario
- Muestre el contador en el topbar del frontend

---

## Diseño del frontend (SKILL de diseño)

Aplica las siguientes directrices de diseño para obtener un frontend profesional, funcional y memorable:

### Paleta de colores y tokens CSS

```css
/* frontend/src/index.css */
:root {
  --color-primary: #1a4a6b;        /* Azul marino institucional */
  --color-primary-light: #2563a8;
  --color-primary-dark: #0f2d42;
  --color-accent: #e8622a;         /* Naranja seguridad */
  --color-accent-light: #f28c5e;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-surface: #f8fafc;
  --color-surface-alt: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --font-display: 'DM Sans', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

**Fuentes** (importar en `index.html`):
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
```

### Diseño del Sidebar

- Fondo `var(--color-primary-dark)` (#0f2d42)
- Logo / nombre de la app en la parte superior
- Iconos de Lucide React para cada módulo
- Ítem activo con fondo `var(--color-primary-light)` y borde izquierdo de color acento
- Selector de empresa en la parte inferior del sidebar (solo para ADMIN)
- Colapsable en pantallas medianas

### Diseño del Topbar

- Fondo blanco, borde inferior sutil
- Breadcrumb con la ruta actual
- Selector de idioma (ES/EN)
- Campana de alertas con contador en rojo
- Avatar del usuario con dropdown para perfil y cerrar sesión

### Tarjetas de KPI (Dashboard)

Diseñar cada tarjeta con:
- Icono grande a la derecha con fondo redondeado de color semitransparente
- Número grande con la cifra principal
- Texto secundario con la etiqueta
- Indicador de tendencia (flecha arriba/abajo con color)
- Borde izquierdo de color según estado (verde=bien, amarillo=atención, rojo=urgente)

### Tabla de requerimientos

- Columna de estado con `StatusPill` (badges con color de fondo suave)
- Columna de fecha compromiso con color según proximidad
- Fila expandible para ver actividades
- Filtros en la parte superior: por estado, fuente legal, área, fecha
- Barra de búsqueda

### Formularios

- Labels siempre visibles (no placeholders como únicos indicadores)
- Validación en tiempo real con mensajes de error en rojo debajo del campo
- Indicadores de campo requerido (asterisco rojo)
- Botones de guardar con estado de loading (spinner)

### Cargador de evidencias (`FileUploader.jsx`)

- Zona de drop con borde punteado, icono de nube y texto
- Preview de imágenes en cuadrícula de miniaturas
- Icono de PDF/documento para archivos no imagen
- Botón X para eliminar cada archivo
- Barra de progreso durante la carga a Cloudinary
- Límite de tamaño: 10MB por archivo, mensaje de error si excede

### StatusPill (badges de estado)

```
PENDING      → bg-yellow-100  text-yellow-800
IN_PROGRESS  → bg-blue-100    text-blue-800
COMPLETED    → bg-green-100   text-green-800
OVERDUE      → bg-red-100     text-red-800
NOT_APPLICABLE → bg-gray-100  text-gray-600
```

### Comportamiento responsive

- Desktop (≥1280px): Sidebar visible + contenido principal
- Tablet (≥768px): Sidebar colapsado a iconos
- Móvil (<768px): Sidebar como drawer con overlay

---

## Configuración para Railway

### `railway.json` (en la raíz del proyecto)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && node server.js",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Estrategia de despliegue en Railway

Railway desplegará **dos servicios separados**:

1. **Backend** (`backend/`): Node.js + Express — conectado al plugin PostgreSQL de Railway
2. **Frontend** (`frontend/`): Vite build estático — servido por el backend o como servicio separado (recomendado: servir el `dist/` desde Express en producción)

**Para servir el frontend desde Express en producción**, agrega al final de `backend/app.js`:

```js
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}
```

### Variables de entorno en Railway

Configura en el dashboard de Railway:
- `DATABASE_URL` — provista automáticamente por el plugin PostgreSQL
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NODE_ENV=production`
- `PORT=3001` (Railway asigna su propia)

---

## Datos semilla (Prisma Seed)

Crea `backend/prisma/seed.js` con:

1. **Empresa demo**: "Empresa Demo S.A. de C.V."
2. **Usuario administrador**: `admin@shmexicoapp.com` / `Admin1234!`
3. **Usuario especialista SH**: `especialista@shmexicoapp.com` / `Especialista1!`
4. **Catálogo completo de NOMs** listadas en el módulo de requerimientos (crear una por empresa demo en estado PENDING)
5. **5 riesgos de ejemplo** en diferentes áreas
6. **3 registros de mantenimiento** de ejemplo

---

## Orden de implementación recomendado

Implementa en este orden para tener siempre algo funcional:

1. Setup del proyecto (carpetas, dependencias, variables de entorno)
2. Prisma schema + migraciones + seed
3. Backend: auth middleware + endpoints de login/me
4. Frontend: Login page + configuración de rutas
5. Backend: CRUD de empresas y usuarios
6. Frontend: Admin de usuarios
7. Backend: CRUD de requerimientos + actividades + evidencias (Cloudinary)
8. Frontend: Módulo completo de requerimientos (tabla, detalle, formularios, upload)
9. Backend: Dashboard endpoints (KPIs + alertas)
10. Frontend: Dashboard ejecutivo (tarjetas + gráficas Recharts)
11. Backend + Frontend: Módulo incidentes
12. Backend + Frontend: Módulo CMSH
13. Backend + Frontend: Módulo capacitación
14. Backend + Frontend: Módulo simulacros
15. Backend + Frontend: Módulo 5S
16. Backend + Frontend: Módulo mantenimiento
17. Backend + Frontend: Módulo riesgos
18. Backend + Frontend: Módulo auditorías internas
19. Backend + Frontend: Módulo PSH
20. i18n (Español/Inglés)
21. Ajustes finales de diseño + responsive
22. Configuración Railway + variables producción

---

## Notas adicionales para Claude Code

- Usa `prisma migrate dev` para desarrollo y `prisma migrate deploy` para producción
- El campo `participants` del modelo `Training` se almacena como JSON string; parsear al leer
- El campo `checklist` del modelo `Audit` es un JSON con estructura: `[{ "question": "...", "answer": "yes|no|partial", "weight": 1, "observations": "..." }]`
- Para el cálculo de nivel de riesgo: `LOW` = 1-4, `MEDIUM` = 5-9, `HIGH` = 10-16, `CRITICAL` = 17-25 (usando la fórmula `probability × severity`)
- El folio de incidentes se genera con: `INC-{año}-{número secuencial con ceros a la izquierda}`
- Cloudinary: usar `upload_preset` con firma o el API secret desde el backend, nunca desde el frontend
- Implementar `GET /api/health` que devuelva `{ status: "ok", timestamp: new Date() }` para el healthcheck de Railway
- Usar `helmet` y `cors` en el backend configurado para el dominio del frontend
- Implementar rate limiting en los endpoints de autenticación (`express-rate-limit`)
- Todos los endpoints deben devolver errores en formato `{ error: true, message: "...", code: "..." }`
- La paginación debe usar `?page=1&limit=20` y devolver `{ data: [], total, page, totalPages }`

---

*Generado el 7 de abril de 2026 — App SH México v1.0*
*Stack: React 18 + Node.js/Express + PostgreSQL + Cloudinary — Despliegue: Railway*
