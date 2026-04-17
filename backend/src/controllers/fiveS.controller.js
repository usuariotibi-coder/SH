const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const calcTotal = (seiri, seiton, seiso, seiketsu, shitsuke) =>
  ((seiri + seiton + seiso + seiketsu + shitsuke) / 25) * 100;

const getFiveS = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { area } = req.query;
    const where = {
      companyId: req.user.companyId,
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
    };

    const [records, total] = await Promise.all([
      prisma.fiveS.findMany({ where, skip, take: limit, include: { evidences: true }, orderBy: { auditDate: 'desc' } }),
      prisma.fiveS.count({ where }),
    ]);
    res.json(paginatedResponse(records, total, page, limit));
  } catch (err) { next(err); }
};

const createFiveS = async (req, res, next) => {
  try {
    const { area, auditDate, seiriScore, seitonScore, seisoScore, seiketsuScore, shitsuke, observations, actionPlan, auditorName } = req.body;
    if (!area || !auditDate || !auditorName) {
      return res.status(400).json({ error: true, message: 'Área, fecha y auditor requeridos', code: 'MISSING_FIELDS' });
    }

    const s1 = parseInt(seiriScore), s2 = parseInt(seitonScore), s3 = parseInt(seisoScore);
    const s4 = parseInt(seiketsuScore), s5 = parseInt(shitsuke);
    const totalScore = calcTotal(s1, s2, s3, s4, s5);

    const record = await prisma.fiveS.create({
      data: {
        area, auditDate: new Date(auditDate),
        seiriScore: s1, seitonScore: s2, seisoScore: s3, seiketsuScore: s4, shitsuke: s5,
        totalScore, observations, actionPlan, auditorName,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(record);
  } catch (err) { next(err); }
};

const updateFiveS = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { area, auditDate, seiriScore, seitonScore, seisoScore, seiketsuScore, shitsuke, observations, actionPlan, auditorName } = req.body;

    const s1 = parseInt(seiriScore), s2 = parseInt(seitonScore), s3 = parseInt(seisoScore);
    const s4 = parseInt(seiketsuScore), s5 = parseInt(shitsuke);
    const totalScore = calcTotal(s1, s2, s3, s4, s5);

    const record = await prisma.fiveS.update({
      where: { id },
      data: {
        area, auditDate: auditDate ? new Date(auditDate) : undefined,
        seiriScore: s1, seitonScore: s2, seisoScore: s3, seiketsuScore: s4, shitsuke: s5,
        totalScore, observations, actionPlan, auditorName,
      },
    });
    res.json(record);
  } catch (err) { next(err); }
};

const deleteFiveS = async (req, res, next) => {
  try {
    await prisma.fiveS.delete({ where: { id: req.params.id } });
    res.json({ message: 'Registro 5S eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getFiveS, createFiveS, updateFiveS, deleteFiveS };
