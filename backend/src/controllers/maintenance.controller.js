const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getMaintenances = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, type } = req.query;
    const where = {
      companyId: req.user.companyId,
      ...(status && { status }),
      ...(type && { type }),
    };

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({ where, skip, take: limit, orderBy: { nextDate: 'asc' } }),
      prisma.maintenance.count({ where }),
    ]);
    res.json(paginatedResponse(maintenances, total, page, limit));
  } catch (err) { next(err); }
};

const createMaintenance = async (req, res, next) => {
  try {
    const { name, type, description, frequency, lastDate, nextDate, responsible, observations } = req.body;
    if (!name || !type || !frequency || !nextDate || !responsible) {
      return res.status(400).json({ error: true, message: 'Nombre, tipo, frecuencia, próxima fecha y responsable requeridos', code: 'MISSING_FIELDS' });
    }
    const maintenance = await prisma.maintenance.create({
      data: {
        name, type, description, frequency,
        lastDate: lastDate ? new Date(lastDate) : null,
        nextDate: new Date(nextDate),
        responsible, observations,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(maintenance);
  } catch (err) { next(err); }
};

const updateMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, frequency, lastDate, nextDate, status, responsible, observations, completedAt } = req.body;
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        name, type, description, frequency, status, responsible, observations,
        ...(lastDate !== undefined && { lastDate: lastDate ? new Date(lastDate) : null }),
        ...(nextDate && { nextDate: new Date(nextDate) }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
    });
    res.json(maintenance);
  } catch (err) { next(err); }
};

const deleteMaintenance = async (req, res, next) => {
  try {
    await prisma.maintenance.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mantenimiento eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance };
