/**
 * populate-requirements.js
 *
 * 1. Borra toda la base de datos EXCEPTO usuarios y empresas
 * 2. Parsea los archivos .md de la carpeta Normas
 * 3. Inserta requerimientos reales en la base de datos para la empresa 1
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const NORMAS_DIR = path.join(__dirname, '../../Normas');

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractNomCode(filename) {
  const m = filename.match(/NOM-[\d]+-[\w]+-[\d]+/i);
  return m ? m[0].toUpperCase() : null;
}

function extractNomName(content) {
  // Primera línea h1 o h2 con el título completo
  const m = content.match(/^#+ (Análisis de la |Registro de requerimientos[^\n]*\n\n[^\n]*)?(NOM-[^\n]+)/m);
  if (m) return m[0].replace(/^#+ /, '').replace(/\[\^1\]/g, '').trim();
  const h1 = content.match(/^# (.+)/m);
  return h1 ? h1[1].trim() : 'NOM STPS';
}

function extractObjective(content) {
  // Busca sección "Objetivo y campo de aplicación" o "Resumen ejecutivo"
  const sections = [
    /## Objetivo[^\n]*\n+([\s\S]+?)(?=\n##)/,
    /## Resumen ejecutivo\n+([\s\S]+?)(?=\n##)/,
  ];
  for (const re of sections) {
    const m = content.match(re);
    if (m) {
      // Toma el primer párrafo, max 400 chars
      const p = m[1].split('\n\n')[0].replace(/\[\^[0-9]+\]/g, '').trim();
      return p.length > 400 ? p.slice(0, 397) + '...' : p;
    }
  }
  return null;
}

/**
 * Parsea todas las tablas markdown de un archivo y devuelve filas.
 * Retorna array de { numeral, requisito, periodicidad }
 */
function parseTableRows(content) {
  const rows = [];

  // Divide por líneas y busca bloques de tabla
  const lines = content.split('\n');
  let inTable = false;
  let headers = [];
  let colCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) { inTable = false; headers = []; continue; }

    // Línea separadora (|---|---|)
    if (/^\|[-| :]+\|$/.test(trimmed)) continue;

    const cols = trimmed.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);

    // Primera fila de tabla → cabecera
    if (!inTable) {
      headers = cols.map(h => h.toLowerCase());
      colCount = cols.length;
      inTable = true;
      continue;
    }

    if (cols.length < 2) continue;

    // Determinar qué columna es qué según el header
    let numeral = '', requisito = '', periodicidad = '';

    if (colCount >= 3) {
      // Detectar orden por headers
      const numeralIdx = headers.findIndex(h => h.includes('numeral') || h.includes('artículo'));
      const reqIdx = headers.findIndex(h => h.includes('actividad') || h.includes('requisito') || h.includes('obligación'));
      const perIdx = headers.findIndex(h => h.includes('periodicidad') || h.includes('frecuencia') || h.includes('alcance'));

      if (numeralIdx === 0 && reqIdx === 1) {
        // nom-001 style: numeral | requisito | periodicidad
        numeral = cols[0] || '';
        requisito = cols[1] || '';
        periodicidad = cols[2] || '';
      } else {
        // Standard: actividad | numeral | periodicidad
        numeral = cols[numeralIdx >= 0 ? numeralIdx : 1] || '';
        requisito = cols[reqIdx >= 0 ? reqIdx : 0] || '';
        periodicidad = cols[perIdx >= 0 ? perIdx : 2] || '';
      }
    } else if (colCount === 2) {
      requisito = cols[0];
      periodicidad = cols[1];
    }

    // Limpiar
    numeral = numeral.replace(/\[\^[0-9]+\]/g, '').trim();
    requisito = requisito.replace(/\[\^[0-9]+\]/g, '').replace(/\*\*/g, '').trim();
    periodicidad = periodicidad.replace(/\[\^[0-9]+\]/g, '').trim();

    if (requisito && requisito.length > 5 && !requisito.startsWith('---')) {
      rows.push({ numeral, requisito, periodicidad });
    }
  }

  return rows;
}

function shortName(requisito, maxLen = 100) {
  // Toma las primeras palabras significativas
  const clean = requisito.replace(/\(.*?\)/g, '').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…';
}

function dueDateFromPeriodicity(periodicidad) {
  const p = periodicidad.toLowerCase();
  const now = new Date();
  const add = (days) => new Date(now.getTime() + days * 86400000);

  if (p.includes('mensual') || p.includes('cada mes') || p.includes('mensual')) return add(30);
  if (p.includes('bimestral')) return add(60);
  if (p.includes('trimestral') || p.includes('3 meses') || p.includes('tres meses')) return add(90);
  if (p.includes('semestral') || p.includes('6 meses') || p.includes('seis meses')) return add(180);
  if (p.includes('anual') || p.includes('12 meses') || p.includes('un año') || p.includes('cada año')) return add(365);
  if (p.includes('bienal') || p.includes('2 años') || p.includes('dos años') || p.includes('cada 2')) return add(730);
  if (p.includes('quinquenal') || p.includes('5 años') || p.includes('cinco años')) return add(1825);
  if (p.includes('72 horas')) return add(3);
  if (p.includes('inmediato') || p.includes('inmediata')) return add(7);
  if (p.includes('continua') || p.includes('permanente') || p.includes('todo momento')) return add(365);
  if (p.includes('cada vez') || p.includes('posterior a') || p.includes('después de')) return add(30);
  return add(365); // default anual
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧹 Limpiando base de datos (excepto usuarios y empresas)...');

  // Borrar en orden por dependencias
  await prisma.evidence.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.cMSHMeeting.deleteMany();
  await prisma.cMSHMember.deleteMany();
  await prisma.training.deleteMany();
  await prisma.drill.deleteMany();
  await prisma.fiveS.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.sHProgram.deleteMany();
  await prisma.brigadeMember.deleteMany();
  await prisma.brigade.deleteMany();

  console.log('✅ Base de datos limpiada');

  // Obtener empresa 1 y usuario admin
  const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!company) throw new Error('No hay empresa en la base de datos. Ejecuta el seed primero.');

  const admin = await prisma.user.findFirst({
    where: { companyId: company.id, role: 'ADMIN' },
  });
  if (!admin) throw new Error('No hay usuario ADMIN en la empresa.');

  console.log(`\n🏭 Empresa: ${company.name}`);
  console.log(`👤 Usuario: ${admin.name} (${admin.email})\n`);

  // Leer archivos de normas
  const files = fs.readdirSync(NORMAS_DIR).filter(f => f.endsWith('.md'));
  console.log(`📂 Archivos encontrados: ${files.length}\n`);

  let totalCreated = 0;
  let skipped = 0;

  for (const filename of files.sort()) {
    const filepath = path.join(NORMAS_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf8');

    const nomCode = extractNomCode(filename) || extractNomCode(content) || 'NOM-STPS';
    const normName = (() => {
      // Extraer del título h1 del archivo
      const h1 = content.match(/^# (.+)/m);
      if (h1) return h1[1].replace(/\[\^[0-9]+\]/g, '').trim();
      // Del nombre del archivo
      return filename.replace(/\.md$/, '').replace(/^Análisis de la /, '').trim();
    })();
    const normObjective = extractObjective(content);

    const rows = parseTableRows(content);

    if (rows.length === 0) {
      console.log(`  ⚠️  ${nomCode}: sin requerimientos parseados — omitido`);
      skipped++;
      continue;
    }

    console.log(`  📋 ${nomCode}: ${rows.length} requerimientos`);

    for (const row of rows) {
      const code = `${nomCode}${row.numeral ? ' §' + row.numeral : ''}`;
      const name = shortName(row.requisito);
      const specificRequirement = row.periodicidad
        ? `${row.requisito}\n\nPeriodicidad: ${row.periodicidad}`
        : row.requisito;

      await prisma.requirement.create({
        data: {
          code,
          name,
          specificRequirement,
          legalSource: 'NOM',
          legalBasis: nomCode + (row.numeral ? ', numeral ' + row.numeral : ''),
          normName,
          normObjective,
          applicabilityScope: 'Aplica a todas las áreas del centro de trabajo',
          status: 'PENDING',
          dueDate: dueDateFromPeriodicity(row.periodicidad || ''),
          companyId: company.id,
          createdById: admin.id,
        },
      });

      totalCreated++;
    }
  }

  const total = await prisma.requirement.count();
  console.log(`\n✅ Requerimientos creados: ${totalCreated}`);
  console.log(`⚠️  Archivos omitidos: ${skipped}`);
  console.log(`📊 Total en BD: ${total}`);
  console.log(`\n🏭 Empresa: ${company.name}`);
  console.log(`🔑 Acceso: admin@sh-app.mx / Admin1234!\n`);
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
