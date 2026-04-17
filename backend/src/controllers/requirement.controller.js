const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');
const { computeRequirementStatus } = require('../utils/requirementStatus.utils');

const prisma = new PrismaClient();

const getRequirements = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { page, limit, skip } = getPagination(req.query);
    const { status, legalSource, area, search } = req.query;

    const where = {
      companyId,
      ...(status && { status }),
      ...(legalSource && { legalSource }),
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [requirements, total] = await Promise.all([
      prisma.requirement.findMany({
        where, skip, take: limit,
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { activities: true, evidences: true } },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      }),
      prisma.requirement.count({ where }),
    ]);

    res.json(paginatedResponse(requirements, total, page, limit));
  } catch (err) { next(err); }
};

const getRequirement = async (req, res, next) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        activities: {
          orderBy: { dueDate: 'asc' },
        },
        evidences: true,
      },
    });
    if (!requirement) return res.status(404).json({ error: true, message: 'Requerimiento no encontrado', code: 'NOT_FOUND' });
    res.json(requirement);
  } catch (err) { next(err); }
};

const createRequirement = async (req, res, next) => {
  try {
    const {
      code, name, specificRequirement, legalSource, legalBasis, area,
      dueDate, responsibleArea, notes,
      normName, normObjective, applicabilityJustification, applicabilityScope,
    } = req.body;
    if (!code || !name || !specificRequirement || !legalSource) {
      return res.status(400).json({ error: true, message: 'Código, nombre, requerimiento específico y fuente legal son requeridos', code: 'MISSING_FIELDS' });
    }

    const requirement = await prisma.requirement.create({
      data: {
        code, name, specificRequirement, legalSource, legalBasis, area,
        dueDate: dueDate ? new Date(dueDate) : null,
        responsibleArea, notes,
        normName: normName || null,
        normObjective: normObjective || null,
        applicabilityJustification: applicabilityJustification || null,
        applicabilityScope: applicabilityScope || null,
        companyId: req.user.companyId,
        createdById: req.user.id,
      },
    });

    res.status(201).json(requirement);
  } catch (err) { next(err); }
};

const updateRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code, name, specificRequirement, legalSource, legalBasis, area, status,
      dueDate, responsibleArea, notes, activities,
      normName, normObjective, applicabilityJustification, applicabilityScope,
    } = req.body;

    // ── 1. Preparar datos base del requerimiento ──────────────────
    const reqData = {
      code, name, specificRequirement, legalSource, legalBasis, area, responsibleArea, notes,
      normName: normName ?? undefined,
      normObjective: normObjective ?? undefined,
      applicabilityJustification: applicabilityJustification ?? undefined,
      applicabilityScope: applicabilityScope ?? undefined,
    };
    if (dueDate !== undefined) reqData.dueDate = dueDate ? new Date(dueDate) : null;

    await prisma.$transaction(async (tx) => {
      // ── 2. Gestionar el array de actividades si viene en el body ──
      if (Array.isArray(activities)) {
        const existingActivities = await tx.activity.findMany({ where: { requirementId: id } });

        // IDs a conservar (los que NO tienen prefijo "new-")
        const idsToKeep = activities.filter(a => !a.id.startsWith('new-')).map(a => a.id);

        // Eliminar las que ya no están en el array
        const idsToDelete = existingActivities
          .map(a => a.id)
          .filter(existingId => !idsToKeep.includes(existingId));

        if (idsToDelete.length > 0) {
          await tx.activity.deleteMany({ where: { id: { in: idsToDelete } } });
        }

        // Upsert las existentes / crear las nuevas
        for (const act of activities) {
          const actStatus = act.activityStatus || (act.isCompleted ? 'COMPLETED' : 'PENDING');
          const actData = {
            description: act.description,
            responsible: act.responsible || '',
            dueDate: new Date(act.dueDate),
            activityStatus: actStatus,
            completedAt: actStatus === 'COMPLETED' ? (act.completedAt ? new Date(act.completedAt) : new Date()) : null,
            notes: act.notes || null,
          };

          if (act.id.startsWith('new-')) {
            await tx.activity.create({
              data: { ...actData, requirementId: id, userId: req.user.id },
            });
          } else {
            await tx.activity.update({ where: { id: act.id }, data: actData });
          }
        }
      }

      // ── 3. Recalcular status basado en actividades resultantes ────
      const updatedActivities = await tx.activity.findMany({ where: { requirementId: id } });
      const currentReq = await tx.requirement.findUnique({ where: { id }, select: { status: true } });

      // Si el body pide NOT_APPLICABLE, respetarlo siempre
      const baseStatus = status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : currentReq.status;
      const computed = computeRequirementStatus(updatedActivities, baseStatus);

      if (computed) {
        reqData.status = computed.status;
        reqData.completedAt = computed.completedAt;
      } else if (status && status === 'NOT_APPLICABLE') {
        reqData.status = 'NOT_APPLICABLE';
        reqData.completedAt = null;
      } else if (status && updatedActivities.length === 0) {
        // Sin actividades → status manual
        reqData.status = status;
        if (status === 'COMPLETED') reqData.completedAt = new Date();
      }

      await tx.requirement.update({ where: { id }, data: reqData });
    });

    const updated = await prisma.requirement.findUnique({
      where: { id },
      include: { activities: { orderBy: { dueDate: 'asc' } }, evidences: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteRequirement = async (req, res, next) => {
  try {
    await prisma.requirement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Requerimiento eliminado' });
  } catch (err) { next(err); }
};

// ── Activities (endpoints legacy, aún usados por RequirementDetailPage) ──

const createActivity = async (req, res, next) => {
  try {
    const { requirementId } = req.params;
    const { description, responsible, dueDate, notes } = req.body;
    if (!description || !dueDate) {
      return res.status(400).json({ error: true, message: 'Descripción y fecha requeridas', code: 'MISSING_FIELDS' });
    }

    const activity = await prisma.activity.create({
      data: { description, responsible: responsible || '', dueDate: new Date(dueDate), notes, activityStatus: 'PENDING', requirementId, userId: req.user.id },
    });

    // Recalcular status del requerimiento padre
    const [allActivities, req_] = await Promise.all([
      prisma.activity.findMany({ where: { requirementId } }),
      prisma.requirement.findUnique({ where: { id: requirementId }, select: { status: true } }),
    ]);
    const computed = computeRequirementStatus(allActivities, req_.status);
    if (computed) await prisma.requirement.update({ where: { id: requirementId }, data: { status: computed.status, completedAt: computed.completedAt } });

    res.status(201).json(activity);
  } catch (err) { next(err); }
};

const updateActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { description, responsible, dueDate, notes, activityStatus, isCompleted } = req.body;

    const data = { description, notes };
    if (responsible !== undefined) data.responsible = responsible;
    if (dueDate) data.dueDate = new Date(dueDate);

    // Soportar tanto activityStatus nuevo como isCompleted legacy
    if (activityStatus !== undefined) {
      data.activityStatus = activityStatus;
      data.completedAt = activityStatus === 'COMPLETED' ? new Date() : null;
    } else if (isCompleted !== undefined) {
      data.activityStatus = isCompleted ? 'COMPLETED' : 'PENDING';
      data.completedAt = isCompleted ? new Date() : null;
    }

    const activity = await prisma.activity.update({ where: { id: activityId }, data });

    // Recalcular status del requerimiento padre
    const [allActivities, req_] = await Promise.all([
      prisma.activity.findMany({ where: { requirementId: activity.requirementId } }),
      prisma.requirement.findUnique({ where: { id: activity.requirementId }, select: { status: true } }),
    ]);
    const computed = computeRequirementStatus(allActivities, req_.status);
    if (computed) await prisma.requirement.update({ where: { id: activity.requirementId }, data: { status: computed.status, completedAt: computed.completedAt } });

    res.json(activity);
  } catch (err) { next(err); }
};

const deleteActivity = async (req, res, next) => {
  try {
    const activity = await prisma.activity.findUnique({ where: { id: req.params.activityId }, select: { requirementId: true } });
    await prisma.activity.delete({ where: { id: req.params.activityId } });

    if (activity) {
      const [allActivities, req_] = await Promise.all([
        prisma.activity.findMany({ where: { requirementId: activity.requirementId } }),
        prisma.requirement.findUnique({ where: { id: activity.requirementId }, select: { status: true } }),
      ]);
      const computed = computeRequirementStatus(allActivities, req_.status);
      if (computed) await prisma.requirement.update({ where: { id: activity.requirementId }, data: { status: computed.status, completedAt: computed.completedAt } });
    }

    res.json({ message: 'Actividad eliminada' });
  } catch (err) { next(err); }
};

// PATCH — actualización parcial de campos descriptivos (sin recalcular status)
const patchRequirement = async (req, res, next) => {
  try {
    const allowed = ['specificRequirement', 'normName', 'normObjective', 'applicabilityJustification', 'applicabilityScope', 'notes'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: true, message: 'No hay campos válidos para actualizar', code: 'NO_FIELDS' });
    }
    const updated = await prisma.requirement.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) { next(err); }
};

module.exports = {
  getRequirements, getRequirement, createRequirement, updateRequirement, deleteRequirement,
  createActivity, updateActivity, deleteActivity, patchRequirement,
};
