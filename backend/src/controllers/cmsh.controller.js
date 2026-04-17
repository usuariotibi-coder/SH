const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Members
const getMembers = async (req, res, next) => {
  try {
    const members = await prisma.cMSHMember.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { startDate: 'desc' },
    });
    res.json(members);
  } catch (err) { next(err); }
};

const createMember = async (req, res, next) => {
  try {
    const { name, position, cmshRole, email, phone, startDate, endDate } = req.body;
    if (!name || !position || !cmshRole || !startDate) {
      return res.status(400).json({ error: true, message: 'Nombre, posición, rol y fecha de inicio requeridos', code: 'MISSING_FIELDS' });
    }
    const member = await prisma.cMSHMember.create({
      data: {
        name, position, cmshRole, email, phone,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
};

const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, cmshRole, email, phone, startDate, endDate, isActive } = req.body;
    const member = await prisma.cMSHMember.update({
      where: { id },
      data: {
        name, position, cmshRole, email, phone, isActive,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    res.json(member);
  } catch (err) { next(err); }
};

const deleteMember = async (req, res, next) => {
  try {
    await prisma.cMSHMember.delete({ where: { id: req.params.id } });
    res.json({ message: 'Integrante eliminado' });
  } catch (err) { next(err); }
};

// Meetings
const getMeetings = async (req, res, next) => {
  try {
    const meetings = await prisma.cMSHMeeting.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { meetingDate: 'desc' },
    });
    res.json(meetings);
  } catch (err) { next(err); }
};

const createMeeting = async (req, res, next) => {
  try {
    const { meetingDate, location, agenda, agreements, attendees, nextMeeting } = req.body;
    if (!meetingDate || !location || !agenda) {
      return res.status(400).json({ error: true, message: 'Fecha, lugar y orden del día requeridos', code: 'MISSING_FIELDS' });
    }
    const meeting = await prisma.cMSHMeeting.create({
      data: {
        meetingDate: new Date(meetingDate),
        location, agenda, agreements, attendees,
        nextMeeting: nextMeeting ? new Date(nextMeeting) : null,
        companyId: req.user.companyId,
      },
    });
    res.status(201).json(meeting);
  } catch (err) { next(err); }
};

const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { meetingDate, location, agenda, agreements, attendees, nextMeeting } = req.body;
    const meeting = await prisma.cMSHMeeting.update({
      where: { id },
      data: {
        meetingDate: meetingDate ? new Date(meetingDate) : undefined,
        location, agenda, agreements, attendees,
        nextMeeting: nextMeeting ? new Date(nextMeeting) : null,
      },
    });
    res.json(meeting);
  } catch (err) { next(err); }
};

const deleteMeeting = async (req, res, next) => {
  try {
    await prisma.cMSHMeeting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Acta eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getMembers, createMember, updateMember, deleteMember, getMeetings, createMeeting, updateMeeting, deleteMeeting };
