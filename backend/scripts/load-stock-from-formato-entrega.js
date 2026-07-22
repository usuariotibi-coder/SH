// Carga existencias iniciales desde "Foremato Entrega Equipo EPP sin codigo.xlsx"
// Genera movimientos ENTRY (lote FIFO costo $0) y actualiza currentStock
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = 'cmnywhzr700008dctf90464sy';
const ADMIN_ID   = 'cmnywhzt500048dctgiz2dp1w';
const REASON     = 'Carga de existencias iniciales (Formato Entrega EPP)';

// nombre exacto del EppItem en BD -> cantidad (solo > 0)
const MATCHES = [
  ['Capucha Mezclilla para Soldador MAT',                              4],
  ['Filtro Polipropileno Vapores Organicos P100 2097 3M',              6],
  ['Guante Carnaza Soldador con Kevlar LAMIRA No.10',                  6],
  ['Guante Carnaza Corto LAMIRA No.10',                                9],
  ['Guante HPPE Nitrilo Arenado Antiimpacto DuraFlex Gisa No.9',       2],
  ['Guante HPPE Nitrilo Espumado Cortes A4 DuraFlex Gisa No.8',        3],
  ['Guante Industrial contra Acidos 18 DermaCare No.8',                1],
  ['Guante Uso Domestico Economico DermaCare No.9',                    4],
  ['Guante Piel Argonero Lamira XL',                                   1],
  ['Guante Poliester Nitrilo Espumado Gisa No.9',                     20],
  ['Guante Poliester Nitrilo Espumado Gisa No.10',                     1],
  ['Guante Resistente al Calor ActivArmr Ansell No.10',                6],
  ['Lente Policarbonato Antiimpacto LAMIRA',                           2],
  ['Lente Policarbonato Sombra 3.0 Sargento Jyrsa',                    1],
  ['Mandil PVC Sanitario Jyrsa 70x110cm',                              2],
  ['Manga 100% Kevlar con Orificio Pulgar Gisa 18 pulgadas',           1],
  ['Manga Carnaza LAMIRA Unitalla',                                    1],
  ['Orejera Premium Tipo Diadema SRR 31dB LAMIRA',                     2],
  ['Pechera Carnaza LAMIRA 50x80cm',                                   1],
  ['Mica Policarbonato para Protector Facial LAMIRA',                  6],
  ['Respirador Desechable N95 8210 3M',                                7],
  ['Respirador TPE Media Cara 6200 3M',                                1],
  ['Tapon Auditivo Reutilizable con Cordon SNR 30dB Arca Safety',     10],
  ['Protector Facial Mica Clara con Suspension Infra',                 2],
  ['Chaleco Rescatista Lamira LG',                                     1],
  ['Talonera Antiestatica Jyrsa Unitalla',                             2],
];

(async () => {
  let updated = 0, skipped = 0;

  for (const [itemName, qty] of MATCHES) {
    const item = await prisma.eppItem.findFirst({ where: { name: itemName, companyId: COMPANY_ID } });
    if (!item) { console.log(`✗ No encontrado: ${itemName}`); skipped++; continue; }

    const newStock = item.currentStock + qty;

    await prisma.$transaction([
      prisma.eppMovement.create({
        data: {
          type: 'ENTRY',
          quantity: qty,
          balanceAfter: newStock,
          reason: REASON,
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

    console.log(`✓ ${itemName}: +${qty} → stock = ${newStock}`);
    updated++;
  }

  console.log(`\nTotal actualizados: ${updated}, no encontrados: ${skipped}`);
  await prisma.$disconnect();
})();
