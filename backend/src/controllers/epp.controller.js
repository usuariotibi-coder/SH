const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

// Consume lots FIFO for an EXIT movement. Returns array of Prisma update ops.
// Throws if insufficient stock.
async function buildFifoOps(eppItemId, companyId, qty) {
  const lots = await prisma.eppLot.findMany({
    where: { eppItemId, companyId, remaining: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });

  let remaining = qty;
  const ops = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const consume = Math.min(lot.remaining, remaining);
    ops.push(
      prisma.eppLot.update({
        where: { id: lot.id },
        data: { remaining: lot.remaining - consume },
      })
    );
    remaining -= consume;
  }

  if (remaining > 0) throw new Error('Stock insuficiente en lotes FIFO');
  return ops;
}

// ── EPP ITEMS ────────────────────────────────────────────────────────────────

// GET /api/epp
const getItems = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { category, search, lowStock } = req.query;

    const where = { companyId, isActive: true };
    if (category) where.category = category;
    if (search)   where.name = { contains: search, mode: 'insensitive' };

    const [items, lots] = await Promise.all([
      prisma.eppItem.findMany({
        where,
        include: {
          movements: {
            orderBy: { date: 'desc' },
            take: 10,
            include: { registeredBy: { select: { name: true } } },
          },
          areaRequirements: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.eppLot.findMany({
        where: { companyId, remaining: { gt: 0 } },
      }),
    ]);

    // FIFO value per item
    const fifoValue = {};
    for (const lot of lots) {
      fifoValue[lot.eppItemId] = (fifoValue[lot.eppItemId] || 0) + lot.remaining * lot.unitPrice;
    }

    const annotated = items.map(item => ({
      ...item,
      isLowStock:     item.currentStock <= item.minStock,
      totalUsers:     item.areaRequirements.reduce((s, r) => s + (r.userCount || 1), 0),
      inventoryValue: Math.round((fifoValue[item.id] || 0) * 100) / 100,
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

    const [item, lots] = await Promise.all([
      prisma.eppItem.findFirst({
        where: { id, companyId },
        include: {
          movements: {
            orderBy: { date: 'desc' },
            include: { registeredBy: { select: { name: true } } },
          },
          areaRequirements: true,
        },
      }),
      prisma.eppLot.findMany({ where: { eppItemId: id, companyId, remaining: { gt: 0 } } }),
    ]);

    if (!item) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    const inventoryValue = lots.reduce((s, l) => s + l.remaining * l.unitPrice, 0);
    res.json({ ...item, isLowStock: item.currentStock <= item.minStock, inventoryValue: Math.round(inventoryValue * 100) / 100 });
  } catch (err) { next(err); }
};

// POST /api/epp
const createItem = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { name, category, description, unit, minStock, maxStock, currentStock, partNumber, brand } = req.body;

    const item = await prisma.eppItem.create({
      data: { name, category, description, unit, minStock: Number(minStock) || 0, maxStock: Number(maxStock) || 0, currentStock: Number(currentStock) || 0, partNumber, brand, companyId },
    });

    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/epp/:id
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, category, description, unit, minStock, maxStock, partNumber, brand, isActive } = req.body;

    const existing = await prisma.eppItem.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    const item = await prisma.eppItem.update({
      where: { id },
      data: { name, category, description, unit, minStock: Number(minStock), maxStock: Number(maxStock) || 0, partNumber, brand, isActive },
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

// ── MOVEMENTS ────────────────────────────────────────────────────────────────

// POST /api/epp/:id/movements
const createMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId      = req.user.companyId;
    const registeredById = req.user.id;
    const { type, quantity, employeeName, employeeArea, frequency, supplier, price, reason } = req.body;

    const item = await prisma.eppItem.findFirst({ where: { id, companyId } });
    if (!item) return res.status(404).json({ message: 'Artículo EPP no encontrado' });

    const qty = Number(quantity);
    let newStock = item.currentStock;
    const extraOps = [];

    if (type === 'ENTRY' || type === 'RETURN') {
      newStock += qty;
      if (type === 'ENTRY') {
        // Create FIFO lot
        extraOps.push(prisma.eppLot.create({
          data: { quantity: qty, remaining: qty, unitPrice: price ? Number(price) : 0, eppItemId: id, companyId },
        }));
      }
    } else if (type === 'EXIT') {
      if (item.currentStock < qty) return res.status(400).json({ message: 'Stock insuficiente' });
      newStock -= qty;
      // Consume FIFO lots
      try {
        const fifoOps = await buildFifoOps(id, companyId, qty);
        extraOps.push(...fifoOps);
      } catch { return res.status(400).json({ message: 'Stock insuficiente en lotes registrados' }); }
    } else if (type === 'ADJUSTMENT') {
      newStock = qty;
    }

    const [movement] = await prisma.$transaction([
      prisma.eppMovement.create({
        data: {
          type,
          quantity: qty,
          balanceAfter: newStock,
          employeeName,
          employeeArea,
          frequency,
          supplier:  supplier || null,
          price:     price    ? Number(price) : null,
          reason,
          date: new Date(),
          eppItemId: id,
          registeredById,
        },
      }),
      prisma.eppItem.update({ where: { id }, data: { currentStock: newStock } }),
      ...extraOps,
    ]);

    res.status(201).json({ movement, newStock });
  } catch (err) { next(err); }
};

// POST /api/epp/bulk-movements
const bulkMovements = async (req, res, next) => {
  try {
    const companyId      = req.user.companyId;
    const registeredById = req.user.id;
    const { type, movements } = req.body;

    if (!Array.isArray(movements) || movements.length === 0)
      return res.status(400).json({ message: 'Sin movimientos' });

    const results = { success: 0, errors: [] };

    for (const mov of movements) {
      const itemName = (mov.articulo || '').trim();
      if (!itemName) { results.errors.push('Fila sin nombre de artículo'); continue; }

      const item = await prisma.eppItem.findFirst({
        where: { companyId, isActive: true, name: { equals: itemName, mode: 'insensitive' } },
      });
      if (!item) { results.errors.push(`Artículo no encontrado: "${itemName}"`); continue; }

      const qty = Number(mov.cantidad);
      if (!qty || qty <= 0) { results.errors.push(`Cantidad inválida para "${itemName}"`); continue; }

      let newStock = item.currentStock;
      const extraOps = [];

      if (type === 'ENTRY') {
        newStock += qty;
        extraOps.push(prisma.eppLot.create({
          data: { quantity: qty, remaining: qty, unitPrice: mov.precio ? Number(mov.precio) : 0, eppItemId: item.id, companyId },
        }));
      } else if (type === 'EXIT') {
        if (item.currentStock < qty) {
          results.errors.push(`Stock insuficiente para "${itemName}" (stock: ${item.currentStock}, solicitado: ${qty})`);
          continue;
        }
        newStock -= qty;
        try {
          const fifoOps = await buildFifoOps(item.id, companyId, qty);
          extraOps.push(...fifoOps);
        } catch {
          results.errors.push(`Sin lotes suficientes para "${itemName}"`);
          continue;
        }
      }

      try {
        await prisma.$transaction([
          prisma.eppMovement.create({
            data: {
              type,
              quantity:      qty,
              balanceAfter:  newStock,
              supplier:      mov.proveedor   || null,
              price:         mov.precio      ? Number(mov.precio)  : null,
              employeeName:  mov.solicitante || null,
              employeeArea:  mov.puesto      || null,
              date:          new Date(),
              eppItemId:     item.id,
              registeredById,
            },
          }),
          prisma.eppItem.update({ where: { id: item.id }, data: { currentStock: newStock } }),
          ...extraOps,
        ]);
        results.success++;
      } catch (err) {
        results.errors.push(`Error guardando "${itemName}": ${err.message}`);
      }
    }

    res.json(results);
  } catch (err) { next(err); }
};

// ── MATRIX ───────────────────────────────────────────────────────────────────

// GET /api/epp/matrix
const getMatrix = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const requirements = await prisma.eppAreaRequirement.findMany({
      where: { companyId },
      include: { eppItem: { select: { id: true, name: true, category: true } } },
      orderBy: [{ areaName: 'asc' }, { eppItem: { name: 'asc' } }],
    });

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
    const { eppItemId, areaName, mandatory, notes, userCount, changeFrequency } = req.body;

    const entry = await prisma.eppAreaRequirement.upsert({
      where: { eppItemId_areaName_companyId: { eppItemId, areaName, companyId } },
      update: { mandatory: mandatory !== false, notes, userCount: Number(userCount) || 1, changeFrequency: changeFrequency || null },
      create: { eppItemId, areaName, mandatory: mandatory !== false, notes, userCount: Number(userCount) || 1, changeFrequency: changeFrequency || null, companyId },
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

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, createMovement, bulkMovements, getMatrix, upsertMatrixEntry, deleteMatrixEntry };
