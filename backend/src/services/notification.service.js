const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAYS_AHEAD = 15;

const generateAlerts = async () => {
  const companies = await prisma.company.findMany({ where: { isActive: true } });

  for (const company of companies) {
    const companyId = company.id;
    const now = new Date();
    const soon = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

    // Clear old alerts
    await prisma.alert.deleteMany({ where: { companyId } });

    const newAlerts = [];

    // Requerimientos vencidos
    const overdueReqs = await prisma.requirement.findMany({
      where: { companyId, status: { not: 'COMPLETED' }, dueDate: { lt: now } },
      select: { id: true, code: true, name: true },
    });
    overdueReqs.forEach(r => newAlerts.push({
      type: 'REQUIREMENT_OVERDUE',
      title: 'Requerimiento vencido',
      description: `${r.code} — ${r.name}`,
      priority: 3,
      relatedId: r.id,
      companyId,
    }));

    // Requerimientos próximos a vencer
    const dueSoonReqs = await prisma.requirement.findMany({
      where: { companyId, status: { not: 'COMPLETED' }, dueDate: { gte: now, lte: soon } },
      select: { id: true, code: true, name: true },
    });
    dueSoonReqs.forEach(r => newAlerts.push({
      type: 'REQUIREMENT_DUE_SOON',
      title: 'Requerimiento próximo a vencer',
      description: `${r.code} — ${r.name}`,
      priority: 2,
      relatedId: r.id,
      companyId,
    }));

    // Mantenimientos vencidos
    const overdueMaint = await prisma.maintenance.findMany({
      where: { companyId, nextDate: { lt: now }, status: { not: 'COMPLETED' } },
      select: { id: true, name: true },
    });
    overdueMaint.forEach(m => newAlerts.push({
      type: 'MAINTENANCE_OVERDUE',
      title: 'Mantenimiento vencido',
      description: m.name,
      priority: 3,
      relatedId: m.id,
      companyId,
    }));

    // Mantenimientos próximos
    const dueSoonMaint = await prisma.maintenance.findMany({
      where: { companyId, nextDate: { gte: now, lte: soon }, status: { not: 'COMPLETED' } },
      select: { id: true, name: true },
    });
    dueSoonMaint.forEach(m => newAlerts.push({
      type: 'MAINTENANCE_DUE_SOON',
      title: 'Mantenimiento próximo',
      description: m.name,
      priority: 1,
      relatedId: m.id,
      companyId,
    }));

    // Capacitaciones por vencer
    const expiringTrainings = await prisma.training.findMany({
      where: { companyId, expirationDate: { gte: now, lte: soon } },
      select: { id: true, name: true },
    });
    expiringTrainings.forEach(t => newAlerts.push({
      type: 'TRAINING_EXPIRING',
      title: 'Capacitación próxima a vencer',
      description: t.name,
      priority: 2,
      relatedId: t.id,
      companyId,
    }));

    // CMSH: reunión del mes no registrada
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const cmshMeetingThisMonth = await prisma.cMSHMeeting.count({
      where: { companyId, meetingDate: { gte: startOfMonth } },
    });
    if (cmshMeetingThisMonth === 0) {
      newAlerts.push({
        type: 'CMSH_MEETING_MISSING',
        title: 'Reunión CMSH del mes no registrada',
        description: 'No se ha registrado acta de reunión CMSH este mes',
        priority: 2,
        companyId,
      });
    }

    // Simulacros planeados no ejecutados
    const pendingDrills = await prisma.drill.findMany({
      where: { companyId, plannedDate: { lt: now }, isCompleted: false },
      select: { id: true, type: true },
    });
    pendingDrills.forEach(d => newAlerts.push({
      type: 'DRILL_PENDING',
      title: 'Simulacro no ejecutado',
      description: `Simulacro tipo ${d.type} pendiente de ejecución`,
      priority: 2,
      relatedId: d.id,
      companyId,
    }));

    if (newAlerts.length > 0) {
      await prisma.alert.createMany({ data: newAlerts });
    }
  }

  console.log(`Alertas generadas: ${new Date().toISOString()}`);
};

module.exports = { generateAlerts };
