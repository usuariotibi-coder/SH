const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getAudits = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;
    const where = {
      companyId: req.user.companyId,
      ...(status && { status }),
    };

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where, skip, take: limit,
        include: { evidences: true },
        orderBy: { auditDate: 'desc' },
      }),
      prisma.audit.count({ where }),
    ]);
    res.json(paginatedResponse(audits, total, page, limit));
  } catch (err) { next(err); }
};

const getAudit = async (req, res, next) => {
  try {
    const audit = await prisma.audit.findUnique({ where: { id: req.params.id }, include: { evidences: true } });
    if (!audit) return res.status(404).json({ error: true, message: 'Auditoría no encontrada', code: 'NOT_FOUND' });
    res.json({ ...audit, checklist: JSON.parse(audit.checklist) });
  } catch (err) { next(err); }
};

const createAudit = async (req, res, next) => {
  try {
    const { title, auditDate, area, auditorName, checklist, findings, correctives } = req.body;
    if (!title || !auditDate || !area || !auditorName) {
      return res.status(400).json({ error: true, message: 'Título, fecha, área y auditor requeridos', code: 'MISSING_FIELDS' });
    }

    const checklistArr = checklist || [];
    const completed = checklistArr.filter(q => q.answer === 'yes');
    const score = checklistArr.length > 0
      ? (completed.length / checklistArr.length) * 100
      : null;

    const audit = await prisma.audit.create({
      data: {
        title, auditDate: new Date(auditDate), area, auditorName, findings, correctives,
        checklist: JSON.stringify(checklistArr),
        score,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json({ ...audit, checklist: checklistArr });
  } catch (err) { next(err); }
};

const updateAudit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, auditDate, area, auditorName, status, checklist, findings, correctives } = req.body;

    const checklistArr = checklist || undefined;
    let score;
    if (checklistArr) {
      const completed = checklistArr.filter(q => q.answer === 'yes');
      score = checklistArr.length > 0 ? (completed.length / checklistArr.length) * 100 : null;
    }

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        title, area, auditorName, status, findings, correctives,
        ...(auditDate && { auditDate: new Date(auditDate) }),
        ...(checklistArr && { checklist: JSON.stringify(checklistArr), score }),
      },
    });
    res.json({ ...audit, checklist: JSON.parse(audit.checklist) });
  } catch (err) { next(err); }
};

const deleteAudit = async (req, res, next) => {
  try {
    await prisma.audit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Auditoría eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getAudits, getAudit, createAudit, updateAudit, deleteAudit };
