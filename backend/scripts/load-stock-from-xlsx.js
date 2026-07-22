// Carga existencias iniciales desde Stock.xlsx para artículos con coincidencia clara
// Genera movimientos ENTRY (lote FIFO costo $0) y actualiza currentStock
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = 'cmnywhzr700008dctf90464sy';
const ADMIN_ID   = 'cmnywhzt500048dctgiz2dp1w';

// stockLabel -> nombre exacto del EppItem en BD
const MATCHES = [
  ['Arnés de seguridad',                  'Arnes de Seguridad',                                          0],
  ['Careta para esmerilado',              'Careta de Esmerilado',                                        6],
  ['Careta para soldador',                'Careta de Soldador',                                          0],
  ['Casco contra impacto',                'Casco de Seguridad',                                          0],
  ['Lentes de policarbonato anti impacto','Lente Policarbonato Antiimpacto LAMIRA',                      1],
  ['Línea de vida simple',                'Linea de Vida',                                               0],
  ['Overol',                              'Overol',                                                      0],
  ['Pantalón de mezclilla',               'Pantalon de Mezclilla',                                       0],
  ['Polainas',                            'Polainas',                                                    1],
  ['Rodilleras',                          'Rodillera Profesional Rooster',                               0],
  ['Talonera antiestática',               'Talonera Antiestatica Jyrsa Unitalla',                        2],
  ['Tapones auditivos',                   'Tapon Auditivo Reutilizable con Cordon SNR 30dB Arca Safety', 18],
  ['Guante de argonero',                  'Guante Piel Argonero Lamira XL',                              3],
  ['Guantes contra temperaturas extremas','Guante Resistente al Calor ActivArmr Ansell No.10',           6],
  ['Mangas de carnaza',                   'Manga Carnaza LAMIRA Unitalla',                               2],
  ['Mascarilla desechable N95',           'Respirador Desechable N95 8210 3M',                           8],
  ['Capuchas para soldador',              'Capucha Mezclilla para Soldador MAT',                         0],
  ['Bata antiestática',                   'Bata',                                                        0],
];

(async () => {
  let updated = 0, skipped = 0;

  for (const [stockLabel, itemName, qty] of MATCHES) {
    const item = await prisma.eppItem.findFirst({ where: { name: itemName, companyId: COMPANY_ID } });
    if (!item) { console.log(`✗ No encontrado: ${itemName}`); skipped++; continue; }

    if (qty === 0) {
      console.log(`- ${itemName}: stock 0, sin movimiento (ya está en 0)`);
      continue;
    }

    const newStock = item.currentStock + qty;

    await prisma.$transaction([
      prisma.eppMovement.create({
        data: {
          type: 'ENTRY',
          quantity: qty,
          balanceAfter: newStock,
          reason: 'Carga de existencias iniciales (Stock.xlsx)',
          date: new Date(),
          eppItemId: item.id,
          registeredById: ADMIN_ID,
        },
      }),
      prisma.eppLot.create({
        data: { quantity: qty, remaining: qty, unitPrice: 0, eppItemId: item.id, companyId: COMPANY_ID },
      }),
      prisma.eppItem.update({ where: { id: item.id }, data: { currentStock: newStock } }),
    ]);

    console.log(`✓ ${itemName} (${stockLabel}): +${qty} → stock = ${newStock}`);
    updated++;
  }

  console.log(`\nTotal actualizados: ${updated}, sin cambio (stock 0): ${MATCHES.filter(m => m[2] === 0).length}, no encontrados: ${skipped}`);
  await prisma.$disconnect();
})();
