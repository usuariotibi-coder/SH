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

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
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

    const [trainings, drills, cmshMeetings, brigadeMembers] =
      await Promise.all([
        prisma.training.findMany({
          where: { companyId },
          select: { id: true, name: true, expirationDate: true, trainingDate: true, instructor: true },
        }),

        prisma.drill.findMany({
          where: {
            companyId,
            isCompleted: false,
            OR: [{ plannedDate: { gte: rangeStart, lte: rangeEnd } }, { plannedDate: { lt: now } }],
          },
          select: { id: true, type: true, plannedDate: true },
        }),

        prisma.cMSHMeeting.findMany({
          where: {
            company: { id: companyId },
            OR: [{ nextMeeting: { gte: rangeStart, lte: rangeEnd } }, { nextMeeting: { lt: now } }],
          },
          select: { id: true, nextMeeting: true, location: true },
        }),

        prisma.brigadeMember.findMany({
          where: {
            brigade: { companyId },
            isActive: true,
            OR: [{ certificationExpiry: { gte: rangeStart, lte: rangeEnd } }, { certificationExpiry: { lt: now } }],
          },
          select: {
            id: true,
            employeeName: true,
            certificationExpiry: true,
            brigade: { select: { type: true } },
          },
        }),
      ]);

    const events = [
      ...trainings
        .map(t => ({ ...t, effectiveExpiration: t.expirationDate || addYears(t.trainingDate, 1) }))
        .filter(t => (t.effectiveExpiration >= rangeStart && t.effectiveExpiration <= rangeEnd) || t.effectiveExpiration < now)
        .map(t => ({
          id: `train-${t.id}`,
          title: `Capacitación vence: ${truncate(t.name, 35)}`,
          date: t.effectiveExpiration,
          type: 'training',
          status: 'ACTIVE',
          severity: getSeverity(t.effectiveExpiration),
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
        area: '',
        sourceId: d.id,
        url: `/drills`,
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
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ events, total: events.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCalendarEvents };
