const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getProgram = async (req, res, next) => {
  try {
    const program = await prisma.sHProgram.findUnique({ where: { companyId: req.user.companyId } });
    if (!program) return res.status(404).json({ error: true, message: 'Programa SH no encontrado', code: 'NOT_FOUND' });
    res.json(program);
  } catch (err) { next(err); }
};

const upsertProgram = async (req, res, next) => {
  try {
    const { year, objectives, scope, budget, responsible, approvedBy, approvedAt, notes } = req.body;
    if (!year || !objectives || !responsible) {
      return res.status(400).json({ error: true, message: 'Año, objetivos y responsable requeridos', code: 'MISSING_FIELDS' });
    }

    const program = await prisma.sHProgram.upsert({
      where: { companyId: req.user.companyId },
      update: {
        year: parseInt(year), objectives, scope, budget: budget ? parseFloat(budget) : null,
        responsible, approvedBy,
        approvedAt: approvedAt ? new Date(approvedAt) : null,
        notes,
      },
      create: {
        year: parseInt(year), objectives, scope, budget: budget ? parseFloat(budget) : null,
        responsible, approvedBy,
        approvedAt: approvedAt ? new Date(approvedAt) : null,
        notes,
        companyId: req.user.companyId,
      },
    });
    res.json(program);
  } catch (err) { next(err); }
};

module.exports = { getProgram, upsertProgram };
