# Prompt para Claude Code — Actualización v1.6: Proveedores, Portal de acceso, EPP e Inventario, Sustancias Químicas

---

## Resumen de cambios

1. Módulo de Proveedores (catálogo + portal de carga por link único)
2. EPP: catálogo de artículos + inventario (entradas/salidas/existencias/stock mínimo) + matriz de requerimientos por área
3. Sustancias químicas: hojas de seguridad + etiquetas SGA + registro de disposición de residuos peligrosos
4. Actualización del Dashboard con nuevos indicadores y gráficas

---

## Parte 1 — Módulo de Proveedores

### 1.1 Modelo de datos

```prisma
enum SupplierStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Supplier {
  id              String         @id @default(cuid())
  name            String
  rfc             String?
  address         String?
  city            String?
  state           String?
  productsServices String        @db.Text   // descripción libre de qué ofrece
  contactName     String?
  phone           String?
  email           String?
  website         String?
  status          SupplierStatus @default(ACTIVE)
  notes           String?        @db.Text
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  companyId       String
  company         Company        @relation(fields: [companyId], references: [id])

  accessToken     SupplierAccessToken?
  documents       SupplierDocument[]
  hazmatDisposals HazmatDisposal[]     // relación con disposición de residuos
}

// Token de acceso para el portal del proveedor (link único)
model SupplierAccessToken {
  id          String    @id @default(cuid())
  token       String    @unique @default(cuid()) // token en la URL
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?

  supplierId  String    @unique
  supplier    Supplier  @relation(fields: [supplierId], references: [id])
}

// Tipos de documento requeridos al proveedor
enum SupplierDocType {
  SUA              // Pago IMSS — vigencia 15 días
  REPSE            // Registro de prestadoras de servicios
  DC3              // Constancia de competencias laborales
  IMSS_ALTA        // Alta patronal IMSS
  ACTA_CONSTITUTIVA
  POLIZA_SEGURO
  CONTRATO_SERVICIOS
  OPINION_SAT
  OTHER
}

enum SupplierDocStatus {
  PENDING          // No entregado
  UPLOADED         // Cargado, pendiente de revisión
  APPROVED         // Aprobado por el admin
  REJECTED         // Rechazado — requiere resubida
  EXPIRED          // Vencido (especialmente SUA cada 15 días)
}

model SupplierDocument {
  id           String            @id @default(cuid())
  docType      SupplierDocType
  status       SupplierDocStatus @default(PENDING)
  fileUrl      String?           // URL Cloudinary
  publicId     String?           // Cloudinary public_id
  fileName     String?
  uploadedAt   DateTime?
  expiresAt    DateTime?         // Para SUA: uploadedAt + 15 días
  reviewedAt   DateTime?
  reviewNotes  String?           // Comentario del admin al rechazar
  period       String?           // Ej: "Mayo 2025" para identificar el SUA del mes

  supplierId   String
  supplier     Supplier          @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  reviewedById String?
  reviewedBy   User?             @relation(fields: [reviewedById], references: [id])
}
```

Agregar en `Company`: `suppliers Supplier[]`
Agregar en `User`: `reviewedDocuments SupplierDocument[]`

Migración:
```bash
npx prisma migrate dev --name add_suppliers_module
```

### 1.2 Endpoints del backend

```
// Gestión de proveedores (admin/especialista SH)
GET    /api/suppliers                         → listar proveedores de la empresa
POST   /api/suppliers                         → crear proveedor
GET    /api/suppliers/:id                     → detalle + documentos + estado de acceso
PUT    /api/suppliers/:id                     → editar proveedor
DELETE /api/suppliers/:id                     → soft delete (status = INACTIVE)

// Gestión de documentos (admin/especialista SH)
GET    /api/suppliers/:id/documents           → documentos del proveedor
PATCH  /api/suppliers/:id/documents/:docId    → aprobar o rechazar documento
POST   /api/suppliers/:id/documents/request   → solicitar documento faltante (envía correo)

// Token de acceso del proveedor
POST   /api/suppliers/:id/token               → generar o regenerar link de acceso
DELETE /api/suppliers/:id/token               → revocar link

// Portal público del proveedor — NO requiere autenticación JWT de usuario interno
// Solo requiere el token en el header o query param
GET    /api/portal/:token                     → datos del proveedor + documentos requeridos
POST   /api/portal/:token/upload              → subir documento (multipart/form-data)
```

**Lógica de vencimiento SUA:** Al aprobar un documento de tipo `SUA`, calcular `expiresAt = uploadedAt + 15 días`. Un cron job diario (o al cargar el dashboard) marca como `EXPIRED` los SUA cuya `expiresAt < now()`.

**Correo de recordatorio SUA:** 3 días antes del vencimiento, enviar correo automático al email del proveedor con su link de acceso. Implementar en `notification.service.js`.

### 1.3 Frontend — Página de Proveedores (`/suppliers`)

#### Layout de la página

Tabla principal de proveedores con columnas:
- Nombre del proveedor
- Productos/servicios (truncado 60 chars)
- Contacto (teléfono + email)
- Estado de documentación (badge compuesto)
- Estado del proveedor (Activo / Inactivo / Suspendido)
- Acciones: ver detalle, copiar link, editar, desactivar

**Badge compuesto de documentación** — muestra el estado global de todos los documentos:
```
✅ Al día       → todos los documentos aprobados y vigentes
⚠️ Atención     → algún documento próximo a vencer (≤5 días)
🔴 Vencido      → al menos 1 SUA vencido o documento rechazado
📋 Incompleto   → documentos faltantes sin subir
```

#### Panel de detalle del proveedor (página `/suppliers/:id`)

Dividido en dos secciones con tabs o acordeones:

**Sección 1 — Datos generales** (campos editables inline con `InlineEditField`):
- Nombre, RFC, dirección, ciudad, estado
- Productos/servicios que ofrece (textarea)
- Nombre de contacto, teléfono, email, sitio web
- Notas internas
- Estado del proveedor (select)

**Sección 2 — Documentos de acceso a empresa**

Tabla de documentos con una fila por tipo de documento requerido:

```
┌─────────────────┬──────────────┬────────────┬──────────┬──────────────┐
│ Documento       │ Estado       │ Vigencia   │ Archivo  │ Acciones     │
├─────────────────┼──────────────┼────────────┼──────────┼──────────────┤
│ SUA             │ 🔴 Vencido   │ Venció ayer│ Ver PDF  │ Solicitar    │
│ REPSE           │ ✅ Aprobado  │ Sin vence  │ Ver PDF  │ Ver          │
│ DC-3            │ 📋 Pendiente │ —          │ —        │ Solicitar    │
│ Alta IMSS       │ ⚠️ En revisión│ —         │ Ver PDF  │ Aprobar/Rech.│
└─────────────────┴──────────────┴────────────┴──────────┴──────────────┘
```

Botones de acción por fila:
- **Aprobar**: cambia status a APPROVED, registra `reviewedAt` y `reviewedById`
- **Rechazar**: abre un mini-modal para escribir el motivo, cambia a REJECTED
- **Solicitar**: envía correo al proveedor con su link y el documento específico que falta
- **Ver PDF**: abre en nueva pestaña la URL de Cloudinary

**Panel del link de acceso** (card al pie de la sección de documentos):
```
┌─────────────────────────────────────────────────────────────────┐
│  Link de acceso del proveedor                                   │
│  https://tuapp.railway.app/portal/abc123xyz456...               │
│  [Copiar link]  [Enviar por correo]  [Regenerar]  [Revocar]    │
│  Último acceso: hace 2 días                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Portal del proveedor (`/portal/:token`)

Página pública completamente separada visualmente de la app principal. El proveedor solo ve sus documentos requeridos y puede subir archivos.

**Diseño del portal:**
- Fondo neutro, logo de la empresa cliente en el header (nombre de la empresa, sin el sistema interno)
- Saludo: "Bienvenido, [Nombre del proveedor]"
- Lista de documentos requeridos con su estado
- Para cada documento: botón de carga, estado actual y fecha de vencimiento si aplica
- Para SUA: indicador prominente de los días restantes hasta el vencimiento

```jsx
// Componente SupplierDocCard en el portal
<div className="border rounded-lg p-4">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-medium">SUA — Pago IMSS</h3>
      <p className="text-sm text-gray-500">Vigencia: 15 días desde la carga</p>
      {doc.expiresAt && (
        <p className={`text-sm font-medium mt-1 ${daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
          {daysLeft > 0 ? `Vence en ${daysLeft} días` : 'VENCIDO'}
        </p>
      )}
    </div>
    <StatusBadge status={doc.status} />
  </div>
  {doc.reviewNotes && (
    <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">
      Motivo del rechazo: {doc.reviewNotes}
    </div>
  )}
  <div className="mt-3">
    <FileUploader
      onUpload={(file) => uploadDocument(doc.docType, file)}
      accept=".pdf,.jpg,.png"
      maxSizeMb={10}
    />
  </div>
</div>
```

**Restricciones del portal:**
- No requiere autenticación JWT interna
- El token es validado en cada request — si `isActive = false`, mostrar "Este link ha sido revocado. Contacta a tu empresa cliente."
- Solo permite subir archivos — no puede ver datos de otros proveedores ni del sistema interno
- Los archivos se suben directamente a Cloudinary desde el backend (nunca exponer las credenciales de Cloudinary al frontend público)
- Ruta completamente separada: `/portal/*` no pasa por el middleware de autenticación JWT

---

## Parte 2 — EPP: Inventario y Matriz de requerimientos

### 2.1 Modelo de datos

```prisma
// Catálogo de artículos EPP
model EppItem {
  id           String   @id @default(cuid())
  name         String                          // Ej: "Guantes de nitrilo"
  category     String                          // Ej: "Manos", "Cabeza", "Ojos", "Pies"
  description  String?
  unit         String   @default("pieza")      // pieza, par, juego
  minStock     Int      @default(0)            // Stock mínimo de alerta
  currentStock Int      @default(0)            // Calculado de los movimientos
  partNumber   String?                         // Número de parte / referencia
  brand        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  companyId    String
  company      Company         @relation(fields: [companyId], references: [id])

  movements    EppMovement[]
  areaRequirements EppAreaRequirement[]
}

enum EppMovementType {
  ENTRY       // Entrada a inventario (compra, donación)
  EXIT        // Salida por entrega a trabajador
  ADJUSTMENT  // Ajuste de inventario (conteo físico)
  RETURN      // Devolución de un trabajador
}

// Movimientos de inventario EPP
model EppMovement {
  id              String          @id @default(cuid())
  type            EppMovementType
  quantity        Int
  balanceAfter    Int             // stock resultante tras el movimiento
  employeeName    String?         // nombre del trabajador para EXIT/RETURN
  employeeArea    String?
  reason          String?         // motivo de ajuste, descripción de compra, etc.
  date            DateTime        @default(now())
  createdAt       DateTime        @default(now())

  eppItemId       String
  eppItem         EppItem         @relation(fields: [eppItemId], references: [id])
  registeredById  String
  registeredBy    User            @relation(fields: [registeredById], references: [id])
}

// Matriz de requerimientos EPP por área
model EppAreaRequirement {
  id          String   @id @default(cuid())
  areaName    String                    // Ej: "Producción", "Almacén", "Mantenimiento"
  mandatory   Boolean  @default(true)   // obligatorio vs recomendado
  notes       String?                   // condición de uso, ej: "solo en operación de torno"
  createdAt   DateTime @default(now())

  eppItemId   String
  eppItem     EppItem  @relation(fields: [eppItemId], references: [id])
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])

  @@unique([eppItemId, areaName, companyId])
}
```

Agregar en `Company`: `eppItems EppItem[]`, `eppAreaRequirements EppAreaRequirement[]`
Agregar en `User`: `eppMovements EppMovement[]`

**Lógica de `currentStock`:** Nunca se guarda directamente — se recalcula siempre desde los movimientos:
```js
// En el controller, al pedir el stock de un artículo:
const stock = await prisma.eppMovement.aggregate({
  where: { eppItemId },
  _sum: {
    // ENTRY y RETURN suman, EXIT resta, ADJUSTMENT reemplaza
  }
});
// Más simple: usar el campo balanceAfter del último movimiento
const lastMovement = await prisma.eppMovement.findFirst({
  where: { eppItemId },
  orderBy: { date: 'desc' }
});
const currentStock = lastMovement?.balanceAfter ?? 0;
```

Alternativamente, mantener `currentStock` en `EppItem` y actualizarlo en cada movimiento dentro de una `prisma.$transaction`.

### 2.2 Endpoints del backend

```
// Catálogo EPP
GET    /api/epp/items                       → lista de artículos con stock actual
POST   /api/epp/items                       → crear artículo
PUT    /api/epp/items/:id                   → editar artículo
DELETE /api/epp/items/:id                   → desactivar (soft delete)

// Movimientos
GET    /api/epp/items/:id/movements         → historial de movimientos del artículo
POST   /api/epp/movements                   → registrar movimiento (entrada/salida/ajuste/devolución)

// Alertas de stock
GET    /api/epp/alerts                      → artículos con stock <= minStock

// Matriz de requerimientos por área
GET    /api/epp/matrix                      → matriz completa (areas x artículos)
POST   /api/epp/matrix                      → agregar requerimiento área-artículo
DELETE /api/epp/matrix/:id                  → quitar artículo de una área
PUT    /api/epp/matrix/:id                  → actualizar (obligatorio/recomendado, notas)
```

### 2.3 Frontend — Página EPP (`/epp`)

Dos tabs dentro de la misma página:

#### Tab 1 — Inventario

**Tarjetas de resumen al tope:**
- Total de artículos en catálogo
- Artículos con stock crítico (≤ mínimo) — badge rojo
- Artículos con stock OK
- Movimientos del mes

**Tabla de artículos:**

```
┌──────────────────────┬──────────┬─────────┬─────────────┬─────────────┬──────────┐
│ Artículo             │ Categoría│ Unidad  │ Stock actual│ Stock mínimo│ Acciones │
├──────────────────────┼──────────┼─────────┼─────────────┼─────────────┼──────────┤
│ Guantes de nitrilo   │ Manos    │ par     │    45 ⬆     │     20      │ [+ mov]  │
│ Casco de seguridad   │ Cabeza   │ pieza   │    🔴 8     │     15      │ [+ mov]  │
│ Lentes de seguridad  │ Ojos     │ pieza   │    32       │     10      │ [+ mov]  │
└──────────────────────┴──────────┴─────────┴─────────────┴─────────────┴──────────┘
```

- Stock en rojo + icono de alerta cuando `currentStock <= minStock`
- Botón `[+ mov]` abre el modal de registro de movimiento

**Modal de registro de movimiento:**
```
Tipo de movimiento  [Entrada ▼ | Salida ▼ | Ajuste ▼ | Devolución ▼]
Artículo            [selector o ya viene preseleccionado]
Cantidad            [input numérico]
Fecha               [date picker — default hoy]

// Solo si tipo = EXIT o RETURN:
Nombre del trabajador  [input texto]
Área del trabajador    [select de áreas de la empresa]

// Solo si tipo = ENTRY:
Proveedor / Origen     [input texto]
Número de factura      [input texto, opcional]

// Solo si tipo = ADJUSTMENT:
Motivo del ajuste      [input texto]
Stock real contado     [input numérico — el sistema calcula la diferencia]

Notas adicionales      [textarea, opcional]
```

Al guardar, actualizar `currentStock` en `EppItem` y crear el `EppMovement` en una transacción.

**Historial de movimientos** (panel debajo de la tabla, expande al seleccionar un artículo):
- Fecha, tipo (badge de color), cantidad (+/-), stock resultante, trabajador/área si aplica, registrado por

#### Tab 2 — Matriz de requerimientos por área

Tabla de doble entrada: filas = artículos EPP, columnas = áreas de trabajo. Cada celda indica si ese artículo es requerido en esa área.

```
Diseño de la matriz:

              │ Producción │ Almacén │ Mantenimiento │ Oficinas │
──────────────┼────────────┼─────────┼───────────────┼──────────┤
Casco         │     ●      │    ●    │      ●        │          │
Lentes segur. │     ●      │    ○    │      ●        │          │
Guantes nit.  │     ●      │    ●    │      ●        │          │
Botas punta a.│     ●      │    ●    │      ●        │          │
Tapones oídos │     ●      │         │      ○        │          │
──────────────┼────────────┼─────────┼───────────────┼──────────┤

● = Obligatorio   ○ = Recomendado   (vacío) = No requerido
```

Interacción: hacer clic en una celda vacía la activa como Obligatorio → clic de nuevo cambia a Recomendado → clic de nuevo la quita. Guardar automáticamente al cambiar cada celda (PATCH individual, sin botón de guardar global).

Al pie de la matriz, botón **"Exportar matriz como PDF"** — genera un documento con el nombre de la empresa, fecha y la tabla completa. Útil para evidencia ante auditorías NOM-017.

**Gestión de áreas:** Un botón **"Gestionar áreas"** abre un modal pequeño para agregar o quitar áreas de la matriz. Las áreas son texto libre (no FK a otra tabla) — mismo concepto que `area` en los requerimientos.

---

## Parte 3 — Sustancias químicas

### 3.1 Modelo de datos

```prisma
// Sección 1: Hojas de seguridad y etiquetas SGA
enum GhsHazardClass {
  FLAMMABLE
  TOXIC
  CORROSIVE
  OXIDIZING
  EXPLOSIVE
  ENVIRONMENTAL_HAZARD
  HEALTH_HAZARD
  IRRITANT
  COMPRESSED_GAS
}

model ChemicalProduct {
  id                String          @id @default(cuid())
  tradeName         String          // Nombre comercial
  chemicalName      String?         // Nombre IUPAC / químico
  casNumber         String?         // Número CAS (ej: 64-17-5 para etanol)
  manufacturer      String?
  supplierId        String?
  supplier          Supplier?       @relation(fields: [supplierId], references: [id])
  ghsHazardClasses  String          // JSON array de GhsHazardClass
  physicalState     String?         // líquido, sólido, gas, polvo
  storageLocation   String?
  maxStockKg        Float?          // cantidad máxima almacenada (para permisos)
  isActive          Boolean         @default(true)
  notes             String?         @db.Text
  sdsUpdatedAt      DateTime?       // fecha de la HDS más reciente
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  companyId         String
  company           Company         @relation(fields: [companyId], references: [id])

  sdsFile           ChemicalFile?   @relation("sds")     // Hoja de Seguridad (SDS/HDS)
  labelFile         ChemicalFile?   @relation("label")   // Etiqueta SGA
  hazmatDisposals   HazmatDisposal[]
}

enum ChemicalFileType {
  SDS    // Safety Data Sheet / Hoja de Datos de Seguridad
  LABEL  // Etiqueta SGA
}

model ChemicalFile {
  id           String          @id @default(cuid())
  fileType     ChemicalFileType
  fileUrl      String
  publicId     String
  fileName     String
  uploadedAt   DateTime        @default(now())
  version      String?         // ej: "v3 - 2025"

  productId    String
  product      ChemicalProduct @relation(name: "sds", fields: [productId], references: [id], onDelete: Cascade)
}

// Sección 2: Disposición de residuos peligrosos
enum WasteState {
  SOLID
  LIQUID
  SLUDGE
  GAS
}

model HazmatDisposal {
  id               String      @id @default(cuid())
  folio            String      @unique   // DISP-2025-001
  disposalDate     DateTime
  wasteType        String                // Descripción del residuo peligroso
  wasteState       WasteState
  quantityKg       Float
  manifestNumber   String?               // Número de manifiesto SEMARNAT
  transportCompany String?               // Empresa transportista
  disposalMethod   String?               // Ej: incineración, co-procesamiento, confinamiento
  notes            String?     @db.Text

  supplierId       String                // Proveedor que da la disposición (con REPSE/autorización SEMARNAT)
  supplier         Supplier    @relation(fields: [supplierId], references: [id])
  productId        String?               // Vinculación opcional al producto químico origen
  product          ChemicalProduct? @relation(fields: [productId], references: [id])
  companyId        String
  company          Company     @relation(fields: [companyId], references: [id])
  createdById      String
  createdBy        User        @relation(fields: [createdById], references: [id])

  evidences        HazmatEvidence[]
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

model HazmatEvidence {
  id          String   @id @default(cuid())
  fileUrl     String
  publicId    String
  fileName    String
  fileType    String   // pdf, jpg, png
  description String?
  uploadedAt  DateTime @default(now())

  disposalId  String
  disposal    HazmatDisposal @relation(fields: [disposalId], references: [id], onDelete: Cascade)
}
```

Agregar en `Company`: `chemicals ChemicalProduct[]`, `hazmatDisposals HazmatDisposal[]`
Agregar en `Supplier`: `chemicals ChemicalProduct[]`, `hazmatDisposals HazmatDisposal[]`

Migración:
```bash
npx prisma migrate dev --name add_chemicals_module
```

### 3.2 Endpoints del backend

```
// Productos químicos
GET    /api/chemicals                       → lista con estado de SDS y etiqueta
POST   /api/chemicals                       → crear producto
GET    /api/chemicals/:id                   → detalle con archivos
PUT    /api/chemicals/:id                   → editar producto
DELETE /api/chemicals/:id                   → desactivar

// Archivos SDS y etiquetas
POST   /api/chemicals/:id/sds               → subir o reemplazar HDS (PDF)
POST   /api/chemicals/:id/label             → subir o reemplazar etiqueta (PDF/imagen)
DELETE /api/chemicals/:id/sds               → eliminar HDS (también de Cloudinary)
DELETE /api/chemicals/:id/label             → eliminar etiqueta

// Disposición de residuos
GET    /api/hazmat/disposals                → lista con filtros (año, proveedor, tipo)
POST   /api/hazmat/disposals               → registrar disposición
GET    /api/hazmat/disposals/:id           → detalle + evidencias
PUT    /api/hazmat/disposals/:id           → editar disposición
POST   /api/hazmat/disposals/:id/evidence  → cargar evidencia (foto/PDF)
DELETE /api/hazmat/disposals/:id/evidence/:evidenceId
```

### 3.3 Frontend — Página Sustancias Químicas (`/chemicals`)

Dos tabs dentro de la misma página:

#### Tab 1 — Inventario de sustancias (hojas de seguridad y etiquetas)

**Tarjetas de resumen:**
- Total de productos registrados
- Sin HDS cargada (badge rojo)
- Sin etiqueta SGA (badge amarillo)
- Actualizados en los últimos 12 meses (badge verde)

**Tabla de productos químicos:**

```
┌──────────────────┬────────────┬──────────┬──────────────┬──────────────┬──────────┐
│ Nombre comercial │ Nombre quím│ CAS      │ HDS          │ Etiqueta SGA │ Acciones │
├──────────────────┼────────────┼──────────┼──────────────┼──────────────┼──────────┤
│ Thinner acrílico │ Tolueno    │ 108-88-3 │ ✅ v2 - 2024 │ ✅ Cargada   │ [ver][✎] │
│ Soda cáustica    │ NaOH       │ 1310-73-2│ ✅ v1 - 2023 │ 🔴 Faltante  │ [ver][✎] │
│ Aceite de corte  │            │          │ 🔴 Faltante   │ 🔴 Faltante  │ [ver][✎] │
└──────────────────┴────────────┴──────────┴──────────────┴──────────────┴──────────┘
```

**Diamantes GHS en la tabla:** mostrar los pictogramas GHS/SGA correspondientes a las clases de peligro del producto. Usar SVG inline simples (no imágenes externas) — los 9 pictogramas GHS son formas geométricas básicas dibujables con SVG.

**Panel de detalle del producto (modal o página `/chemicals/:id`):**

Sección de información general (campos editables inline):
- Nombre comercial, nombre químico, número CAS
- Fabricante, proveedor (selector vinculado al módulo de Proveedores)
- Estado físico, ubicación de almacenamiento
- Cantidad máxima almacenada (kg/L)
- Clases de peligro GHS (checkboxes con los 9 pictogramas)

Sección de archivos:
```
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│  Hoja de Datos de Seguridad (HDS)   │  │  Etiqueta SGA                       │
│                                     │  │                                     │
│  [Nombre del archivo] [Descargar]   │  │  [Nombre del archivo] [Descargar]   │
│  Versión: v2 - 2024                 │  │  [Ver preview]                      │
│  Cargado: 15 ene 2024              │  │                                     │
│                                     │  │  [Subir etiqueta]                   │
│  [Reemplazar HDS]                   │  │                                     │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
```

Subir HDS y etiqueta: usar el componente `FileUploader` existente, aceptar solo PDF para HDS, PDF/JPG/PNG para etiqueta.

#### Tab 2 — Disposición de residuos peligrosos

**Tarjetas de resumen del año actual:**
- Eventos de disposición realizados
- Total de kg/L dispuestos
- Proveedores de disposición utilizados
- Último evento (fecha)

**Tabla de registros de disposición:**

```
┌───────────┬────────────┬──────────────────┬──────────┬─────────────┬────────────┐
│ Folio     │ Fecha      │ Tipo de residuo  │ Cantidad │ Proveedor   │ Acciones   │
├───────────┼────────────┼──────────────────┼──────────┼─────────────┼────────────┤
│ DISP-001  │ 15 ene 25  │ Aceites residuales│ 45 kg   │ EcoResiduos │ [ver][✎]   │
│ DISP-002  │ 12 feb 25  │ Solventes usados  │ 28 L    │ EcoResiduos │ [ver][✎]   │
└───────────┴────────────┴──────────────────┴──────────┴─────────────┴────────────┘
```

Filtros: por año, por proveedor, por tipo de residuo.

**Modal de registro de disposición:**
```
Folio             [auto-generado: DISP-{año}-{seq}]
Fecha de disposición   [date picker]
Tipo de residuo   [input texto — libre]
Estado del residuo  [Sólido | Líquido | Lodo | Gas]
Cantidad (kg/L)   [número con unidad]
Producto químico origen  [selector opcional — vincula al catálogo]
Número de manifiesto SEMARNAT  [texto]
Proveedor de disposición  [selector del módulo de Proveedores]
Empresa transportista  [texto]
Método de disposición  [texto o select: incineración, co-procesamiento, confinamiento, otro]
Notas              [textarea]
Evidencias         [FileUploader — fotos + PDFs del manifiesto, reporte, factura]
```

---

## Parte 4 — Actualización del Dashboard

### Nuevos indicadores (tarjetas KPI)

Agregar al `dashboard.controller.js` los siguientes cálculos:

```js
// Proveedores
const suppliersTotal = await prisma.supplier.count({ where: { companyId, status: 'ACTIVE' } });
const suppliersDocExpired = await prisma.supplierDocument.count({
  where: { supplier: { companyId }, status: 'EXPIRED' }
});
const suppliersDocPending = await prisma.supplierDocument.count({
  where: { supplier: { companyId }, status: 'PENDING' }
});

// EPP con stock crítico
const eppCritical = await prisma.eppItem.count({
  where: { companyId, isActive: true, currentStock: { lte: prisma.eppItem.fields.minStock } }
});
// Nota: comparar currentStock <= minStock requiere raw query o post-proceso en JS

// Sustancias sin HDS
const chemicalsNoSds = await prisma.chemicalProduct.count({
  where: { companyId, isActive: true, sdsFile: null }
});
```

### Nuevas gráficas en el Dashboard

**1. Estado de documentación de proveedores (donut)**
- Sectores: Al día / Próximo a vencer (≤5 días) / Vencido / Pendiente
- Solo contar el documento más crítico por proveedor para no inflar

**2. EPP — stock vs mínimo (barras horizontales)**
- Una barra por artículo EPP
- Barra gris = stock mínimo (línea de referencia)
- Barra azul = stock actual
- Roja cuando stock actual < mínimo
- Máximo 8 artículos visibles — botón "Ver todos" enlaza a `/epp`

**3. Disposición de residuos peligrosos por mes (barras)**
- Kg/L dispuestos por mes en el año actual
- Útil para reportes ambientales y presupuesto

**4. Semáforo de cumplimiento de proveedores (tabla resumen)**
- Máximo 5 proveedores activos con documentos más críticos
- Nombre del proveedor + estado de cada documento clave (SUA, REPSE, DC-3)
- Color verde/amarillo/rojo por celda
- Link "Ver todos" a `/suppliers`

### Actualizar el calendario

En `calendar.controller.js`, agregar dos nuevas fuentes de eventos:

```js
// Vencimiento de SUA de proveedores
prisma.supplierDocument.findMany({
  where: {
    supplier: { companyId },
    docType: 'SUA',
    status: 'APPROVED',
    expiresAt: { gte: rangeStart, lte: rangeEnd }
  },
  include: { supplier: { select: { id, name } } }
})
// Evento: { type: 'supplier_doc', title: 'SUA vence: [nombre proveedor]', color: '#0369a1' }

// Artículos EPP con stock crítico (no es fecha — aparece como evento permanente en "hoy")
// Solo mostrar en vista Agenda, no en vista mes (evita saturar)
```

---

## Actualización de navegación

Agregar en el **Sidebar** dos nuevos grupos de navegación:

**Grupo: Proveedores** (nuevo grupo después de Brigadas)
- `/suppliers` — Proveedores (icono: `Building2`)

**Grupo: Operaciones y Seguridad** (nuevo grupo después de Mantenimiento)
- `/epp` — EPP e Inventario (icono: `HardHat`)
- `/chemicals` — Sustancias químicas (icono: `FlaskConical`)

---

## Actualización de i18n

Agregar en `es.json` los namespaces:

```json
"suppliers": {
  "title": "Proveedores",
  "portal": "Portal de proveedores",
  "docTypes": {
    "SUA": "SUA — Pago IMSS",
    "REPSE": "REPSE",
    "DC3": "DC-3 Constancia de habilidades",
    "IMSS_ALTA": "Alta patronal IMSS",
    "ACTA_CONSTITUTIVA": "Acta constitutiva",
    "POLIZA_SEGURO": "Póliza de seguro",
    "CONTRATO_SERVICIOS": "Contrato de servicios",
    "OPINION_SAT": "Opinión de cumplimiento SAT",
    "OTHER": "Otro"
  },
  "docStatuses": {
    "PENDING": "Pendiente",
    "UPLOADED": "En revisión",
    "APPROVED": "Aprobado",
    "REJECTED": "Rechazado",
    "EXPIRED": "Vencido"
  },
  "suaExpiry": "Vigencia SUA: 15 días",
  "linkAccess": "Link de acceso",
  "copyLink": "Copiar link",
  "revokeLink": "Revocar link",
  "regenerateLink": "Regenerar link",
  "portalWelcome": "Bienvenido"
},
"epp": {
  "title": "EPP e Inventario",
  "inventory": "Inventario",
  "matrix": "Matriz por área",
  "movementTypes": {
    "ENTRY": "Entrada",
    "EXIT": "Salida",
    "ADJUSTMENT": "Ajuste",
    "RETURN": "Devolución"
  },
  "minStock": "Stock mínimo",
  "currentStock": "Existencias actuales",
  "critical": "Stock crítico",
  "exportMatrix": "Exportar matriz PDF"
},
"chemicals": {
  "title": "Sustancias químicas",
  "sds": "Hoja de Datos de Seguridad",
  "label": "Etiqueta SGA",
  "casNumber": "Número CAS",
  "ghsClasses": "Clases de peligro GHS",
  "disposals": "Disposición de residuos",
  "manifestNumber": "Número de manifiesto",
  "wasteStates": {
    "SOLID": "Sólido",
    "LIQUID": "Líquido",
    "SLUDGE": "Lodo",
    "GAS": "Gas"
  }
}
```

---

## Seed de datos para los módulos nuevos

En `backend/prisma/seed.js`, agregar para "Manufacturas del Norte":

**5 proveedores de ejemplo:**
1. `Distribuidora Industrial del Norte S.A.` — productos: EPP y herramental — con SUA vigente, REPSE aprobado
2. `EcoResiduos Noreste S.A. de C.V.` — servicios: disposición de residuos peligrosos — con todos los docs
3. `Seguridad Industrial Monterrey` — productos: señalización, extintores — sin DC-3 (pendiente)
4. `Mantenimiento Especializado MX` — servicios: mantenimiento eléctrico — con SUA próximo a vencer (3 días)
5. `Gases Industriales Regio` — productos: gases comprimidos — con SUA vencido

**5 artículos EPP con movimientos:**
- Guantes de nitrilo (stock: 45, mínimo: 20) — 3 entradas + 2 salidas con nombre de trabajador
- Casco de seguridad amarillo (stock: 8, mínimo: 15) — stock CRÍTICO
- Lentes de seguridad (stock: 32, mínimo: 10)
- Botas de punta de acero (stock: 14, mínimo: 10)
- Tapones auditivos (stock: 60, mínimo: 30)

**Matriz EPP:** configurar Producción y Mantenimiento con todos los artículos obligatorios; Almacén sin tapones; Oficinas vacía.

**4 productos químicos:**
- Thinner acrílico (CAS: 108-88-3, flamable + tóxico) — con SDS cargada
- Soda cáustica (CAS: 1310-73-2, corrosivo) — con SDS, sin etiqueta
- Aceite de corte soluble — sin SDS ni etiqueta (para activar alerta)
- Gas LP (flamable, gas comprimido) — con SDS

**3 registros de disposición:**
- DISP-2025-001: aceites residuales 45kg, proveedor EcoResiduos, hace 3 meses
- DISP-2025-002: solventes usados 28L, hace 2 meses
- DISP-2025-003: baterías residuales 12kg, hace 1 mes

---

## Checklist de implementación

### Base de datos
- [ ] Agregar modelos `Supplier`, `SupplierAccessToken`, `SupplierDocument` en schema
- [ ] Agregar modelos `EppItem`, `EppMovement`, `EppAreaRequirement`
- [ ] Agregar modelos `ChemicalProduct`, `ChemicalFile`, `HazmatDisposal`, `HazmatEvidence`
- [ ] Ejecutar migración de Prisma
- [ ] Actualizar seed con datos de prueba

### Backend — Proveedores
- [ ] `supplier.controller.js` + `supplier.routes.js`
- [ ] Lógica de generación de token único (cuid como token)
- [ ] `portal.controller.js` + `portal.routes.js` (ruta pública, sin auth middleware)
- [ ] Cron/función de vencimiento SUA (ejecutar al cargar dashboard o cron diario)
- [ ] Correo de recordatorio SUA en `notification.service.js`
- [ ] Subida de archivos en portal usa backend como intermediario (no exponer keys de Cloudinary)

### Backend — EPP
- [ ] `epp.controller.js` + `epp.routes.js`
- [ ] Lógica de actualización de `currentStock` en transacción al crear movimiento
- [ ] Endpoint de alertas de stock crítico

### Backend — Sustancias químicas
- [ ] `chemical.controller.js` + `chemical.routes.js`
- [ ] `hazmat.controller.js` + `hazmat.routes.js`
- [ ] Generación de folio DISP-{año}-{seq}
- [ ] Upload de evidencias a Cloudinary

### Backend — Dashboard
- [ ] Actualizar `dashboard.controller.js` con nuevos KPIs
- [ ] Actualizar `calendar.controller.js` con eventos de SUA de proveedores

### Frontend — Proveedores
- [ ] Crear `SuppliersPage.jsx` con tabla y badges de estado
- [ ] Crear `SupplierDetailPage.jsx` con dos secciones
- [ ] Crear `SupplierPortalPage.jsx` (página pública en `/portal/:token`)
- [ ] Agregar rutas en `App.jsx` (portal NO envuelto en `ProtectedRoute`)
- [ ] Agregar ítem en Sidebar

### Frontend — EPP
- [ ] Crear `EppPage.jsx` con dos tabs
- [ ] Crear `EppInventoryTab.jsx` con tabla y modal de movimiento
- [ ] Crear `EppMatrixTab.jsx` con tabla de doble entrada interactiva
- [ ] Lógica de clic en celda (vacío → obligatorio → recomendado → vacío)
- [ ] Exportar matriz como PDF (usar `window.print()` o librería `jspdf`)

### Frontend — Sustancias químicas
- [ ] Crear `ChemicalsPage.jsx` con dos tabs
- [ ] Crear `ChemicalListTab.jsx` con pictogramas GHS inline SVG
- [ ] Crear `ChemicalDetailPage.jsx` con secciones de info + archivos
- [ ] Crear `HazmatDisposalTab.jsx` con tabla y modal de registro
- [ ] `FileUploader` para SDS, etiqueta y evidencias de disposición

### Frontend — Dashboard
- [ ] Donut de estado de documentos de proveedores
- [ ] Barras horizontales EPP stock vs mínimo
- [ ] Barras de disposición de residuos por mes
- [ ] Tabla semáforo de proveedores

### i18n
- [ ] Agregar `suppliers`, `epp`, `chemicals` en `es.json` y `en.json`

---

## Notas técnicas para Claude Code

- El portal del proveedor (`/portal/:token`) debe estar en una ruta que **no pase por el middleware JWT** de autenticación. En Express, registrar la ruta de portal **antes** del middleware de auth, o excluirla explícitamente en el middleware
- Para la carga de archivos en el portal (proveedor sube SUA), el backend recibe el archivo como `multipart/form-data`, lo sube a Cloudinary desde el servidor y guarda la URL en BD. Nunca pasar las credenciales de Cloudinary al frontend público
- El `token` del `SupplierAccessToken` se envía como query param: `/portal/abc123...` — la ruta lo extrae con `req.params.token`
- La matriz EPP `EppAreaRequirement` tiene `@@unique([eppItemId, areaName, companyId])` — al hacer clic en celda, verificar si existe el registro: si no existe → crear; si existe con `mandatory: true` → actualizar a `mandatory: false`; si existe con `mandatory: false` → eliminar
- Para la generación del folio de disposición `DISP-{año}-{seq}`, contar los registros del año actual del empresa y sumarle 1: `DISP-2025-${String(count + 1).padStart(3, '0')}`
- Los pictogramas GHS/SGA son 9 diamantes con bordes rojos e iconos interiores — dibujarlos como SVG inline en un componente `GhsPictogram.jsx` que recibe el tipo y renderiza el diamante correspondiente. No depender de imágenes externas
- `ChemicalFile` tiene dos relaciones nombradas al mismo modelo (`"sds"` y `"label"`) — asegurarse de usar los nombres correctos en Prisma y en las queries

---

*Módulos: Proveedores + Portal + EPP + Sustancias Químicas — Actualización v1.6*
*App: Seguridad e Higiene México — Stack: React + Node.js/Express + PostgreSQL + Prisma + Cloudinary*
