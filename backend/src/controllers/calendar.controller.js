const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function subDays(date, days) {
  return addDays(date, -days);
}

function getSeverity(date) {
  const now = new Date();
  const diff = (new Date(date) - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'urgent';
  if (diff <= 30) return 'upcoming';
  return 'normal';
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

const getCalendarEvents = async (req, res, next) => {
  try {
    const user = req.user;
    // Admin puede pasar companyId por query; otros usan el suyo
    const companyId = user.role === 'ADMIN' && req.query.companyId
      ? req.query.companyId
      : user.companyId;

    const now = new Date();
    const rangeStart = req.query.start ? new Date(req.query.start) : subDays(now, 30);
    const rangeEnd   = req.query.end   ? new Date(req.query.end)   : addDays(now, 90);

    const [requirements, activities, trainings, drills, maintenances, risks, audits, cmshMeetings, brigadeMembers, supplierDocs] =
      await Promise.all([
        prisma.requirement.findMany({
          where: {
            companyId,
            dueDate: { not: null, gte: rangeStart, lte: rangeEnd },
            status: { not: 'COMPLETED' },
          },
          select: { id: true, code: true, name: true, dueDate: true, status: true, responsibleArea: true },
        }),

        prisma.activity.findMany({
          where: {
            requirement: { companyId },
            dueDate: { not: null, gte: rangeStart, lte: rangeEnd },
            activityStatus: { not: 'COMPLETED' },
          },
          select: {
            id: true,
            description: true,
            responsible: true,
            dueDate: true,
            requirement: { select: { id: true, code: true, responsibleArea: true } },
          },
        }),

        prisma.training.findMany({
          where: {
            companyId,
            expirationDate: { not: null, gte: rangeStart, lte: rangeEnd },
          },
          select: { id: true, name: true, expirationDate: true, instructor: true },
        }),

        prisma.drill.findMany({
          where: {
            companyId,
            plannedDate: { not: null, gte: rangeStart, lte: rangeEnd },
            isCompleted: false,
          },
          select: { id: true, type: true, plannedDate: true, area: true },
        }),

        prisma.maintenance.findMany({
          where: {
            companyId,
            nextDate: { not: null, gte: rangeStart, lte: rangeEnd },
            status: { not: 'COMPLETED' },
          },
          select: { id: true, name: true, nextDate: true, area: true, responsible: true, status: true },
        }),

        prisma.risk.findMany({
          where: {
            companyId,
            targetDate: { not: null, gte: rangeStart, lte: rangeEnd },
            isControlled: false,
          },
          select: { id: true, hazard: true, targetDate: true, area: true, responsible: true, riskLevel: true },
        }),

        prisma.audit.findMany({
          where: {
            companyId,
            auditDate: { not: null, gte: rangeStart, lte: rangeEnd },
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
          },
          select: { id: true, title: true, auditDate: true, auditor: true, status: true },
        }),

        prisma.cMSHMeeting.findMany({
          where: {
            company: { id: companyId },
            nextMeeting: { not: null, gte: rangeStart, lte: rangeEnd },
          },
          select: { id: true, nextMeeting: true, location: true },
        }),

        prisma.brigadeMember.findMany({
          where: {
            brigade: { companyId },
            isActive: true,
            certificationExpiry: { not: null, gte: rangeStart, lte: rangeEnd },
          },
          select: {
            id: true,
            employeeName: true,
            certificationExpiry: true,
            brigade: { select: { type: true } },
          },
        }),

        prisma.supplierDocument.findMany({
          where: {
            supplier: { companyId },
            expiresAt: { not: null, gte: rangeStart, lte: rangeEnd },
            status: { in: ['UPLOADED', 'APPROVED'] },
          },
          select: {
            id: true,
            docType: true,
            expiresAt: true,
            supplier: { select: { id: true, name: true } },
          },
        }),
      ]);

    const events = [
      ...requirements.map(r => ({
        id: `req-${r.id}`,
        title: `${r.code} — ${truncate(r.name, 30)}`,
        date: r.dueDate,
        type: 'requirement',
        status: r.status,
        severity: getSeverity(r.dueDate),
        module: 'Requerimientos',
        area: r.responsibleArea || '',
        sourceId: r.id,
        url: `/requirements/${r.id}`,
      })),

      ...activities.map(a => ({
        id: `act-${a.id}`,
        title: `Actividad: ${truncate(a.description, 40)}`,
        date: a.dueDate,
        type: 'activity',
        status: 'PENDING',
        severity: getSeverity(a.dueDate),
        module: 'Actividades',
        area: a.requirement?.responsibleArea || '',
        responsible: a.responsible || '',
        parentCode: a.requirement?.code || '',
        sourceId: a.requirement?.id || a.id,
        url: `/requirements/${a.requirement?.id}`,
      })),

      ...trainings.map(t => ({
        id: `train-${t.id}`,
        title: `Capacitación vence: ${truncate(t.name, 35)}`,
        date: t.expirationDate,
        type: 'training',
        status: 'ACTIVE',
        severity: getSeverity(t.expirationDate),
        module: 'Capacitación',
        area: '',
        sourceId: t.id,
        url: `/training`,
      })),

      ...drills.map(d => ({
        id: `drill-${d.id}`,
        title: `Simulacro planeado: ${d.type}`,
        date: d.plannedDate,
        type: 'drill',
        status: 'PLANNED',
        severity: getSeverity(d.plannedDate),
        module: 'Simulacros',
        area: d.area || '',
        sourceId: d.id,
        url: `/drills`,
      })),

      ...maintenances.map(m => ({
        id: `maint-${m.id}`,
        title: `Mantenimiento: ${truncate(m.name, 35)}`,
        date: m.nextDate,
        type: 'maintenance',
        status: m.status,
        severity: getSeverity(m.nextDate),
        module: 'Mantenimiento',
        area: m.area || '',
        sourceId: m.id,
        url: `/maintenance`,
      })),

      ...risks.map(r => ({
        id: `risk-${r.id}`,
        title: `Control de riesgo: ${truncate(r.hazard, 35)}`,
        date: r.targetDate,
        type: 'risk',
        status: r.riskLevel,
        severity: getSeverity(r.targetDate),
        module: 'Gestión de Riesgos',
        area: r.area || '',
        sourceId: r.id,
        url: `/risks`,
      })),

      ...audits.map(a => ({
        id: `audit-${a.id}`,
        title: `Auditoría: ${truncate(a.title, 35)}`,
        date: a.auditDate,
        type: 'audit',
        status: a.status,
        severity: getSeverity(a.auditDate),
        module: 'Auditorías',
        area: '',
        sourceId: a.id,
        url: `/audits`,
      })),

      ...cmshMeetings.map(m => ({
        id: `cmsh-${m.id}`,
        title: 'Reunión CMSH',
        date: m.nextMeeting,
        type: 'cmsh',
        status: 'SCHEDULED',
        severity: getSeverity(m.nextMeeting),
        module: 'CMSH',
        area: m.location || '',
        sourceId: m.id,
        url: `/cmsh`,
      })),

      ...brigadeMembers.map(b => ({
        id: `brig-${b.id}`,
        title: `Cert. vence: ${truncate(b.employeeName, 25)} (${b.brigade?.type || 'Brigada'})`,
        date: b.certificationExpiry,
        type: 'brigade',
        status: 'PENDING',
        severity: getSeverity(b.certificationExpiry),
        module: 'Brigadas',
        area: 'Seguridad e Higiene',
        sourceId: b.id,
        url: `/brigades`,
      })),

      ...supplierDocs.map(d => ({
        id: `supdoc-${d.id}`,
        title: `Doc. proveedor: ${d.docType} — ${truncate(d.supplier?.name, 25)}`,
        date: d.expiresAt,
        type: 'supplier',
        status: 'EXPIRING',
        severity: getSeverity(d.expiresAt),
        module: 'Proveedores',
        area: '',
        sourceId: d.supplier?.id || d.id,
        url: `/suppliers/${d.supplier?.id}`,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ events, total: events.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCalendarEvents };
