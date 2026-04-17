const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');

const prisma = new PrismaClient();

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { status, search } = req.query;

    const where = { companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        documents: {
          orderBy: { updatedAt: 'desc' },
        },
        accessToken: { select: { token: true, isActive: true } },
        _count: { select: { chemicals: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(suppliers);
  } catch (err) { next(err); }
};

// GET /api/suppliers/:id
const getSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        documents: { orderBy: { docType: 'asc' } },
        accessToken: true,
        chemicals: { select: { id: true, tradeName: true, isActive: true } },
        _count: { select: { hazmatDisposals: true } },
      },
    });

    if (!supplier) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(supplier);
  } catch (err) { next(err); }
};

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { name, rfc, address, city, state, productsServices, contactName, phone, email, website, notes } = req.body;

    const supplier = await prisma.supplier.create({
      data: { name, rfc, address, city, state, productsServices, contactName, phone, email, website, notes, companyId },
    });

    res.status(201).json(supplier);
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, rfc, address, city, state, productsServices, contactName, phone, email, website, notes, status } = req.body;

    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Proveedor no encontrado' });

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, rfc, address, city, state, productsServices, contactName, phone, email, website, notes, status },
    });

    res.json(supplier);
  } catch (err) { next(err); }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Proveedor no encontrado' });

    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) { next(err); }
};

// POST /api/suppliers/:id/token — generate or regenerate portal access token
const generateToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const supplier = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!supplier) return res.status(404).json({ message: 'Proveedor no encontrado' });

    // Upsert: revoke old, create new
    const accessToken = await prisma.supplierAccessToken.upsert({
      where: { supplierId: id },
      update: { token: generateCuid(), isActive: true, lastUsedAt: null },
      create: { supplierId: id, token: generateCuid() },
    });

    res.json({ token: accessToken.token });
  } catch (err) { next(err); }
};

// DELETE /api/suppliers/:id/token — revoke token
const revokeToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const supplier = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!supplier) return res.status(404).json({ message: 'Proveedor no encontrado' });

    await prisma.supplierAccessToken.updateMany({
      where: { supplierId: id },
      data: { isActive: false },
    });

    res.json({ message: 'Acceso revocado' });
  } catch (err) { next(err); }
};

// POST /api/suppliers/:id/documents — internal review: approve/reject/expire a document
const reviewDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const reviewedById = req.user.id;
    const { status, reviewNotes } = req.body;

    const doc = await prisma.supplierDocument.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

    const updated = await prisma.supplierDocument.update({
      where: { id: docId },
      data: { status, reviewNotes, reviewedById, reviewedAt: new Date() },
    });

    res.json(updated);
  } catch (err) { next(err); }
};

// Helper: generate a unique token
function generateCuid() {
  const crypto = require('crypto');
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, generateToken, revokeToken, reviewDocument };
