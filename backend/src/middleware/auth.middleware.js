const { verifyToken } = require('../utils/jwt.utils');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Token no proporcionado', code: 'NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: true, message: 'Usuario no autorizado', code: 'UNAUTHORIZED' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: 'Token inválido o expirado', code: 'INVALID_TOKEN' });
  }
};

module.exports = { authenticate };
