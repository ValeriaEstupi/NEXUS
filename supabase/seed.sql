-- =====================================================================
-- SEED — Plantilla base de PESV y SG-SST (compartida por todas las
-- empresas nuevas que se creen)
-- =====================================================================
-- Corre esto DESPUÉS de schema.sql, una sola vez. Esto llena las
-- tablas "_template" — NO son los datos que usa cada empresa; son el
-- punto de partida que se copia automáticamente cada vez que alguien
-- crea una empresa nueva en NEXUS (ver la función create_empresa()
-- en schema.sql). Editar una plantilla después de este paso NO afecta
-- a las empresas que ya se crearon — solo a las que se creen después.
--
-- ⚠️ IMPORTANTE (léelo antes de correrlo):
-- Esta plantilla de requisitos del PESV y de estándares del SG-SST fue
-- redactada a partir de la estructura general de la Resolución 40595
-- de 2022 (PESV) y la Resolución 0312 de 2019 (Estándares Mínimos
-- SG-SST, grupo de 60/61 ítems para empresa de 50+ trabajadores y/o
-- riesgo alto). Es un PUNTO DE PARTIDA funcional, no un texto legal
-- certificado: antes de auditar o de presentarlo ante el Ministerio de
-- Transporte, la ARL o el Ministerio del Trabajo, el equipo legal/HSEQ
-- debe contrastar cada ítem contra el texto vigente de la resolución y
-- ajustar redacción, códigos y puntajes si hace falta. Cada empresa
-- edita libremente su propia copia desde la pantalla de NEXUS (no hay
-- que tocar SQL de nuevo): agregar, editar o desactivar un requisito
-- es una pantalla, no una migración.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Ciclo PHVA (global, compartido — no es una plantilla, es fijo)
-- ---------------------------------------------------------------------
insert into public.fases_phva (orden, nombre) values
  (1, 'Planear'),
  (2, 'Hacer'),
  (3, 'Verificar'),
  (4, 'Actuar');


-- ---------------------------------------------------------------------
-- Plantilla: Pilares del PESV (Res. 40595/2022)
-- ---------------------------------------------------------------------
insert into public.pilares_pesv_template (orden, nombre, descripcion) values
  (1, 'Fortalecimiento de la gestión institucional',
      'Política de seguridad vial, comité, diagnóstico, PESV documentado y su gobierno.'),
  (2, 'Comportamiento humano',
      'Selección, aptitud, formación y control del comportamiento de quienes conducen y se movilizan.'),
  (3, 'Vehículos seguros',
      'Mantenimiento preventivo, inspecciones y condiciones técnico-mecánicas de la flota.'),
  (4, 'Infraestructura segura',
      'Rutas, puntos críticos, señalización y condiciones del entorno donde opera la flota.'),
  (5, 'Atención a víctimas',
      'Protocolo y capacidad de respuesta ante un accidente de tránsito.');


-- ---------------------------------------------------------------------
-- Plantilla: Requisitos PESV, por pilar y fase PHVA
-- ---------------------------------------------------------------------
insert into public.requisitos_pesv_template (pilar_template_id, fase_id, codigo, descripcion, fuente_normativa, orden)
select p.id, f.id, v.codigo, v.descripcion, v.fuente, v.orden
from (values
  -- Pilar 1 — Gestión institucional
  (1, 'Planear', '1.1', 'Diagnóstico inicial del PESV (accidentalidad, comportamiento, vehículos, infraestructura).', 'Res. 40595/2022', 1),
  (1, 'Planear', '1.2', 'Política de seguridad vial firmada por la alta dirección, fechada y divulgada.', 'Res. 40595/2022', 2),
  (1, 'Planear', '1.3', 'Conformación del comité/responsable de seguridad vial.', 'Res. 40595/2022', 3),
  (1, 'Planear', '1.4', 'PESV documentado, con objetivos, metas e indicadores medibles.', 'Res. 40595/2022', 4),
  (1, 'Planear', '1.5', 'Plan de acción anual del PESV con responsables y fechas.', 'Res. 40595/2022', 5),
  (1, 'Planear', '1.6', 'Presupuesto asignado para la implementación del PESV.', 'Res. 40595/2022', 6),
  (1, 'Hacer', '1.7', 'Divulgación del PESV y la política a todo el personal y conductores.', 'Res. 40595/2022', 7),
  (1, 'Hacer', '1.8', 'Capacitación al comité/responsable de seguridad vial.', 'Res. 40595/2022', 8),
  (1, 'Verificar', '1.9', 'Auditoría interna anual del PESV.', 'Res. 40595/2022', 9),
  (1, 'Verificar', '1.10', 'Revisión periódica de indicadores del PESV por la alta dirección.', 'Res. 40595/2022', 10),
  (1, 'Actuar', '1.11', 'Plan de mejoramiento del PESV a partir de auditorías e indicadores.', 'Res. 40595/2022', 11),
  (1, 'Actuar', '1.12', 'Actualización del PESV ante cambios normativos o de la operación.', 'Res. 40595/2022', 12),

  -- Pilar 2 — Comportamiento humano
  (2, 'Planear', '2.1', 'Perfil y requisitos de selección para conductores (experiencia, licencia, historial).', 'Res. 40595/2022', 1),
  (2, 'Hacer', '2.2', 'Exámenes médicos de ingreso, periódicos y de egreso para conductores.', 'Res. 40595/2022', 2),
  (2, 'Hacer', '2.3', 'Curso de conducción segura (mínimo 10 horas) para todos los conductores.', 'Ley 1503/2011', 3),
  (2, 'Hacer', '2.4', 'Capacitación periódica en seguridad vial (normas, distracción, fatiga, alcohol/drogas).', 'Res. 40595/2022', 4),
  (2, 'Hacer', '2.5', 'Control de horas de conducción y descanso de los conductores.', 'Res. 40595/2022', 5),
  (2, 'Hacer', '2.6', 'Pruebas de alcohol y sustancias psicoactivas antes de iniciar turno.', 'Res. 40595/2022', 6),
  (2, 'Verificar', '2.7', 'Seguimiento a vigencia y novedades de las licencias de conducción.', 'Res. 40595/2022', 7),
  (2, 'Verificar', '2.8', 'Evaluación periódica del comportamiento vial de cada conductor.', 'Res. 40595/2022', 8),
  (2, 'Actuar', '2.9', 'Plan de acompañamiento/reentrenamiento a conductores con hallazgos.', 'Res. 40595/2022', 9),

  -- Pilar 3 — Vehículos seguros
  (3, 'Planear', '3.1', 'Procedimiento documentado de mantenimiento preventivo de la flota.', 'Res. 40595/2022', 1),
  (3, 'Hacer', '3.2', 'Inspección preoperacional diaria de cada vehículo antes de rodar.', 'Res. 40595/2022', 2),
  (3, 'Hacer', '3.3', 'Mantenimiento programado según kilometraje/tiempo, con soportes.', 'Res. 40595/2022', 3),
  (3, 'Hacer', '3.4', 'SOAT y revisión técnico-mecánica vigentes para toda la flota.', 'Decreto 348/2015', 4),
  (3, 'Hacer', '3.5', 'Elementos de seguridad y prevención en cada vehículo (botiquín, extintor, kit de carretera, triángulos).', 'Res. 40595/2022', 5),
  (3, 'Verificar', '3.6', 'Seguimiento al cumplimiento del plan de mantenimiento.', 'Res. 40595/2022', 6),
  (3, 'Verificar', '3.7', 'Auditorías técnicas periódicas a una muestra de la flota.', 'Res. 40595/2022', 7),
  (3, 'Actuar', '3.8', 'Retiro o reparación inmediata de vehículos con hallazgos críticos.', 'Res. 40595/2022', 8),

  -- Pilar 4 — Infraestructura segura
  (4, 'Planear', '4.1', 'Identificación de rutas habituales y puntos críticos de riesgo vial.', 'Res. 40595/2022', 1),
  (4, 'Hacer', '4.2', 'Definición de rutas seguras y horarios que reducen exposición al riesgo.', 'Res. 40595/2022', 2),
  (4, 'Hacer', '4.3', 'Señalización y condiciones seguras en instalaciones/patios/parqueaderos propios.', 'Res. 40595/2022', 3),
  (4, 'Verificar', '4.4', 'Seguimiento a los puntos críticos identificados (internos y en vía).', 'Res. 40595/2022', 4),
  (4, 'Actuar', '4.5', 'Gestión ante autoridades de tránsito competentes por puntos críticos externos.', 'Res. 40595/2022', 5),

  -- Pilar 5 — Atención a víctimas
  (5, 'Planear', '5.1', 'Protocolo de atención a víctimas y procedimiento en caso de accidente de tránsito.', 'Res. 40595/2022', 1),
  (5, 'Hacer', '5.2', 'Capacitación en atención básica / primer respondiente para conductores.', 'Res. 40595/2022', 2),
  (5, 'Hacer', '5.3', 'Kit de atención a víctimas disponible en cada vehículo.', 'Res. 40595/2022', 3),
  (5, 'Verificar', '5.4', 'Verificación de la aplicación real del protocolo en accidentes ocurridos.', 'Res. 40595/2022', 4),
  (5, 'Actuar', '5.5', 'Ajuste del protocolo según lecciones aprendidas de casos reales.', 'Res. 40595/2022', 5)
) as v(pilar_orden, fase_nombre, codigo, descripcion, fuente, orden)
join public.pilares_pesv_template p on p.orden = v.pilar_orden
join public.fases_phva f on f.nombre = v.fase_nombre;


-- ---------------------------------------------------------------------
-- Plantilla: Estándares mínimos SG-SST (Res. 0312/2019 — grupo de
-- 60/61 ítems, empresa de 50+ trabajadores y/o riesgo IV-V). Puntaje
-- sobre 100.
-- ---------------------------------------------------------------------
insert into public.estandares_sgsst_template (fase_id, componente, codigo, descripcion, puntaje, orden)
select f.id, v.componente, v.codigo, v.descripcion, v.puntaje, v.orden
from (values
  -- I. PLANEAR — 1.1 Recursos
  ('Planear', 'Recursos', '1.1.1', 'Responsable del SG-SST asignado (profesional/tecnólogo en SST según el caso).', 0.5, 1),
  ('Planear', 'Recursos', '1.1.2', 'Responsabilidades en SST asignadas y comunicadas a todos los niveles.', 0.5, 2),
  ('Planear', 'Recursos', '1.1.3', 'Asignación de recursos financieros, técnicos y humanos para el SG-SST.', 0.5, 3),
  ('Planear', 'Recursos', '1.1.4', 'Afiliación de todos los trabajadores al Sistema General de Riesgos Laborales.', 0.5, 4),
  ('Planear', 'Recursos', '1.1.5', 'Pago de pensión especial para trabajadores con exposición a alto riesgo, si aplica.', 0.5, 5),
  ('Planear', 'Recursos', '1.1.6', 'Conformación y funcionamiento del COPASST.', 0.5, 6),
  ('Planear', 'Recursos', '1.1.7', 'Capacitación a los integrantes del COPASST.', 0.5, 7),
  ('Planear', 'Recursos', '1.1.8', 'Conformación y funcionamiento del Comité de Convivencia Laboral.', 0.5, 8),
  ('Planear', 'Capacitación', '1.2.1', 'Programa de capacitación anual en SST, vigente y firmado.', 2.0, 9),
  ('Planear', 'Capacitación', '1.2.2', 'Inducción y reinducción en SST, incluye actividades de promoción y prevención.', 2.0, 10),
  ('Planear', 'Capacitación', '1.2.3', 'Responsables del SG-SST con curso virtual de 50 horas vigente.', 2.0, 11),
  ('Planear', 'Gestión integral del SG-SST', '2.1.1', 'Política de SST firmada, fechada y comunicada a todos los niveles.', 1.0, 12),
  ('Planear', 'Gestión integral del SG-SST', '2.2.1', 'Objetivos del SG-SST definidos, claros, medibles y coherentes con la política.', 1.0, 13),
  ('Planear', 'Gestión integral del SG-SST', '2.3.1', 'Evaluación inicial del SG-SST realizada y documentada.', 1.0, 14),
  ('Planear', 'Gestión integral del SG-SST', '2.4.1', 'Plan anual de trabajo del SG-SST, con metas, responsables y cronograma.', 2.0, 15),
  ('Planear', 'Gestión integral del SG-SST', '2.5.1', 'Archivo y retención documental del SG-SST disponible y organizado.', 2.0, 16),
  ('Planear', 'Gestión integral del SG-SST', '2.6.1', 'Rendición de cuentas anual sobre el desempeño del SG-SST.', 1.0, 17),
  ('Planear', 'Gestión integral del SG-SST', '2.7.1', 'Matriz de requisitos legales en SST, actualizada.', 2.0, 18),
  ('Planear', 'Gestión integral del SG-SST', '2.8.1', 'Mecanismos de comunicación interna y externa en SST.', 1.0, 19),
  ('Planear', 'Gestión integral del SG-SST', '2.9.1', 'Identificación y evaluación de SST en la adquisición de bienes y servicios.', 1.0, 20),
  ('Planear', 'Gestión integral del SG-SST', '2.10.1', 'Evaluación y selección de proveedores y contratistas en criterios de SST.', 2.0, 21),
  ('Planear', 'Gestión integral del SG-SST', '2.11.1', 'Procedimiento de gestión del cambio (nuevas rutas, vehículos, procesos).', 1.0, 22),

  -- II. HACER — 3.1 Condiciones de salud
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.1', 'Descripción sociodemográfica y diagnóstico de condiciones de salud.', 1.0, 23),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.2', 'Actividades de promoción y prevención en salud realizadas.', 1.0, 24),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.3', 'Información al médico ocupacional sobre perfiles de cargo y riesgos.', 1.0, 25),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.4', 'Realización de exámenes médicos ocupacionales (ingreso, periódicos, egreso).', 1.0, 26),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.5', 'Custodia de historias clínicas ocupacionales.', 1.0, 27),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.6', 'Seguimiento a restricciones y recomendaciones médico-laborales.', 1.0, 28),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.7', 'Programa de estilos de vida y entornos de trabajo saludables.', 1.0, 29),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.8', 'Agua potable, servicios sanitarios y disposición de basuras adecuados.', 1.0, 30),
  ('Hacer', 'Condiciones de salud en el trabajo', '3.1.9', 'Eliminación adecuada de residuos sólidos, líquidos y gaseosos.', 1.0, 31),
  ('Hacer', 'Registro e investigación de incidentes/accidentes', '3.2.1', 'Reporte oportuno de accidentes de trabajo y enfermedad laboral.', 2.0, 32),
  ('Hacer', 'Registro e investigación de incidentes/accidentes', '3.2.2', 'Investigación de incidentes, accidentes de trabajo y enfermedad laboral.', 2.0, 33),
  ('Hacer', 'Registro e investigación de incidentes/accidentes', '3.2.3', 'Registro y análisis estadístico de accidentalidad y enfermedad laboral.', 1.0, 34),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.1', 'Medición de la severidad de accidentes de trabajo y enfermedad laboral.', 1.0, 35),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.2', 'Medición de la frecuencia de accidentes de trabajo y enfermedad laboral.', 1.0, 36),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.3', 'Medición de la mortalidad de accidentes de trabajo y enfermedad laboral.', 1.0, 37),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.4', 'Medición de la prevalencia de enfermedad laboral.', 1.0, 38),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.5', 'Medición de la incidencia de enfermedad laboral.', 1.0, 39),
  ('Hacer', 'Vigilancia de la salud de los trabajadores', '3.3.6', 'Medición del ausentismo laboral por causa médica.', 1.0, 40),
  ('Hacer', 'Identificación de peligros y valoración de riesgos', '4.1.1', 'Metodología definida para identificar peligros y valorar riesgos.', 4.0, 41),
  ('Hacer', 'Identificación de peligros y valoración de riesgos', '4.1.2', 'Identificación de peligros con participación de todos los niveles de la empresa.', 4.0, 42),
  ('Hacer', 'Identificación de peligros y valoración de riesgos', '4.1.3', 'Identificación y priorización de peligros según su naturaleza (incluye riesgo vial).', 3.0, 43),
  ('Hacer', 'Identificación de peligros y valoración de riesgos', '4.1.4', 'Mediciones ambientales (químicos, físicos, biológicos) cuando aplique.', 4.0, 44),
  ('Hacer', 'Medidas de prevención y control', '4.2.1', 'Implementación de medidas de prevención y control de peligros/riesgos.', 2.5, 45),
  ('Hacer', 'Medidas de prevención y control', '4.2.2', 'Verificación periódica de la aplicación de esas medidas.', 2.5, 46),
  ('Hacer', 'Medidas de prevención y control', '4.2.3', 'Procedimientos, instructivos y protocolos documentados y disponibles.', 2.5, 47),
  ('Hacer', 'Medidas de prevención y control', '4.2.4', 'Inspecciones de seguridad con participación del COPASST.', 2.5, 48),
  ('Hacer', 'Medidas de prevención y control', '4.2.5', 'Mantenimiento periódico de instalaciones, equipos y herramientas.', 2.5, 49),
  ('Hacer', 'Medidas de prevención y control', '4.2.6', 'Entrega y verificación del uso de Elementos de Protección Personal (EPP).', 2.5, 50),
  ('Hacer', 'Preparación y respuesta ante emergencias', '5.1.1', 'Plan de prevención, preparación y respuesta ante emergencias.', 5.0, 51),
  ('Hacer', 'Preparación y respuesta ante emergencias', '5.1.2', 'Brigada de emergencias conformada, capacitada y dotada.', 5.0, 52),

  -- III. VERIFICAR
  ('Verificar', 'Gestión y resultados del SG-SST', '6.1.1', 'Indicadores del SG-SST definidos (estructura, proceso y resultado).', 1.25, 53),
  ('Verificar', 'Gestión y resultados del SG-SST', '6.1.2', 'Auditoría anual del SG-SST (autoevaluación de estándares mínimos).', 1.25, 54),
  ('Verificar', 'Gestión y resultados del SG-SST', '6.1.3', 'Revisión anual del SG-SST por la alta dirección.', 1.25, 55),
  ('Verificar', 'Gestión y resultados del SG-SST', '6.1.4', 'Planificación de auditorías con la participación del COPASST.', 1.25, 56),

  -- IV. ACTUAR
  ('Actuar', 'Mejoramiento', '7.1.1', 'Acciones preventivas y correctivas con base en los resultados del SG-SST.', 2.5, 57),
  ('Actuar', 'Mejoramiento', '7.1.2', 'Acciones de mejora derivadas de la revisión por la alta dirección.', 2.5, 58),
  ('Actuar', 'Mejoramiento', '7.1.3', 'Acciones de mejora con base en la investigación de accidentes/enfermedad laboral.', 2.5, 59),
  ('Actuar', 'Mejoramiento', '7.1.4', 'Plan de mejoramiento con implementación efectiva de medidas correctivas.', 2.5, 60)
) as v(fase_nombre, componente, codigo, descripcion, puntaje, orden)
join public.fases_phva f on f.nombre = v.fase_nombre;


-- ---------------------------------------------------------------------
-- Catálogo de normas ISO (Sistema de Gestión Integrado) y su plantilla
-- de requisitos, basada en la Estructura de Alto Nivel (Anexo SL) que
-- comparten ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018.
-- ---------------------------------------------------------------------
insert into public.normas_iso (codigo, nombre, orden) values
  ('9001', 'ISO 9001 — Gestión de la Calidad', 1),
  ('14001', 'ISO 14001 — Gestión Ambiental', 2),
  ('45001', 'ISO 45001 — Gestión de Seguridad y Salud en el Trabajo', 3);

insert into public.requisitos_iso_template (norma_id, fase_id, codigo, descripcion, orden)
select n.id, f.id, v.codigo, v.descripcion, v.orden
from (values
  -- ===== ISO 9001:2015 — Gestión de la Calidad =====
  ('9001', 'Planear', '4.1', 'Comprensión de la organización y su contexto.', 1),
  ('9001', 'Planear', '4.2', 'Comprensión de las necesidades y expectativas de las partes interesadas.', 2),
  ('9001', 'Planear', '4.3', 'Determinación del alcance del sistema de gestión de la calidad.', 3),
  ('9001', 'Planear', '4.4', 'Sistema de gestión de la calidad y sus procesos.', 4),
  ('9001', 'Planear', '5.1', 'Liderazgo y compromiso de la alta dirección con el SGC.', 5),
  ('9001', 'Planear', '5.2', 'Política de calidad establecida, documentada y comunicada.', 6),
  ('9001', 'Planear', '5.3', 'Roles, responsabilidades y autoridades organizacionales asignados.', 7),
  ('9001', 'Planear', '6.1', 'Acciones para abordar riesgos y oportunidades.', 8),
  ('9001', 'Planear', '6.2', 'Objetivos de la calidad y planificación para lograrlos.', 9),
  ('9001', 'Planear', '6.3', 'Planificación de los cambios al SGC.', 10),
  ('9001', 'Hacer', '7.1', 'Recursos: personas, infraestructura, ambiente, seguimiento y medición.', 11),
  ('9001', 'Hacer', '7.2', 'Competencia del personal que afecta el desempeño de la calidad.', 12),
  ('9001', 'Hacer', '7.3', 'Toma de conciencia sobre la política y los objetivos de calidad.', 13),
  ('9001', 'Hacer', '7.4', 'Comunicación interna y externa pertinente al SGC.', 14),
  ('9001', 'Hacer', '7.5', 'Información documentada: control de documentos y registros.', 15),
  ('9001', 'Hacer', '8.1', 'Planificación y control operacional.', 16),
  ('9001', 'Hacer', '8.2', 'Requisitos para los servicios prestados y comunicación con el cliente.', 17),
  ('9001', 'Hacer', '8.4', 'Control de los procesos, productos y servicios suministrados externamente.', 18),
  ('9001', 'Hacer', '8.5', 'Producción y provisión del servicio bajo condiciones controladas.', 19),
  ('9001', 'Hacer', '8.7', 'Control de las salidas (servicios) no conformes.', 20),
  ('9001', 'Verificar', '9.1', 'Seguimiento, medición, análisis y evaluación (incluida satisfacción del cliente).', 21),
  ('9001', 'Verificar', '9.2', 'Auditoría interna del SGC.', 22),
  ('9001', 'Verificar', '9.3', 'Revisión del SGC por la alta dirección.', 23),
  ('9001', 'Actuar', '10.2', 'No conformidad y acción correctiva.', 24),
  ('9001', 'Actuar', '10.3', 'Mejora continua de la conveniencia, adecuación y eficacia del SGC.', 25),

  -- ===== ISO 14001:2015 — Gestión Ambiental =====
  ('14001', 'Planear', '4.1', 'Comprensión de la organización y su contexto ambiental.', 1),
  ('14001', 'Planear', '4.2', 'Necesidades y expectativas de las partes interesadas (incluidos requisitos de cumplimiento).', 2),
  ('14001', 'Planear', '4.3', 'Determinación del alcance del sistema de gestión ambiental.', 3),
  ('14001', 'Planear', '4.4', 'Sistema de gestión ambiental y sus procesos.', 4),
  ('14001', 'Planear', '5.1', 'Liderazgo y compromiso de la alta dirección con el SGA.', 5),
  ('14001', 'Planear', '5.2', 'Política ambiental establecida, documentada y comunicada.', 6),
  ('14001', 'Planear', '5.3', 'Roles, responsabilidades y autoridades organizacionales asignados.', 7),
  ('14001', 'Planear', '6.1.2', 'Identificación de aspectos ambientales y sus impactos (incluida la operación de la flota).', 8),
  ('14001', 'Planear', '6.1.3', 'Identificación y acceso a los requisitos legales ambientales aplicables.', 9),
  ('14001', 'Planear', '6.1.4', 'Planificación de acciones para abordar aspectos, riesgos y requisitos legales.', 10),
  ('14001', 'Planear', '6.2', 'Objetivos ambientales y planificación para lograrlos.', 11),
  ('14001', 'Hacer', '7.1', 'Recursos para el sistema de gestión ambiental.', 12),
  ('14001', 'Hacer', '7.2', 'Competencia del personal con impacto ambiental en su trabajo.', 13),
  ('14001', 'Hacer', '7.3', 'Toma de conciencia sobre la política ambiental.', 14),
  ('14001', 'Hacer', '7.4', 'Comunicación interna y externa pertinente al SGA.', 15),
  ('14001', 'Hacer', '7.5', 'Información documentada del SGA.', 16),
  ('14001', 'Hacer', '8.1', 'Planificación y control operacional (residuos, vertimientos, emisiones, consumo de combustible).', 17),
  ('14001', 'Hacer', '8.2', 'Preparación y respuesta ante emergencias ambientales (derrames, incendios).', 18),
  ('14001', 'Verificar', '9.1', 'Seguimiento, medición, análisis y evaluación del desempeño ambiental.', 19),
  ('14001', 'Verificar', '9.2', 'Auditoría interna del SGA.', 20),
  ('14001', 'Verificar', '9.3', 'Revisión del SGA por la alta dirección.', 21),
  ('14001', 'Actuar', '10.2', 'No conformidad y acción correctiva.', 22),
  ('14001', 'Actuar', '10.3', 'Mejora continua del desempeño ambiental.', 23),

  -- ===== ISO 45001:2018 — Gestión de Seguridad y Salud en el Trabajo =====
  ('45001', 'Planear', '4.1', 'Comprensión de la organización y su contexto en SST.', 1),
  ('45001', 'Planear', '4.2', 'Necesidades y expectativas de los trabajadores y otras partes interesadas.', 2),
  ('45001', 'Planear', '4.3', 'Determinación del alcance del sistema de gestión de SST.', 3),
  ('45001', 'Planear', '4.4', 'Sistema de gestión de SST y sus procesos.', 4),
  ('45001', 'Planear', '5.1', 'Liderazgo y compromiso de la alta dirección con la SST.', 5),
  ('45001', 'Planear', '5.2', 'Política de SST establecida, documentada y comunicada.', 6),
  ('45001', 'Planear', '5.3', 'Roles, responsabilidades y autoridades organizacionales asignados.', 7),
  ('45001', 'Planear', '5.4', 'Consulta y participación de los trabajadores en el sistema de SST.', 8),
  ('45001', 'Planear', '6.1.2', 'Identificación de peligros y evaluación de riesgos y oportunidades para la SST.', 9),
  ('45001', 'Planear', '6.1.3', 'Determinación de los requisitos legales y otros requisitos de SST aplicables.', 10),
  ('45001', 'Planear', '6.1.4', 'Planificación de acciones para abordar peligros, riesgos y requisitos legales.', 11),
  ('45001', 'Planear', '6.2', 'Objetivos de SST y planificación para lograrlos.', 12),
  ('45001', 'Hacer', '7.1', 'Recursos para el sistema de gestión de SST.', 13),
  ('45001', 'Hacer', '7.2', 'Competencia del personal en materia de SST.', 14),
  ('45001', 'Hacer', '7.3', 'Toma de conciencia sobre peligros, riesgos y la política de SST.', 15),
  ('45001', 'Hacer', '7.4', 'Comunicación interna y externa pertinente a la SST.', 16),
  ('45001', 'Hacer', '7.5', 'Información documentada del sistema de gestión de SST.', 17),
  ('45001', 'Hacer', '8.1', 'Planificación y control operacional, aplicando la jerarquía de controles.', 18),
  ('45001', 'Hacer', '8.1.2', 'Eliminación de peligros y reducción de los riesgos para la SST.', 19),
  ('45001', 'Hacer', '8.2', 'Preparación y respuesta ante emergencias.', 20),
  ('45001', 'Verificar', '9.1', 'Seguimiento, medición, análisis y evaluación del desempeño en SST.', 21),
  ('45001', 'Verificar', '9.2', 'Auditoría interna del sistema de gestión de SST.', 22),
  ('45001', 'Verificar', '9.3', 'Revisión del sistema de gestión de SST por la alta dirección.', 23),
  ('45001', 'Actuar', '10.2', 'Investigación de incidentes, no conformidades y acciones correctivas.', 24),
  ('45001', 'Actuar', '10.3', 'Mejora continua del desempeño en SST.', 25)
) as v(norma_codigo, fase_nombre, codigo, descripcion, orden)
join public.normas_iso n on n.codigo = v.norma_codigo
join public.fases_phva f on f.nombre = v.fase_nombre;

-- =====================================================================
-- FIN DEL SEED — ya puedes crear tu primera empresa desde la app.
-- =====================================================================
