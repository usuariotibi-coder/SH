// Asigna precios unitarios desde la cotización COT D52132 a los lotes FIFO
// (y movimientos de entrada relacionados) que se cargaron a costo $0.
// Corre directo contra Railway.
const { PrismaClient } = require('@prisma/client');

const RAILWAY_URL = 'postgresql://postgres:XrfDPJzmOUcCtHNNZcRqrZILQqWWmJle@centerbeam.proxy.rlwy.net:20848/railway';
const COMPANY_ID  = 'cmnywhzr700008dctf90464sy';

const railway = new PrismaClient({ datasources: { db: { url: RAILWAY_URL } } });

// partNumber -> precio unitario (catálogo COT D52132, 28-mayo-2026)
const PRICES = {
  '00015-01': 561.57,
  '01286-02': 19.53,
  '04415-28': 270.00,
  '00302-01': 119.02,
  '03523-01': 64.15,
  '00327-01': 32.55,
  '04289-02': 244.74,
  '04289-01': 244.74,
  '03655-04': 69.48,
  '03655-03': 69.48,
  '00426-01': 68.82,
  '00438-03': 15.35,
  '04332-01': 44.10,
  '04126-02': 16.74,
  '04126-03': 16.74,
  '04126-04': 16.74,
  '04126-05': 16.74,
  '04126-06': 16.74,
  '00335-01': 339.16,
  '02993-01': 9.31,
  '01513-01': 77.85,
  '00543-01': 82.77,
  '00547-02': 19.63,
  '00545-01': 64.12,
  '00551-01': 72.16,
  '04469-01': 178.46,
  '00602-01': 76.26,
  '04472-01': 93.11,
  '04476-01': 31.04,
  '00668-01': 16.76,
  '00647-01': 281.64,
  '00679-01': 146.11,
  '01425-01': 99.61,
  '04861-01': 3.82,
  '00621-01': 128.62,
  '01162-01': 223.20,
  '01162-02': 223.20,
  '01162-03': 223.20,
  '01162-04': 223.20,
  '01162-05': 223.20,
  '01162-06': 223.20,
};

(async () => {
  const items = await railway.eppItem.findMany({
    where: { companyId: COMPANY_ID, partNumber: { in: Object.keys(PRICES) } },
    select: { id: true, name: true, partNumber: true },
  });
  console.log(`Artículos con partNumber en cotización: ${items.length}/${Object.keys(PRICES).length}`);

  let lotsUpdated = 0, movementsUpdated = 0;

  for (const item of items) {
    const price = PRICES[item.partNumber];

    const lotRes = await railway.eppLot.updateMany({
      where: { eppItemId: item.id, companyId: COMPANY_ID, unitPrice: 0 },
      data:  { unitPrice: price },
    });
    const movRes = await railway.eppMovement.updateMany({
      where: { eppItemId: item.id, type: 'ENTRY', OR: [{ price: null }, { price: 0 }] },
      data:  { price },
    });

    lotsUpdated      += lotRes.count;
    movementsUpdated += movRes.count;
    console.log(`✓ ${item.name} (${item.partNumber}): $${price} → ${lotRes.count} lote(s), ${movRes.count} movimiento(s)`);
  }

  console.log(`\nTotal lotes actualizados: ${lotsUpdated} | movimientos actualizados: ${movementsUpdated}`);
  await railway.$disconnect();
})();
