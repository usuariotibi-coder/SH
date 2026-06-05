const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/epp/loans
const getLoans = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { active } = req.query;

    const where = { companyId };
    if (active === 'true')  where.isReturned = false;
    if (active === 'false') where.isReturned = true;

    const loans = await prisma.eppLoan.findMany({
      where,
      include: {
        items: {
          include: { eppItem: { select: { id: true, name: true, unit: true } } },
        },
      },
      orderBy: { loanDate: 'desc' },
    });

    res.json(loans);
  } catch (err) { next(err); }
};

// POST /api/epp/loans
const createLoan = async (req, res, next) => {
  try {
    const companyId      = req.user.companyId;
    const { employeeName, employeeArea, notes, items } = req.body;

    if (!employeeName) return res.status(400).json({ message: 'Nombre del solicitante requerido' });
    if (!items?.length) return res.status(400).json({ message: 'Selecciona al menos un artículo' });

    // Verify all eppItems belong to this company
    const itemIds = items.map(i => i.eppItemId);
    const validItems = await prisma.eppItem.findMany({
      where: { id: { in: itemIds }, companyId, isActive: true },
      select: { id: true, name: true, unit: true },
    });
    if (validItems.length !== itemIds.length)
      return res.status(400).json({ message: 'Uno o más artículos no son válidos' });

    const loan = await prisma.eppLoan.create({
      data: {
        employeeName,
        employeeArea,
        notes,
        companyId,
        items: {
          create: items.map(i => ({
            eppItemId: i.eppItemId,
            quantity:  Number(i.quantity) || 1,
          })),
        },
      },
      include: {
        items: { include: { eppItem: { select: { id: true, name: true, unit: true } } } },
      },
    });

    // Generate alert
    const itemsList = loan.items
      .map(i => `${i.quantity} ${i.eppItem.name}`)
      .join(', ');
    const dateStr = new Date(loan.loanDate).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    await prisma.alert.create({
      data: {
        type:        'EPP_LOAN',
        title:       `Préstamo EPP — ${employeeName}`,
        description: `${employeeName}${employeeArea ? ` (${employeeArea})` : ''} tiene en préstamo desde ${dateStr}: ${itemsList}.`,
        priority:    2,
        relatedId:   loan.id,
        companyId,
      },
    });

    res.status(201).json(loan);
  } catch (err) { next(err); }
};

// PUT /api/epp/loans/:id/return
const returnLoan = async (req, res, next) => {
  try {
    const { id }    = req.params;
    const companyId = req.user.companyId;

    const loan = await prisma.eppLoan.findFirst({ where: { id, companyId } });
    if (!loan)          return res.status(404).json({ message: 'Préstamo no encontrado' });
    if (loan.isReturned) return res.status(400).json({ message: 'El préstamo ya fue devuelto' });

    await prisma.eppLoan.update({
      where: { id },
      data: { isReturned: true, returnedAt: new Date() },
    });

    // Mark related alert as read
    await prisma.alert.updateMany({
      where: { relatedId: id, companyId, type: 'EPP_LOAN', isRead: false },
      data:  { isRead: true },
    });

    res.json({ message: 'Préstamo marcado como devuelto' });
  } catch (err) { next(err); }
};

module.exports = { getLoans, createLoan, returnLoan };
