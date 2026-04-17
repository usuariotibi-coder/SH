const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRIGADE_TYPES = ['FIRST_AID', 'EVACUATION', 'FIRE_FIGHTING', 'SEARCH_RESCUE'];

// Asegurar que existan las 4 brigadas para la empresa
async function ensureBrigadesExist(companyId) {
  for (const type of BRIGADE_TYPES) {
    await prisma.brigade.upsert({
      where: { companyId_type: { companyId, type } },
      update: {},
      create: { type, companyId },
    });
  }
}

// GET /api/brigades — todas las brigadas de la empresa con miembros activos
const getBrigades = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    await ensureBrigadesExist(companyId);

    const brigades = await prisma.brigade.findMany({
      where: { companyId },
      include: {
        members: {
          where: { isActive: true },
          orderBy: [{ memberRole: 'asc' }, { employeeName: 'asc' }],
        },
      },
      orderBy: { type: 'asc' },
    });

    res.json(brigades);
  } catch (err) { next(err); }
};

// GET /api/brigades/:type
const getBrigade = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { type } = req.params;

    const brigade = await prisma.brigade.findUnique({
      where: { companyId_type: { companyId, type } },
      include: {
        members: {
          where: { isActive: true },
          orderBy: [{ memberRole: 'asc' }, { employeeName: 'asc' }],
        },
      },
    });

    if (!brigade) return res.status(404).json({ error: true, message: 'Brigada no encontrada', code: 'NOT_FOUND' });
    res.json(brigade);
  } catch (err) { next(err); }
};

// PUT /api/brigades/:type — actualizar descripción, objetivos, punto de reunión
const updateBrigade = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { type } = req.params;
    const { description, objectives, meetingPoint, isActive } = req.body;

    const brigade = await prisma.brigade.upsert({
      where: { companyId_type: { companyId, type } },
      update: { description, objectives, meetingPoint, ...(isActive !== undefined && { isActive }) },
      create: { type, companyId, description, objectives, meetingPoint },
    });

    res.json(brigade);
  } catch (err) { next(err); }
};

// POST /api/brigades/:type/members
const addMember = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { type } = req.params;
    const { memberRole, employeeName, employeeArea, employeePosition, phone,
            certificationDate, certificationExpiry, notes, userId } = req.body;

    if (!employeeName) {
      return res.status(400).json({ error: true, message: 'Nombre del integrante requerido', code: 'MISSING_FIELDS' });
    }

    const brigade = await prisma.brigade.findUnique({
      where: { companyId_type: { companyId, type } },
      include: { members: { where: { isActive: true } } },
    });
    if (!brigade) return res.status(404).json({ error: true, message: 'Brigada no encontrada', code: 'NOT_FOUND' });

    // Validar unicidad de COORDINATOR y DEPUTY
    if (memberRole === 'COORDINATOR' || memberRole === 'DEPUTY') {
      const existing = brigade.members.find(m => m.memberRole === memberRole);
      if (existing) {
        const label = memberRole === 'COORDINATOR' ? 'Jefe' : 'Suplente';
        return res.status(409).json({
          error: true,
          message: `Esta brigada ya tiene un ${label} asignado. Cambia el rol del integrante actual antes de asignar uno nuevo.`,
          code: 'ROLE_CONFLICT',
        });
      }
    }

    const member = await prisma.brigadeMember.create({
      data: {
        memberRole: memberRole || 'MEMBER',
        employeeName,
        employeeArea,
        employeePosition,
        phone,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        certificationExpiry: certificationExpiry ? new Date(certificationExpiry) : null,
        notes,
        brigadeId: brigade.id,
        userId: userId || null,
      },
    });

    res.status(201).json(member);
  } catch (err) { next(err); }
};

// PUT /api/brigades/:type/members/:id
const updateMember = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { type, id } = req.params;
    const { memberRole, employeeName, employeeArea, employeePosition, phone,
            certificationDate, certificationExpiry, notes, userId } = req.body;

    // Verificar que el miembro pertenece a una brigada de la empresa
    const member = await prisma.brigadeMember.findUnique({
      where: { id },
      include: { brigade: { select: { companyId: true, type: true } } },
    });
    if (!member || member.brigade.companyId !== companyId) {
      return res.status(404).json({ error: true, message: 'Integrante no encontrado', code: 'NOT_FOUND' });
    }

    // Validar unicidad de rol si cambia
    if (memberRole && memberRole !== member.memberRole &&
        (memberRole === 'COORDINATOR' || memberRole === 'DEPUTY')) {
      const brigade = await prisma.brigade.findUnique({
        where: { companyId_type: { companyId, type } },
        include: { members: { where: { isActive: true, id: { not: id } } } },
      });
      const conflict = brigade?.members.find(m => m.memberRole === memberRole);
      if (conflict) {
        const label = memberRole === 'COORDINATOR' ? 'Jefe' : 'Suplente';
        return res.status(409).json({
          error: true,
          message: `Esta brigada ya tiene un ${label} asignado.`,
          code: 'ROLE_CONFLICT',
        });
      }
    }

    const updated = await prisma.brigadeMember.update({
      where: { id },
      data: {
        ...(memberRole && { memberRole }),
        ...(employeeName && { employeeName }),
        employeeArea,
        employeePosition,
        phone,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        certificationExpiry: certificationExpiry ? new Date(certificationExpiry) : null,
        notes,
        userId: userId || null,
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/brigades/:type/members/:id — soft delete
const deleteMember = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const member = await prisma.brigadeMember.findUnique({
      where: { id },
      include: { brigade: { select: { companyId: true } } },
    });
    if (!member || member.brigade.companyId !== companyId) {
      return res.status(404).json({ error: true, message: 'Integrante no encontrado', code: 'NOT_FOUND' });
    }

    await prisma.brigadeMember.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Integrante desactivado' });
  } catch (err) { next(err); }
};

module.exports = { getBrigades, getBrigade, updateBrigade, addMember, updateMember, deleteMember, ensureBrigadesExist };
