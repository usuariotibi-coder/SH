// Calcula minStock/maxStock por artículo EPP a partir del consumo mensual
// estimado en la matriz EPP (usuarios por puesto / frecuencia de cambio).
// Política: Mínimo = consumo de 1 mes, Máximo = consumo de 3 meses.
// Artículos sin usuarios en la matriz se dejan en 0/0.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MIN_MONTHS = 1;
const MAX_MONTHS = 3;

(async () => {
  const matrix = await prisma.eppAreaRequirement.findMany({
    select: { eppItemId: true, userCount: true, changeFrequency: true },
  });

  const consumption = {};
  for (const m of matrix) {
    const months = Number(m.changeFrequency) || 12;
    const rate = (m.userCount || 0) / months;
    consumption[m.eppItemId] = (consumption[m.eppItemId] || 0) + rate;
  }

  let updated = 0;
  for (const [eppItemId, monthly] of Object.entries(consumption)) {
    if (monthly <= 0) continue;

    let minStock = Math.ceil(monthly * MIN_MONTHS);
    let maxStock = Math.ceil(monthly * MAX_MONTHS);
    if (minStock < 1) minStock = 1;
    if (maxStock <= minStock) maxStock = minStock + 1;

    const item = await prisma.eppItem.update({
      where: { id: eppItemId },
      data: { minStock, maxStock },
      select: { name: true },
    });

    console.log(`✓ ${item.name}: consumo/mes=${monthly.toFixed(2)} → Min=${minStock}, Max=${maxStock}`);
    updated++;
  }

  console.log(`\nTotal artículos actualizados: ${updated}`);
  await prisma.$disconnect();
})();
