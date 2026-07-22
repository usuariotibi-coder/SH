const { PrismaClient } = require('@prisma/client');

const LOCAL_URL   = 'postgresql://postgres:postgres@localhost:5432/sh_mexico';
const RAILWAY_URL = 'postgresql://postgres:XrfDPJzmOUcCtHNNZcRqrZILQqWWmJle@centerbeam.proxy.rlwy.net:20848/railway';
const COMPANY     = 'cmnywhzr700008dctf90464sy';

const local   = new PrismaClient({ datasources: { db: { url: LOCAL_URL   } } });
const railway = new PrismaClient({ datasources: { db: { url: RAILWAY_URL } } });

async function main() {
  // ── 1. Leer datos locales ────────────────────────────────────────────────
  console.log('Leyendo datos locales...');
  const [items, matrix, lots] = await Promise.all([
    local.eppItem.findMany({
      where: { companyId: COMPANY, isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
    local.eppAreaRequirement.findMany({
      where: { companyId: COMPANY },
      orderBy: { createdAt: 'asc' },
    }),
    local.eppLot.findMany({
      where: { companyId: COMPANY },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  console.log(`  Items: ${items.length} | Matriz: ${matrix.length} | Lotes: ${lots.length}`);

  // ── 2. Limpiar EPP en Railway ────────────────────────────────────────────
  console.log('\nLimpiando EPP en Railway...');
  await railway.eppAreaRequirement.deleteMany({ where: { companyId: COMPANY } });
  await railway.eppMovement.deleteMany({
    where: { eppItem: { companyId: COMPANY } },
  });
  await railway.eppLot.deleteMany({ where: { companyId: COMPANY } });
  await railway.eppItem.deleteMany({ where: { companyId: COMPANY } });
  console.log('  Limpieza completa.');

  // ── 3. Insertar items ────────────────────────────────────────────────────
  console.log('\nInsertando artículos EPP...');
  let itemsOk = 0;
  for (const item of items) {
    await railway.eppItem.create({ data: item });
    itemsOk++;
    if (itemsOk % 10 === 0) process.stdout.write(`  ${itemsOk}/${items.length}\n`);
  }
  console.log(`  Total insertados: ${itemsOk}`);

  // ── 4. Insertar matriz ───────────────────────────────────────────────────
  console.log('\nInsertando matriz EPP...');
  let matrixOk = 0;
  for (const entry of matrix) {
    await railway.eppAreaRequirement.create({ data: entry });
    matrixOk++;
  }
  console.log(`  Total insertados: ${matrixOk}`);

  // ── 5. Insertar lotes FIFO ───────────────────────────────────────────────
  if (lots.length > 0) {
    console.log('\nInsertando lotes FIFO...');
    for (const lot of lots) {
      await railway.eppLot.create({ data: lot });
    }
    console.log(`  Total insertados: ${lots.length}`);
  }

  // ── 6. Verificación final ────────────────────────────────────────────────
  console.log('\nVerificando Railway...');
  const [rItems, rMatrix, rLots] = await Promise.all([
    railway.eppItem.count({ where: { companyId: COMPANY } }),
    railway.eppAreaRequirement.count({ where: { companyId: COMPANY } }),
    railway.eppLot.count({ where: { companyId: COMPANY } }),
  ]);
  console.log(`  Items: ${rItems} | Matriz: ${rMatrix} | Lotes: ${rLots}`);
  console.log('\nSincronización completada.');

  await local.$disconnect();
  await railway.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
