const { PrismaClient } = require('@prisma/client');
const { getPagination, paginatedResponse } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const getCompanies = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [companies, total] = await Promise.all([
      prisma.company.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.company.count(),
    ]);
    res.json(paginatedResponse(companies, total, page, limit));
  } catch (err) { next(err); }
};

const getCompany = async (req, res, next) => {
  try {
    const id = req.user.role === 'ADMIN' ? req.params.id : req.user.companyId;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ error: true, message: 'Empresa no encontrada', code: 'NOT_FOUND' });
    res.json(company);
  } catch (err) { next(err); }
};

const BRIGADE_TYPES = ['FIRST_AID', 'EVACUATION', 'FIRE_FIGHTING', 'SEARCH_RESCUE'];

const createCompany = async (req, res, next) => {
  try {
    const { name, rfc, address, industry } = req.body;
    if (!name) return res.status(400).json({ error: true, message: 'Nombre requerido', code: 'MISSING_FIELDS' });

    const company = await prisma.company.create({ data: { name, rfc, address, industry } });

    // Crear automáticamente las 4 brigadas para la nueva empresa
    await prisma.brigade.createMany({
      data: BRIGADE_TYPES.map(type => ({ type, companyId: company.id })),
    });

    res.status(201).json(company);
  } catch (err) { next(err); }
};

const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, rfc, address, industry, isActive } = req.body;
    const company = await prisma.company.update({ where: { id }, data: { name, rfc, address, industry, isActive } });
    res.json(company);
  } catch (err) { next(err); }
};

const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Empresa eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, deleteCompany };
