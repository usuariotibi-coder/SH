const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');

const prisma = new PrismaClient();

const getEvidenceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'PHOTO';
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.includes('word') || mimetype.includes('excel') || mimetype.includes('sheet')) return 'DOCUMENT';
  return 'OTHER';
};

const uploadEvidence = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: true, message: 'No se recibió ningún archivo', code: 'NO_FILE' });

    const { requirementId, activityId, incidentId, drillId, fiveSId, auditId, description } = req.body;

    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);

    const evidence = await prisma.evidence.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileType: getEvidenceType(req.file.mimetype),
        fileSizeKb: Math.round(req.file.size / 1024),
        description,
        requirementId: requirementId || null,
        activityId: activityId || null,
        incidentId: incidentId || null,
        drillId: drillId || null,
        fiveSId: fiveSId || null,
        auditId: auditId || null,
      },
    });

    res.status(201).json(evidence);
  } catch (err) { next(err); }
};

const deleteEvidence = async (req, res, next) => {
  try {
    const evidence = await prisma.evidence.findUnique({ where: { id: req.params.id } });
    if (!evidence) return res.status(404).json({ error: true, message: 'Evidencia no encontrada', code: 'NOT_FOUND' });

    await deleteFromCloudinary(evidence.publicId);
    await prisma.evidence.delete({ where: { id: req.params.id } });

    res.json({ message: 'Evidencia eliminada' });
  } catch (err) { next(err); }
};

module.exports = { uploadEvidence, deleteEvidence };
