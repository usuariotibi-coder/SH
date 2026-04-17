require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { fakerES: faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFrom = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const weeksAgo = (w) => daysAgo(w * 7);

const calcFiveSScore = (s1, s2, s3, s4, s5) =>
  Math.round(((s1 + s2 + s3 + s4 + s5) / 25) * 100 * 10) / 10;

const placeholder = (n) => ({
  fileUrl: `https://res.cloudinary.com/demo/image/upload/v1/sh-evidencias/evidencia-${n}.jpg`,
  publicId: `sh-evidencias/evidencia-${n}`,
});

const mexicanNames = (count) =>
  Array.from({ length: count }, () => `${faker.person.firstName()} ${faker.person.lastName()} ${faker.person.lastName()}`);

const year = new Date().getFullYear();
let incidentCounter = 0;
const nextFolio = () => `INC-${year}-${String(++incidentCounter).padStart(3, '0')}`;

// ─── Limpieza en orden inverso de FK ─────────────────────────────────────────

async function cleanDB() {
  await prisma.alert.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.cMSHMeeting.deleteMany();
  await prisma.cMSHMember.deleteMany();
  await prisma.training.deleteMany();
  await prisma.drill.deleteMany();
  await prisma.fiveS.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.sHProgram.deleteMany();
  await prisma.brigadeMember.deleteMany();
  await prisma.brigade.deleteMany();
  // v1.6 new models
  await prisma.hazmatEvidence.deleteMany();
  await prisma.hazmatDisposal.deleteMany();
  await prisma.chemicalFile.deleteMany();
  await prisma.chemicalProduct.deleteMany();
  await prisma.eppMovement.deleteMany();
  await prisma.eppAreaRequirement.deleteMany();
  await prisma.eppItem.deleteMany();
  await prisma.supplierDocument.deleteMany();
  await prisma.supplierAccessToken.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  console.log('🗑  Base de datos limpiada');
}

// ─── Empresas ─────────────────────────────────────────────────────────────────

async function createCompanies() {
  const c1 = await prisma.company.create({
    data: {
      name: 'Manufacturas del Norte S.A. de C.V.',
      rfc: 'MNO850312AB1',
      address: 'Parque Industrial Monterrey, Av. Industrial 450, Apodaca, N.L.',
      industry: 'Manufactura metalmecánica',
    },
  });
  const c2 = await prisma.company.create({
    data: {
      name: 'Constructora Edificar S.A. de C.V.',
      rfc: 'CED920601CD3',
      address: 'Blvd. Tecnológico 200, Guadalajara, Jal.',
      industry: 'Construcción',
    },
  });
  const c3 = await prisma.company.create({
    data: {
      name: 'Servicios Corporativos Nexo S.C.',
      rfc: 'SCN010815EF5',
      address: 'Torre Reforma 265, Piso 14, CDMX',
      industry: 'Servicios corporativos',
    },
  });
  return { c1, c2, c3 };
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

async function createUsers(c1Id, c2Id, c3Id) {
  const hash = async (p) => bcrypt.hash(p, 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@sh-app.mx', name: 'Administrador del Sistema', password: await hash('Admin1234!'), role: 'ADMIN', companyId: c1Id },
  });
  const esp1 = await prisma.user.create({
    data: { email: 'especialista@sh-app.mx', name: 'Lic. Carmen Ruiz Torres', password: await hash('Especialista1!'), role: 'SH_SPECIALIST', area: 'Seguridad e Higiene', companyId: c1Id },
  });
  await prisma.user.create({
    data: { email: 'gerente.produccion@sh-app.mx', name: 'Ing. Luis Martínez Ortega', password: await hash('Gerente1234!'), role: 'AREA_MANAGER', area: 'Producción', companyId: c1Id },
  });
  await prisma.user.create({
    data: { email: 'gerente.mantenimiento@sh-app.mx', name: 'Ing. Ricardo Torres Vega', password: await hash('Gerente1234!'), role: 'AREA_MANAGER', area: 'Mantenimiento', companyId: c1Id },
  });
  await prisma.user.create({
    data: { email: 'auditor@sh-app.mx', name: 'Lic. Patricia Morales Soto', password: await hash('Auditor1234!'), role: 'AUDITOR', companyId: c1Id },
  });
  await prisma.user.create({
    data: { email: 'direccion@sh-app.mx', name: 'Ing. Roberto Salinas Mendoza', password: await hash('Direccion1!'), role: 'EXECUTIVE', area: 'Dirección General', companyId: c1Id },
  });

  // Empresa 2
  const esp2 = await prisma.user.create({
    data: { email: 'especialista@edificar.mx', name: faker.person.fullName(), password: await hash('Password1234!'), role: 'SH_SPECIALIST', area: 'Seguridad e Higiene', companyId: c2Id },
  });
  await prisma.user.create({
    data: { email: 'area@edificar.mx', name: faker.person.fullName(), password: await hash('Password1234!'), role: 'AREA_MANAGER', area: 'Obra', companyId: c2Id },
  });

  // Empresa 3
  const esp3 = await prisma.user.create({
    data: { email: 'especialista@nexo.mx', name: faker.person.fullName(), password: await hash('Password1234!'), role: 'SH_SPECIALIST', area: 'Seguridad e Higiene', companyId: c3Id },
  });
  await prisma.user.create({
    data: { email: 'area@nexo.mx', name: faker.person.fullName(), password: await hash('Password1234!'), role: 'AREA_MANAGER', area: 'Operaciones', companyId: c3Id },
  });

  return { admin, esp1, esp2, esp3 };
}

// ─── Requerimientos empresa 1 ─────────────────────────────────────────────────

const NORM_INFO = {
  'NOM-017-STPS-2008': {
    normName: 'Norma Oficial Mexicana NOM-017-STPS-2008, Equipo de protección personal — Selección, uso y manejo en los centros de trabajo.',
    normObjective: 'Establecer los requisitos mínimos para que los patrones seleccionen, adquieran y proporcionen a sus trabajadores el equipo de protección personal correspondiente para protegerlos de los agentes del medio ambiente de trabajo que puedan dañar su integridad física y su salud.',
    applicabilityJustification: 'La empresa realiza procesos de manufactura metalmecánica que incluyen maquinado, soldadura, esmerilado y manejo de materiales, actividades que exponen al personal a riesgos de proyección de partículas, ruido, sustancias químicas y esfuerzo físico.',
    applicabilityScope: 'Aplica a todos los trabajadores del área de producción, mantenimiento y almacén. Incluye personal de planta, supervisores y contratistas que realicen actividades dentro de las instalaciones.',
  },
  'NOM-019-STPS-2011': {
    normName: 'Norma Oficial Mexicana NOM-019-STPS-2011, Constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene.',
    normObjective: 'Establecer los requerimientos para la constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene en los centros de trabajo, con el fin de identificar las causas de los accidentes y enfermedades de trabajo y proponer medidas preventivas.',
    applicabilityJustification: 'Todo centro de trabajo con más de un trabajador está obligado a conformar una Comisión Mixta de Seguridad e Higiene conforme a lo dispuesto por el artículo 509 de la Ley Federal del Trabajo.',
    applicabilityScope: 'Aplica a la totalidad de la plantilla laboral y a todos los niveles jerárquicos de la organización. El comité estará integrado por representantes del patrón y de los trabajadores.',
  },
  'NOM-002-STPS-2010': {
    normName: 'Norma Oficial Mexicana NOM-002-STPS-2010, Condiciones de seguridad — Prevención y protección contra incendios en los centros de trabajo.',
    normObjective: 'Establecer las condiciones de seguridad para la prevención y protección contra incendios en los centros de trabajo, a fin de reducir los riesgos de un incendio, su propagación y las lesiones o daños que puedan causar a los trabajadores.',
    applicabilityJustification: 'El centro de trabajo cuenta con procesos productivos que utilizan materiales inflamables, equipos eléctricos industriales y almacenamiento de sustancias que representan riesgo de incendio.',
    applicabilityScope: 'Aplica a todas las áreas de la empresa: producción, almacén, oficinas administrativas y zonas de carga y descarga. Incluye a todo el personal permanente, temporal y subcontratado.',
  },
  'NOM-035-STPS-2018': {
    normName: 'Norma Oficial Mexicana NOM-035-STPS-2018, Factores de riesgo psicosocial en el trabajo — Identificación, análisis y prevención.',
    normObjective: 'Establecer los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial, así como para promover un entorno organizacional favorable en los centros de trabajo.',
    applicabilityJustification: 'La norma es de aplicación obligatoria para todos los centros de trabajo del territorio nacional, independientemente de la actividad económica o número de trabajadores, con los requisitos diferenciados según el número de empleados.',
    applicabilityScope: 'Aplica a la totalidad del personal de la empresa. Para centros de trabajo con más de 50 trabajadores se requiere evaluación del entorno organizacional. Las acciones preventivas involucran a todos los niveles jerárquicos.',
  },
  'NOM-004-STPS-1999': {
    normName: 'Norma Oficial Mexicana NOM-004-STPS-1999, Sistemas de protección y dispositivos de seguridad en la maquinaria y equipo que se utilice en los centros de trabajo.',
    normObjective: 'Establecer las condiciones de seguridad y los sistemas de protección y dispositivos que deberá tener la maquinaria y equipo del centro de trabajo, para evitar accidentes a los trabajadores que los operen o realicen labores de mantenimiento.',
    applicabilityJustification: 'La empresa opera maquinaria de manufactura metalmecánica (tornos, fresadoras, prensas, sierras) que representa riesgo de atrapamiento, corte y aplastamiento para los operadores.',
    applicabilityScope: 'Aplica a toda la maquinaria y equipo instalado en el área de producción y taller de mantenimiento. Incluye operadores, mecánicos de mantenimiento y supervisores de área.',
  },
};

const REQS_C1 = [
  { code: 'NOM-017-STPS-2008', name: 'Equipo de Protección Personal', status: 'COMPLETED', daysOffset: -90, area: 'Producción', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-026-STPS-2008', name: 'Colores y señales de seguridad', status: 'COMPLETED', daysOffset: -80, area: 'General', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-019-STPS-2011', name: 'Comisión Mixta de Seguridad e Higiene', status: 'COMPLETED', daysOffset: -75, area: 'General', responsibleArea: 'Dirección General' },
  { code: 'NOM-025-STPS-2008', name: 'Condiciones de iluminación', status: 'COMPLETED', daysOffset: -60, area: 'Producción', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-035-STPS-2018', name: 'Factores de riesgo psicosocial', status: 'COMPLETED', daysOffset: -45, area: 'General', responsibleArea: 'Recursos Humanos' },
  { code: 'NOM-030-STPS-2009', name: 'Servicios preventivos de SH', status: 'COMPLETED', daysOffset: -30, area: 'General', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-002-STPS-2010', name: 'Prevención y protección contra incendios', status: 'IN_PROGRESS', daysOffset: 30, area: 'General', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-004-STPS-1999', name: 'Protección en maquinaria y equipo', status: 'IN_PROGRESS', daysOffset: 45, area: 'Producción', responsibleArea: 'Producción' },
  { code: 'NOM-011-STPS-2001', name: 'Ruido', status: 'IN_PROGRESS', daysOffset: 60, area: 'Producción', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-022-STPS-2015', name: 'Electricidad estática', status: 'IN_PROGRESS', daysOffset: 45, area: 'Producción', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-018-STPS-2015', name: 'Sistema armonizado SGA (HAZMAT)', status: 'IN_PROGRESS', daysOffset: 50, area: 'Almacén', responsibleArea: 'Almacén' },
  { code: 'NOM-001-STPS-2008', name: 'Edificios e instalaciones', status: 'PENDING', daysOffset: 90, area: 'General', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-006-STPS-2014', name: 'Manejo y almacenamiento de materiales', status: 'PENDING', daysOffset: 75, area: 'Almacén', responsibleArea: 'Almacén' },
  { code: 'NOM-029-STPS-2011', name: 'Instalaciones eléctricas en mantenimiento', status: 'PENDING', daysOffset: 60, area: 'Mantenimiento', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-033-STPS-2015', name: 'Espacios confinados', status: 'PENDING', daysOffset: 45, area: 'Mantenimiento', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-010-STPS-2014', name: 'Agentes químicos contaminantes', status: 'OVERDUE', daysOffset: -30, area: 'Producción', responsibleArea: 'Seguridad e Higiene' },
  { code: 'NOM-009-STPS-2011', name: 'Trabajos en altura', status: 'OVERDUE', daysOffset: -15, area: 'Mantenimiento', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-020-STPS-2011', name: 'Recipientes a presión', status: 'OVERDUE', daysOffset: -7, area: 'Producción', responsibleArea: 'Mantenimiento' },
  { code: 'NOM-023-STPS-2012', name: 'Trabajos en minas', status: 'NOT_APPLICABLE', daysOffset: null, area: null, responsibleArea: null },
  { code: 'NOM-016-STPS-2001', name: 'Ferrocarriles', status: 'NOT_APPLICABLE', daysOffset: null, area: null, responsibleArea: null },
];

async function createRequirementsC1(companyId, userId) {
  const created = [];
  let evidenceIdx = 1;

  for (let i = 0; i < REQS_C1.length; i++) {
    const r = REQS_C1[i];
    const req = await prisma.requirement.create({
      data: {
        code: r.code,
        name: r.name,
        specificRequirement: `Cumplimiento de ${r.code}: ${r.name}. Aplica a todas las instalaciones y actividades relacionadas del centro de trabajo.`,
        ...(NORM_INFO[r.code] || {}),
        legalSource: 'NOM',
        legalBasis: `Artículos 5, 8 y 17. Anexo de verificación.`,
        area: r.area,
        status: r.status,
        dueDate: r.daysOffset !== null ? (r.daysOffset < 0 ? daysAgo(Math.abs(r.daysOffset)) : daysFrom(r.daysOffset)) : null,
        completedAt: r.status === 'COMPLETED' ? daysAgo(Math.abs(r.daysOffset) - 5) : null,
        responsibleArea: r.responsibleArea,
        notes: r.status === 'OVERDUE' ? 'Requiere atención inmediata. Programar visita de verificación.' : null,
        companyId,
        createdById: userId,
      },
    });

    // Actividades
    if (['COMPLETED', 'IN_PROGRESS', 'OVERDUE'].includes(r.status)) {
      const actCount = r.status === 'COMPLETED' ? 3 : r.status === 'OVERDUE' ? 2 : 3;
      for (let a = 0; a < actCount; a++) {
        const isDone = r.status === 'COMPLETED' || (r.status === 'IN_PROGRESS' && a < 1) || (r.status === 'OVERDUE' && a < 1);
        const activityStatus = isDone ? 'COMPLETED' : (r.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING');
        await prisma.activity.create({
          data: {
            description: [
              'Revisión y actualización del programa de cumplimiento normativo',
              'Capacitación al personal de área sobre requisitos de la NOM',
              'Verificación física de instalaciones y equipos según lista de verificación',
              'Elaboración y entrega de evidencias documentales requeridas',
            ][a % 4],
            responsible: [
              'Ing. Torres / Seguridad e Higiene',
              'Gerente de Área / Producción',
              'Supervisor SH / Operaciones',
              'Especialista SH',
            ][a % 4],
            dueDate: r.daysOffset !== null ? (r.daysOffset < 0 ? daysAgo(Math.abs(r.daysOffset) + (3 - a) * 10) : daysFrom(r.daysOffset - a * 10)) : daysAgo(30),
            completedAt: isDone ? daysAgo(Math.abs(r.daysOffset !== null ? r.daysOffset : 20) + 2) : null,
            activityStatus,
            requirementId: req.id,
            userId,
          },
        });
      }
    }

    // Evidencias placeholder para COMPLETED y OVERDUE
    if (['COMPLETED', 'OVERDUE'].includes(r.status)) {
      const evCount = r.status === 'COMPLETED' ? 3 : 2;
      for (let e = 0; e < evCount; e++) {
        const p = placeholder(evidenceIdx++);
        await prisma.evidence.create({
          data: {
            fileName: `evidencia-${r.code.replace(/\s/g, '_')}-${e + 1}.jpg`,
            fileUrl: p.fileUrl,
            publicId: p.publicId,
            fileType: e < 2 ? 'PHOTO' : 'PDF',
            fileSizeKb: faker.number.int({ min: 150, max: 2000 }),
            description: `Evidencia ${e + 1} — ${r.name}`,
            requirementId: req.id,
          },
        });
      }
    }

    created.push(req);
  }
  return created;
}

// ─── Incidentes empresa 1 ─────────────────────────────────────────────────────

const INCIDENTS_DEF = [
  // Accidentes
  { type: 'ACCIDENT', severity: 'MINOR', area: 'Producción', daysAgoVal: 155, isClosed: true, lostDays: 2, isReportedIMSS: false },
  { type: 'ACCIDENT', severity: 'MINOR', area: 'Almacén', daysAgoVal: 120, isClosed: true, lostDays: 1, isReportedIMSS: false },
  { type: 'ACCIDENT', severity: 'MODERATE', area: 'Mantenimiento', daysAgoVal: 90, isClosed: true, lostDays: 5, isReportedIMSS: true, imssReportNo: 'ST7-2024-0452' },
  { type: 'ACCIDENT', severity: 'SERIOUS', area: 'Producción', daysAgoVal: 60, isClosed: true, lostDays: 21, isReportedIMSS: true, imssReportNo: 'ST7-2024-0891' },
  // Incidentes
  { type: 'INCIDENT', severity: 'MINOR', area: 'Producción', daysAgoVal: 140, isClosed: true, lostDays: 0 },
  { type: 'INCIDENT', severity: 'MINOR', area: 'Oficinas', daysAgoVal: 110, isClosed: true, lostDays: 0 },
  { type: 'INCIDENT', severity: 'MINOR', area: 'Almacén', daysAgoVal: 80, isClosed: true, lostDays: 0 },
  { type: 'INCIDENT', severity: 'MINOR', area: 'Mantenimiento', daysAgoVal: 50, isClosed: false, lostDays: 0 },
  { type: 'INCIDENT', severity: 'MINOR', area: 'Producción', daysAgoVal: 20, isClosed: false, lostDays: 0 },
  // Casi accidentes
  { type: 'NEAR_MISS', severity: 'MINOR', area: 'Producción', daysAgoVal: 100, isClosed: true, lostDays: 0 },
  { type: 'NEAR_MISS', severity: 'MINOR', area: 'Almacén', daysAgoVal: 70, isClosed: true, lostDays: 0 },
  { type: 'NEAR_MISS', severity: 'MINOR', area: 'Mantenimiento', daysAgoVal: 15, isClosed: false, lostDays: 0 },
];

const ROOT_CAUSES = [
  'Falta de uso de EPP adecuado al realizar operación de maquinaria. No se siguió el procedimiento de trabajo seguro establecido.',
  'Piso húmedo sin señalización preventiva en área de lavado. La actividad de limpieza no fue comunicada a los operadores del área.',
  'Trabajador no siguió procedimiento de bloqueo de energía (LOTO) durante intervención de mantenimiento en equipo.',
  'Manejo manual de carga con postura incorrecta y sin capacitación previa en técnicas de manejo seguro de materiales.',
  'Herramienta manual en mal estado causó resbalón durante operación. Falta de inspección previa de herramientas.',
];

async function createIncidentsC1(companyId, userId) {
  for (let i = 0; i < INCIDENTS_DEF.length; i++) {
    const def = INCIDENTS_DEF[i];
    await prisma.incident.create({
      data: {
        folio: nextFolio(),
        type: def.type,
        severity: def.severity,
        occurredAt: daysAgo(def.daysAgoVal),
        area: def.area,
        description: `${def.type === 'ACCIDENT' ? 'Accidente laboral' : def.type === 'NEAR_MISS' ? 'Casi accidente' : 'Incidente'} registrado en área de ${def.area}. ${faker.lorem.sentence()}`,
        injuredName: def.type === 'ACCIDENT' ? `${faker.person.firstName()} ${faker.person.lastName()}` : null,
        injuredPosition: def.type === 'ACCIDENT' ? faker.person.jobTitle() : null,
        rootCause: ROOT_CAUSES[i % ROOT_CAUSES.length],
        correctiveAction: def.isClosed ? `Implementación de ${faker.lorem.words(4)}. Capacitación al personal del área afectada. Revisión y actualización del procedimiento de trabajo.` : null,
        imssReportNo: def.imssReportNo || null,
        lostDays: def.lostDays || 0,
        isReportedIMSS: def.isReportedIMSS || false,
        isClosed: def.isClosed,
        closedAt: def.isClosed ? daysAgo(def.daysAgoVal - 15) : null,
        companyId,
        createdById: userId,
      },
    });
  }
}

// ─── CMSH empresa 1 ───────────────────────────────────────────────────────────

async function createCMSHC1(companyId) {
  const startDate = daysAgo(365);

  await prisma.cMSHMember.createMany({
    data: [
      { name: 'Ing. Roberto Salinas Mendoza', position: 'Gerente de Operaciones', cmshRole: 'PRESIDENT', email: 'r.salinas@mfn.mx', phone: '81-1234-5601', startDate, isActive: true, companyId },
      { name: 'Lic. Carmen Ruiz Torres', position: 'Especialista en SH', cmshRole: 'SECRETARY', email: 'c.ruiz@mfn.mx', phone: '81-1234-5602', startDate, isActive: true, companyId },
      { name: 'Sr. Juan Pérez Hernández', position: 'Operador de máquina CNC', cmshRole: 'WORKER_REP', email: 'j.perez@mfn.mx', phone: '81-1234-5603', startDate, isActive: true, companyId },
      { name: 'Sra. María González López', position: 'Técnica de mantenimiento', cmshRole: 'WORKER_REP', email: 'm.gonzalez@mfn.mx', phone: '81-1234-5604', startDate, isActive: true, companyId },
      { name: 'Ing. Luis Martínez Ortega', position: 'Jefe de Producción', cmshRole: 'EMPLOYER_REP', email: 'l.martinez@mfn.mx', phone: '81-1234-5605', startDate, isActive: true, companyId },
    ],
  });

  const agendas = [
    'Revisión de incidentes del mes anterior. Seguimiento a acciones correctivas pendientes. Revisión de programa de capacitación. Recorrido de verificación en área de producción.',
    'Análisis de estadísticas de accidentabilidad Q1. Presentación de resultados de auditoría 5S. Aprobación del programa de simulacros. Revisión de mantenimientos preventivos vencidos.',
    'Evaluación del cumplimiento de NOMs. Seguimiento a hallazgos de auditoría interna. Revisión de riesgos identificados en área de almacén. Informe de capacitaciones realizadas.',
    'Revisión de indicadores SH del trimestre. Planificación de simulacro combinado Q3. Presentación de nuevos riesgos identificados. Actualización de integrantes y vigencias de la comisión.',
    'Análisis de incidente grave ocurrido el mes anterior. Plan de acción correctiva y preventiva. Revisión de EPP: inventario y estado. Seguimiento al programa anual SH.',
    'Revisión de avance del Programa SH anual. Planeación de capacitaciones Q4. Recorrido de inspección área Mantenimiento. Cierre de acciones correctivas pendientes.',
  ];

  const agreements = [
    'Acuerdo 1: Realizar inspección de extintores antes del 15 del próximo mes. Responsable: Ing. Salinas. Acuerdo 2: Completar capacitación NOM-017 para todos los operadores. Responsable: Lic. Ruiz.',
    'Acuerdo 1: Implementar señalización en área de almacén. Responsable: Sr. Pérez. Acuerdo 2: Solicitar cotización de EPP faltante. Responsable: Lic. Ruiz. Acuerdo 3: Programar simulacro para el mes siguiente.',
    'Acuerdo 1: Actualizar etiquetado SGA en recipientes de sustancias peligrosas. Responsable: Sra. González. Acuerdo 2: Cerrar hallazgos de auditoría con 3+ meses de antigüedad. Responsable: Ing. Martínez.',
    'Acuerdo 1: Actualizar procedimiento LOTO con nuevos equipos instalados. Responsable: Ing. Martínez. Acuerdo 2: Coordinar evaluación médica ocupacional. Responsable: Lic. Ruiz.',
    'Acuerdo 1: Instalar barandal en plataforma de carga 2do nivel. Responsable: Ing. Salinas. Plazo: 30 días. Acuerdo 2: Suspender temporalmente trabajos en altura hasta nueva capacitación.',
    'Acuerdo 1: Programar auditoría externa para Q1 del próximo año. Acuerdo 2: Presentar informe final del PSH a Dirección antes del 31 de diciembre. Responsable: Lic. Ruiz.',
  ];

  for (let m = 5; m >= 0; m--) {
    const meetDate = daysAgo(m * 30 + 5);
    await prisma.cMSHMeeting.create({
      data: {
        meetingDate: meetDate,
        location: 'Sala de juntas SH — Planta Principal',
        agenda: agendas[5 - m],
        agreements: agreements[5 - m],
        attendees: JSON.stringify(['Ing. Roberto Salinas Mendoza', 'Lic. Carmen Ruiz Torres', 'Sr. Juan Pérez Hernández', 'Sra. María González López', 'Ing. Luis Martínez Ortega']),
        nextMeeting: daysAgo(m * 30 - 25),
        companyId,
      },
    });
  }
}

// ─── Capacitaciones empresa 1 ─────────────────────────────────────────────────

const TRAININGS_DEF = [
  { name: 'Uso y mantenimiento de EPP', norm: 'NOM-017-STPS-2008', hours: 2, count: 25, daysAgoVal: 150, expiryDays: 210 },
  { name: 'Manejo de materiales peligrosos y SGA', norm: 'NOM-018-STPS-2015', hours: 4, count: 18, daysAgoVal: 120, expiryDays: 240 },
  { name: 'Prevención y combate de incendios', norm: 'NOM-002-STPS-2010', hours: 3, count: 30, daysAgoVal: 90, expiryDays: 275 },
  { name: 'Primeros auxilios', norm: null, hours: 8, count: 12, daysAgoVal: 90, expiryDays: 20 }, // próxima a vencer
  { name: 'Trabajo en alturas', norm: 'NOM-009-STPS-2011', hours: 6, count: 8, daysAgoVal: 60, expiryDays: 305 },
  { name: 'Electricidad estática e instalaciones eléctricas', norm: 'NOM-022-STPS-2015 / NOM-029-STPS-2011', hours: 3, count: 15, daysAgoVal: 60, expiryDays: null },
  { name: 'Factores de riesgo psicosocial', norm: 'NOM-035-STPS-2018', hours: 4, count: 45, daysAgoVal: 30, expiryDays: null },
  { name: 'Ergonomía y manejo manual de cargas', norm: 'NOM-036-1-STPS-2018', hours: 3, count: 20, daysAgoVal: 30, expiryDays: null },
  { name: 'Espacios confinados', norm: 'NOM-033-STPS-2015', hours: 8, count: 6, daysAgoVal: 21, expiryDays: null },
  { name: 'Inducción SH para personal nuevo', norm: 'NOM-019, NOM-017, NOM-026', hours: 2, count: 8, daysAgoVal: 7, expiryDays: 10 }, // vence en 10 días
];

async function createTrainingsC1(companyId, userId) {
  for (const t of TRAININGS_DEF) {
    await prisma.training.create({
      data: {
        name: t.name,
        description: `Capacitación sobre ${t.name}. Aplica a trabajadores con exposición directa al riesgo asociado.`,
        instructor: faker.helpers.arrayElement(['Consultoría SH México S.C.', 'IMSS — Servicio de Salud en el Trabajo', 'Inst. Tecnológico de Monterrey', 'Lic. Carmen Ruiz Torres']),
        trainingDate: daysAgo(t.daysAgoVal),
        durationHours: t.hours,
        location: faker.helpers.arrayElement(['Sala de capacitación A', 'Auditorio planta', 'Área de producción', 'Sala de juntas principal']),
        normReference: t.norm,
        participants: JSON.stringify(mexicanNames(Math.min(t.count, 8))),
        participantCount: t.count,
        expirationDate: t.expiryDays ? daysFrom(t.expiryDays) : null,
        isCompleted: true,
        companyId,
        createdById: userId,
      },
    });
  }
}

// ─── Simulacros empresa 1 ─────────────────────────────────────────────────────

const DRILLS_DEF = [
  { type: 'FIRE', planned: 150, executed: 148, participants: 180, evTime: 275, obs: 'Tiempo de evacuación dentro del parámetro objetivo (< 5 min). Se detectaron 2 brigadistas sin identificación visible. Área de conteo con congestionamiento.', correctives: 'Identificación de brigadistas renovada. Se amplió área de punto de reunión para evitar congestionamiento.' },
  { type: 'EARTHQUAKE', planned: 120, executed: 118, participants: 180, evTime: 310, obs: 'El tiempo superó el objetivo por 10 segundos. Una puerta de emergencia en almacén presentó dificultad para abrirse. Personal de turno nocturno no contabilizado en el ejercicio.', correctives: 'Mantenimiento correctivo a puerta de emergencia almacén. Se incorporó al turno nocturno en el siguiente ejercicio.' },
  { type: 'CHEMICAL_SPILL', planned: 90, executed: 88, participants: 45, evTime: 500, obs: 'Brigada de respuesta a emergencias activó protocolo en tiempo adecuado. Se detectó falta de EPP especializado en 2 integrantes. La señalización del área de contención no era visible.', correctives: 'Adquisición de traje Tyvek talla XL para brigada. Se reubicó señalización de área de contención.' },
  { type: 'MEDICAL_EMERGENCY', planned: 60, executed: 59, participants: 20, evTime: 195, obs: 'Tiempo de respuesta de brigada de primeros auxilios excelente. El desfibrilador del área de producción fue localizado con retraso por 1 brigadista.', correctives: 'Se instaló señalización adicional para localización de DEA. Se realizó práctica adicional de localización de equipos de emergencia.' },
  { type: 'EVACUATION', planned: 30, executed: 29, participants: 185, evTime: 245, obs: 'Mejor tiempo registrado en el año. Todos los brigadistas identificados correctamente. Punto de reunión reorganizado funcionó de manera eficiente.', correctives: 'Se documentaron las mejoras implementadas como práctica estándar para siguientes ejercicios.' },
  { type: 'EARTHQUAKE', planned: -15, executed: null, participants: null, evTime: null, obs: null, correctives: null }, // planeado futuro
];

async function createDrillsC1(companyId) {
  for (const d of DRILLS_DEF) {
    const isCompleted = d.executed !== null;
    await prisma.drill.create({
      data: {
        type: d.type,
        plannedDate: d.planned < 0 ? daysFrom(Math.abs(d.planned)) : daysAgo(d.planned),
        executedDate: isCompleted ? daysAgo(d.executed) : null,
        participantCount: d.participants,
        evacuationTime: d.evTime,
        observations: d.obs,
        correctives: d.correctives,
        isCompleted,
        companyId,
      },
    });
  }
}

// ─── 5S empresa 1 ────────────────────────────────────────────────────────────

const FIVES_PRODUCCION = [
  { w: 8, s1: 3, s2: 2, s3: 3, s4: 2, s5: 2, obs: 'Área con exceso de material en proceso sin clasificar. Pasillos con obstáculos. Herramientas sin lugar definido.', plan: 'Implementar tarjetas rojas para clasificación. Definir zonas de material en proceso. Marcar ubicaciones de herramientas.' },
  { w: 6, s1: 3, s2: 3, s3: 3, s4: 3, s5: 2, obs: 'Mejora en clasificación y orden. Persisten áreas con limpieza insuficiente. Los estándares no están documentados en todas las estaciones.', plan: 'Documentar estándares de limpieza por estación. Implementar checklist diario de 5S.' },
  { w: 4, s1: 4, s2: 3, s3: 4, s4: 3, s5: 3, obs: 'Avance significativo en clasificación y limpieza. La disciplina mejoró con la implementación del checklist diario.', plan: 'Estandarizar la documentación de 5S en todo el departamento. Iniciar programa de reconocimiento.' },
  { w: 2, s1: 4, s2: 4, s3: 4, s4: 4, s5: 3, obs: 'Área en buen estado general. La disciplina sigue siendo el área de oportunidad principal. Los operadores participan activamente.', plan: 'Consolidar los logros. Implementar auditorías cruzadas entre áreas para mantener el nivel.' },
];

const FIVES_ALMACEN = [
  { w: 8, s1: 2, s2: 2, s3: 2, s4: 2, s5: 1, obs: 'Área crítica: materiales sin clasificar, mezcla de producto conforme y no conforme, pasillos obstruidos, suciedad acumulada en racks.', plan: 'Campaña de orden y limpieza inmediata. Separar y etiquetar todo el material. Definir zonas claramente marcadas.' },
  { w: 6, s1: 2, s2: 3, s3: 2, s4: 2, s5: 2, obs: 'Mejora en orden gracias a campaña de limpieza. La clasificación de materiales mejoró. La limpieza y estandarización siguen siendo bajas.', plan: 'Continuar con programa de clasificación. Implementar limpieza diaria estructurada con responsable asignado.' },
  { w: 4, s1: 3, s2: 3, s3: 3, s4: 2, s5: 2, obs: 'Avance sostenido. Los racks están mejor organizados. Falta estandarizar y documentar la ubicación de cada tipo de material.', plan: 'Crear mapa visual de ubicaciones en almacén. Documentar procedimiento de recepción y almacenamiento.' },
  { w: 2, s1: 3, s2: 3, s3: 3, s4: 3, s5: 3, obs: 'Mejora consistente en todas las categorías. El personal del almacén ha adoptado la metodología. La estandarización ya tiene base documental.', plan: 'Mantener el nivel alcanzado. Integrar 5S en los indicadores de desempeño del área.' },
];

async function createFiveSC1(companyId) {
  for (const r of FIVES_PRODUCCION) {
    await prisma.fiveS.create({
      data: {
        area: 'Producción',
        auditDate: weeksAgo(r.w),
        seiriScore: r.s1, seitonScore: r.s2, seisoScore: r.s3, seiketsuScore: r.s4, shitsuke: r.s5,
        totalScore: calcFiveSScore(r.s1, r.s2, r.s3, r.s4, r.s5),
        observations: r.obs,
        actionPlan: r.plan,
        auditorName: 'Lic. Carmen Ruiz Torres',
        companyId,
      },
    });
  }
  for (const r of FIVES_ALMACEN) {
    await prisma.fiveS.create({
      data: {
        area: 'Almacén',
        auditDate: weeksAgo(r.w),
        seiriScore: r.s1, seitonScore: r.s2, seisoScore: r.s3, seiketsuScore: r.s4, shitsuke: r.s5,
        totalScore: calcFiveSScore(r.s1, r.s2, r.s3, r.s4, r.s5),
        observations: r.obs,
        actionPlan: r.plan,
        auditorName: 'Lic. Carmen Ruiz Torres',
        companyId,
      },
    });
  }
}

// ─── Mantenimientos empresa 1 ─────────────────────────────────────────────────

async function createMaintenanceC1(companyId) {
  const records = [
    { name: 'Extintores área producción (20 unidades)', type: 'EXTINGUISHER', freq: 'mensual', status: 'OVERDUE', lastDate: daysAgo(35), nextDate: daysAgo(5), responsible: 'Lic. Carmen Ruiz Torres', obs: 'Revisión mensual de presión, seguros y etiquetado. Incluye recarga anual.' },
    { name: 'Extintores área almacén (8 unidades)', type: 'EXTINGUISHER', freq: 'mensual', status: 'SCHEDULED', lastDate: daysAgo(5), nextDate: daysFrom(25), responsible: 'Lic. Carmen Ruiz Torres', obs: null },
    { name: 'Revisión EPP soldadores', type: 'EPP', freq: 'mensual', status: 'OVERDUE', lastDate: daysAgo(40), nextDate: daysAgo(10), responsible: 'Ing. Luis Martínez Ortega', obs: 'Inspección de pantallas faciales, guantes de carnaza, mandiles y polainas.' },
    { name: 'Revisión EPP operadores CNC', type: 'EPP', freq: 'mensual', status: 'COMPLETED', lastDate: daysAgo(5), nextDate: daysFrom(25), responsible: 'Ing. Luis Martínez Ortega', completedAt: daysAgo(5), obs: null },
    { name: 'Botiquín planta principal', type: 'FIRST_AID_KIT', freq: 'mensual', status: 'SCHEDULED', lastDate: daysAgo(10), nextDate: daysFrom(20), responsible: 'Lic. Carmen Ruiz Torres', obs: null },
    { name: 'Botiquín oficinas', type: 'FIRST_AID_KIT', freq: 'mensual', status: 'OVERDUE', lastDate: daysAgo(33), nextDate: daysAgo(3), responsible: 'Lic. Carmen Ruiz Torres', obs: null },
    { name: 'Instalación eléctrica tableros', type: 'ELECTRICAL', freq: 'semestral', status: 'SCHEDULED', lastDate: daysAgo(120), nextDate: daysFrom(60), responsible: 'Ing. Ricardo Torres Vega', obs: 'Revisión por electricista certificado. Incluye termografía.' },
    { name: 'Puente grúa área producción', type: 'EQUIPMENT', freq: 'trimestral', status: 'COMPLETED', lastDate: daysAgo(7), nextDate: daysFrom(83), responsible: 'Ing. Ricardo Torres Vega', completedAt: daysAgo(7), obs: null },
    { name: 'Montacargas #1', type: 'VEHICLE', freq: 'mensual', status: 'OVERDUE', lastDate: daysAgo(38), nextDate: daysAgo(8), responsible: 'Ing. Ricardo Torres Vega', obs: 'Revisión de frenos, dirección, mástil y sistema hidráulico.' },
    { name: 'Montacargas #2', type: 'VEHICLE', freq: 'mensual', status: 'SCHEDULED', lastDate: daysAgo(8), nextDate: daysFrom(22), responsible: 'Ing. Ricardo Torres Vega', obs: null },
  ];

  for (const m of records) {
    await prisma.maintenance.create({
      data: {
        name: m.name, type: m.type, description: m.obs, frequency: m.freq,
        lastDate: m.lastDate, nextDate: m.nextDate, status: m.status,
        responsible: m.responsible, observations: m.obs,
        completedAt: m.completedAt || null,
        companyId,
      },
    });
  }
}

// ─── Riesgos empresa 1 ────────────────────────────────────────────────────────

async function createRisksC1(companyId) {
  const risks = [
    { area: 'Producción', hazard: 'Atrapamiento en prensa hidráulica', desc: 'Riesgo de aplastamiento o amputación de extremidades superiores durante operación de prensa hidráulica de 200 toneladas sin resguardo adecuado.', prob: 2, sev: 5, level: 'HIGH', current: 'Guarda frontal instalada. Capacitación inicial al operador.', proposed: 'Instalar sistema de mando a dos manos. Actualizar procedimiento operativo. Realizar análisis de seguridad en el trabajo (AST).', resp: 'Ing. Luis Martínez Ortega', isControlled: false },
    { area: 'Producción', hazard: 'Exposición a ruido > 85 dB', desc: 'Exposición crónica a ruido de maquinaria de corte y conformado de metal que supera los 85 dB(A) de manera continua durante la jornada.', prob: 4, sev: 3, level: 'HIGH', current: 'Tapones auditivos disponibles. Señalización de uso obligatorio.', proposed: 'Implementar programa de conservación auditiva. Audiometrías anuales. Encapsulamiento de fuentes de ruido. Rotación de puestos.', resp: 'Lic. Carmen Ruiz Torres', isControlled: false },
    { area: 'Producción', hazard: 'Quemaduras por proceso de soldadura', desc: 'Exposición a radiaciones UV, salpicaduras de metal fundido y gases de soldadura durante operaciones de soldadura MIG y TIG.', prob: 3, sev: 3, level: 'MEDIUM', current: 'EPP de soldador completo. Biombos de protección.', proposed: 'Ventilación localizada en puestos de soldadura. Evaluación de humos de soldadura. Renovación de EPP cada 6 meses.', resp: 'Ing. Luis Martínez Ortega', isControlled: false },
    { area: 'Almacén', hazard: 'Caída de materiales en estantería alta', desc: 'Riesgo de aplastamiento por caída de materiales almacenados en racks de hasta 6 metros de altura, sin sistemas anti-vuelco adecuados.', prob: 3, sev: 4, level: 'HIGH', current: 'Señalización de carga máxima en racks.', proposed: 'Anclar todos los racks a la estructura. Instalar topes de seguridad. Implementar inspección semanal de racks. Definir zona de exclusión.', resp: 'Responsable de Almacén', isControlled: false },
    { area: 'Almacén', hazard: 'Golpes por operación de montacargas', desc: 'Riesgo de atropellamiento o golpe de personas en zona de tránsito de montacargas, sin segregación física de rutas peatonales.', prob: 2, sev: 4, level: 'HIGH', current: 'Señalización de tránsito peatonal. Capacitación a operadores.', proposed: 'Instalar barreras físicas para segregar rutas. Espejos en cruces ciegos. Velocímetros en montacargas. Luces de advertencia en intersecciones.', resp: 'Responsable de Almacén', isControlled: false },
    { area: 'Mantenimiento', hazard: 'Choque eléctrico en instalaciones', desc: 'Riesgo de electrocución durante trabajos de mantenimiento en instalaciones eléctricas de media y baja tensión sin procedimiento LOTO implementado.', prob: 2, sev: 5, level: 'HIGH', current: 'EPP eléctrico básico disponible.', proposed: 'Implementar procedimiento LOTO formal. Capacitación en NOM-029. Inspección y certificación de instalaciones. Herramientas dieléctricas.', resp: 'Ing. Ricardo Torres Vega', isControlled: false },
    { area: 'Mantenimiento', hazard: 'Caída en trabajos en altura', desc: 'Riesgo de caída desde diferentes niveles durante trabajos de mantenimiento en techos, plataformas y equipos elevados sin sistema anticaída adecuado.', prob: 2, sev: 5, level: 'HIGH', current: 'Arnés disponible. Capacitación básica.', proposed: 'Implementar sistema de línea de vida permanente. Puntos de anclaje certificados. Rescate en altura. Actualizar permiso de trabajo en altura.', resp: 'Ing. Ricardo Torres Vega', isControlled: false },
    { area: 'Oficinas', hazard: 'Fatiga visual por iluminación deficiente', desc: 'Exposición prolongada a pantallas de cómputo con iluminación inadecuada que genera fatiga visual, cefaleas y reducción de productividad.', prob: 4, sev: 2, level: 'MEDIUM', current: 'Iluminación LED instalada. Descansos programados.', proposed: 'Evaluación de iluminación por puesto. Pantallas con filtro anti-reflejo. Ajuste de altura de monitor. Revisión oftalmológica anual.', resp: 'RRHH', isControlled: true },
    { area: 'Oficinas', hazard: 'Trastornos musculoesqueléticos por postura', desc: 'Riesgo ergonómico por trabajo sedentario prolongado, posturas inadecuadas frente a computadora y mobiliario no ergonómico.', prob: 3, sev: 2, level: 'MEDIUM', current: 'Sillas ajustables. Pausas activas recomendadas.', proposed: 'Evaluación ergonómica individual. Mobiliario ergonómico certificado. Programa de pausas activas. Capacitación NOM-036.', resp: 'RRHH', isControlled: true },
    { area: 'General', hazard: 'Incendio en cuarto eléctrico', desc: 'Riesgo de incendio en tablero eléctrico principal por sobrecalentamiento, cortocircuito o falla de equipos, con posibilidad de propagación.', prob: 1, sev: 5, level: 'MEDIUM', current: 'Extintor CO2 en cuarto eléctrico. Señalización. Acceso restringido.', proposed: 'Termografía semestral de tableros. Sistema de supresión automática. Mantenimiento preventivo con mayor frecuencia. Plan de emergencia eléctrica.', resp: 'Ing. Ricardo Torres Vega', isControlled: true },
  ];

  for (const r of risks) {
    await prisma.risk.create({
      data: {
        area: r.area, hazard: r.hazard, riskDescription: r.desc,
        probability: r.prob, severity: r.sev, riskLevel: r.level,
        currentControls: r.current, proposedControls: r.proposed,
        responsible: r.resp,
        targetDate: r.isControlled ? null : daysFrom(faker.number.int({ min: 30, max: 120 })),
        isControlled: r.isControlled,
        companyId,
      },
    });
  }
}

// ─── Auditorías empresa 1 ─────────────────────────────────────────────────────

const CHECKLIST_PRODUCCION = [
  { question: '¿Se cuenta con señalización de seguridad en todas las áreas?', answer: 'yes', weight: 1, observations: '' },
  { question: '¿El personal usa correctamente el EPP asignado?', answer: 'partial', weight: 2, observations: 'Se observó a 2 operadores sin lentes de seguridad' },
  { question: '¿Las rutas de evacuación están libres de obstáculos?', answer: 'yes', weight: 1, observations: '' },
  { question: '¿Los extintores tienen vigencia y están accesibles?', answer: 'yes', weight: 2, observations: '' },
  { question: '¿Las guardas de maquinaria están en buen estado?', answer: 'partial', weight: 2, observations: 'Prensa hidráulica #3 con guarda dañada, reportada a mantenimiento' },
  { question: '¿Los equipos cuentan con procedimiento de bloqueo LOTO?', answer: 'no', weight: 2, observations: 'No se encontró procedimiento actualizado' },
  { question: '¿El área de trabajo está limpia y ordenada (5S)?', answer: 'partial', weight: 1, observations: 'Pasillos con exceso de material en proceso' },
  { question: '¿Los trabajadores conocen los riesgos de su área?', answer: 'yes', weight: 1, observations: '' },
  { question: '¿Existe bitácora de inspección de seguridad?', answer: 'yes', weight: 1, observations: '' },
  { question: '¿Las sustancias peligrosas tienen etiqueta SGA?', answer: 'no', weight: 2, observations: 'Recipientes de lubricantes sin etiqueta SGA actualizada' },
];

const CHECKLIST_ALMACEN = [
  { question: '¿El almacén cuenta con señalización de capacidad máxima en racks?', answer: 'partial', weight: 1, observations: 'Algunos racks sin etiqueta' },
  { question: '¿Están delimitadas las zonas de tránsito peatonal y montacargas?', answer: 'no', weight: 2, observations: 'Sin segregación física, solo pintura en piso' },
  { question: '¿Los materiales peligrosos están almacenados correctamente?', answer: 'yes', weight: 2, observations: '' },
  { question: '¿Existe sistema de inventario de sustancias peligrosas?', answer: 'partial', weight: 1, observations: 'Inventario desactualizado' },
  { question: '¿Los operadores de montacargas tienen licencia interna vigente?', answer: 'yes', weight: 2, observations: '' },
];

async function createAuditsC1(companyId) {
  // Auditoría 1 — COMPLETED
  const yesCount1 = CHECKLIST_PRODUCCION.filter(q => q.answer === 'yes').length;
  const score1 = (yesCount1 / CHECKLIST_PRODUCCION.length) * 100;
  await prisma.audit.create({
    data: {
      title: 'Auditoría integral SH — Área Producción Q1',
      auditDate: daysAgo(60),
      area: 'Producción',
      auditorName: 'Lic. Patricia Morales Soto',
      status: 'COMPLETED',
      checklist: JSON.stringify(CHECKLIST_PRODUCCION),
      score: Math.round(score1 * 10) / 10,
      findings: 'Se identificaron 3 no conformidades: uso inconsistente de EPP, guarda de prensa hidráulica #3 dañada y ausencia de procedimiento LOTO actualizado. Adicionalmente, se detectó etiquetado SGA incompleto en área de lubricantes.',
      correctives: '1. Reforzar supervisión del uso de EPP y aplicar medidas disciplinarias. 2. Reparar guarda de prensa #3 en plazo máximo de 15 días. 3. Actualizar y publicar procedimiento LOTO antes del 30 del mes. 4. Etiquetar todos los recipientes con SGA en los próximos 10 días.',
      companyId,
    },
  });

  // Auditoría 2 — IN_PROGRESS
  await prisma.audit.create({
    data: {
      title: 'Auditoría SH — Área Almacén Q2',
      auditDate: daysAgo(7),
      area: 'Almacén',
      auditorName: 'Lic. Carmen Ruiz Torres',
      status: 'IN_PROGRESS',
      checklist: JSON.stringify(CHECKLIST_ALMACEN),
      score: null,
      findings: null,
      correctives: null,
      companyId,
    },
  });

  // Auditoría 3 — PLANNED
  await prisma.audit.create({
    data: {
      title: 'Auditoría integral SH — Área Mantenimiento Q2',
      auditDate: daysFrom(14),
      area: 'Mantenimiento',
      auditorName: 'Lic. Patricia Morales Soto',
      status: 'PLANNED',
      checklist: JSON.stringify([
        { question: '¿Los trabajadores de mantenimiento cuentan con EPP específico para cada tarea?', answer: '', weight: 2, observations: '' },
        { question: '¿Existe procedimiento LOTO documentado y aplicado?', answer: '', weight: 2, observations: '' },
        { question: '¿Se llevan bitácoras de mantenimiento preventivo y correctivo?', answer: '', weight: 1, observations: '' },
        { question: '¿Las herramientas y equipos están en buen estado y calibrados?', answer: '', weight: 1, observations: '' },
        { question: '¿El personal tiene capacitación vigente en trabajos en altura?', answer: '', weight: 2, observations: '' },
      ]),
      score: null,
      companyId,
    },
  });
}

// ─── Programa SH empresa 1 ────────────────────────────────────────────────────

async function createProgramC1(companyId) {
  const firstDay = new Date(new Date().getFullYear(), 0, 1);
  await prisma.sHProgram.upsert({
    where: { companyId },
    update: {},
    create: {
      year: new Date().getFullYear(),
      objectives: `1. REDUCCIÓN DE ACCIDENTABILIDAD: Reducir el índice de frecuencia de accidentes en un 20% respecto al año anterior, mediante la implementación de controles de ingeniería, administrativos y el reforzamiento del uso de EPP en todas las áreas de la planta.\n\n2. CUMPLIMIENTO NORMATIVO: Alcanzar y mantener un cumplimiento del 90% o superior en las NOMs aplicables al giro metalmecánico, priorizando NOM-002, NOM-004, NOM-009, NOM-011 y NOM-033 que presentan brechas identificadas en la evaluación inicial del año.\n\n3. CAPACITACIÓN INTEGRAL: Garantizar que el 100% del personal reciba al menos 16 horas anuales de capacitación en temas de seguridad e higiene, con énfasis en manejo de EPP, respuesta a emergencias y procedimientos seguros de trabajo.\n\n4. METODOLOGÍA 5S: Implementar y consolidar la metodología 5S en todas las áreas del centro de trabajo, alcanzando un puntaje promedio de 3.5/5 en la evaluación de cada S, y desarrollando el hábito de auditoría cruzada entre departamentos.`,
      scope: 'Aplica a todas las instalaciones, áreas, trabajadores propios y contratistas de Manufacturas del Norte S.A. de C.V. en su planta ubicada en Parque Industrial Monterrey, Apodaca, N.L. Incluye: área de producción, almacén, mantenimiento, oficinas administrativas y áreas comunes.',
      budget: 450000.00,
      responsible: 'Lic. Carmen Ruiz Torres',
      approvedBy: 'Ing. Roberto Salinas Mendoza',
      approvedAt: firstDay,
      notes: 'Presupuesto distribuido: 40% capacitación, 30% EPP y señalización, 20% mantenimiento preventivo SH, 10% consultoría y certificaciones.',
      companyId,
    },
  });
}

// ─── Datos reducidos para empresas 2 y 3 ─────────────────────────────────────

async function createDataForCompany(companyId, userId, companyIndex) {
  // 5 requerimientos
  const reqsData = [
    { code: `NOM-017-STPS-2008`, name: 'Equipo de Protección Personal', status: 'COMPLETED', daysOffset: -30 },
    { code: `NOM-002-STPS-2010`, name: 'Prevención y protección contra incendios', status: 'IN_PROGRESS', daysOffset: 45 },
    { code: `NOM-019-STPS-2011`, name: 'Comisión Mixta de Seguridad e Higiene', status: 'PENDING', daysOffset: 60 },
    { code: `NOM-035-STPS-2018`, name: 'Factores de riesgo psicosocial', status: 'OVERDUE', daysOffset: -10 },
    { code: `NOM-025-STPS-2008`, name: 'Condiciones de iluminación', status: 'NOT_APPLICABLE', daysOffset: null },
  ];

  for (const r of reqsData) {
    await prisma.requirement.create({
      data: {
        code: r.code, name: r.name,
        specificRequirement: `Cumplimiento de ${r.code}: ${r.name}.`,
        legalSource: 'NOM', status: r.status,
        dueDate: r.daysOffset !== null ? (r.daysOffset < 0 ? daysAgo(Math.abs(r.daysOffset)) : daysFrom(r.daysOffset)) : null,
        completedAt: r.status === 'COMPLETED' ? daysAgo(25) : null,
        companyId, createdById: userId,
      },
    });
  }

  // 2 incidentes
  for (let i = 0; i < 2; i++) {
    await prisma.incident.create({
      data: {
        folio: nextFolio(),
        type: i === 0 ? 'ACCIDENT' : 'INCIDENT',
        severity: 'MINOR',
        occurredAt: daysAgo(faker.number.int({ min: 30, max: 150 })),
        area: faker.helpers.arrayElement(['Producción', 'Almacén', 'Obra', 'Oficinas']),
        description: faker.lorem.sentences(2),
        rootCause: ROOT_CAUSES[i],
        isClosed: true,
        closedAt: daysAgo(15),
        lostDays: i === 0 ? 1 : 0,
        companyId, createdById: userId,
      },
    });
  }

  // 3 capacitaciones
  const capNames = ['Inducción de seguridad', 'Uso de EPP', 'Prevención de incendios'];
  for (const name of capNames) {
    await prisma.training.create({
      data: {
        name, instructor: faker.person.fullName(),
        trainingDate: daysAgo(faker.number.int({ min: 20, max: 120 })),
        durationHours: faker.helpers.arrayElement([2, 3, 4]),
        participants: JSON.stringify(mexicanNames(6)),
        participantCount: faker.number.int({ min: 8, max: 20 }),
        isCompleted: true,
        companyId, createdById: userId,
      },
    });
  }

  // 2 riesgos
  const riskDefs = [
    { area: 'Producción', hazard: 'Caída al mismo nivel', prob: 3, sev: 2, level: 'MEDIUM' },
    { area: 'General', hazard: 'Incendio en área eléctrica', prob: 1, sev: 5, level: 'MEDIUM' },
  ];
  for (const r of riskDefs) {
    await prisma.risk.create({
      data: {
        area: r.area, hazard: r.hazard,
        riskDescription: faker.lorem.sentences(2),
        probability: r.prob, severity: r.sev, riskLevel: r.level,
        currentControls: 'Señalización básica.',
        proposedControls: 'Implementar controles administrativos y de ingeniería.',
        companyId,
      },
    });
  }

  // 1 auditoría COMPLETED
  await prisma.audit.create({
    data: {
      title: `Auditoría SH General — ${companyIndex === 2 ? 'Constructora Edificar' : 'Servicios Nexo'}`,
      auditDate: daysAgo(45),
      area: 'General',
      auditorName: faker.person.fullName(),
      status: 'COMPLETED',
      checklist: JSON.stringify([
        { question: '¿Se cuenta con señalización de seguridad?', answer: 'yes', weight: 1, observations: '' },
        { question: '¿El personal usa EPP correctamente?', answer: 'partial', weight: 2, observations: 'Se detectaron incumplimientos en área de trabajo.' },
        { question: '¿Los extintores están vigentes?', answer: 'yes', weight: 2, observations: '' },
      ]),
      score: Math.round((2 / 3) * 100 * 10) / 10,
      findings: 'Cumplimiento general aceptable. Se requiere reforzar el uso de EPP.',
      correctives: 'Campaña de concientización sobre uso de EPP.',
      companyId,
    },
  });
}

// ─── Brigadas ─────────────────────────────────────────────────────────────────

async function createBrigadesC1(companyId) {
  const today = new Date();

  // Crear las 4 brigadas
  const [firstAid, evacuation, fireFighting, searchRescue] = await Promise.all([
    prisma.brigade.upsert({
      where: { companyId_type: { companyId, type: 'FIRST_AID' } },
      update: { meetingPoint: 'Área de enfermería – Planta baja edificio administrativo' },
      create: { companyId, type: 'FIRST_AID', meetingPoint: 'Área de enfermería – Planta baja edificio administrativo' },
    }),
    prisma.brigade.upsert({
      where: { companyId_type: { companyId, type: 'EVACUATION' } },
      update: { meetingPoint: 'Estacionamiento principal zona norte' },
      create: { companyId, type: 'EVACUATION', meetingPoint: 'Estacionamiento principal zona norte' },
    }),
    prisma.brigade.upsert({
      where: { companyId_type: { companyId, type: 'FIRE_FIGHTING' } },
      update: { meetingPoint: 'Punto B – Puerta lateral sur' },
      create: { companyId, type: 'FIRE_FIGHTING', meetingPoint: 'Punto B – Puerta lateral sur' },
    }),
    prisma.brigade.upsert({
      where: { companyId_type: { companyId, type: 'SEARCH_RESCUE' } },
      update: { meetingPoint: 'Acceso principal – Control de visitantes' },
      create: { companyId, type: 'SEARCH_RESCUE', meetingPoint: 'Acceso principal – Control de visitantes' },
    }),
  ]);

  // ── Primeros auxilios (6 integrantes) ────────────────────────────────────────
  await prisma.brigadeMember.createMany({
    data: [
      {
        brigadeId: firstAid.id, employeeName: 'Carmen Ruiz Torres', memberRole: 'COORDINATOR',
        notes: 'Cruz Roja Mexicana – Primeros Auxilios Avanzados',
        certificationDate: daysAgo(180), certificationExpiry: daysFrom(185),
      },
      {
        brigadeId: firstAid.id, employeeName: 'Adriana Flores Medina', memberRole: 'DEPUTY',
        notes: 'IMSS – Primeros Auxilios Básicos',
        certificationDate: daysAgo(340), certificationExpiry: daysFrom(25),
      },
      {
        brigadeId: firstAid.id, employeeName: 'Marco Antonio Vega Ríos', memberRole: 'MEMBER',
        notes: 'Cruz Roja Mexicana – RCP',
        certificationDate: daysAgo(90), certificationExpiry: daysFrom(275),
      },
      {
        brigadeId: firstAid.id, employeeName: 'Patricia Leal Guzmán', memberRole: 'MEMBER',
        notes: 'Cruz Roja Mexicana – RCP',
        certificationDate: daysAgo(90), certificationExpiry: daysFrom(275),
      },
      {
        brigadeId: firstAid.id, employeeName: 'Héctor Jiménez Soto', memberRole: 'MEMBER',
        notes: 'IMSS – Primeros Auxilios Básicos',
        certificationDate: daysAgo(60), certificationExpiry: daysFrom(305),
      },
      {
        brigadeId: firstAid.id, employeeName: 'Rebeca Moreno Castillo', memberRole: 'MEMBER',
        notes: 'IMSS – Primeros Auxilios Básicos',
        certificationDate: daysAgo(60), certificationExpiry: daysFrom(305),
      },
    ],
  });

  // ── Evacuación (8 integrantes) ───────────────────────────────────────────────
  await prisma.brigadeMember.createMany({
    data: [
      {
        brigadeId: evacuation.id, employeeName: 'Luis Martínez Ortega', memberRole: 'COORDINATOR',
        notes: 'PC Nuevo León – Coordinador de Evacuación',
        certificationDate: daysAgo(120), certificationExpiry: daysFrom(245),
      },
      {
        brigadeId: evacuation.id, employeeName: 'Sandra Delgado Nava', memberRole: 'DEPUTY',
        notes: 'PC Nuevo León – Evacuación Industrial',
        certificationDate: daysAgo(120), certificationExpiry: daysFrom(245),
      },
      {
        brigadeId: evacuation.id, employeeName: 'Jorge Ramírez Peña', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: evacuation.id, employeeName: 'Yolanda Fuentes Cruz', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: evacuation.id, employeeName: 'Alejandro Bernal Treviño', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: evacuation.id, employeeName: 'Claudia Sandoval Ibarra', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: evacuation.id, employeeName: 'Fernando Reyes Luna', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: evacuation.id, employeeName: 'Irma Valdés Quiroga', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
    ],
  });

  // ── Contra incendios (5 integrantes) ────────────────────────────────────────
  await prisma.brigadeMember.createMany({
    data: [
      {
        brigadeId: fireFighting.id, employeeName: 'Roberto Salinas Mendoza', memberRole: 'COORDINATOR',
        notes: 'STPS – Combate de Incendios Nivel II',
        certificationDate: daysAgo(200), certificationExpiry: daysFrom(165),
      },
      {
        brigadeId: fireFighting.id, employeeName: 'Diana Espinoza Garza', memberRole: 'DEPUTY',
        notes: 'STPS – Combate de Incendios Nivel I',
        certificationDate: daysAgo(200), certificationExpiry: daysFrom(165),
      },
      {
        brigadeId: fireFighting.id, employeeName: 'Ernesto Aguilar Campos', memberRole: 'MEMBER',
        notes: 'STPS – Uso de Extintores',
        certificationDate: daysAgo(45), certificationExpiry: daysFrom(320),
      },
      {
        brigadeId: fireFighting.id, employeeName: 'Norma Acosta Bravo', memberRole: 'MEMBER',
        notes: 'STPS – Uso de Extintores',
        certificationDate: daysAgo(45), certificationExpiry: daysFrom(320),
      },
      {
        brigadeId: fireFighting.id, employeeName: 'Óscar Torres Hernández', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
    ],
  });

  // ── Búsqueda y rescate (4 integrantes) ──────────────────────────────────────
  await prisma.brigadeMember.createMany({
    data: [
      {
        brigadeId: searchRescue.id, employeeName: 'Juan Pérez Hernández', memberRole: 'COORDINATOR',
        notes: 'PC Federal – Búsqueda y Rescate Urbano',
        certificationDate: daysAgo(380), certificationExpiry: daysAgo(15),
      },
      {
        brigadeId: searchRescue.id, employeeName: 'Mónica Guerrero Alvarado', memberRole: 'DEPUTY',
        notes: 'PC Nuevo León – Rescate Básico',
        certificationDate: daysAgo(100), certificationExpiry: daysFrom(265),
      },
      {
        brigadeId: searchRescue.id, employeeName: 'Arturo Navarro Quintero', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
      {
        brigadeId: searchRescue.id, employeeName: 'Leticia Domínguez Arias', memberRole: 'MEMBER',
        certificationDate: null, certificationExpiry: null,
      },
    ],
  });
}

// ─── v1.6: Suppliers, EPP, Chemicals ────────────────────────────────────────

async function createSuppliersC1(companyId, userId) {
  const crypto = require('crypto');

  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'Grupo Seguridad Industrial SA de CV', rfc: 'GSI201501ABC', address: 'Av. Revolución 1234', city: 'Monterrey', state: 'Nuevo León', productsServices: 'EPP, señalización de seguridad, extintores', contactName: 'Ing. Roberto Garza', phone: '81 1234 5678', email: 'rgarza@gruposi.mx', status: 'ACTIVE', companyId } }),
    prisma.supplier.create({ data: { name: 'Químicos del Norte SA de CV', rfc: 'QNO180312DEF', address: 'Blvd. Industrial 567', city: 'Apodaca', state: 'Nuevo León', productsServices: 'Sustancias químicas industriales, solventes, lubricantes', contactName: 'Lic. Sandra Moreno', phone: '81 2345 6789', email: 'smoreno@quinor.mx', status: 'ACTIVE', companyId } }),
    prisma.supplier.create({ data: { name: 'Transportes Especializados MX SA de CV', rfc: 'TEM200607GHI', address: 'Carretera Nacional km 12', city: 'Guadalupe', state: 'Nuevo León', productsServices: 'Transporte y disposición de residuos peligrosos', contactName: 'Sr. Carlos Vásquez', phone: '81 3456 7890', email: 'cvasquez@temx.mx', status: 'ACTIVE', companyId } }),
    prisma.supplier.create({ data: { name: 'Consultores SH & Normatividad AC', rfc: 'CSN190823JKL', address: 'Torre Cibeles piso 8', city: 'San Pedro Garza García', state: 'Nuevo León', productsServices: 'Consultoría en seguridad, auditorías NOM, capacitación', contactName: 'Dr. Marco Hernández', phone: '81 4567 8901', email: 'mhernandez@consultoressh.mx', status: 'ACTIVE', companyId } }),
    prisma.supplier.create({ data: { name: 'Mantenimiento Industrial del Norte SA de CV', rfc: 'MIN170415MNO', address: 'Parque Industrial Escobedo L-12', city: 'General Escobedo', state: 'Nuevo León', productsServices: 'Mantenimiento preventivo y correctivo, instalaciones eléctricas', contactName: 'Ing. Patricia Luna', phone: '81 5678 9012', email: 'pluna@mdin.mx', status: 'INACTIVE', companyId } }),
  ]);

  // Create access token for first supplier
  await prisma.supplierAccessToken.create({
    data: {
      supplierId: suppliers[0].id,
      token: crypto.randomBytes(24).toString('hex'),
      isActive: true,
    },
  });

  // Add some documents for supplier 1
  await prisma.supplierDocument.createMany({
    data: [
      { supplierId: suppliers[0].id, docType: 'SUA', status: 'APPROVED', fileName: 'SUA_Oct2025.pdf', uploadedAt: daysAgo(20), expiresAt: daysFrom(10), period: 'Oct-2025', reviewedById: userId, reviewedAt: daysAgo(15) },
      { supplierId: suppliers[0].id, docType: 'REPSE', status: 'APPROVED', fileName: 'REPSE_2025.pdf', uploadedAt: daysAgo(90), expiresAt: daysFrom(275) },
      { supplierId: suppliers[0].id, docType: 'OPINION_SAT', status: 'UPLOADED', fileName: 'SAT_Nov2025.pdf', uploadedAt: daysAgo(2) },
    ],
  });

  // Add documents for supplier 2
  await prisma.supplierDocument.createMany({
    data: [
      { supplierId: suppliers[1].id, docType: 'SUA', status: 'PENDING' },
      { supplierId: suppliers[1].id, docType: 'REPSE', status: 'UPLOADED', fileName: 'REPSE_Quinor.pdf', uploadedAt: daysAgo(5) },
    ],
  });

  console.log(`  ✅ ${suppliers.length} proveedores creados`);
  return suppliers;
}

async function createEppC1(companyId, userId) {
  const items = await Promise.all([
    prisma.eppItem.create({ data: { name: 'Casco de seguridad tipo I', category: 'Cabeza', unit: 'pieza', minStock: 10, currentStock: 25, brand: 'MSA', partNumber: 'MSA-C1', companyId } }),
    prisma.eppItem.create({ data: { name: 'Lentes de seguridad transparentes', category: 'Ojos y cara', unit: 'pieza', minStock: 20, currentStock: 8, brand: '3M', partNumber: '3M-11360', companyId } }),
    prisma.eppItem.create({ data: { name: 'Tapones auditivos desechables', category: 'Oídos', unit: 'par', minStock: 50, currentStock: 120, brand: '3M', partNumber: '3M-1100', companyId } }),
    prisma.eppItem.create({ data: { name: 'Guantes de nitrilo negros talla M', category: 'Manos', unit: 'par', minStock: 30, currentStock: 15, brand: 'Ansell', partNumber: 'ANS-G200', companyId } }),
    prisma.eppItem.create({ data: { name: 'Botas de seguridad punta acero', category: 'Pies', unit: 'par', minStock: 5, currentStock: 12, brand: 'Cat', partNumber: 'CAT-P90233', companyId } }),
  ]);

  // Movements for item 1 (casco)
  await prisma.eppMovement.createMany({
    data: [
      { type: 'ENTRY', quantity: 30, balanceAfter: 30, reason: 'Compra inicial', date: daysAgo(60), eppItemId: items[0].id, registeredById: userId },
      { type: 'EXIT', quantity: 5, balanceAfter: 25, employeeName: 'Juan Martínez', employeeArea: 'Producción', reason: 'Asignación a nuevo empleado', date: daysAgo(30), eppItemId: items[0].id, registeredById: userId },
    ],
  });

  // Movements for item 2 (lentes) — low stock
  await prisma.eppMovement.createMany({
    data: [
      { type: 'ENTRY', quantity: 30, balanceAfter: 30, reason: 'Compra inicial', date: daysAgo(90), eppItemId: items[1].id, registeredById: userId },
      { type: 'EXIT', quantity: 22, balanceAfter: 8, employeeName: 'Varios', employeeArea: 'Planta', reason: 'Reposición mensual', date: daysAgo(5), eppItemId: items[1].id, registeredById: userId },
    ],
  });

  // Matrix entries
  await prisma.eppAreaRequirement.createMany({
    data: [
      { eppItemId: items[0].id, areaName: 'Planta de producción', mandatory: true, companyId },
      { eppItemId: items[0].id, areaName: 'Almacén', mandatory: true, companyId },
      { eppItemId: items[1].id, areaName: 'Planta de producción', mandatory: true, companyId },
      { eppItemId: items[1].id, areaName: 'Laboratorio', mandatory: true, companyId },
      { eppItemId: items[2].id, areaName: 'Planta de producción', mandatory: true, notes: 'Nivel de ruido > 85 dB', companyId },
      { eppItemId: items[3].id, areaName: 'Laboratorio', mandatory: true, companyId },
      { eppItemId: items[3].id, areaName: 'Mantenimiento', mandatory: true, companyId },
      { eppItemId: items[4].id, areaName: 'Planta de producción', mandatory: true, companyId },
      { eppItemId: items[4].id, areaName: 'Almacén', mandatory: true, companyId },
    ],
  });

  console.log(`  ✅ ${items.length} artículos EPP creados con movimientos y matriz`);
  return items;
}

async function createChemicalsC1(companyId, supplierId, userId) {
  const products = await Promise.all([
    prisma.chemicalProduct.create({ data: { tradeName: 'Hexano técnico', chemicalName: 'n-Hexano', casNumber: '110-54-3', manufacturer: 'BASF', supplierId, ghsHazardClasses: ['Inflamable', 'Nocivo', 'Peligro ambiental'], physicalState: 'Líquido', storageLocation: 'Bodega 3 – área inflamables', maxStockKg: 500, companyId } }),
    prisma.chemicalProduct.create({ data: { tradeName: 'Ácido sulfúrico industrial', chemicalName: 'Ácido sulfúrico H₂SO₄', casNumber: '7664-93-9', manufacturer: 'Químicos del Norte', supplierId, ghsHazardClasses: ['Corrosivo', 'Tóxico'], physicalState: 'Líquido', storageLocation: 'Bodega 4 – área ácidos', maxStockKg: 200, companyId } }),
    prisma.chemicalProduct.create({ data: { tradeName: 'Aceite hidráulico ISO 46', chemicalName: 'Aceite mineral parafínico', casNumber: '64742-54-7', manufacturer: 'Pemex Lubricantes', ghsHazardClasses: [], physicalState: 'Líquido', storageLocation: 'Almacén general estante B4', maxStockKg: 1000, companyId } }),
    prisma.chemicalProduct.create({ data: { tradeName: 'Sosa cáustica pellets', chemicalName: 'Hidróxido de sodio NaOH', casNumber: '1310-73-2', manufacturer: 'Chem-Mex SA de CV', ghsHazardClasses: ['Corrosivo'], physicalState: 'Sólido', storageLocation: 'Bodega 2 – área básicos', maxStockKg: 300, companyId } }),
  ]);

  // Hazmat disposal
  await prisma.hazmatDisposal.create({
    data: {
      folio: `HM-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-0001`,
      disposalDate: daysAgo(45),
      wasteType: 'Solventes orgánicos usados',
      wasteState: 'LIQUID',
      quantityKg: 85.5,
      manifestNumber: 'MNF-2025-00123',
      transportCompany: 'Transportes Especializados MX SA de CV',
      disposalMethod: 'Incineración en horno de alta temperatura',
      productId: products[0].id,
      companyId,
      createdById: userId,
    },
  });

  await prisma.hazmatDisposal.create({
    data: {
      folio: `HM-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-0002`,
      disposalDate: daysAgo(10),
      wasteType: 'Ácidos inorgánicos residuales',
      wasteState: 'LIQUID',
      quantityKg: 42.0,
      transportCompany: 'Transportes Especializados MX SA de CV',
      disposalMethod: 'Neutralización y confinamiento',
      productId: products[1].id,
      companyId,
      createdById: userId,
    },
  });

  console.log(`  ✅ ${products.length} sustancias químicas creadas y 2 disposiciones de residuos`);
  return products;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Iniciando seed de datos de prueba...\n');

  await cleanDB();

  // Empresas
  const { c1, c2, c3 } = await createCompanies();
  console.log('🏭 Empresas creadas: 3');

  // Usuarios
  const { admin, esp1, esp2, esp3 } = await createUsers(c1.id, c2.id, c3.id);
  console.log('👤 Usuarios creados: 10');

  // Empresa 1 — datos principales
  const reqs = await createRequirementsC1(c1.id, esp1.id);
  console.log(`📋 Requerimientos empresa 1: ${reqs.length}`);

  await createIncidentsC1(c1.id, esp1.id);
  console.log('⚠️  Incidentes empresa 1: 12');

  await createCMSHC1(c1.id);
  console.log('👥 CMSH empresa 1: 5 miembros, 6 actas');

  await createTrainingsC1(c1.id, esp1.id);
  console.log('🎓 Capacitaciones empresa 1: 10');

  await createDrillsC1(c1.id);
  console.log('🚨 Simulacros empresa 1: 6');

  await createFiveSC1(c1.id);
  console.log('⭐ Auditorías 5S empresa 1: 8');

  await createMaintenanceC1(c1.id);
  console.log('🔧 Mantenimientos empresa 1: 10');

  await createRisksC1(c1.id);
  console.log('⚡ Riesgos empresa 1: 10');

  await createAuditsC1(c1.id);
  console.log('📊 Auditorías empresa 1: 3');

  await createProgramC1(c1.id);
  console.log('📖 Programa SH empresa 1: 1');

  await createBrigadesC1(c1.id);
  console.log('🚒 Brigadas empresa 1: 4 brigadas, 23 integrantes');

  // v1.6: Suppliers, EPP, Chemicals
  const suppliers = await createSuppliersC1(c1.id, esp1.id);
  console.log(`🚛 Proveedores empresa 1: ${suppliers.length}`);

  await createEppC1(c1.id, esp1.id);
  console.log('🪖 EPP empresa 1: 5 artículos, movimientos y matriz');

  await createChemicalsC1(c1.id, suppliers[1].id, esp1.id);
  console.log('⚗️  Químicos empresa 1: 4 sustancias, 2 disposiciones');

  // Empresas 2 y 3
  await createDataForCompany(c2.id, esp2.id, 2);
  console.log('📦 Datos empresa 2 creados');

  await createDataForCompany(c3.id, esp3.id, 3);
  console.log('📦 Datos empresa 3 creados');

  // Conteos finales
  const [totalReqs, totalInc, totalTrainings, totalDrills, total5S, totalMaint, totalRisks, totalAudits, totalUsers, totalMembers, totalMeetings] =
    await Promise.all([
      prisma.requirement.count(),
      prisma.incident.count(),
      prisma.training.count(),
      prisma.drill.count(),
      prisma.fiveS.count(),
      prisma.maintenance.count(),
      prisma.risk.count(),
      prisma.audit.count(),
      prisma.user.count(),
      prisma.cMSHMember.count(),
      prisma.cMSHMeeting.count(),
    ]);

  const [totalActivities, totalEvidences, totalBrigades, totalBrigadeMembers, totalSuppliers, totalEppItems, totalChemicals, totalDisposals] = await Promise.all([
    prisma.activity.count(),
    prisma.evidence.count(),
    prisma.brigade.count(),
    prisma.brigadeMember.count(),
    prisma.supplier.count(),
    prisma.eppItem.count(),
    prisma.chemicalProduct.count(),
    prisma.hazmatDisposal.count(),
  ]);

  console.log('\n✅ Seed completado exitosamente');
  console.log('───────────────────────────────────────────');
  console.log(`Empresas creadas:           3`);
  console.log(`Usuarios creados:           ${totalUsers}`);
  console.log(`Requerimientos:             ${totalReqs}  (20 empresa 1, 5 empresa 2, 5 empresa 3)`);
  console.log(`Actividades:                ${totalActivities}`);
  console.log(`Evidencias (placeholder):   ${totalEvidences}`);
  console.log(`Incidentes:                 ${totalInc}`);
  console.log(`Miembros CMSH:              ${totalMembers}`);
  console.log(`Actas CMSH:                 ${totalMeetings}`);
  console.log(`Capacitaciones:             ${totalTrainings}`);
  console.log(`Simulacros:                 ${totalDrills}`);
  console.log(`Auditorías 5S:              ${total5S}`);
  console.log(`Mantenimientos:             ${totalMaint}`);
  console.log(`Riesgos:                    ${totalRisks}`);
  console.log(`Auditorías internas:        ${totalAudits}`);
  console.log(`Brigadas:                   ${totalBrigades}`);
  console.log(`Integrantes brigadas:       ${totalBrigadeMembers}`);
  console.log(`Proveedores:                ${totalSuppliers}`);
  console.log(`Artículos EPP:              ${totalEppItems}`);
  console.log(`Sustancias químicas:        ${totalChemicals}`);
  console.log(`Disposiciones residuos:     ${totalDisposals}`);
  console.log(`PSH:                        1`);
  console.log('───────────────────────────────────────────');
  console.log('🔑 Credenciales de acceso:');
  console.log('   Admin:        admin@sh-app.mx / Admin1234!');
  console.log('   Especialista: especialista@sh-app.mx / Especialista1!');
  console.log('   Gerente:      gerente.produccion@sh-app.mx / Gerente1234!');
  console.log('   Auditor:      auditor@sh-app.mx / Auditor1234!');
  console.log('   Dirección:    direccion@sh-app.mx / Direccion1!');
  console.log('───────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
