const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getKPIs = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReqs, completedReqs, overdueReqs,
      incidentsYear, incidentsMonth,
      trainingsYear, drillsYear, drillsCompleted,
      avgFiveS,
      suppliersTotal, suppliersActive,
      eppLowStock,
      chemicalsNoSds,
      suppliersDocExpired,
    ] = await Promise.all([
      prisma.requirement.count({ where: { companyId } }),
      prisma.requirement.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.requirement.count({ where: { companyId, status: 'OVERDUE' } }),
      prisma.incident.count({ where: { companyId, occurredAt: { gte: startOfYear } } }),
      prisma.incident.count({ where: { companyId, occurredAt: { gte: startOfMonth } } }),
      prisma.training.count({ where: { companyId, trainingDate: { gte: startOfYear } } }),
      prisma.drill.count({ where: { companyId, plannedDate: { gte: startOfYear } } }),
      prisma.drill.count({ where: { companyId, plannedDate: { gte: startOfYear }, isCompleted: true } }),
      prisma.fiveS.aggregate({ where: { companyId }, _avg: { totalScore: true } }),
      prisma.supplier.count({ where: { companyId } }),
      prisma.supplier.count({ where: { companyId, status: 'ACTIVE' } }),
      // EPP items where currentStock <= minStock
      prisma.eppItem.count({ where: { companyId, isActive: true, currentStock: { lte: 0 } } }),
      // Chemicals without an SDS file
      prisma.chemicalProduct.count({
        where: { companyId, isActive: true, files: { none: { fileType: 'SDS' } } },
      }),
      // Supplier documents expired
      prisma.supplierDocument.count({
        where: {
          supplier: { companyId },
          status: 'UPLOADED',
          expiresAt: { lt: now },
        },
      }),
    ]);

    const complianceRate = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;

    // Tasa de frecuencia (TF) = (accidentes / horas trabajadas) × 1,000,000
    // Usando estimación de 2000 horas/año por trabajador promedio
    const accidents = await prisma.incident.count({ where: { companyId, type: 'ACCIDENT', occurredAt: { gte: startOfYear } } });
    const lostDaysResult = await prisma.incident.aggregate({
      where: { companyId, occurredAt: { gte: startOfYear } },
      _sum: { lostDays: true },
    });

    // ── EPP metrics ──────────────────────────────────────────────────────────
    const [eppItems, eppLots] = await Promise.all([
      prisma.eppItem.findMany({
        where: { companyId, isActive: true },
        select: { id: true, currentStock: true, minStock: true, maxStock: true },
      }),
      prisma.eppLot.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 1. Valor inventario actual (FIFO)
    const eppCurrentValue = eppLots
      .filter(l => l.remaining > 0)
      .reduce((sum, l) => sum + l.remaining * l.unitPrice, 0);

    // Last known price per item (most recent lot)
    const lastPrice = {};
    for (const lot of eppLots) {
      if (lastPrice[lot.eppItemId] === undefined) lastPrice[lot.eppItemId] = lot.unitPrice;
    }

    // 2. Valor inventario completo (all items at maxStock × last price)
    const eppFullValue = eppItems.reduce((sum, item) => {
      if (!item.maxStock) return sum;
      return sum + item.maxStock * (lastPrice[item.id] || 0);
    }, 0);

    // 3 & 4. Items below minStock that need purchasing (up to maxStock)
    const needsBuying = eppItems.filter(i => i.maxStock > 0 && i.currentStock < i.minStock);
    const eppUnitsToBuy = needsBuying.reduce((sum, i) => sum + Math.max(0, i.maxStock - i.currentStock), 0);
    const eppBuyCost   = needsBuying.reduce((sum, i) => {
      const units = Math.max(0, i.maxStock - i.currentStock);
      return sum + units * (lastPrice[i.id] || 0);
    }, 0);

    const round2 = (n) => Math.round(n * 100) / 100;

    res.json({
      complianceRate,
      totalRequirements: totalReqs,
      completedRequirements: completedReqs,
      overdueRequirements: overdueReqs,
      incidentsYear,
      incidentsMonth,
      accidents,
      lostDays: lostDaysResult._sum.lostDays || 0,
      trainingsYear,
      drillsYear,
      drillsCompleted,
      drillsRate: drillsYear > 0 ? Math.round((drillsCompleted / drillsYear) * 100) : 0,
      avgFiveS: Math.round((avgFiveS._avg.totalScore || 0) * 10) / 10,
      suppliersTotal,
      suppliersActive,
      suppliersDocExpired,
      eppLowStock,
      chemicalsNoSds,
      eppCurrentValue:  round2(eppCurrentValue),
      eppFullValue:     round2(eppFullValue),
      eppUnitsToBuy,
      eppBuyCost:       round2(eppBuyCost),
      eppItemsBelowMin: needsBuying.length,
    });
  } catch (err) { next(err); }
};

const getChartData = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();

    // Requerimientos por estado
    const reqByStatus = await prisma.requirement.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { status: true },
    });

    // Incidentes por mes (últimos 12)
    const incidentsByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await prisma.incident.count({
        where: { companyId, occurredAt: { gte: start, lte: end } },
      });
      incidentsByMonth.push({
        month: start.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    // Cumplimiento por área
    const reqByArea = await prisma.requirement.groupBy({
      by: ['responsibleArea'],
      where: { companyId, responsibleArea: { not: null } },
      _count: { id: true },
    });

    const completedByArea = await prisma.requirement.groupBy({
      by: ['responsibleArea'],
      where: { companyId, status: 'COMPLETED', responsibleArea: { not: null } },
      _count: { id: true },
    });

    const completedMap = Object.fromEntries(completedByArea.map(r => [r.responsibleArea, r._count.id]));
    const areaCompliance = reqByArea.map(r => ({
      area: r.responsibleArea || 'Sin área',
      total: r._count.id,
      completed: completedMap[r.responsibleArea] || 0,
      rate: Math.round(((completedMap[r.responsibleArea] || 0) / r._count.id) * 100),
    }));

    // Tendencia 5S
    const fiveSTrend = await prisma.fiveS.findMany({
      where: { companyId },
      select: { auditDate: true, area: true, totalScore: true },
      orderBy: { auditDate: 'asc' },
      take: 20,
    });

    res.json({
      requirementsByStatus: reqByStatus.map(r => ({ status: r.status, count: r._count.status })),
      incidentsByMonth,
      areaCompliance,
      fiveSTrend: fiveSTrend.map(r => ({
        date: r.auditDate.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        area: r.area,
        score: Math.round(r.totalScore * 10) / 10,
      })),
    });
  } catch (err) { next(err); }
};

const getAlerts = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const alerts = await prisma.alert.findMany({
      where: { companyId, isRead: false },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    res.json(alerts);
  } catch (err) { next(err); }
};

const markAlertRead = async (req, res, next) => {
  try {
    await prisma.alert.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ message: 'Alerta marcada como leída' });
  } catch (err) { next(err); }
};

module.exports = { getKPIs, getChartData, getAlerts, markAlertRead };
