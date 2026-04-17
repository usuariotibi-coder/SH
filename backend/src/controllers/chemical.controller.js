const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');

const prisma = new PrismaClient();

// ── PRODUCTS ─────────────────────────────────────────────────────────────────

// GET /api/chemicals
const getProducts = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { search, noSds } = req.query;

    const where = { companyId, isActive: true };
    if (search) {
      where.OR = [
        { tradeName: { contains: search, mode: 'insensitive' } },
        { chemicalName: { contains: search, mode: 'insensitive' } },
        { casNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.chemicalProduct.findMany({
      where,
      include: {
        files: true,
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { tradeName: 'asc' },
    });

    // Annotate with flags
    const annotated = products.map(p => ({
      ...p,
      hasSds: p.files.some(f => f.fileType === 'SDS'),
      hasLabel: p.files.some(f => f.fileType === 'LABEL'),
    }));

    if (noSds === 'true') return res.json(annotated.filter(p => !p.hasSds));
    res.json(annotated);
  } catch (err) { next(err); }
};

// GET /api/chemicals/:id
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const product = await prisma.chemicalProduct.findFirst({
      where: { id, companyId },
      include: {
        files: true,
        supplier: { select: { id: true, name: true } },
        hazmatDisposals: { orderBy: { disposalDate: 'desc' }, take: 10 },
      },
    });

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json({
      ...product,
      hasSds: product.files.some(f => f.fileType === 'SDS'),
      hasLabel: product.files.some(f => f.fileType === 'LABEL'),
    });
  } catch (err) { next(err); }
};

// POST /api/chemicals
const createProduct = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const {
      tradeName, chemicalName, casNumber, manufacturer, supplierId,
      ghsHazardClasses, physicalState, storageLocation, maxStockKg, notes,
    } = req.body;

    const product = await prisma.chemicalProduct.create({
      data: {
        tradeName, chemicalName, casNumber, manufacturer,
        supplierId: supplierId || null,
        ghsHazardClasses: ghsHazardClasses || [],
        physicalState, storageLocation,
        maxStockKg: maxStockKg ? Number(maxStockKg) : null,
        notes,
        companyId,
      },
    });

    res.status(201).json(product);
  } catch (err) { next(err); }
};

// PUT /api/chemicals/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      tradeName, chemicalName, casNumber, manufacturer, supplierId,
      ghsHazardClasses, physicalState, storageLocation, maxStockKg, notes, isActive,
    } = req.body;

    const existing = await prisma.chemicalProduct.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    const product = await prisma.chemicalProduct.update({
      where: { id },
      data: {
        tradeName, chemicalName, casNumber, manufacturer,
        supplierId: supplierId || null,
        ghsHazardClasses: ghsHazardClasses || existing.ghsHazardClasses,
        physicalState, storageLocation,
        maxStockKg: maxStockKg !== undefined ? Number(maxStockKg) : existing.maxStockKg,
        notes, isActive,
      },
    });

    res.json(product);
  } catch (err) { next(err); }
};

// DELETE /api/chemicals/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.chemicalProduct.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    await prisma.chemicalProduct.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Producto desactivado' });
  } catch (err) { next(err); }
};

// ── FILES (SDS / LABEL) ───────────────────────────────────────────────────────

// POST /api/chemicals/:id/files — upload SDS or label
const uploadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { fileType } = req.body; // 'SDS' or 'LABEL'

    const product = await prisma.chemicalProduct.findFirst({ where: { id, companyId } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });
    if (!['SDS', 'LABEL'].includes(fileType)) return res.status(400).json({ message: 'Tipo de archivo inválido' });

    // Check if file of this type already exists
    const existing = await prisma.chemicalFile.findUnique({
      where: { productId_fileType: { productId: id, fileType } },
    });

    if (existing) await deleteFromCloudinary(existing.publicId);

    const cloudResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const file = await prisma.chemicalFile.upsert({
      where: { productId_fileType: { productId: id, fileType } },
      update: {
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        fileName: req.file.originalname,
        uploadedAt: new Date(),
        version: existing ? existing.version + 1 : 1,
      },
      create: {
        fileType,
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        fileName: req.file.originalname,
        productId: id,
      },
    });

    // Update sdsUpdatedAt if it's an SDS file
    if (fileType === 'SDS') {
      await prisma.chemicalProduct.update({
        where: { id },
        data: { sdsUpdatedAt: new Date() },
      });
    }

    res.status(201).json(file);
  } catch (err) { next(err); }
};

// DELETE /api/chemicals/:id/files/:fileType
const deleteFile = async (req, res, next) => {
  try {
    const { id, fileType } = req.params;
    const companyId = req.user.companyId;

    const product = await prisma.chemicalProduct.findFirst({ where: { id, companyId } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const file = await prisma.chemicalFile.findUnique({
      where: { productId_fileType: { productId: id, fileType } },
    });

    if (!file) return res.status(404).json({ message: 'Archivo no encontrado' });

    await deleteFromCloudinary(file.publicId);
    await prisma.chemicalFile.delete({ where: { id: file.id } });

    res.json({ message: 'Archivo eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadFile, deleteFile };
