const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getUsers = async (req, res, next) => {
  try {
    const companyId = req.user.role === 'ADMIN' ? (req.query.companyId || req.user.companyId) : req.user.companyId;
    const { page, limit, skip } = getPagination(req.query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { companyId },
        skip, take: limit,
        select: { id: true, email: true, name: true, role: true, area: true, isActive: true, createdAt: true, company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { companyId } }),
    ]);

    res.json(paginatedResponse(users, total, page, limit));
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { email, name, password, role, area, companyId } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: true, message: 'Email, nombre y contraseña requeridos', code: 'MISSING_FIELDS' });
    }

    const targetCompanyId = req.user.role === 'ADMIN' && companyId ? companyId : req.user.companyId;
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, password: hashed, role: role || 'AREA_MANAGER', area, companyId: targetCompanyId },
      select: { id: true, email: true, name: true, role: true, area: true, isActive: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, area } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, role, area },
      select: { id: true, email: true, name: true, role: true, area: true, isActive: true },
    });

    res.json(user);
  } catch (err) { next(err); }
};

const toggleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: true, message: 'Usuario no encontrado', code: 'NOT_FOUND' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    res.json(updated);
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: true, message: 'No puedes eliminar tu propio usuario', code: 'SELF_DELETE' });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) { next(err); }
};

// Endpoint ligero para selector de responsable en actividades
const getSelectUsers = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const users = await prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, area: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser, updateUser, toggleUser, deleteUser, getSelectUsers };
