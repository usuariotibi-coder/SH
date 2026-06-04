const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = 'cmnywhzr700008dctf90464sy';

const items = [
  // Respiradores
  { name: 'Arnes para Respirador Cara Completa 6897 3M', category: 'Respiradores', unit: 'pieza', partNumber: '00015-01', brand: '3M' },
  { name: 'Filtro Polipropileno Vapores Organicos P100 2097 3M', category: 'Respiradores', unit: 'pieza', partNumber: '00302-01', brand: '3M' },
  { name: 'Respirador Desechable N95 8210 3M', category: 'Respiradores', unit: 'pieza', partNumber: '00668-01', brand: '3M' },
  { name: 'Respirador TPE Media Cara 6200 3M', category: 'Respiradores', unit: 'pieza', partNumber: '00647-01', brand: '3M' },
  // Proteccion Visual
  { name: 'Lente Policarbonato Antiimpacto LAMIRA', category: 'Proteccion Visual', unit: 'pieza', partNumber: '02993-01', brand: 'LAMIRA' },
  { name: 'Lente Policarbonato Sombra 3.0 Sargento Jyrsa', category: 'Proteccion Visual', unit: 'pieza', partNumber: '01513-01', brand: 'Jyrsa' },
  // Proteccion Facial
  { name: 'Cabezal LAMIRA', category: 'Proteccion Facial', unit: 'pieza', partNumber: '04472-01', brand: 'LAMIRA' },
  { name: 'Mica Policarbonato para Protector Facial LAMIRA', category: 'Proteccion Facial', unit: 'pieza', partNumber: '04476-01', brand: 'LAMIRA' },
  { name: 'Protector Facial Mica Clara con Suspension Infra', category: 'Proteccion Facial', unit: 'pieza', partNumber: '00621-01', brand: 'Infra' },
  // Proteccion Auditiva
  { name: 'Orejera Premium Tipo Diadema SRR 31dB LAMIRA', category: 'Proteccion Auditiva', unit: 'pieza', partNumber: '04469-01', brand: 'LAMIRA' },
  { name: 'Tapon Auditivo Reutilizable con Cordon SNR 30dB Arca Safety', category: 'Proteccion Auditiva', unit: 'par', partNumber: '04861-01', brand: 'Arca Safety' },
  // Guantes
  { name: 'Guante Carnaza Soldador con Kevlar LAMIRA No.10', category: 'Guantes', unit: 'par', partNumber: '03523-01', brand: 'LAMIRA' },
  { name: 'Guante Carnaza Corto LAMIRA No.10', category: 'Guantes', unit: 'par', partNumber: '00327-01', brand: 'LAMIRA' },
  { name: 'Guante HPPE Nitrilo Arenado Antiimpacto DuraFlex Gisa No.9', category: 'Guantes', unit: 'par', partNumber: '04289-02', brand: 'Gisa' },
  { name: 'Guante HPPE Nitrilo Arenado Antiimpacto DuraFlex Gisa No.8', category: 'Guantes', unit: 'par', partNumber: '04289-01', brand: 'Gisa' },
  { name: 'Guante HPPE Nitrilo Espumado Cortes A4 DuraFlex Gisa No.9', category: 'Guantes', unit: 'par', partNumber: '03655-04', brand: 'Gisa' },
  { name: 'Guante HPPE Nitrilo Espumado Cortes A4 DuraFlex Gisa No.8', category: 'Guantes', unit: 'par', partNumber: '03655-03', brand: 'Gisa' },
  { name: 'Guante Industrial contra Acidos 18 DermaCare No.8', category: 'Guantes', unit: 'par', partNumber: '00426-01', brand: 'DermaCare' },
  { name: 'Guante Uso Domestico Economico DermaCare No.9', category: 'Guantes', unit: 'par', partNumber: '00438-03', brand: 'DermaCare' },
  { name: 'Guante Piel Argonero Lamira XL', category: 'Guantes', unit: 'par', partNumber: '04332-01', brand: 'LAMIRA' },
  { name: 'Guante Poliester Nitrilo Espumado Gisa No.6', category: 'Guantes', unit: 'par', partNumber: '04126-02', brand: 'Gisa' },
  { name: 'Guante Poliester Nitrilo Espumado Gisa No.7', category: 'Guantes', unit: 'par', partNumber: '04126-03', brand: 'Gisa' },
  { name: 'Guante Poliester Nitrilo Espumado Gisa No.8', category: 'Guantes', unit: 'par', partNumber: '04126-04', brand: 'Gisa' },
  { name: 'Guante Poliester Nitrilo Espumado Gisa No.9', category: 'Guantes', unit: 'par', partNumber: '04126-05', brand: 'Gisa' },
  { name: 'Guante Poliester Nitrilo Espumado Gisa No.10', category: 'Guantes', unit: 'par', partNumber: '04126-06', brand: 'Gisa' },
  { name: 'Guante Resistente al Calor ActivArmr Ansell No.10', category: 'Guantes', unit: 'par', partNumber: '00335-01', brand: 'Ansell' },
  // Ropa de Trabajo
  { name: 'Capucha Mezclilla para Soldador MAT', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01286-02', brand: 'MAT' },
  { name: 'Chaleco Rescatista Lamira LG', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '04415-28', brand: 'LAMIRA' },
  { name: 'Mandil PVC Sanitario Jyrsa 70x110cm', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '00543-01', brand: 'Jyrsa' },
  { name: 'Manga 100% Algodon Gisa 18 pulgadas', category: 'Ropa de Trabajo', unit: 'par', partNumber: '00547-02', brand: 'Gisa' },
  { name: 'Manga 100% Kevlar con Orificio Pulgar Gisa 18 pulgadas', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '00545-01', brand: 'Gisa' },
  { name: 'Manga Carnaza LAMIRA Unitalla', category: 'Ropa de Trabajo', unit: 'par', partNumber: '00551-01', brand: 'LAMIRA' },
  { name: 'Camisola 100% Algodon IPF No.36', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-05', brand: 'IPF' },
  { name: 'Camisola 100% Algodon IPF No.38', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-01', brand: 'IPF' },
  { name: 'Camisola 100% Algodon IPF No.40', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-02', brand: 'IPF' },
  { name: 'Camisola 100% Algodon IPF No.42', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-03', brand: 'IPF' },
  { name: 'Camisola 100% Algodon IPF No.44', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-04', brand: 'IPF' },
  { name: 'Camisola 100% Algodon IPF No.46', category: 'Ropa de Trabajo', unit: 'pieza', partNumber: '01162-06', brand: 'IPF' },
  // Proteccion Corporal
  { name: 'Pechera Carnaza LAMIRA 50x80cm', category: 'Proteccion Corporal', unit: 'pieza', partNumber: '00602-01', brand: 'LAMIRA' },
  { name: 'Rodillera Profesional Rooster', category: 'Proteccion Corporal', unit: 'par', partNumber: '00679-01', brand: 'Rooster' },
  // Calzado
  { name: 'Talonera Antiestatica Jyrsa Unitalla', category: 'Calzado', unit: 'pieza', partNumber: '01425-01', brand: 'Jyrsa' },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const item of items) {
    const exists = await prisma.eppItem.findFirst({
      where: { companyId: COMPANY_ID, partNumber: item.partNumber },
    });
    if (exists) { skipped++; continue; }
    await prisma.eppItem.create({
      data: { ...item, minStock: 0, maxStock: 0, currentStock: 0, companyId: COMPANY_ID },
    });
    created++;
    process.stdout.write('.');
  }
  console.log('\nCreados:', created, '| Ya existian:', skipped, '| Total:', items.length);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
