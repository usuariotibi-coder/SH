import { useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, Users2, GraduationCap,
  Siren, FlaskConical,
  ChevronDown, ChevronRight, ArrowRight, Info, CheckCircle2, AlertCircle,
  Users, Building2, Shield, Bell, Upload, Search, Filter, PlusCircle,
  Eye, Edit2, Trash2, Lock, Star, Zap, GitBranch,
  CalendarDays, UsersRound, HardHat
} from 'lucide-react';

/* ─── Datos de la guía ─────────────────────────────────── */
const MODULES = [
  {
    id: 'start',
    icon: Shield,
    color: '#1a4a6b',
    title: 'Inicio rápido',
    subtitle: 'Primeros pasos en la plataforma',
    steps: [
      {
        title: 'Acceso al sistema',
        desc: 'Ingresa con tu correo y contraseña en la pantalla de login. El sistema redirige automáticamente según tu rol.',
        tips: ['Admin ve todas las empresas', 'Especialista, Gerente y Auditor solo ven su empresa asignada', 'Dirección tiene acceso de solo lectura']
      },
      {
        title: 'Selección de empresa (solo Admin)',
        desc: 'El Admin puede cambiar de empresa desde el selector en la barra superior. Todo el contenido se filtra por la empresa activa.',
        tips: ['El selector aparece únicamente con el rol ADMIN', 'El cambio de empresa actualiza todos los módulos instantáneamente']
      },
      {
        title: 'Dashboard — punto de partida',
        desc: 'Al entrar siempre aterrizas en el Dashboard. Desde ahí puedes ver el estado general y navegar a cualquier módulo por las alertas activas.',
        tips: ['Las alertas en rojo requieren atención inmediata', 'Los KPI se recalculan en tiempo real']
      },
    ],
    flow: null,
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    color: '#1a4a6b',
    title: 'Dashboard',
    subtitle: 'Vista ejecutiva consolidada',
    steps: [
      {
        title: '¿Qué muestra el Dashboard?',
        desc: 'Consolida los KPI más importantes: incidentes del mes/año, capacitaciones activas, simulacros realizados, puntaje 5S promedio, inventario EPP y alertas activas.',
        tips: ['Los incidentes se cuentan por año calendario', 'Las alertas en rojo requieren atención inmediata']
      },
      {
        title: 'Gráficas disponibles',
        desc: '2 gráficas principales: Incidentes por mes (barras) y Tendencia 5S (líneas).',
        tips: ['Hover sobre las gráficas para ver valores exactos', 'La tendencia 5S muestra los últimos registros por área']
      },
      {
        title: 'Panel de alertas',
        desc: 'Las alertas se generan automáticamente cada 6 horas. Clic en cualquier alerta para marcarla como leída.',
        tips: ['Rojo = vencido / crítico', 'Amarillo = próximo a vencer (≤15 días)', 'Las alertas se regeneran automáticamente']
      },
    ],
    flow: null,
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    color: '#0369a1',
    title: 'Calendario',
    subtitle: 'Vista unificada de todos los vencimientos',
    steps: [
      {
        title: '¿Qué muestra el calendario?',
        desc: 'Consolida en una sola vista los eventos con fecha de vencimiento de los demás módulos: capacitaciones, simulacros, reuniones CMSH y certificaciones de brigadistas.',
        tips: ['Cada tipo de evento tiene un color distinto, visible en la leyenda superior', 'Haz clic en cualquier evento para ver el detalle y saltar directo al módulo correspondiente']
      },
      {
        title: 'Severidad de los eventos',
        desc: 'Cada evento se clasifica automáticamente según qué tan cerca está su fecha: Vencido (ya pasó y sigue sin resolverse), Urgente (≤7 días), Próximo (≤30 días) o Normal.',
        tips: ['Los eventos vencidos se muestran siempre, sin importar el mes que estés viendo, hasta que se resuelvan', 'Las tarjetas de resumen arriba del calendario cuentan el total de eventos por severidad']
      },
      {
        title: 'Capacitaciones sin fecha de vencimiento',
        desc: 'Si un curso no tiene fecha de expiración registrada, el calendario calcula una automáticamente: un año después de la fecha en que se impartió.',
        tips: ['Esta regla solo aplica para graficar el evento; no modifica el registro original de la capacitación']
      },
    ],
    flow: ['Se acerca un vencimiento', 'Aparece en el calendario', 'Severidad se actualiza sola', 'Clic para ir al módulo', 'Resolver el pendiente'],
  },
  {
    id: 'incidents',
    icon: AlertTriangle,
    color: '#dc2626',
    title: 'Incidentes y Accidentes',
    subtitle: 'Reporte y seguimiento de eventos',
    steps: [
      {
        title: 'Registrar un incidente',
        desc: 'Clic en "+ Nuevo incidente". El folio se genera automáticamente (INC-AÑO-NNN). Selecciona tipo (ACCIDENTE, INCIDENTE, CUASI_ACCIDENTE, ENFERMEDAD) y gravedad (LEVE, MODERADO, GRAVE, FATAL).',
        tips: ['Registra el incidente lo más pronto posible, en las primeras 24h', 'Los accidentes GRAVES y FATALES deben reportarse al IMSS']
      },
      {
        title: 'Datos del evento',
        desc: 'Completa: área donde ocurrió, descripción detallada, nombre del lesionado (si aplica), días perdidos y si requirió reporte al IMSS.',
        tips: ['Los días perdidos impactan el KPI del Dashboard', 'El campo "reporte IMSS" es obligatorio para accidentes']
      },
      {
        title: 'Causa raíz y acciones correctivas',
        desc: 'En el detalle del incidente documenta la investigación: causa raíz identificada y acciones correctivas asignadas con responsable y fecha.',
        tips: ['Una buena causa raíz responde al método de los 5 Porqués', 'Las acciones correctivas evitan la recurrencia']
      },
    ],
    flow: ['Ocurre el evento', 'Registrar folio', 'Documentar causa raíz', 'Asignar correctivas', 'Cerrar incidente'],
  },
  {
    id: 'cmsh',
    icon: Users2,
    color: '#7c3aed',
    title: 'CMSH',
    subtitle: 'Comisión Mixta de Seguridad e Higiene',
    steps: [
      {
        title: 'Configurar los miembros',
        desc: 'Registra los integrantes de la Comisión: nombre, cargo, rol CMSH (PRESIDENTE, SECRETARIO, VOCAL) y fecha de vigencia.',
        tips: ['La CMSH debe tener al menos un representante obrero y uno patronal', 'La vigencia típica es de 2 años según la NOM-019-STPS']
      },
      {
        title: 'Registrar actas de reunión',
        desc: 'Crea una nueva acta por cada sesión: fecha, lugar, agenda, acuerdos y lista de asistentes. Las actas son el respaldo legal.',
        tips: ['La CMSH debe reunirse mensualmente (NOM-019-STPS)', 'Si pasan más de 45 días sin acta, se genera una alerta automática']
      },
    ],
    flow: ['Registrar miembros', 'Agendar reunión mensual', 'Registrar acta', 'Documentar acuerdos'],
  },
  {
    id: 'brigades',
    icon: UsersRound,
    color: '#be123c',
    title: 'Brigadas de Emergencia',
    subtitle: 'Primeros auxilios, evacuación y contra incendios',
    steps: [
      {
        title: 'Integrantes por brigada',
        desc: 'Cada empresa cuenta con brigadas fijas (Primeros auxilios, Evacuación, Contra incendios). Agrega integrantes con su rol — jefe, suplente o brigadista — y sus datos de certificación.',
        tips: ['Solo puede haber un jefe de brigada activo por tipo', 'Un mismo colaborador puede pertenecer a más de una brigada']
      },
      {
        title: 'Vigencia de certificaciones',
        desc: 'Registra la fecha de certificación y su vencimiento. El sistema marca en el listado y en el calendario cuando una certificación está por vencer o ya venció.',
        tips: ['Recertifica antes de que la certificación expire para no perder cobertura', 'El estatus de certificación se muestra con un badge de color por integrante']
      },
    ],
    flow: ['Asignar integrantes', 'Registrar certificación', 'Monitorear vigencia', 'Recertificar antes del vencimiento'],
  },
  {
    id: 'training',
    icon: GraduationCap,
    color: '#059669',
    title: 'Capacitación',
    subtitle: 'Programa de formación en SH',
    steps: [
      {
        title: 'Crear una capacitación',
        desc: 'Agrega nombre del curso, instructor, fecha de realización, duración en horas y fecha de vencimiento (si aplica). Puedes adjuntar la constancia en PDF.',
        tips: ['Las capacitaciones sin vencimiento no generan alertas', 'Los cursos con vencimiento ≤20 días aparecen como alerta en el Dashboard']
      },
      {
        title: 'Gestionar participantes',
        desc: 'El campo "participantes" es una lista de nombres. Puedes guardar cuántas personas tomaron el curso para reportes estadísticos.',
        tips: ['El número de capacitaciones del año aparece en el KPI del Dashboard']
      },
    ],
    flow: ['Planear curso', 'Registrar capacitación', 'Agregar participantes', 'Subir constancia', 'Monitorear vencimiento'],
  },
  {
    id: 'drills',
    icon: Siren,
    color: '#d97706',
    title: 'Simulacros',
    subtitle: 'Registro y evaluación de simulacros',
    steps: [
      {
        title: 'Programar un simulacro',
        desc: 'Crea el simulacro con tipo (INCENDIO, SISMO, EVACUACIÓN, DERRAME, MÉDICO), fecha programada y descripción. Queda en estatus PROGRAMADO.',
        tips: ['La NOM-002-STPS exige al menos 2 simulacros anuales de evacuación', 'Un simulacro PENDIENTE por más de 90 días genera alerta']
      },
      {
        title: 'Registrar resultados',
        desc: 'Después del simulacro, actualiza: fecha de realización, tiempo de evacuación en segundos, número de participantes, observaciones y lecciones aprendidas.',
        tips: ['El tiempo de evacuación es un KPI de seguridad clave', 'Las lecciones aprendidas alimentan el plan de mejora']
      },
    ],
    flow: ['Programar simulacro', 'Ejecutar', 'Registrar tiempo y participantes', 'Documentar lecciones'],
  },
  {
    id: 'fiveS',
    icon: FlaskConical,
    color: '#0891b2',
    title: 'Auditorías 5S',
    subtitle: 'Auditorías de orden y limpieza',
    steps: [
      {
        title: 'Realizar una auditoría 5S',
        desc: 'Crea una nueva auditoría: selecciona el área, fecha y evalúa cada S del 1 al 5. El puntaje total (0-100%) se calcula automáticamente.',
        tips: ['1 = Muy deficiente, 5 = Excelente', 'Un puntaje <60% requiere plan de acción inmediato', 'El puntaje aparece en el Dashboard como tendencia']
      },
      {
        title: 'Las 5 dimensiones',
        desc: 'Seiri (Clasificar), Seiton (Ordenar), Seiso (Limpiar), Seiketsu (Estandarizar), Shitsuke (Disciplina). Cada una se evalúa del 1 al 5.',
        tips: ['Registra una auditoría mensual por área para ver la tendencia']
      },
      {
        title: 'Revisar el detalle de una auditoría',
        desc: 'Selecciona una auditoría de la tabla: a la izquierda, debajo de la tabla, aparece la gráfica de radar con las 5 dimensiones; a la derecha se muestra el Plan de acción.',
        tips: ['El Plan de acción incluye, por cada S, el Hallazgo, las Acciones inmediatas y la Mejora', 'Estos tres campos son editables directamente ahí, sin abrir otro formulario, salvo que la dimensión ya tenga calificación 5/5']
      },
    ],
    flow: ['Seleccionar área', 'Evaluar 5 dimensiones (1-5)', 'Puntaje automático', 'Documentar hallazgo y acciones', 'Ver tendencia'],
  },
  {
    id: 'epp',
    icon: HardHat,
    color: '#c2410c',
    title: 'EPP — Equipo de Protección Personal',
    subtitle: 'Inventario, matriz de requerimientos y préstamos',
    steps: [
      {
        title: 'Inventario',
        desc: 'Administra el catálogo de artículos de EPP: stock actual, mínimos y máximos, y su valor mediante costeo FIFO. Los artículos bajo el mínimo se marcan automáticamente como "Bajo stock".',
        tips: ['Registra entradas y salidas desde el detalle de cada artículo', 'También puedes cargar movimientos masivos por CSV']
      },
      {
        title: 'Matriz EPP',
        desc: 'Define qué equipo de protección corresponde a cada puesto o área, como referencia para auditorías y entregas.',
      },
      {
        title: 'Préstamos',
        desc: 'Registra la entrega de EPP a un colaborador y su devolución posterior.',
        tips: ['El botón "+" de la parte superior cambia según la pestaña activa: Inventario, Matriz o Préstamo', 'Solo Admin, Especialista SH y Responsable de área pueden registrar préstamos y movimientos']
      },
    ],
    flow: ['Definir matriz por puesto', 'Registrar entrada a inventario', 'Prestar a colaborador', 'Registrar devolución', 'Reabastecer bajo mínimo'],
  },
];

const ROLES = [
  { role: 'ADMIN', color: '#7c3aed', desc: 'Acceso total. Gestiona empresas y usuarios. Puede ver y editar todos los módulos de todas las empresas.' },
  { role: 'SH_SPECIALIST', color: '#2563eb', desc: 'Acceso completo a todos los módulos de su empresa. Crea, edita y elimina registros.' },
  { role: 'AREA_MANAGER', color: '#059669', desc: 'Puede ver todos los módulos y crear/editar registros — incluyendo Simulacros, 5S y EPP. No puede eliminar registros ni acceder a administración.' },
  { role: 'AUDITOR', color: '#d97706', desc: 'Solo lectura en todos los módulos.' },
  { role: 'EXECUTIVE', color: '#9333ea', desc: 'Solo lectura. Acceso al Dashboard y reportes consolidados.' },
];

const INFO_FLOW = [
  { from: 'Incidentes', to: 'Dashboard', desc: 'KPIs incidentes' },
  { from: 'Capacitación', to: 'Dashboard', desc: 'Alertas vencimiento' },
  { from: 'Simulacros', to: 'Dashboard', desc: 'Tasa simulacros' },
  { from: '5S', to: 'Dashboard', desc: 'Puntaje promedio' },
  { from: 'CMSH', to: 'Alertas', desc: 'Reuniones faltantes' },
];

/* ─── Componente principal ─────────────────────────────── */
export default function GuidePage() {
  const [activeModule, setActiveModule] = useState('start');
  const [expandedSteps, setExpandedSteps] = useState({});

  const current = MODULES.find(m => m.id === activeModule);

  const toggleStep = (idx) => {
    setExpandedSteps(prev => ({ ...prev, [`${activeModule}-${idx}`]: !prev[`${activeModule}-${idx}`] }));
  };

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar de módulos */}
      <aside
        className="w-64 flex-shrink-0 border-r overflow-y-auto"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Guía de uso
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Selecciona un módulo</p>
        </div>
        <nav className="p-2">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setExpandedSteps({}); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5"
                style={{
                  background: isActive ? `${mod.color}15` : 'transparent',
                  borderLeft: isActive ? `3px solid ${mod.color}` : '3px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? mod.color : 'var(--color-text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: isActive ? mod.color : 'var(--color-text-secondary)' }}>
                  {mod.title}
                </span>
              </button>
            );
          })}

          <div className="px-3 pt-4 pb-1">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Referencia
            </p>
          </div>
          <button
            onClick={() => setActiveModule('roles')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5"
            style={{
              background: activeModule === 'roles' ? '#1a4a6b15' : 'transparent',
              borderLeft: activeModule === 'roles' ? '3px solid #1a4a6b' : '3px solid transparent',
            }}
          >
            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: activeModule === 'roles' ? '#1a4a6b' : 'var(--color-text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: activeModule === 'roles' ? '#1a4a6b' : 'var(--color-text-secondary)' }}>
              Roles y permisos
            </span>
          </button>
          <button
            onClick={() => setActiveModule('flow')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
            style={{
              background: activeModule === 'flow' ? '#1a4a6b15' : 'transparent',
              borderLeft: activeModule === 'flow' ? '3px solid #1a4a6b' : '3px solid transparent',
            }}
          >
            <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: activeModule === 'flow' ? '#1a4a6b' : 'var(--color-text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: activeModule === 'flow' ? '#1a4a6b' : 'var(--color-text-secondary)' }}>
              Flujo de información
            </span>
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">

          {/* Roles view */}
          {activeModule === 'roles' && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1a4a6b20' }}>
                    <Lock className="w-5 h-5" style={{ color: '#1a4a6b' }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                      Roles y permisos
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Control de acceso basado en roles (RBAC)
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {ROLES.map(r => (
                  <div key={r.role} className="rounded-xl p-5 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                        style={{ background: `${r.color}20`, color: r.color }}
                      >
                        {r.role}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{r.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl p-5 border" style={{ background: '#fef9c3', borderColor: '#fde047' }}>
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">Asignación de roles</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Solo el <strong>ADMIN</strong> puede crear usuarios y asignar roles desde el módulo
                      <strong> Administración → Usuarios</strong>. Cada usuario solo puede pertenecer a una empresa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flow view */}
          {activeModule === 'flow' && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1a4a6b20' }}>
                    <GitBranch className="w-5 h-5" style={{ color: '#1a4a6b' }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                      Flujo de información
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Cómo se conectan los módulos entre sí
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagrama central */}
              <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="flex flex-col items-center">
                  {/* Dashboard centro */}
                  <div
                    className="rounded-2xl px-8 py-4 text-center mb-6 shadow-lg"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    <LayoutDashboard className="w-6 h-6 mx-auto mb-1" />
                    <p className="font-bold text-sm">Dashboard</p>
                    <p className="text-white/70 text-xs">Consolida todo</p>
                  </div>

                  {/* Módulos que alimentan al dashboard */}
                  <div className="grid grid-cols-2 gap-3 w-full mb-6">
                    {[
                      { label: 'Incidentes', desc: 'KPIs y días perdidos', color: '#dc2626', Icon: AlertTriangle },
                      { label: 'Capacitación', desc: 'Cursos y vencimientos', color: '#059669', Icon: GraduationCap },
                      { label: 'Simulacros', desc: 'Tasa de ejecución', color: '#d97706', Icon: Siren },
                      { label: '5S', desc: 'Puntaje y tendencia', color: '#0891b2', Icon: FlaskConical },
                    ].map(({ label, desc, color, Icon }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 border text-center"
                        style={{ borderColor: `${color}40`, background: `${color}08` }}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
                        <div className="flex justify-center mt-1.5">
                          <ArrowRight className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Relaciones entre módulos */}
              <h3 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Relaciones entre módulos
              </h3>
              <div className="space-y-2">
                {INFO_FLOW.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 border"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <span className="font-semibold text-sm w-32 flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                      {f.from}
                    </span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="font-semibold text-sm w-32 flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                      {f.to}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                      {f.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Flujo recomendado */}
              <div className="mt-6 rounded-xl p-5 border" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                <div className="flex gap-2">
                  <Star className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Orden recomendado de configuración inicial</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['1. Empresa', '2. Usuarios', '3. CMSH', '4. Capacitación', '5. Simulacros', '6. 5S y EPP'].map(s => (
                        <span key={s} className="text-xs px-2 py-1 rounded-md font-medium text-green-800" style={{ background: '#bbf7d0' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Los módulos de Brigadas, Simulacros y 5S se alimentan durante la operación normal del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module view */}
          {current && activeModule !== 'roles' && activeModule !== 'flow' && (
            <div>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${current.color}20` }}
                  >
                    <current.icon className="w-6 h-6" style={{ color: current.color }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                      {current.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{current.subtitle}</p>
                  </div>
                </div>

                {/* Flujo visual del módulo */}
                {current.flow && (
                  <div
                    className="flex items-center gap-2 flex-wrap rounded-xl p-4 mt-4"
                    style={{ background: `${current.color}08`, border: `1px solid ${current.color}25` }}
                  >
                    <Zap className="w-4 h-4 flex-shrink-0" style={{ color: current.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: current.color }}>Flujo:</span>
                    {current.flow.map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: `${current.color}15`, color: current.color }}
                        >
                          {step}
                        </span>
                        {i < current.flow.length - 1 && (
                          <ChevronRight className="w-3 h-3" style={{ color: current.color }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pasos acordeón */}
              <div className="space-y-3">
                {current.steps.map((step, idx) => {
                  const key = `${activeModule}-${idx}`;
                  const isOpen = expandedSteps[key] !== false; // abierto por defecto
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border overflow-hidden"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    >
                      <button
                        className="w-full flex items-center gap-4 px-5 py-4 text-left"
                        onClick={() => toggleStep(idx)}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{ background: `${current.color}20`, color: current.color }}
                        >
                          {idx + 1}
                        </div>
                        <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {step.title}
                        </span>
                        {isOpen
                          ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          : <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        }
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                          <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {step.desc}
                          </p>
                          {step.tips?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {step.tips.map((tip, ti) => (
                                <div key={ti} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: current.color }} />
                                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{tip}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Acciones rápidas reference */}
              <div
                className="mt-8 rounded-xl p-5 border"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Acciones comunes en este módulo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: PlusCircle, label: 'Crear nuevo registro' },
                    { icon: Search, label: 'Buscar por texto' },
                    { icon: Filter, label: 'Filtrar por estatus' },
                    { icon: Eye, label: 'Ver detalle' },
                    { icon: Edit2, label: 'Editar registro' },
                    { icon: Upload, label: 'Adjuntar evidencias' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: current.color }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navegación entre módulos */}
              <div className="flex justify-between mt-8">
                {MODULES.indexOf(current) > 0 && (
                  <button
                    onClick={() => setActiveModule(MODULES[MODULES.indexOf(current) - 1].id)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    {MODULES[MODULES.indexOf(current) - 1].title}
                  </button>
                )}
                <div className="flex-1" />
                {MODULES.indexOf(current) < MODULES.length - 1 && (
                  <button
                    onClick={() => setActiveModule(MODULES[MODULES.indexOf(current) + 1].id)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    {MODULES[MODULES.indexOf(current) + 1].title}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
