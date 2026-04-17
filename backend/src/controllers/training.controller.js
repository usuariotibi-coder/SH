const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search } = req.query;
    const where = {
      companyId: req.user.companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { instructor: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where, skip, take: limit,
        include: { createdBy: { select: { name: true } } },
        orderBy: { trainingDate: 'desc' },
      }),
      prisma.training.count({ where }),
    ]);

    const parsed = trainings.map(t => ({ ...t, participants: JSON.parse(t.participants) }));
    res.json(paginatedResponse(parsed, total, page, limit));
  } catch (err) { next(err); }
};

const getTraining = async (req, res, next) => {
  try {
    const training = await prisma.training.findUnique({ where: { id: req.params.id } });
    if (!training) return res.status(404).json({ error: true, message: 'Capacitación no encontrada', code: 'NOT_FOUND' });
    res.json({ ...training, participants: JSON.parse(training.participants) });
  } catch (err) { next(err); }
};

const createTraining = async (req, res, next) => {
  try {
    const { name, description, instructor, trainingDate, durationHours, location, normReference, participants, expirationDate } = req.body;
    if (!name || !instructor || !trainingDate || !durationHours) {
      return res.status(400).json({ error: true, message: 'Nombre, instructor, fecha y duración requeridos', code: 'MISSING_FIELDS' });
    }

    const participantsArr = Array.isArray(participants) ? participants : (participants || '').split(',').map(p => p.trim()).filter(Boolean);

    const training = await prisma.training.create({
      data: {
        name, description, instructor,
        trainingDate: new Date(trainingDate),
        durationHours: parseFloat(durationHours),
        location, normReference,
        participants: JSON.stringify(participantsArr),
        participantCount: participantsArr.length,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        companyId: req.user.companyId,
        createdById: req.user.id,
      },
    });

    res.status(201).json({ ...training, participants: participantsArr });
  } catch (err) { next(err); }
};

const updateTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, instructor, trainingDate, durationHours, location, normReference, participants, expirationDate, isCompleted } = req.body;

    const participantsArr = participants
      ? (Array.isArray(participants) ? participants : participants.split(',').map(p => p.trim()).filter(Boolean))
      : undefined;

    const training = await prisma.training.update({
      where: { id },
      data: {
        name, description, instructor, location, normReference, isCompleted,
        ...(trainingDate && { trainingDate: new Date(trainingDate) }),
        ...(durationHours && { durationHours: parseFloat(durationHours) }),
        ...(participantsArr && { participants: JSON.stringify(participantsArr), participantCount: participantsArr.length }),
        ...(expirationDate !== undefined && { expirationDate: expirationDate ? new Date(expirationDate) : null }),
      },
    });

    res.json({ ...training, participants: JSON.parse(training.participants) });
  } catch (err) { next(err); }
};

const deleteTraining = async (req, res, next) => {
  try {
    await prisma.training.delete({ where: { id: req.params.id } });
    res.json({ message: 'Capacitación eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getTrainings, getTraining, createTraining, updateTraining, deleteTraining };
