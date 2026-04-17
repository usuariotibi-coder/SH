const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getDrills = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = { companyId: req.user.companyId };

    const [drills, total] = await Promise.all([
      prisma.drill.findMany({ where, skip, take: limit, include: { evidences: true }, orderBy: { plannedDate: 'desc' } }),
      prisma.drill.count({ where }),
    ]);
    res.json(paginatedResponse(drills, total, page, limit));
  } catch (err) { next(err); }
};

const getDrill = async (req, res, next) => {
  try {
    const drill = await prisma.drill.findUnique({ where: { id: req.params.id }, include: { evidences: true } });
    if (!drill) return res.status(404).json({ error: true, message: 'Simulacro no encontrado', code: 'NOT_FOUND' });
    res.json(drill);
  } catch (err) { next(err); }
};

const createDrill = async (req, res, next) => {
  try {
    const { type, plannedDate, executedDate, participantCount, evacuationTime, observations, correctives } = req.body;
    if (!type || !plannedDate) {
      return res.status(400).json({ error: true, message: 'Tipo y fecha planeada requeridos', code: 'MISSING_FIELDS' });
    }
    const drill = await prisma.drill.create({
      data: {
        type,
        plannedDate: new Date(plannedDate),
        executedDate: executedDate ? new Date(executedDate) : null,
        participantCount: participantCount ? parseInt(participantCount) : null,
        evacuationTime: evacuationTime ? parseInt(evacuationTime) : null,
        observations, correctives,
        isCompleted: !!executedDate,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(drill);
  } catch (err) { next(err); }
};

const updateDrill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, plannedDate, executedDate, participantCount, evacuationTime, observations, correctives, isCompleted } = req.body;
    const drill = await prisma.drill.update({
      where: { id },
      data: {
        type,
        ...(plannedDate && { plannedDate: new Date(plannedDate) }),
        ...(executedDate !== undefined && { executedDate: executedDate ? new Date(executedDate) : null }),
        participantCount: participantCount ? parseInt(participantCount) : undefined,
        evacuationTime: evacuationTime ? parseInt(evacuationTime) : undefined,
        observations, correctives,
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });
    res.json(drill);
  } catch (err) { next(err); }
};

const deleteDrill = async (req, res, next) => {
  try {
    await prisma.drill.delete({ where: { id: req.params.id } });
    res.json({ message: 'Simulacro eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getDrills, getDrill, createDrill, updateDrill, deleteDrill };
