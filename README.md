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

## Inicio rápido

### Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Credenciales demo

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Administrador | admin@shmexicoapp.com | Admin1234! |
| Especialista SH | especialista@shmexicoapp.com | Especialista1! |

## Módulos

1. **Dashboard ejecutivo** — KPIs, gráficas Recharts, panel de alertas
2. **Requerimientos legales** — NOMs, IMSS, STPS con actividades y evidencias
3. **Incidentes y accidentes** — Folio automático, causa raíz, reporte IMSS
4. **CMSH** — Integrantes y actas de reunión
5. **Capacitación** — Cursos, participantes, vencimiento
6. **Simulacros** — Planeados vs ejecutados, tiempo de evacuación
7. **5S** — Auditorías con gráfica radar
8. **Mantenimiento preventivo** — EPP, extintores, instalaciones
9. **Gestión de riesgos** — Matriz probabilidad × severidad
10. **Auditorías internas** — Checklist configurable con puntaje
11. **Programa SH** — PSH anual

## Despliegue en Railway

1. Crear proyecto en Railway
2. Agregar plugin PostgreSQL
3. Configurar variables de entorno (ver `.env.example`)
4. Conectar repositorio — Railway detecta automáticamente la configuración

## Variables de entorno requeridas

```
DATABASE_URL        # Provista por Railway PostgreSQL
JWT_SECRET          # Clave secreta para JWT
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NODE_ENV=production
```
