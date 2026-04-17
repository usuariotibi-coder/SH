const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const calcRiskLevel = (probability, severity) => {
  const score = probability * severity;
  if (score <= 4) return 'LOW';
  if (score <= 9) return 'MEDIUM';
  if (score <= 16) return 'HIGH';
  return 'CRITICAL';
};

const getRisks = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { riskLevel, area, isControlled } = req.query;
    const where = {
      companyId: req.user.companyId,
      ...(riskLevel && { riskLevel }),
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
      ...(isControlled !== undefined && { isControlled: isControlled === 'true' }),
    };

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({ where, skip, take: limit, orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }] }),
      prisma.risk.count({ where }),
    ]);
    res.json(paginatedResponse(risks, total, page, limit));
  } catch (err) { next(err); }
};

const createRisk = async (req, res, next) => {
  try {
    const { area, hazard, riskDescription, probability, severity, currentControls, proposedControls, responsible, targetDate } = req.body;
    if (!area || !hazard || !riskDescription || !probability || !severity) {
      return res.status(400).json({ error: true, message: 'Área, peligro, descripción, probabilidad y severidad requeridos', code: 'MISSING_FIELDS' });
    }
    const prob = parseInt(probability), sev = parseInt(severity);
    const riskLevel = calcRiskLevel(prob, sev);

    const risk = await prisma.risk.create({
      data: {
        area, hazard, riskDescription,
        probability: prob, severity: sev, riskLevel,
        currentControls, proposedControls, responsible,
        targetDate: targetDate ? new Date(targetDate) : null,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(risk);
  } catch (err) { next(err); }
};

const updateRisk = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { area, hazard, riskDescription, probability, severity, currentControls, proposedControls, responsible, targetDate, isControlled } = req.body;

    const prob = probability ? parseInt(probability) : undefined;
    const sev = severity ? parseInt(severity) : undefined;
    const riskLevel = prob && sev ? calcRiskLevel(prob, sev) : undefined;

    const risk = await prisma.risk.update({
      where: { id },
      data: {
        area, hazard, riskDescription, currentControls, proposedControls, responsible,
        ...(prob && { probability: prob }),
        ...(sev && { severity: sev }),
        ...(riskLevel && { riskLevel }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(isControlled !== undefined && { isControlled }),
      },
    });
    res.json(risk);
  } catch (err) { next(err); }
};

const deleteRisk = async (req, res, next) => {
  try {
    await prisma.risk.delete({ where: { id: req.params.id } });
    res.json({ message: 'Riesgo eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getRisks, createRisk, updateRisk, deleteRisk };
