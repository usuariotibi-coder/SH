/**
 * clean-keep-requirements.js
 * Limpia la BD manteniendo solo requerimientos, empresas y usuarios esenciales
 * Uso: node prisma/clean-keep-requirements.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos...\n');

  try {
    // Eliminar en orden de dependencias
    await prisma.alert.deleteMany({});
    console.log('✓ Alertas eliminadas');

    await prisma.evidence.deleteMany({});
    console.log('✓ Evidencias eliminadas');

    await prisma.activity.deleteMany({});
    console.log('✓ Actividades eliminadas');

    await prisma.incident.deleteMany({});
    console.log('✓ Incidentes eliminados');

    await prisma.cMSHMember.deleteMany({});
    await prisma.cMSHMeeting.deleteMany({});
    console.log('✓ CMSH eliminado');

    await prisma.training.deleteMany({});
    console.log('✓ Capacitaciones eliminadas');

    await prisma.drill.deleteMany({});
    console.log('✓ Simulacros eliminados');

    await prisma.fiveS.deleteMany({});
    console.log('✓ Auditorías 5S eliminadas');

    await prisma.maintenance.deleteMany({});
    console.log('✓ Mantenimientos eliminados');

    await prisma.risk.deleteMany({});
    console.log('✓ Riesgos eliminados');

    await prisma.audit.deleteMany({});
    console.log('✓ Auditorías eliminadas');

    // await prisma.shProgram.deleteMany({});
    // console.log('✓ Programa SH eliminado');

    // Mantener requerimientos, empresas y usuarios
    console.log('\n✅ Base de datos limpiada');
    console.log('📋 Requerimientos mantenidos');
    console.log('🏭 Empresas mantenidas');
    console.log('👤 Usuarios mantenidos');

    // Contar lo que quedó
    const reqs = await prisma.requirement.count();
    const comps = await prisma.company.count();
    const users = await prisma.user.count();

    console.log(`\n📊 Estado final:\n   Requerimientos: ${reqs}\n   Empresas: ${comps}\n   Usuarios: ${users}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
