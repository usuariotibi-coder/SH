const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');

const prisma = new PrismaClient();

// Generate folio: HM-YYYYMM-NNNN
async function generateFolio(companyId) {
  const now = new Date();
  const prefix = `HM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await prisma.hazmatDisposal.count({
    where: { companyId, folio: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// GET /api/hazmat
const getDisposals = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { year, wasteState, productId } = req.query;

    const where = { companyId };
    if (wasteState) where.wasteState = wasteState;
    if (productId) where.productId = productId;
    if (year) {
      where.disposalDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${Number(year) + 1}-01-01`),
      };
    }

    const disposals = await prisma.hazmatDisposal.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        product: { select: { id: true, tradeName: true } },
        createdBy: { select: { name: true } },
        evidences: true,
      },
      orderBy: { disposalDate: 'desc' },
    });

    res.json(disposals);
  } catch (err) { next(err); }
};

// GET /api/hazmat/:id
const getDisposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const disposal = await prisma.hazmatDisposal.findFirst({
      where: { id, companyId },
      include: {
        supplier: { select: { id: true, name: true } },
        product: { select: { id: true, tradeName: true } },
        createdBy: { select: { name: true } },
        evidences: true,
      },
    });

    if (!disposal) return res.status(404).json({ message: 'Disposición no encontrada' });
    res.json(disposal);
  } catch (err) { next(err); }
};

// POST /api/hazmat
const createDisposal = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const createdById = req.user.id;
    const {
      disposalDate, wasteType, wasteState, quantityKg,
      manifestNumber, transportCompany, disposalMethod,
      notes, supplierId, productId,
    } = req.body;

    const folio = await generateFolio(companyId);

    const disposal = await prisma.hazmatDisposal.create({
      data: {
        folio,
        disposalDate: new Date(disposalDate),
        wasteType,
        wasteState,
        quantityKg: Number(quantityKg),
        manifestNumber,
        transportCompany,
        disposalMethod,
        notes,
        supplierId: supplierId || null,
        productId: productId || null,
        companyId,
        createdById,
      },
    });

    res.status(201).json(disposal);
  } catch (err) { next(err); }
};

// PUT /api/hazmat/:id
const updateDisposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      disposalDate, wasteType, wasteState, quantityKg,
      manifestNumber, transportCompany, disposalMethod,
      notes, supplierId, productId,
    } = req.body;

    const existing = await prisma.hazmatDisposal.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Disposición no encontrada' });

    const disposal = await prisma.hazmatDisposal.update({
      where: { id },
      data: {
        disposalDate: disposalDate ? new Date(disposalDate) : undefined,
        wasteType, wasteState,
        quantityKg: quantityKg ? Number(quantityKg) : undefined,
        manifestNumber, transportCompany, disposalMethod, notes,
        supplierId: supplierId || null,
        productId: productId || null,
      },
    });

    res.json(disposal);
  } catch (err) { next(err); }
};

// DELETE /api/hazmat/:id
const deleteDisposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.hazmatDisposal.findFirst({
      where: { id, companyId },
      include: { evidences: true },
    });
    if (!existing) return res.status(404).json({ message: 'Disposición no encontrada' });

    // Delete evidence files from cloudinary
    for (const ev of existing.evidences) {
      await deleteFromCloudinary(ev.publicId);
    }

    await prisma.hazmatDisposal.delete({ where: { id } });
    res.json({ message: 'Disposición eliminada' });
  } catch (err) { next(err); }
};

// POST /api/hazmat/:id/evidence — upload evidence file
const uploadEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { description } = req.body;

    const disposal = await prisma.hazmatDisposal.findFirst({ where: { id, companyId } });
    if (!disposal) return res.status(404).json({ message: 'Disposición no encontrada' });

    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });

    const cloudResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const evidence = await prisma.hazmatEvidence.create({
      data: {
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        description,
        disposalId: id,
      },
    });

    res.status(201).json(evidence);
  } catch (err) { next(err); }
};

// DELETE /api/hazmat/:id/evidence/:evidenceId
const deleteEvidence = async (req, res, next) => {
  try {
    const { id, evidenceId } = req.params;
    const companyId = req.user.companyId;

    const disposal = await prisma.hazmatDisposal.findFirst({ where: { id, companyId } });
    if (!disposal) return res.status(404).json({ message: 'Disposición no encontrada' });

    const evidence = await prisma.hazmatEvidence.findFirst({ where: { id: evidenceId, disposalId: id } });
    if (!evidence) return res.status(404).json({ message: 'Evidencia no encontrada' });

    await deleteFromCloudinary(evidence.publicId);
    await prisma.hazmatEvidence.delete({ where: { id: evidenceId } });

    res.json({ message: 'Evidencia eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getDisposals, getDisposal, createDisposal, updateDisposal, deleteDisposal, uploadEvidence, deleteEvidence };
