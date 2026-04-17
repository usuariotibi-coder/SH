const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');

const prisma = new PrismaClient();

// GET /api/portal/:token — get supplier info and required documents
const getPortalInfo = async (req, res, next) => {
  try {
    const { token } = req.params;

    const accessToken = await prisma.supplierAccessToken.findUnique({
      where: { token },
      include: {
        supplier: {
          include: {
            documents: { orderBy: { docType: 'asc' } },
          },
        },
      },
    });

    if (!accessToken || !accessToken.isActive) {
      return res.status(403).json({ message: 'Enlace inválido o revocado' });
    }

    // Update lastUsedAt
    await prisma.supplierAccessToken.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    });

    const { supplier } = accessToken;
    res.json({
      supplierName: supplier.name,
      supplierId: supplier.id,
      documents: supplier.documents,
    });
  } catch (err) { next(err); }
};

// POST /api/portal/:token/documents — supplier uploads a document
const uploadDocument = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { docType, period, expiresAt } = req.body;

    const accessToken = await prisma.supplierAccessToken.findUnique({
      where: { token },
      include: { supplier: true },
    });

    if (!accessToken || !accessToken.isActive) {
      return res.status(403).json({ message: 'Enlace inválido o revocado' });
    }

    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });

    const cloudResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Check if document of this type already exists for this supplier
    const existing = await prisma.supplierDocument.findFirst({
      where: { supplierId: accessToken.supplierId, docType, period: period || null },
    });

    let doc;
    if (existing) {
      // Delete old file from cloudinary
      if (existing.publicId) await deleteFromCloudinary(existing.publicId);

      doc = await prisma.supplierDocument.update({
        where: { id: existing.id },
        data: {
          status: 'UPLOADED',
          fileUrl: cloudResult.secure_url,
          publicId: cloudResult.public_id,
          fileName: req.file.originalname,
          uploadedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          period: period || null,
          reviewedAt: null,
          reviewNotes: null,
          reviewedById: null,
        },
      });
    } else {
      doc = await prisma.supplierDocument.create({
        data: {
          supplierId: accessToken.supplierId,
          docType,
          status: 'UPLOADED',
          fileUrl: cloudResult.secure_url,
          publicId: cloudResult.public_id,
          fileName: req.file.originalname,
          uploadedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          period: period || null,
        },
      });
    }

    // Update lastUsedAt
    await prisma.supplierAccessToken.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    });

    res.status(201).json(doc);
  } catch (err) { next(err); }
};

module.exports = { getPortalInfo, uploadDocument };
