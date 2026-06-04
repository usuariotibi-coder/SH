# SH México — App de Seguridad e Higiene

Aplicación web fullstack para el seguimiento y cumplimiento de requerimientos legales de Seguridad e Higiene en México (NOMs, IMSS, STPS).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Base de datos | PostgreSQL (Railway plugin) |
| ORM | Prisma |
| Autenticación | JWT + bcrypt |
| Archivos | Cloudinary |
| Estilos | Tailwind CSS v3 |
| Estado | Zustand |
| Despliegue | Railway |

---

## Inicio rápido

### Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Credenciales demo

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Administrador | admin@sh-app.mx | Admin1234! | ADMIN |
| Especialista SH | especialista@sh-app.mx | Especialista1! | SH_SPECIALIST |
| Gerente producción | gerente.produccion@sh-app.mx | Gerente1234! | AREA_MANAGER |
| Auditor | auditor@sh-app.mx | Auditor1234! | AUDITOR |
| Dirección | direccion@sh-app.mx | Direccion1! | EXECUTIVE |

---

## Módulos

### 1. Dashboard ejecutivo
KPIs en tiempo real, gráficas Recharts, panel de alertas automáticas.

### 2. Requerimientos legales
NOMs, IMSS, STPS con actividades, responsables y gestión de evidencias (archivos Cloudinary).

### 3. Incidentes y accidentes
Folio automático, tipos (accidente, incidente, casi-accidente, enfermedad), causa raíz, reporte IMSS, días perdidos.

### 4. CMSH
Integrantes con roles (presidente, secretario, representante), actas de reunión y próximas fechas.

### 5. Capacitación
Cursos, instructor, participantes, fecha de vencimiento de certificación.

### 6. Simulacros
Planeados vs ejecutados, tipo (incendio, sismo, evacuación…), tiempo de evacuación, correctivos.

### 7. 5S
Auditorías por área con puntajes (Seiri-Seiton-Seiso-Seiketsu-Shitsuke) y gráfica radar.

### 8. Mantenimiento preventivo
EPP, extintores, instalaciones eléctricas, vehículos — con fechas de próximo mantenimiento y alertas.

### 9. Gestión de riesgos
Matriz probabilidad × severidad, nivel de riesgo (bajo/medio/alto/crítico), controles actuales y propuestos.

### 10. Auditorías internas
Checklist configurable, puntaje, hallazgos y plan de acción correctiva.

### 11. Programa SH
PSH anual con objetivos, alcance, presupuesto y aprobación.

### 12. Brigadas de emergencia
Tres brigadas activas: Primeros Auxilios, Evacuación e Incendios.
- Tabla por brigada con columnas: Rol, Nombre, **Fecha del curso**, **Vigencia**
- Integrantes con fecha de certificación y estado (vigente / por vencer / vencida)
- Punto de reunión y descripción editable en línea

### 13. EPP — Equipo de Protección Personal

#### Inventario
Vista de tabla con columnas: **Descripción**, **Usuarios**, **Máx**, **Mín**, **Stock**, **Valor FIFO**.

- **Usuarios**: suma del personal de todos los puestos que utilizan ese artículo (calculado desde la Matriz EPP).
- **Valor FIFO**: costo de inventario calculado por método FIFO — consume los lotes más antiguos primero.
- Historial de movimientos expandible por artículo.

#### Entradas y Salidas
Botones globales al nivel de los tabs. Cada uno tiene dos modos:

**Registro manual**

| Entradas | Salidas |
|---|---|
| Artículo | Artículo |
| Cantidad | Cantidad |
| Proveedor | Puesto |
| Precio unitario | Solicitante |

La fecha se registra automáticamente al momento del movimiento.

**Importación CSV**
- Plantilla descargable generada dinámicamente con los artículos actuales como ejemplo.
- Columnas entrada: `Articulo, Cantidad, Proveedor, Precio`
- Columnas salida: `Articulo, Cantidad, Puesto, Solicitante`
- Vista previa de filas antes de importar.
- Reporte de éxitos y errores por fila.

#### Control FIFO
Cada entrada crea un **lote** (`EppLot`) con cantidad, precio unitario y fecha. Cada salida consume los lotes más antiguos primero, actualizando el campo `remaining` por lote. El valor de inventario se calcula como `Σ(restante × precio_unitario)` por artículo.

**Ejemplo:**
```
Lote 1 (ene): 5 unidades × $4 = $20
Lote 2 (jun): 2 unidades × $9 = $18
────────────────────────────────
Valor total:  7 unidades        $38

Salida de 3 → consume 3 del Lote 1 (más antiguo)
Nuevo valor: 2 × $4 + 2 × $9 = $8 + $18 = $26
```

#### Matriz EPP
Tabla por puesto con columnas: **EPP**, **Usuarios**, **Frecuencia de cambio**, **Obligatorio**, **Notas**.

- Frecuencia de cambio: 1 mes / 3 meses / 6 meses / 12 meses.
- Botones editar y eliminar por fila.
- Modal add/edit con campos: EPP, Puesto, Usuarios (personal), Frecuencia, Obligatorio, Notas.

#### Datos precargados
- **54 artículos** EPP (41 de cotización COT D52132 de Seguridad Industrial Amigo + 12 genéricos + Casco de Seguridad).
- **221 registros de matriz** desde archivo `EPP.xlsx` — 35 puestos en 10 áreas con frecuencias y cantidades de personal.

---

## Scripts de importación

```bash
# Importar artículos desde cotización COT D52132
node backend/scripts/import-cot-d52132.js

# Importar matriz EPP desde EPP.xlsx
node backend/scripts/import-epp-matrix.js

# Sincronizar EPP local → Railway
node backend/scripts/sync-epp-to-railway.js
```

---

## Despliegue en Railway

1. Crear proyecto en Railway
2. Agregar plugin PostgreSQL
3. Configurar variables de entorno (ver `.env.example`)
4. Conectar repositorio — Railway detecta automáticamente la configuración via `railway.json`

El `startCommand` ejecuta `npx prisma generate` antes de iniciar el servidor para mantener el cliente Prisma sincronizado con el schema.

## Variables de entorno requeridas

```
DATABASE_URL            # Provista por Railway PostgreSQL
JWT_SECRET              # Clave secreta para JWT
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NODE_ENV=production
```

---

## Modelos de base de datos relevantes (EPP)

```
EppItem          — artículo EPP (nombre, categoría, stocks, marca, part number)
EppMovement      — movimiento de stock (entrada/salida/ajuste/devolución)
                   campos: type, quantity, supplier, price, employeeName,
                           employeeArea, frequency, balanceAfter
EppLot           — lote FIFO (quantity, remaining, unitPrice, createdAt)
EppAreaRequirement — matriz puesto × EPP
                   campos: areaName, userCount, changeFrequency, mandatory, notes
```
