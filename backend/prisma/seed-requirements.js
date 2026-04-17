/**
 * seed-requirements.js
 * Genera los 20 requerimientos basados en las normas de la carpeta /Normas
 * Uso: node prisma/seed-requirements.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const daysAgo  = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFrom = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// ─── Catálogo de 20 normas ────────────────────────────────────────────────────

const NORMS = [
  {
    code: 'NOM-001-STPS-2008',
    name: 'Edificios, locales, instalaciones y áreas',
    normName: 'Norma Oficial Mexicana NOM-001-STPS-2008, Edificios, locales, instalaciones y áreas en los centros de trabajo — Condiciones de seguridad.',
    normObjective: 'Establecer las condiciones de seguridad que deben cumplir los edificios, locales, instalaciones y áreas de los centros de trabajo para evitar riesgos que provoquen daños a la integridad física de los trabajadores o deterioro a las instalaciones.',
    applicabilityJustification: 'La empresa cuenta con instalaciones industriales que incluyen edificios de manufactura, almacenes y áreas de servicio, las cuales deben mantenerse en condiciones seguras para proteger la integridad del personal.',
    applicabilityScope: 'Aplica a todos los edificios, locales, instalaciones y áreas del centro de trabajo: planta de producción, almacenes, talleres de mantenimiento, oficinas administrativas y zonas de tránsito.',
    specificRequirement: 'Realizar verificaciones oculares anuales por área, efectuar verificaciones posteriores a eventos que puedan dañar las instalaciones (sismos, inundaciones), mantener mantenimiento semestral a puertas de emergencia y contar con programa anual de mantenimiento al sistema de ventilación artificial.',
    legalBasis: 'Numerales 5.2, 5.3, 7.5.1 h) y 8.3',
    area: 'General',
    responsibleArea: 'Mantenimiento',
    status: 'PENDING',
    daysOffset: 90,
    activities: [
      { description: 'Realizar verificación ocular anual de todas las áreas del centro de trabajo e identificar condiciones inseguras', responsible: 'Jefe de Mantenimiento', daysFromNow: 30, isCompleted: false },
      { description: 'Elaborar bitácora de resultados de verificaciones y registrar hallazgos para conservación de un año', responsible: 'Especialista SH', daysFromNow: 35, isCompleted: false },
      { description: 'Programar y ejecutar mantenimiento semestral a puertas de acceso de escaleras de emergencia exteriores', responsible: 'Jefe de Mantenimiento', daysFromNow: 60, isCompleted: false },
      { description: 'Elaborar programa anual de mantenimiento preventivo/correctivo al sistema de ventilación artificial', responsible: 'Jefe de Mantenimiento', daysFromNow: 90, isCompleted: false },
    ],
  },
  {
    code: 'NOM-002-STPS-2010',
    name: 'Prevención y protección contra incendios',
    normName: 'Norma Oficial Mexicana NOM-002-STPS-2010, Condiciones de seguridad — Prevención y protección contra incendios en los centros de trabajo.',
    normObjective: 'Establecer los requerimientos para la prevención y protección contra incendios en los centros de trabajo, a fin de reducir los riesgos de un incendio, su propagación y las lesiones o daños que puedan causar a los trabajadores.',
    applicabilityJustification: 'El centro de trabajo cuenta con procesos productivos que utilizan materiales inflamables, equipos eléctricos industriales y almacenamiento de sustancias que representan riesgo de incendio.',
    applicabilityScope: 'Aplica a todas las áreas de la empresa: producción, almacén, oficinas administrativas y zonas de carga y descarga. Incluye a todo el personal permanente, temporal y subcontratado.',
    specificRequirement: 'Clasificar riesgo de incendio, elaborar plan de atención a emergencias, contar con extintores vigentes con revisión mensual y mantenimiento anual, realizar simulacros (al menos 1 anual en riesgo ordinario o 2 en riesgo alto) y programa anual de capacitación en prevención y combate de incendios.',
    legalBasis: 'Numerales 5.1–5.11, 7.2, 7.4, 7.18, 10 y 11',
    area: 'General',
    responsibleArea: 'Seguridad e Higiene',
    status: 'IN_PROGRESS',
    daysOffset: 30,
    activities: [
      { description: 'Clasificar riesgo de incendio del centro de trabajo conforme al Apéndice A de la norma', responsible: 'Especialista SH', daysFromNow: -10, isCompleted: true },
      { description: 'Elaborar o actualizar plan de atención a emergencias de incendio con brigadas y procedimientos de evacuación', responsible: 'Especialista SH', daysFromNow: 5, isCompleted: false },
      { description: 'Ejecutar programa de revisión mensual de extintores y registrar resultados en bitácora', responsible: 'Jefe de Mantenimiento', daysFromNow: 10, isCompleted: false },
      { description: 'Realizar mantenimiento anual a todos los extintores del centro de trabajo', responsible: 'Proveedor externo', daysFromNow: 30, isCompleted: false },
      { description: 'Organizar y documentar simulacro de evacuación por incendio con participación de brigadas', responsible: 'Especialista SH', daysFromNow: 25, isCompleted: false },
      { description: 'Impartir programa anual de capacitación teórico-práctica en prevención y atención de emergencias de incendio', responsible: 'Especialista SH', daysFromNow: 30, isCompleted: false },
    ],
  },
  {
    code: 'NOM-004-STPS-1999',
    name: 'Protección y dispositivos de seguridad en maquinaria',
    normName: 'Norma Oficial Mexicana NOM-004-STPS-1999, Sistemas de protección y dispositivos de seguridad en la maquinaria y equipo que se utilice en los centros de trabajo.',
    normObjective: 'Establecer las condiciones de seguridad y los sistemas de protección y dispositivos necesarios para prevenir y proteger a los trabajadores contra los riesgos de trabajo generados por la operación y mantenimiento de la maquinaria y equipo.',
    applicabilityJustification: 'La empresa opera maquinaria de manufactura metalmecánica (tornos, fresadoras, prensas, sierras) que representa riesgo de atrapamiento, corte, aplastamiento y proyección de materiales para los operadores.',
    applicabilityScope: 'Aplica a toda la maquinaria y equipo instalado en el área de producción y taller de mantenimiento. Incluye operadores, mecánicos de mantenimiento y supervisores de área.',
    specificRequirement: 'Elaborar estudio de riesgo potencial de la maquinaria, elaborar y difundir el Programa Específico de Seguridad e Higiene para la Operación y Mantenimiento de Maquinaria y Equipo, implementar procedimientos de bloqueo de energía (LOTO) y llevar registros de mantenimiento preventivo y correctivo conservando evidencias al menos 12 meses.',
    legalBasis: 'Numerales 5.2, 5.3, 7.1, 7.2.2 y 7.2.3',
    area: 'Producción',
    responsibleArea: 'Producción',
    status: 'IN_PROGRESS',
    daysOffset: 45,
    activities: [
      { description: 'Elaborar estudio de riesgo potencial para toda la maquinaria del área de producción', responsible: 'Supervisor de Producción', daysFromNow: -5, isCompleted: true },
      { description: 'Desarrollar y difundir el Programa Específico de Seguridad e Higiene para Operación y Mantenimiento de Maquinaria', responsible: 'Especialista SH', daysFromNow: 15, isCompleted: false },
      { description: 'Implementar procedimiento formal de bloqueo de energía (LOTO) con candados y tarjetas de seguridad', responsible: 'Jefe de Mantenimiento', daysFromNow: 30, isCompleted: false },
      { description: 'Capacitar al personal operador en operación segura de maquinaria y en el procedimiento LOTO', responsible: 'Especialista SH', daysFromNow: 45, isCompleted: false },
      { description: 'Verificar que todos los protectores y dispositivos de seguridad estén instalados y funcionando correctamente', responsible: 'Supervisor de Producción', daysFromNow: 20, isCompleted: false },
    ],
  },
  {
    code: 'NOM-005-STPS-1998',
    name: 'Manejo, transporte y almacenamiento de sustancias químicas peligrosas',
    normName: 'Norma Oficial Mexicana NOM-005-STPS-1998, Relativa a las condiciones de seguridad e higiene en los centros de trabajo para el manejo, transporte y almacenamiento de sustancias químicas peligrosas.',
    normObjective: 'Establecer las condiciones de seguridad e higiene para el manejo, transporte y almacenamiento de sustancias químicas peligrosas y la producción de sustancias explosivas, a fin de prevenir y proteger la vida y la salud de los trabajadores.',
    applicabilityJustification: 'La empresa utiliza lubricantes, solventes, pinturas y otros agentes químicos en sus procesos de manufactura metalmecánica que requieren manejo, transporte interno y almacenamiento seguro.',
    applicabilityScope: 'Aplica a las áreas de producción, mantenimiento, pintura y almacén donde se manejen, transporten o almacenen sustancias químicas peligrosas. Incluye operadores, almacenistas y personal de mantenimiento.',
    specificRequirement: 'Elaborar y mantener actualizado el estudio de riesgos potenciales de las sustancias químicas, elaborar el Programa Específico de SH para manejo de sustancias peligrosas, contar con Hojas de Datos de Seguridad actualizadas, practicar exámenes médicos periódicos a personal expuesto y mantener programa de mantenimiento preventivo a equipos con registro de 12 meses.',
    legalBasis: 'Numerales 5.2, 5.12, 7 y 9',
    area: 'Almacén',
    responsibleArea: 'Seguridad e Higiene',
    status: 'PENDING',
    daysOffset: 75,
    activities: [
      { description: 'Elaborar inventario completo de sustancias químicas peligrosas presentes en el centro de trabajo', responsible: 'Especialista SH', daysFromNow: 20, isCompleted: false },
      { description: 'Actualizar estudio de riesgos potenciales de sustancias químicas peligrosas', responsible: 'Especialista SH', daysFromNow: 35, isCompleted: false },
      { description: 'Verificar que todas las sustancias cuenten con Hoja de Datos de Seguridad vigente y accesible al personal', responsible: 'Jefe de Almacén', daysFromNow: 40, isCompleted: false },
      { description: 'Elaborar Programa Específico de SH para manejo, transporte y almacenamiento de sustancias químicas peligrosas', responsible: 'Especialista SH', daysFromNow: 60, isCompleted: false },
      { description: 'Programar exámenes médicos periódicos para trabajadores expuestos a sustancias químicas peligrosas', responsible: 'Médico de empresa', daysFromNow: 75, isCompleted: false },
    ],
  },
  {
    code: 'NOM-006-STPS-2014',
    name: 'Manejo y almacenamiento de materiales',
    normName: 'Norma Oficial Mexicana NOM-006-STPS-2014, Manejo y almacenamiento de materiales — Condiciones de seguridad y salud en el trabajo.',
    normObjective: 'Establecer las condiciones de seguridad y salud en el trabajo que se deberán cumplir en los centros de trabajo para evitar riesgos a los trabajadores y daños a las instalaciones por las actividades de manejo y almacenamiento de materiales.',
    applicabilityJustification: 'La empresa realiza actividades de manejo y almacenamiento de materiales con montacargas, polipastos y de forma manual, actividades que representan riesgo de aplastamiento, caída de objetos y sobreesfuerzo.',
    applicabilityScope: 'Aplica al área de almacén, producción y embarques donde se utilicen montacargas, grúas, polipastos, eslingas y manejo manual de materiales. Incluye almacenistas, operadores de montacargas y personal de producción.',
    specificRequirement: 'Contar con programa específico de revisión y mantenimiento de maquinaria para manejo de materiales, realizar revisión visual y prueba funcional de maquinaria al inicio de cada jornada, efectuar vigilancia a la salud de trabajadores expuestos a sobreesfuerzo y capacitar al personal involucrado.',
    legalBasis: 'Numerales 5.1, 5.9, 5.11, 7.8.1 y 10',
    area: 'Almacén',
    responsibleArea: 'Almacén',
    status: 'PENDING',
    daysOffset: 60,
    activities: [
      { description: 'Elaborar programa específico de revisión y mantenimiento para montacargas, polipastos y eslingas', responsible: 'Jefe de Mantenimiento', daysFromNow: 20, isCompleted: false },
      { description: 'Implementar lista de verificación diaria para inspección de montacargas al inicio de jornada', responsible: 'Jefe de Almacén', daysFromNow: 15, isCompleted: false },
      { description: 'Elaborar procedimientos para manejo manual de materiales con límites de peso según NOM', responsible: 'Especialista SH', daysFromNow: 30, isCompleted: false },
      { description: 'Capacitar a personal de almacén en operación segura de montacargas y técnicas de levantamiento manual', responsible: 'Especialista SH', daysFromNow: 45, isCompleted: false },
      { description: 'Realizar exámenes médicos de vigilancia a la salud para trabajadores expuestos a sobreesfuerzo', responsible: 'Médico de empresa', daysFromNow: 60, isCompleted: false },
    ],
  },
  {
    code: 'NOM-009-STPS-2011',
    name: 'Condiciones de seguridad para trabajos en altura',
    normName: 'Norma Oficial Mexicana NOM-009-STPS-2011, Condiciones de seguridad para realizar trabajos en altura.',
    normObjective: 'Establecer los requerimientos mínimos de seguridad para la prevención de riesgos laborales por la realización de trabajos en altura, definidos como actividades a más de 1.80 metros sobre el nivel de referencia.',
    applicabilityJustification: 'El personal de mantenimiento realiza trabajos en techos, estructuras metálicas y andamios que superan 1.80 m de altura, representando riesgo de caída de altura que es una de las principales causas de accidentes graves.',
    applicabilityScope: 'Aplica a todos los trabajos de mantenimiento, limpieza e inspección realizados a más de 1.80 metros de altura. Incluye personal de mantenimiento, supervisores y personal externo contratado.',
    specificRequirement: 'Contar con análisis previo de riesgos, proporcionar sistemas personales de protección contra caídas certificados, establecer programa de revisión y mantenimiento de equipos, realizar exámenes médicos de aptitud física, elaborar plan de emergencias y capacitar al personal en trabajos en altura. Revisión anual mínima de equipos.',
    legalBasis: 'Numerales 5.3, 5.7, 5.10, 5.13, 7.14 y 16',
    area: 'Mantenimiento',
    responsibleArea: 'Mantenimiento',
    status: 'OVERDUE',
    daysOffset: -15,
    activities: [
      { description: 'Elaborar análisis de riesgo para todas las actividades de trabajo en altura identificadas en el centro', responsible: 'Jefe de Mantenimiento', daysFromNow: -30, isCompleted: false },
      { description: 'Verificar certificación y estado de sistemas personales de protección contra caídas (arneses, líneas de vida)', responsible: 'Especialista SH', daysFromNow: -20, isCompleted: false },
      { description: 'Realizar exámenes médicos de aptitud física a trabajadores asignados a trabajos en altura', responsible: 'Médico de empresa', daysFromNow: -15, isCompleted: false },
      { description: 'Capacitar al personal en uso correcto de sistemas de protección contra caídas y plan de emergencias en altura', responsible: 'Especialista SH', daysFromNow: -10, isCompleted: false },
    ],
  },
  {
    code: 'NOM-010-STPS-2014',
    name: 'Agentes químicos contaminantes del ambiente laboral',
    normName: 'Norma Oficial Mexicana NOM-010-STPS-2014, Agentes químicos contaminantes del ambiente laboral — Reconocimiento, evaluación y control.',
    normObjective: 'Establecer los procesos para reconocer, evaluar y controlar los agentes químicos contaminantes del ambiente laboral, con el fin de prevenir daños a la salud de los trabajadores ocupacionalmente expuestos.',
    applicabilityJustification: 'Los procesos de manufactura metalmecánica generan humos de soldadura, polvos metálicos, vapores de solventes y otros agentes químicos que pueden contaminar el ambiente laboral y afectar la salud de los trabajadores.',
    applicabilityScope: 'Aplica al área de producción, soldadura, pintura y mantenimiento donde se generen o manejen agentes químicos contaminantes. Incluye a todos los trabajadores ocupacionalmente expuestos.',
    specificRequirement: 'Elaborar estudio de agentes químicos contaminantes, establecer programa de medición ambiental con laboratorio acreditado, implementar medidas de control jerarquizadas, realizar vigilancia a la salud con exámenes médicos periódicos y conservar registros del estudio por al menos 5 años.',
    legalBasis: 'Numerales 5.1–5.9 y tablas de LMPE',
    area: 'Producción',
    responsibleArea: 'Seguridad e Higiene',
    status: 'OVERDUE',
    daysOffset: -30,
    activities: [
      { description: 'Contratar laboratorio acreditado para elaborar estudio de agentes químicos contaminantes del ambiente laboral', responsible: 'Especialista SH', daysFromNow: -45, isCompleted: false },
      { description: 'Realizar mediciones ambientales de humos de soldadura, polvos y solventes en áreas de exposición', responsible: 'Laboratorio externo', daysFromNow: -30, isCompleted: false },
      { description: 'Implementar medidas de control técnico (ventilación localizada, encapsulamiento) según resultados de medición', responsible: 'Jefe de Mantenimiento', daysFromNow: -15, isCompleted: false },
      { description: 'Programar exámenes médicos periódicos para trabajadores expuestos a agentes químicos contaminantes', responsible: 'Médico de empresa', daysFromNow: -10, isCompleted: false },
    ],
  },
  {
    code: 'NOM-011-STPS-2001',
    name: 'Ruido en centros de trabajo',
    normName: 'Norma Oficial Mexicana NOM-011-STPS-2001, Condiciones de seguridad e higiene en los centros de trabajo donde se genere ruido.',
    normObjective: 'Establecer las condiciones de seguridad e higiene en los centros de trabajo donde se genere ruido que pueda alterar la salud de los trabajadores, determinando los niveles máximos permisibles de exposición y los tiempos máximos por jornada.',
    applicabilityJustification: 'Los procesos de manufactura metalmecánica generan niveles de ruido superiores a 80 dB(A) en áreas de maquinado, prensas y corte que pueden causar hipoacusia inducida por ruido en trabajadores expuestos.',
    applicabilityScope: 'Aplica a las áreas de producción con maquinaria generadora de ruido: maquinado, prensas, corte y esmerilado. Incluye a todos los trabajadores con exposición a niveles iguales o superiores a 80 dB(A).',
    specificRequirement: 'Realizar reconocimiento y evaluación del NER cada 2 años o a los 90 días de cambios en procesos, implementar Programa de Conservación de la Audición en áreas ≥85 dB(A), practicar exámenes médicos anuales (audiometrías), proporcionar EPP auditivo certificado y conservar documentación del programa por los últimos 5 años.',
    legalBasis: 'Numerales 5.2–5.8, 7, 8.2, 8.3, 8.6 y 8.8.1',
    area: 'Producción',
    responsibleArea: 'Seguridad e Higiene',
    status: 'IN_PROGRESS',
    daysOffset: 60,
    activities: [
      { description: 'Contratar laboratorio acreditado para realizar mediciones del Nivel de Exposición a Ruido (NER) en todas las áreas', responsible: 'Especialista SH', daysFromNow: -5, isCompleted: true },
      { description: 'Elaborar Programa de Conservación de la Audición para áreas con NER ≥85 dB(A)', responsible: 'Especialista SH', daysFromNow: 15, isCompleted: false },
      { description: 'Proporcionar equipo de protección auditiva certificado a todos los trabajadores en áreas con NSA ≥85 dB(A)', responsible: 'Jefe de Producción', daysFromNow: 10, isCompleted: false },
      { description: 'Programar y ejecutar audiometrías anuales a trabajadores expuestos a niveles ≥85 dB(A)', responsible: 'Médico de empresa', daysFromNow: 30, isCompleted: false },
      { description: 'Implementar medidas técnicas de control: cabinas acústicas, aislamiento de máquinas, barreras absorbentes', responsible: 'Jefe de Mantenimiento', daysFromNow: 60, isCompleted: false },
    ],
  },
  {
    code: 'NOM-017-STPS-2008',
    name: 'Equipo de protección personal',
    normName: 'Norma Oficial Mexicana NOM-017-STPS-2008, Equipo de protección personal — Selección, uso y manejo en los centros de trabajo.',
    normObjective: 'Establecer los requisitos mínimos para que el patrón seleccione, adquiera y proporcione a los trabajadores el equipo de protección personal correspondiente para protegerlos de los agentes del medio ambiente de trabajo que puedan dañar su integridad física y su salud.',
    applicabilityJustification: 'La empresa realiza procesos de manufactura metalmecánica que incluyen maquinado, soldadura, esmerilado y manejo de materiales, actividades que exponen al personal a riesgos de proyección de partículas, ruido, sustancias químicas y esfuerzo físico.',
    applicabilityScope: 'Aplica a todos los trabajadores del área de producción, mantenimiento y almacén. Incluye personal de planta, supervisores y contratistas que realicen actividades dentro de las instalaciones.',
    specificRequirement: 'Identificar y analizar riesgos por puesto y área, determinar el EPP requerido, proporcionarlo en función de las características físicas del trabajador, capacitar en su uso y mantenimiento, supervisar su uso durante la jornada, señalizar áreas con uso obligatorio de EPP y mantener registros de entrega y reposición.',
    legalBasis: 'Numerales 5.2–5.8 y Guía de referencia Tabla A1',
    area: 'Producción',
    responsibleArea: 'Seguridad e Higiene',
    status: 'COMPLETED',
    daysOffset: -90,
    activities: [
      { description: 'Elaborar y actualizar análisis de riesgos por puesto y área para determinar EPP requerido', responsible: 'Especialista SH', daysFromNow: -120, isCompleted: true },
      { description: 'Adquirir y distribuir EPP adecuado a cada puesto con instrucciones de uso, mantenimiento y reposición', responsible: 'Especialista SH', daysFromNow: -100, isCompleted: true },
      { description: 'Impartir capacitación a todo el personal sobre uso correcto, revisión y disposición final del EPP', responsible: 'Especialista SH', daysFromNow: -95, isCompleted: true },
      { description: 'Instalar señalización de uso obligatorio de EPP en todas las áreas identificadas conforme a NOM-026', responsible: 'Jefe de Mantenimiento', daysFromNow: -90, isCompleted: true },
    ],
  },
  {
    code: 'NOM-018-STPS-2015',
    name: 'Sistema armonizado de identificación de peligros SGA',
    normName: 'Norma Oficial Mexicana NOM-018-STPS-2015, Sistema armonizado para la identificación y comunicación de peligros y riesgos por sustancias químicas peligrosas en los centros de trabajo.',
    normObjective: 'Establecer los requisitos para disponer en los centros de trabajo del sistema armonizado de identificación y comunicación de peligros y riesgos por sustancias químicas peligrosas, con base en el Sistema Globalmente Armonizado (GHS), a fin de prevenir daños a los trabajadores.',
    applicabilityJustification: 'La empresa maneja lubricantes, solventes, pinturas, gases comprimidos y otros productos químicos en sus procesos de manufactura, los cuales requieren identificación y comunicación de peligros conforme al SGA.',
    applicabilityScope: 'Aplica a todas las áreas donde se manejen sustancias químicas peligrosas: almacén, producción, pintura y mantenimiento. Incluye a todos los trabajadores, contratistas y personal de emergencias.',
    specificRequirement: 'Contar con Hojas de Datos de Seguridad (HDS) de 16 secciones en español para todas las sustancias peligrosas manejadas, clasificar sustancias conforme al GHS, elaborar etiquetas con pictogramas y frases H y P, señalizar áreas de almacenamiento y capacitar al personal en la interpretación del sistema.',
    legalBasis: 'Numerales 5.1–5.7 y Apéndices A, B, C, D y E',
    area: 'Almacén',
    responsibleArea: 'Almacén',
    status: 'IN_PROGRESS',
    daysOffset: 50,
    activities: [
      { description: 'Elaborar inventario actualizado de todas las sustancias químicas peligrosas y verificar que cuenten con HDS vigente de 16 secciones', responsible: 'Jefe de Almacén', daysFromNow: -3, isCompleted: true },
      { description: 'Clasificar todas las sustancias conforme al SGA y elaborar etiquetas con pictogramas, palabras de advertencia y frases H y P', responsible: 'Especialista SH', daysFromNow: 15, isCompleted: false },
      { description: 'Señalizar áreas de almacenamiento con el sistema armonizado de identificación de peligros', responsible: 'Jefe de Almacén', daysFromNow: 25, isCompleted: false },
      { description: 'Capacitar a todo el personal que maneja sustancias químicas en la interpretación de etiquetas SGA e HDS', responsible: 'Especialista SH', daysFromNow: 50, isCompleted: false },
    ],
  },
  {
    code: 'NOM-019-STPS-2011',
    name: 'Comisión Mixta de Seguridad e Higiene',
    normName: 'Norma Oficial Mexicana NOM-019-STPS-2011, Constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene en los centros de trabajo.',
    normObjective: 'Establecer los requerimientos para la constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene en los centros de trabajo, con el fin de identificar las causas de los accidentes y enfermedades de trabajo y proponer medidas preventivas.',
    applicabilityJustification: 'Todo centro de trabajo con más de un trabajador está obligado a conformar una Comisión Mixta de Seguridad e Higiene conforme a lo dispuesto por el artículo 509 de la Ley Federal del Trabajo.',
    applicabilityScope: 'Aplica a la totalidad de la plantilla laboral y a todos los niveles jerárquicos de la organización. El comité estará integrado por representantes del patrón y de los trabajadores.',
    specificRequirement: 'Constituir e integrar formalmente la Comisión de Seguridad e Higiene mediante acta, elaborar programa anual de recorridos de verificación, realizar recorridos con actas documentadas, investigar accidentes de trabajo, capacitar a los integrantes al menos una vez al año y dar seguimiento a las recomendaciones formuladas.',
    legalBasis: 'Numerales 5.1–5.11, 7 y 8',
    area: 'General',
    responsibleArea: 'Dirección General',
    status: 'COMPLETED',
    daysOffset: -75,
    activities: [
      { description: 'Formalizar acta de constitución e integración de la Comisión de Seguridad e Higiene con representantes de patrón y trabajadores', responsible: 'Dirección General', daysFromNow: -120, isCompleted: true },
      { description: 'Elaborar programa anual de recorridos de verificación que cubra todas las áreas y turnos del centro de trabajo', responsible: 'Coordinador CMSH', daysFromNow: -100, isCompleted: true },
      { description: 'Ejecutar recorridos de verificación mensuales con actas de hallazgos y recomendaciones', responsible: 'Secretario CMSH', daysFromNow: -80, isCompleted: true },
      { description: 'Impartir capacitación anual a los integrantes de la Comisión sobre funciones, responsabilidades y metodología de recorridos', responsible: 'Especialista SH', daysFromNow: -75, isCompleted: true },
    ],
  },
  {
    code: 'NOM-020-STPS-2011',
    name: 'Recipientes a presión y generadores de vapor',
    normName: 'Norma Oficial Mexicana NOM-020-STPS-2011, Recipientes sujetos a presión, recipientes criogénicos y generadores de vapor o calderas — Funcionamiento y condiciones de seguridad.',
    normObjective: 'Establecer los requisitos de seguridad para el funcionamiento de los recipientes sujetos a presión, recipientes criogénicos y generadores de vapor o calderas en los centros de trabajo, a fin de prevenir riesgos a los trabajadores y daños en las instalaciones.',
    applicabilityJustification: 'El centro de trabajo cuenta con compresores de aire, recipientes a presión y posiblemente generadores de vapor que requieren clasificación, expedientes técnicos, programas de mantenimiento y pruebas periódicas de presión.',
    applicabilityScope: 'Aplica a todos los recipientes a presión, compresores y equipos relacionados instalados en el centro de trabajo. Incluye al personal de operación y mantenimiento de dichos equipos.',
    specificRequirement: 'Clasificar todos los equipos en categorías I, II o III, elaborar listado y expediente por equipo, aplicar programas de revisión y mantenimiento para equipos categoría II y III, realizar pruebas de presión o exámenes no destructivos al menos cada 5 años y demostrar funcionamiento de dispositivos de relevo de presión.',
    legalBasis: 'Numerales 5.1–5.17, 7, 8, 9, 10, 13 y 14',
    area: 'Producción',
    responsibleArea: 'Mantenimiento',
    status: 'OVERDUE',
    daysOffset: -7,
    activities: [
      { description: 'Elaborar inventario y clasificar todos los recipientes a presión en categorías I, II o III conforme a la norma', responsible: 'Jefe de Mantenimiento', daysFromNow: -20, isCompleted: false },
      { description: 'Integrar expediente técnico por cada equipo categoría II y III con fichas técnicas y documentación requerida', responsible: 'Jefe de Mantenimiento', daysFromNow: -10, isCompleted: false },
      { description: 'Contratar unidad de verificación acreditada para pruebas de presión o exámenes no destructivos en equipos categoría II y III', responsible: 'Gerencia', daysFromNow: -5, isCompleted: false },
      { description: 'Verificar funcionamiento de todos los dispositivos de relevo de presión (válvulas de seguridad)', responsible: 'Jefe de Mantenimiento', daysFromNow: -7, isCompleted: false },
    ],
  },
  {
    code: 'NOM-021-STPS-1994',
    name: 'Informes de riesgos de trabajo — Estadísticas',
    normName: 'Norma Oficial Mexicana NOM-021-STPS-1994, Requerimientos y características de los informes de los riesgos de trabajo que ocurran, para integrar las estadísticas.',
    normObjective: 'Establecer los requerimientos y características de los informes de los riesgos de trabajo que ocurran, para que las autoridades del trabajo lleven una estadística nacional de los mismos y se cuente con información para diseñar políticas de prevención.',
    applicabilityJustification: 'La empresa está obligada a reportar todos los accidentes y enfermedades de trabajo a la STPS en los plazos establecidos, para contribuir a la estadística nacional de riesgos laborales.',
    applicabilityScope: 'Aplica a toda la plantilla laboral. Cualquier accidente de trabajo o enfermedad profesional debe ser notificado conforme a los formatos CM-2A y CM-2B dentro de las 72 horas.',
    specificRequirement: 'Notificar accidentes de trabajo a la STPS dentro de las 72 horas usando formato CM-2A, enviar datos adicionales (CM-2B) dentro de las 72 horas posteriores al alta médica o defunción, comunicar cada evento a la Comisión de Seguridad e Higiene y llevar registro interno continuo de todos los avisos emitidos.',
    legalBasis: 'Numerales 3.1.1, 3.1.3, 3.1.4 y formatos CM-2A y CM-2B',
    area: 'General',
    responsibleArea: 'Recursos Humanos',
    status: 'COMPLETED',
    daysOffset: -60,
    activities: [
      { description: 'Establecer procedimiento interno para notificación de accidentes a STPS en un máximo de 72 horas con formatos CM-2A y CM-2B', responsible: 'Especialista SH', daysFromNow: -90, isCompleted: true },
      { description: 'Designar responsable de elaborar y remitir los formatos CM-2A y CM-2B ante cada accidente o enfermedad de trabajo', responsible: 'Jefatura de RH', daysFromNow: -85, isCompleted: true },
      { description: 'Implementar registro interno de seguimiento de accidentes y enfermedades para estadística interna', responsible: 'Especialista SH', daysFromNow: -80, isCompleted: true },
      { description: 'Verificar que la Comisión de Seguridad e Higiene sea informada de cada evento ocurrido en el centro de trabajo', responsible: 'Coordinador CMSH', daysFromNow: -60, isCompleted: true },
    ],
  },
  {
    code: 'NOM-025-STPS-2008',
    name: 'Condiciones de iluminación en centros de trabajo',
    normName: 'Norma Oficial Mexicana NOM-025-STPS-2008, Condiciones de iluminación en los centros de trabajo.',
    normObjective: 'Establecer los requerimientos de iluminación en las áreas de los centros de trabajo para contar con la cantidad de iluminación requerida para cada actividad visual y así proveer un ambiente seguro y saludable en la realización de las tareas.',
    applicabilityJustification: 'Las actividades de manufactura de precisión, inspección de calidad y ensamble requieren niveles específicos de iluminación para garantizar la seguridad del trabajador y la calidad del producto.',
    applicabilityScope: 'Aplica a todas las áreas del centro de trabajo: producción, almacén, oficinas, pasillos y zonas de circulación. Los exámenes médicos aplican a trabajadores en áreas con iluminación especial.',
    specificRequirement: 'Realizar reconocimiento y evaluación de condiciones de iluminación con luxómetro calibrado, contar con informe de resultados y mantenerlo actualizado, elaborar programa de mantenimiento de luminarias, practicar exámenes anuales de agudeza visual a trabajadores en áreas con iluminación especial y contar con sistema de iluminación de emergencia.',
    legalBasis: 'Numerales 5.3–5.11 y Tabla 1',
    area: 'Producción',
    responsibleArea: 'Mantenimiento',
    status: 'COMPLETED',
    daysOffset: -60,
    activities: [
      { description: 'Contratar laboratorio acreditado para realizar evaluación de niveles de iluminación con luxómetro calibrado en todas las áreas', responsible: 'Jefe de Mantenimiento', daysFromNow: -90, isCompleted: true },
      { description: 'Elaborar informe de resultados de evaluación con comparativo contra niveles mínimos de la Tabla 1 de la norma', responsible: 'Jefe de Mantenimiento', daysFromNow: -75, isCompleted: true },
      { description: 'Implementar programa de mantenimiento de luminarias con limpieza periódica y reemplazo según horas de operación', responsible: 'Jefe de Mantenimiento', daysFromNow: -70, isCompleted: true },
      { description: 'Programar exámenes anuales de agudeza visual, campimetría y percepción de colores a trabajadores en iluminación especial', responsible: 'Médico de empresa', daysFromNow: -60, isCompleted: true },
    ],
  },
  {
    code: 'NOM-026-STPS-2008',
    name: 'Colores y señales de seguridad e higiene',
    normName: 'Norma Oficial Mexicana NOM-026-STPS-2008, Colores y señales de seguridad e higiene, e identificación de riesgos por fluidos conducidos en tuberías.',
    normObjective: 'Establecer los requerimientos en cuanto a los colores y señales de seguridad e higiene y la identificación de riesgos por fluidos conducidos en tuberías, a fin de prevenir accidentes por desconocimiento de riesgos.',
    applicabilityJustification: 'El centro de trabajo requiere señalización clara para comunicar riesgos, indicar rutas de evacuación, señalar equipos de emergencia y advertir sobre uso obligatorio de EPP, lo cual es obligatorio conforme a la Ley Federal del Trabajo.',
    applicabilityScope: 'Aplica a todas las áreas del centro de trabajo donde se requiera señalización de seguridad: producción, almacén, oficinas, pasillos y zonas de riesgo. También aplica a la identificación de todas las tuberías con fluidos peligrosos.',
    specificRequirement: 'Instalar y mantener señales de seguridad conforme al código de colores (rojo-paro/incendio, amarillo-advertencia, verde-condición segura, azul-obligación) con dimensiones adecuadas e iluminación mínima de 50 lux, identificar tuberías con color de seguridad y dirección de flujo, capacitar al personal en interpretación de señales y mantener programa continuo de mantenimiento de señalización.',
    legalBasis: 'Numerales 5.2–5.4, 7, 8 y 9',
    area: 'General',
    responsibleArea: 'Seguridad e Higiene',
    status: 'COMPLETED',
    daysOffset: -80,
    activities: [
      { description: 'Realizar auditoría de señalización existente e identificar deficiencias respecto a la NOM-026-STPS-2008', responsible: 'Especialista SH', daysFromNow: -110, isCompleted: true },
      { description: 'Instalar señalización de seguridad faltante conforme al código de colores, formas geométricas y dimensiones correctas', responsible: 'Jefe de Mantenimiento', daysFromNow: -95, isCompleted: true },
      { description: 'Identificar tuberías con color de seguridad, leyendas de riesgo y flechas de dirección de flujo', responsible: 'Jefe de Mantenimiento', daysFromNow: -85, isCompleted: true },
      { description: 'Capacitar a todo el personal en la interpretación correcta de colores y señales de seguridad del centro de trabajo', responsible: 'Especialista SH', daysFromNow: -80, isCompleted: true },
    ],
  },
  {
    code: 'NOM-027-STPS-2008',
    name: 'Actividades de soldadura y corte',
    normName: 'Norma Oficial Mexicana NOM-027-STPS-2008, Actividades de soldadura y corte — Condiciones de seguridad e higiene.',
    normObjective: 'Establecer las condiciones de seguridad e higiene en los centros de trabajo para prevenir riesgos de trabajo durante las actividades de soldadura y corte, incluyendo incendios, explosiones, intoxicaciones, daños por radiación y caídas.',
    applicabilityJustification: 'El área de producción realiza actividades de soldadura MIG/TIG y corte con oxiacetilénico de forma permanente, actividades que generan humos tóxicos, radiación no ionizante, riesgo de incendio y explosión.',
    applicabilityScope: 'Aplica al área de soldadura y producción donde se realizan actividades de soldadura y corte. Incluye soldadores, supervisores y personal de mantenimiento que realiza estas actividades.',
    specificRequirement: 'Contar con análisis de riesgos potenciales, programa de actividades de soldadura y corte, procedimientos de seguridad, informar a trabajadores sobre riesgos al menos 2 veces al año, capacitar y adiestrar al menos una vez al año, practicar exámenes médicos específicos al menos cada 12 meses y realizar revisiones mensuales al equipo de soldadura.',
    legalBasis: 'Numerales 5.3, 5.6, 5.11, 5.15, 10.2 h) y 13',
    area: 'Producción',
    responsibleArea: 'Producción',
    status: 'IN_PROGRESS',
    daysOffset: 40,
    activities: [
      { description: 'Elaborar análisis de riesgos potenciales para todas las actividades de soldadura y corte del centro', responsible: 'Supervisor de Producción', daysFromNow: -5, isCompleted: true },
      { description: 'Desarrollar programa de actividades de soldadura y corte con procedimientos de seguridad por tipo de actividad', responsible: 'Especialista SH', daysFromNow: 10, isCompleted: false },
      { description: 'Implementar revisiones mensuales al equipo de soldadura y corte con registro en bitácora', responsible: 'Supervisor de Producción', daysFromNow: 15, isCompleted: false },
      { description: 'Impartir información semestral a soldadores sobre riesgos de la actividad con registro de participantes', responsible: 'Especialista SH', daysFromNow: 20, isCompleted: false },
      { description: 'Programar capacitación anual y exámenes médicos específicos (espirometría, audiometría) a personal de soldadura', responsible: 'Especialista SH', daysFromNow: 40, isCompleted: false },
    ],
  },
  {
    code: 'NOM-029-STPS-2011',
    name: 'Mantenimiento de instalaciones eléctricas',
    normName: 'Norma Oficial Mexicana NOM-029-STPS-2011, Mantenimiento de las instalaciones eléctricas en los centros de trabajo — Condiciones de seguridad.',
    normObjective: 'Establecer las condiciones de seguridad para la realización de actividades de mantenimiento de las instalaciones eléctricas en los centros de trabajo, a fin de evitar accidentes al personal responsable de ejecutarlas y a personas ajenas que pudieran estar expuestas.',
    applicabilityJustification: 'El departamento de mantenimiento realiza de forma regular actividades de mantenimiento preventivo y correctivo de instalaciones eléctricas, subestaciones, tableros y equipos industriales, con riesgo de choque eléctrico y arcos eléctricos.',
    applicabilityScope: 'Aplica a todas las actividades de mantenimiento eléctrico en el centro de trabajo, tanto permanentes como provisionales. Incluye al personal de mantenimiento, electricistas y supervisores.',
    specificRequirement: 'Contar con plan de trabajo por actividad de mantenimiento eléctrico, mantener diagrama unifilar actualizado de la instalación eléctrica, implementar procedimientos de bloqueo y etiquetado (LOTO), elaborar y dar seguimiento a programa de revisión y conservación de equipos herramientas y EPP dieléctrico, y capacitar formalmente al personal.',
    legalBasis: 'Numerales 5.1–5.8 y capítulo 7',
    area: 'Mantenimiento',
    responsibleArea: 'Mantenimiento',
    status: 'PENDING',
    daysOffset: 60,
    activities: [
      { description: 'Actualizar diagrama unifilar de la instalación eléctrica del centro de trabajo reflejando la configuración actual', responsible: 'Jefe de Mantenimiento', daysFromNow: 15, isCompleted: false },
      { description: 'Elaborar y documentar procedimientos de bloqueo y etiquetado (LOTO) para todas las actividades de mantenimiento eléctrico', responsible: 'Jefe de Mantenimiento', daysFromNow: 25, isCompleted: false },
      { description: 'Implementar programa de revisión y conservación de herramientas aisladas, EPP dieléctrico e implementos de protección', responsible: 'Jefe de Mantenimiento', daysFromNow: 35, isCompleted: false },
      { description: 'Capacitar al personal de mantenimiento eléctrico en seguridad eléctrica, LOTO y uso de EPP dieléctrico', responsible: 'Especialista SH', daysFromNow: 45, isCompleted: false },
      { description: 'Establecer formato de plan de trabajo por actividad de mantenimiento eléctrico con análisis de riesgo', responsible: 'Jefe de Mantenimiento', daysFromNow: 60, isCompleted: false },
    ],
  },
  {
    code: 'NOM-030-STPS-2009',
    name: 'Servicios preventivos de seguridad y salud en el trabajo',
    normName: 'Norma Oficial Mexicana NOM-030-STPS-2009, Servicios preventivos de seguridad y salud en el trabajo — Funciones y actividades.',
    normObjective: 'Establecer las funciones y actividades que deben realizar los servicios preventivos de seguridad y salud en el trabajo para prevenir accidentes y enfermedades de trabajo en los centros laborales, mediante un ciclo sistemático de diagnóstico, planificación, ejecución y seguimiento.',
    applicabilityJustification: 'La norma es de aplicación obligatoria para todos los centros de trabajo del territorio nacional como norma marco que articula el sistema de gestión de seguridad y salud en el trabajo.',
    applicabilityScope: 'Aplica a toda la organización. El diagnóstico y programa de SH involucran todas las áreas y niveles jerárquicos. El responsable de SH debe contar con acceso a todas las áreas.',
    specificRequirement: 'Designar responsable de seguridad y salud en el trabajo, elaborar diagnóstico integral de condiciones de SH, elaborar y actualizar al menos una vez al año el Programa de Seguridad y Salud en el Trabajo, elaborar reportes de seguimiento anuales y conservar documentación por al menos dos años.',
    legalBasis: 'Numerales 4.1–4.9, 5.1–5.9 y capítulos 6 y 7',
    area: 'General',
    responsibleArea: 'Seguridad e Higiene',
    status: 'COMPLETED',
    daysOffset: -30,
    activities: [
      { description: 'Designar formalmente al responsable de Seguridad y Salud en el Trabajo con nombramiento escrito', responsible: 'Dirección General', daysFromNow: -90, isCompleted: true },
      { description: 'Elaborar diagnóstico integral de condiciones de seguridad y salud en el trabajo identificando normas aplicables', responsible: 'Especialista SH', daysFromNow: -75, isCompleted: true },
      { description: 'Elaborar Programa Anual de Seguridad y Salud en el Trabajo con acciones, responsables y fechas', responsible: 'Especialista SH', daysFromNow: -60, isCompleted: true },
      { description: 'Elaborar y presentar reporte anual de avances en la instauración del Programa de SH a la Dirección General', responsible: 'Especialista SH', daysFromNow: -30, isCompleted: true },
    ],
  },
  {
    code: 'NOM-035-STPS-2018',
    name: 'Factores de riesgo psicosocial',
    normName: 'Norma Oficial Mexicana NOM-035-STPS-2018, Factores de riesgo psicosocial en el trabajo — Identificación, análisis y prevención.',
    normObjective: 'Establecer los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial, así como para promover un entorno organizacional favorable en los centros de trabajo.',
    applicabilityJustification: 'La norma es de aplicación obligatoria para todos los centros de trabajo del territorio nacional, independientemente de la actividad económica o número de trabajadores, con los requisitos diferenciados según el número de empleados.',
    applicabilityScope: 'Aplica a la totalidad del personal de la empresa. Para centros de trabajo con más de 50 trabajadores se requiere evaluación del entorno organizacional. Las acciones preventivas involucran a todos los niveles jerárquicos.',
    specificRequirement: 'Establecer y difundir política de prevención de riesgos psicosociales, identificar y analizar factores de riesgo psicosocial al menos cada 2 años (y evaluación del entorno organizacional si >50 trabajadores), implementar medidas de prevención y control, atender acontecimentos traumáticos severos y llevar registros de resultados.',
    legalBasis: 'Numerales 5.1–5.8, 7.9 y 8.2',
    area: 'General',
    responsibleArea: 'Recursos Humanos',
    status: 'COMPLETED',
    daysOffset: -45,
    activities: [
      { description: 'Elaborar y difundir política de prevención de riesgos psicosociales y violencia laboral firmada por la dirección', responsible: 'Dirección General', daysFromNow: -90, isCompleted: true },
      { description: 'Aplicar cuestionario de identificación y análisis de factores de riesgo psicosocial a toda la plantilla laboral', responsible: 'Especialista RH', daysFromNow: -75, isCompleted: true },
      { description: 'Elaborar informe con resultados de evaluación e integrarlo al diagnóstico de SH (NOM-030)', responsible: 'Especialista RH', daysFromNow: -60, isCompleted: true },
      { description: 'Implementar medidas organizacionales de prevención y establecer mecanismos de queja y denuncia de violencia laboral', responsible: 'Especialista RH', daysFromNow: -45, isCompleted: true },
    ],
  },
  {
    code: 'NOM-036-1-STPS-2018',
    name: 'Factores de riesgo ergonómico — Manejo manual de cargas',
    normName: 'Norma Oficial Mexicana NOM-036-1-STPS-2018, Factores de riesgo ergonómico en el trabajo — Identificación, análisis, prevención y control. Parte 1: Manejo manual de cargas.',
    normObjective: 'Establecer los elementos para identificar, analizar, prevenir y controlar los factores de riesgo ergonómico derivados del manejo manual de cargas en los centros de trabajo, con el fin de prevenir trastornos músculo-esqueléticos y otras alteraciones a la salud de los trabajadores.',
    applicabilityJustification: 'En el centro de trabajo se realizan actividades cotidianas de manejo manual de cargas (levantamiento, transporte, empuje y jale de materiales y piezas) que pueden originar trastornos músculo-esqueléticos laborales en el personal.',
    applicabilityScope: 'Aplica a todos los puestos de trabajo donde se realice manejo manual de cargas de forma cotidiana (más de una vez al día) con masas iguales o superiores a 3 kg: almacenistas, operadores de producción y personal de mantenimiento.',
    specificRequirement: 'Elaborar análisis de factores de riesgo ergonómico (estimación rápida y evaluación específica si se requiere), elaborar programa de ergonomía con fechas de ejecución no mayores a un año cuando el análisis lo indique, practicar exámenes médicos iniciales y seguimiento anual, capacitar al personal antes del inicio de actividades y reforzar al menos cada 2 años, conservar expedientes clínicos por mínimo 5 años.',
    legalBasis: 'Numerales 5.1–5.6, 7.1–7.7, 8.4–8.7, 9.1–9.5 y 10.1–10.4',
    area: 'Producción',
    responsibleArea: 'Seguridad e Higiene',
    status: 'PENDING',
    daysOffset: 80,
    activities: [
      { description: 'Identificar todos los puestos de trabajo con manejo manual de cargas cotidiano (>1 vez/día, ≥3 kg)', responsible: 'Especialista SH', daysFromNow: 15, isCompleted: false },
      { description: 'Aplicar estimación rápida del nivel de riesgo ergonómico con Apéndice I y II de la norma', responsible: 'Especialista SH', daysFromNow: 25, isCompleted: false },
      { description: 'Elaborar programa de ergonomía con medidas técnicas y administrativas de control para puestos con riesgo identificado', responsible: 'Especialista SH', daysFromNow: 45, isCompleted: false },
      { description: 'Capacitar a todo el personal con manejo manual de cargas en técnicas seguras de levantamiento y límites de masa', responsible: 'Especialista SH', daysFromNow: 55, isCompleted: false },
      { description: 'Programar exámenes médicos iniciales y seguimiento anual para trabajadores expuestos a factores de riesgo ergonómico', responsible: 'Médico de empresa', daysFromNow: 70, isCompleted: false },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Obtener la primera empresa y su especialista SH
  const company = await prisma.company.findFirst({
    where: { name: { contains: 'Manufacturas' } },
  });
  if (!company) throw new Error('No se encontró la empresa "Manufacturas del Norte". Ejecuta el seed principal primero.');

  const specialist = await prisma.user.findFirst({
    where: { companyId: company.id, role: 'SH_SPECIALIST' },
  });
  if (!specialist) throw new Error('No se encontró el especialista SH. Ejecuta el seed principal primero.');

  console.log(`\n🏭 Empresa: ${company.name}`);
  console.log(`👤 Especialista: ${specialist.name}\n`);

  let createdCount = 0;
  let activitiesCount = 0;

  for (const n of NORMS) {
    const dueDate = n.daysOffset !== null
      ? (n.daysOffset < 0 ? daysAgo(Math.abs(n.daysOffset)) : daysFrom(n.daysOffset))
      : null;

    const req = await prisma.requirement.create({
      data: {
        code: n.code,
        name: n.name,
        specificRequirement: n.specificRequirement,
        normName: n.normName,
        normObjective: n.normObjective,
        applicabilityJustification: n.applicabilityJustification,
        applicabilityScope: n.applicabilityScope,
        legalSource: 'NOM',
        legalBasis: n.legalBasis,
        area: n.area,
        responsibleArea: n.responsibleArea,
        status: n.status,
        dueDate,
        completedAt: n.status === 'COMPLETED' ? daysAgo(Math.abs(n.daysOffset) - 5) : null,
        notes: n.status === 'OVERDUE' ? 'Requiere atención inmediata. Programar verificación y acciones correctivas.' : null,
        companyId: company.id,
        createdById: specialist.id,
      },
    });

    for (const act of n.activities) {
      const actDueDate = act.daysFromNow < 0
        ? daysAgo(Math.abs(act.daysFromNow))
        : daysFrom(act.daysFromNow);

      await prisma.activity.create({
        data: {
          description: act.description,
          responsible: act.responsible,
          dueDate: actDueDate,
          isCompleted: act.isCompleted,
          requirementId: req.id,
          userId: specialist.id,
        },
      });
      activitiesCount++;
    }

    console.log(`  ✓ ${n.code} — ${n.name} [${n.status}]`);
    createdCount++;
  }

  console.log(`\n✅ Creados ${createdCount} requerimientos con ${activitiesCount} actividades.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
