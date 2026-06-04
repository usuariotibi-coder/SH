const { PrismaClient } = require('@prisma/client');
const XLSX = require('../node_modules/xlsx');

const prisma = new PrismaClient();
const COMPANY_ID = 'cmnywhzr700008dctf90464sy';

// Frequency map
const FREQ = { 'mensual': '1', '3 meses': '3', '6 meses': '6', 'anual': '12' };

// New items to create
const NEW_ITEMS = [
  { name: 'Arnes de Seguridad',    category: 'Especifico',        unit: 'pieza' },
  { name: 'Bata',                  category: 'Ropa de Trabajo',   unit: 'pieza' },
  { name: 'Botas para Quimicos',   category: 'Calzado',           unit: 'par'   },
  { name: 'Camisola de Mezclilla', category: 'Ropa de Trabajo',   unit: 'pieza' },
  { name: 'Careta de Alto Voltaje',category: 'Proteccion Facial', unit: 'pieza' },
  { name: 'Careta de Esmerilado',  category: 'Proteccion Facial', unit: 'pieza' },
  { name: 'Careta de Soldador',    category: 'Proteccion Facial', unit: 'pieza' },
  { name: 'Filtros para Polvos',   category: 'Respiradores',      unit: 'pieza' },
  { name: 'Linea de Vida',         category: 'Especifico',        unit: 'pieza' },
  { name: 'Overol',                category: 'Ropa de Trabajo',   unit: 'pieza' },
  { name: 'Pantalon de Mezclilla', category: 'Ropa de Trabajo',   unit: 'pieza' },
  { name: 'Polainas',              category: 'Calzado',           unit: 'par'   },
];

async function main() {
  // ── Step 1: create new items ──────────────────────────────────────────────
  console.log('Creando artículos nuevos...');
  for (const item of NEW_ITEMS) {
    const exists = await prisma.eppItem.findFirst({
      where: { companyId: COMPANY_ID, name: item.name },
    });
    if (!exists) {
      await prisma.eppItem.create({
        data: { ...item, minStock: 0, maxStock: 0, currentStock: 0, companyId: COMPANY_ID },
      });
      console.log('  + Creado:', item.name);
    } else {
      console.log('  ~ Ya existe:', item.name);
    }
  }

  // ── Step 2: build lookup map name → id ───────────────────────────────────
  const allItems = await prisma.eppItem.findMany({
    where: { companyId: COMPANY_ID, isActive: true },
    select: { id: true, name: true },
  });
  const byName = {};
  allItems.forEach(i => { byName[i.name.toLowerCase()] = i.id; });

  // Mapping: excel EPP label → DB item name
  const MAP = {
    'conchas auditivas':          'Orejera Premium Tipo Diadema SRR 31dB LAMIRA',
    'tapones de seguridad ':      'Tapon Auditivo Reutilizable con Cordon SNR 30dB Arca Safety',
    'tapones de seguridad':       'Tapon Auditivo Reutilizable con Cordon SNR 30dB Arca Safety',
    'lentes antimpacto':          'Lente Policarbonato Antiimpacto LAMIRA',
    'careta de esmerilado':       'Careta de Esmerilado',
    'careta de soldador':         'Careta de Soldador',
    'careta de alto voltaje':     'Careta de Alto Voltaje',
    'mascarilla':                 'Respirador Desechable N95 8210 3M',
    'filtros de vapores':         'Filtro Polipropileno Vapores Organicos P100 2097 3M',
    'fitros para polvos':         'Filtros para Polvos',
    'filtros para polvos':        'Filtros para Polvos',
    'mascarilla 3m':              'Respirador Desechable N95 8210 3M',
    'monja de mezclilla':         'Capucha Mezclilla para Soldador MAT',
    'casco':                      'Casco de seguridad tipo I',
    'guante de argonero':         'Guante Piel Argonero Lamira XL',
    'guante de carnaza':          'Guante Carnaza Corto LAMIRA No.10',
    'guante anticorte':           'Guante HPPE Nitrilo Espumado Cortes A4 DuraFlex Gisa No.9',
    'guante para soldador':       'Guante Carnaza Soldador con Kevlar LAMIRA No.10',
    'guantes para quimicos':      'Guante Industrial contra Acidos 18 DermaCare No.8',
    'guante antimpacto':          'Guante HPPE Nitrilo Arenado Antiimpacto DuraFlex Gisa No.9',
    'peto de carnaza':            'Pechera Carnaza LAMIRA 50x80cm',
    'mandil de plástico':         'Mandil PVC Sanitario Jyrsa 70x110cm',
    'arnes':                      'Arnes de Seguridad',
    'linea  de vida':             'Linea de Vida',
    'linea de vida':              'Linea de Vida',
    'botas para quimicos':        'Botas para Quimicos',
    'polainas':                   'Polainas',
    'rodilleras':                 'Rodillera Profesional Rooster',
    'taloneras':                  'Talonera Antiestatica Jyrsa Unitalla',
    'chaleco':                    'Chaleco Rescatista Lamira LG',
    'bata':                       'Bata',
    'camisola de mezclilla':      'Camisola de Mezclilla',
    'camisola de algodón':        'Camisola 100% Algodon IPF No.38',
    'pantalon de mezclilla':      'Pantalon de Mezclilla',
    'overol':                     'Overol',
  };

  const resolveId = (excelName) => {
    const target = MAP[excelName.toLowerCase().trim()];
    if (!target) return null;
    return byName[target.toLowerCase()] || null;
  };

  // ── Step 3: parse Excel ───────────────────────────────────────────────────
  const wb = XLSX.readFile('C:/Users/Sergio Norato/Documents/Proyectos/SH/EPP.xlsx');
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['MATRIZ EPP'], { header: 1 });
  const EPP_HEADERS = raw[3].slice(3);

  let currentArea = '';
  const entries = [];

  for (let i = 5; i < raw.length; i++) {
    const r = raw[i];
    if (!r || r.every(c => !c)) continue;
    if (r[0]) currentArea = r[0];
    const puesto   = r[1]?.toString().trim();
    const personal = Number(r[2]) || 0;
    if (!puesto) continue;

    for (let j = 3; j < r.length && j - 3 < EPP_HEADERS.length; j++) {
      const val = r[j];
      if (!val || val === 0) continue;
      const excelName = EPP_HEADERS[j - 3];
      const freq = FREQ[val] || String(val);
      const itemId = resolveId(excelName);
      if (!itemId) {
        console.warn('  ! No se encontró artículo para:', excelName);
        continue;
      }
      entries.push({ area: currentArea, puesto, personal, excelName, itemId, freq });
    }
  }

  // ── Step 4: upsert EppAreaRequirement ────────────────────────────────────
  console.log(`\nCargando ${entries.length} registros de matriz...`);
  let created = 0, updated = 0, errors = 0;

  for (const e of entries) {
    try {
      const existing = await prisma.eppAreaRequirement.findFirst({
        where: { companyId: COMPANY_ID, eppItemId: e.itemId, areaName: e.puesto },
      });
      if (existing) {
        await prisma.eppAreaRequirement.update({
          where: { id: existing.id },
          data: { userCount: e.personal, changeFrequency: e.freq, mandatory: true },
        });
        updated++;
      } else {
        await prisma.eppAreaRequirement.create({
          data: {
            eppItemId:       e.itemId,
            areaName:        e.puesto,
            mandatory:       true,
            userCount:       e.personal,
            changeFrequency: e.freq,
            companyId:       COMPANY_ID,
          },
        });
        created++;
      }
    } catch (err) {
      console.error('  Error en', e.puesto, '-', e.excelName, ':', err.message);
      errors++;
    }
  }

  console.log(`\n✓ Creados: ${created} | Actualizados: ${updated} | Errores: ${errors}`);
  console.log(`Total puestos únicos: ${[...new Set(entries.map(e => e.puesto))].length}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
