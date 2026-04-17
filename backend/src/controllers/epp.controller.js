const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── EPP ITEMS ────────────────────────────────────────────────────────────────

// GET /api/epp
const getItems = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { category, search, lowStock } = req.query;

    const where = { companyId, isActive: true };
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    // lowStock filter handled post-query to compare with per-row minStock

    const items = await prisma.eppItem.findMany({
      where,
      include: {
        movements: {
          orderBy: { date: 'desc' },
          take: 5,
          include: { registeredBy: { select: { name: true } } },
        },
        areaRequirements: true,
      },
      orderBy: { name: 'asc' },
    });

    // Annotate with lowStock flag
    const annotated = items.map(item => ({
      ...item,
      isLowStock: item.currentStock <= item.minStock,
    }));

    if (lowStock === 'true') return res.json(annotated.filter(i => i.isLowStock));
    res.json(annotated);
  } catch (err) { next(err); }
};

// GET /api/epp/:id
const getItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const item = await prisma.eppItem.findFirst({
      where: { id, companyId },
      include: {
        movements: {
          orderBy: { date: 'desc' },
          include: { registeredBy: { select: { name: true } } },
        },
        areaRequirements: true,
      },
    });

    if (!item) return res.status(404).json({ message: 'Artículo EPP no encontrado' });
    res.json({ ...item, isLowStock: item.currentStock <= item.minStock });
  } catch (err) { next(err); }
};

// POST /api/epp
const createItem = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { name, category, description, unit, minStock, currentStock, partNumber, brand } = req.body;

    const item = await prisma.eppItem.create({
      data: { name, category, description, unit, minStock: Number(minStock) || 0, currentStock: Number(currentStock) || 0, partNumber, brand, companyId },
    });

    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/epp/:id
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, category, description, unit, minStock, partNumber, brand, isActive } = req.body;

    const existing = await prisma.eppItem.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    const item = await prisma.eppItem.update({
      where: { id },
      data: { name, category, description, unit, minStock: Number(minStock), partNumber, brand, isActive },
    });

    res.json(item);
  } catch (err) { next(err); }
};

// DELETE /api/epp/:id
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.eppItem.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    await prisma.eppItem.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Artículo desactivado' });
  } catch (err) { next(err); }
};

// ── MOVEMENTS ───────────────────────────────────────────────────────────────

// POST /api/epp/:id/movements
const createMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const registeredById = req.user.id;
    const { type, quantity, employeeName, employeeArea, reason, date } = req.body;

    const item = await prisma.eppItem.findFirst({ where: { id, companyId } });
    if (!item) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    const qty = Number(quantity);
    let newStock = item.currentStock;

    if (type === 'ENTRY' || type === 'RETURN') {
      newStock += qty;
    } else if (type === 'EXIT') {
      if (item.currentStock < qty) return res.status(400).json({ message: 'Stock insuficiente' });
      newStock -= qty;
    } else if (type === 'ADJUSTMENT') {
      newStock = qty; // Adjustment sets absolute value
    }

    const [movement] = await prisma.$transaction([
      prisma.eppMovement.create({
        data: {
          type,
          quantity: qty,
          balanceAfter: newStock,
          employeeName,
          employeeArea,
          reason,
          date: date ? new Date(date) : new Date(),
          eppItemId: id,
          registeredById,
        },
      }),
      prisma.eppItem.update({
        where: { id },
        data: { currentStock: newStock },
      }),
    ]);

    res.status(201).json({ movement, newStock });
  } catch (err) { next(err); }
};

// ── MATRIX ──────────────────────────────────────────────────────────────────

// GET /api/epp/matrix
const getMatrix = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const requirements = await prisma.eppAreaRequirement.findMany({
      where: { companyId },
      include: { eppItem: { select: { id: true, name: true, category: true } } },
      orderBy: [{ areaName: 'asc' }, { eppItem: { name: 'asc' } }],
    });

    // Group by area
    const matrix = {};
    for (const req of requirements) {
      if (!matrix[req.areaName]) matrix[req.areaName] = [];
      matrix[req.areaName].push(req);
    }

    res.json(matrix);
  } catch (err) { next(err); }
};

// POST /api/epp/matrix
const upsertMatrixEntry = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { eppItemId, areaName, mandatory, notes } = req.body;

    const entry = await prisma.eppAreaRequirement.upsert({
      where: { eppItemId_areaName_companyId: { eppItemId, areaName, companyId } },
      update: { mandatory: mandatory !== false, notes },
      create: { eppItemId, areaName, mandatory: mandatory !== false, notes, companyId },
    });

    res.status(201).json(entry);
  } catch (err) { next(err); }
};

// DELETE /api/epp/matrix/:entryId
const deleteMatrixEntry = async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const companyId = req.user.companyId;

    const entry = await prisma.eppAreaRequirement.findFirst({ where: { id: entryId, companyId } });
    if (!entry) return res.status(404).json({ message: 'Entrada no encontrada' });

    await prisma.eppAreaRequirement.delete({ where: { id: entryId } });
    res.json({ message: 'Entrada eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, createMovement, getMatrix, upsertMatrixEntry, deleteMatrixEntry };
