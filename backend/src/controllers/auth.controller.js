const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt.utils');

const prisma = new PrismaClient();

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email y contraseña requeridos', code: 'MISSING_FIELDS' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: true, message: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
    }

    const token = generateToken({ id: user.id, role: user.role, companyId: user.companyId });

    const { password: _pw, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  const { password: _pw, ...userSafe } = req.user;
  res.json(userSafe);
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: true, message: 'Contraseña actual y nueva requeridas', code: 'MISSING_FIELDS' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: true, message: 'La nueva contraseña debe tener al menos 8 caracteres', code: 'WEAK_PASSWORD' });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) {
      return res.status(400).json({ error: true, message: 'Contraseña actual incorrecta', code: 'WRONG_PASSWORD' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, me, changePassword };
