const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const generateFolio = async (companyId) => {
  const year = new Date().getFullYear();
  const count = await prisma.incident.count({
    where: { companyId, folio: { startsWith: `INC-${year}-` } },
  });
  return `INC-${year}-${String(count + 1).padStart(3, '0')}`;
};

const getIncidents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { type, severity, isClosed, search } = req.query;

    const where = {
      companyId: req.user.companyId,
      ...(type && { type }),
      ...(severity && { severity }),
      ...(isClosed !== undefined && { isClosed: isClosed === 'true' }),
      ...(search && {
        OR: [
          { folio: { contains: search, mode: 'insensitive' } },
          { area: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where, skip, take: limit,
        include: { createdBy: { select: { name: true } } },
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json(paginatedResponse(incidents, total, page, limit));
  } catch (err) { next(err); }
};

const getIncident = async (req, res, next) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true } },
        evidences: true,
      },
    });
    if (!incident) return res.status(404).json({ error: true, message: 'Incidente no encontrado', code: 'NOT_FOUND' });
    res.json(incident);
  } catch (err) { next(err); }
};

const createIncident = async (req, res, next) => {
  try {
    const folio = await generateFolio(req.user.companyId);
    const {
      type, severity, occurredAt, area, description,
      injuredName, injuredPosition, rootCause, correctiveAction,
      imssReportNo, lostDays, isReportedIMSS,
    } = req.body;

    if (!type || !severity || !occurredAt || !area || !description) {
      return res.status(400).json({ error: true, message: 'Tipo, gravedad, fecha, área y descripción son requeridos', code: 'MISSING_FIELDS' });
    }

    const incident = await prisma.incident.create({
      data: {
        folio, type, severity,
        occurredAt: new Date(occurredAt),
        area, description,
        injuredName, injuredPosition, rootCause, correctiveAction,
        imssReportNo, lostDays: lostDays || 0,
        isReportedIMSS: isReportedIMSS || false,
        companyId: req.user.companyId,
        createdById: req.user.id,
      },
    });

    res.status(201).json(incident);
  } catch (err) { next(err); }
};

const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type, severity, occurredAt, area, description,
      injuredName, injuredPosition, rootCause, correctiveAction,
      imssReportNo, lostDays, isReportedIMSS, isClosed,
    } = req.body;

    const data = {
      type, severity, area, description,
      injuredName, injuredPosition, rootCause, correctiveAction,
      imssReportNo, lostDays, isReportedIMSS,
    };

    if (occurredAt) data.occurredAt = new Date(occurredAt);
    if (isClosed !== undefined) {
      data.isClosed = isClosed;
      data.closedAt = isClosed ? new Date() : null;
    }

    const incident = await prisma.incident.update({ where: { id }, data });
    res.json(incident);
  } catch (err) { next(err); }
};

const deleteIncident = async (req, res, next) => {
  try {
    await prisma.incident.delete({ where: { id: req.params.id } });
    res.json({ message: 'Incidente eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getIncidents, getIncident, createIncident, updateIncident, deleteIncident };
