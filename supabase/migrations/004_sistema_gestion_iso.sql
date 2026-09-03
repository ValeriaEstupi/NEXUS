-- =====================================================================
-- Migración 004 — Sistema de Gestión Integrado: ISO 9001, 14001, 45001
-- =====================================================================
-- Esta migración es ADITIVA: no borra nada de lo que ya tienes (tus
-- empresas, vehículos, conductores, checklist de PESV/SG-SST siguen
-- intactos). Agrega un tercer checklist — Calidad (ISO 9001), Ambiental
-- (ISO 14001) y Seguridad y Salud en el Trabajo (ISO 45001) — con el
-- mismo patrón que ya usan PESV y SG-SST: cada empresa recibe su propia
-- copia editable, organizada por norma y por el ciclo PHVA (que en las
-- tres normas ISO corresponde a la Estructura de Alto Nivel: cláusulas
-- 4-6 = Planear, 7-8 = Hacer, 9 = Verificar, 10 = Actuar).
--
-- Corre esto UNA sola vez, en el SQL Editor de tu proyecto.
--
-- ⚠️ Igual que con el PESV y el SG-SST: la redacción de estos
-- requisitos es una plantilla de partida basada en la Estructura de
-- Alto Nivel (Anexo SL) que comparten ISO 9001:2015, ISO 14001:2015 e
-- ISO 45001:2018 — no es una transcripción literal certificada de
-- cada norma. Cada empresa la edita libremente desde la pantalla.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Catálogo global de normas (fijo, igual para todas las empresas)
-- ---------------------------------------------------------------------
create table if not exists public.normas_iso (
  id serial primary key,
  codigo text not null unique,
  nombre text not null,
  orden integer not null
);

alter table public.normas_iso enable row level security;

drop policy if exists "Ver normas ISO si estoy logueado" on public.normas_iso;
create policy "Ver normas ISO si estoy logueado"
  on public.normas_iso for select using (auth.uid() is not null);

insert into public.normas_iso (codigo, nombre, orden) values
  ('9001', 'ISO 9001 — Gestión de la Calidad', 1),
  ('14001', 'ISO 14001 — Gestión Ambiental', 2),
  ('45001', 'ISO 45001 — Gestión de Seguridad y Salud en el Trabajo', 3)
on conflict (codigo) do nothing;


-- ---------------------------------------------------------------------
-- 2) Plantilla base (global, se copia a cada empresa nueva)
-- ---------------------------------------------------------------------
create table if not exists public.requisitos_iso_template (
  id uuid primary key default gen_random_uuid(),
  norma_id integer not null references public.normas_iso(id),
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  orden integer not null default 0
);

alter table public.requisitos_iso_template enable row level security;

drop policy if exists "Ver plantilla ISO si estoy logueado" on public.requisitos_iso_template;
create policy "Ver plantilla ISO si estoy logueado"
  on public.requisitos_iso_template for select using (auth.uid() is not null);

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
join public.fases_phva f on f.nombre = v.fase_nombre
where not exists (select 1 from public.requisitos_iso_template limit 1);


-- ---------------------------------------------------------------------
-- 3) Catálogo de cada empresa (copia propia, editable)
-- ---------------------------------------------------------------------
create table if not exists public.requisitos_iso (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  norma_id integer not null references public.normas_iso(id),
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.requisitos_iso enable row level security;

drop policy if exists "Ver requisitos ISO de mis empresas" on public.requisitos_iso;
create policy "Ver requisitos ISO de mis empresas"
  on public.requisitos_iso for select using (public.is_empresa_member(empresa_id));
drop policy if exists "Crear requisitos ISO si soy editor de la empresa" on public.requisitos_iso;
create policy "Crear requisitos ISO si soy editor de la empresa"
  on public.requisitos_iso for insert with check (public.is_empresa_editor(empresa_id));
drop policy if exists "Editar requisitos ISO si soy editor de la empresa" on public.requisitos_iso;
create policy "Editar requisitos ISO si soy editor de la empresa"
  on public.requisitos_iso for update using (public.is_empresa_editor(empresa_id));
drop policy if exists "Borrar requisitos ISO si soy admin de la empresa" on public.requisitos_iso;
create policy "Borrar requisitos ISO si soy admin de la empresa"
  on public.requisitos_iso for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 4) Conectar con el seguimiento de cumplimiento (cumplimiento_items)
-- ---------------------------------------------------------------------
alter table public.cumplimiento_items
  add column if not exists requisito_iso_id uuid references public.requisitos_iso(id) on delete cascade;

alter table public.cumplimiento_items
  drop constraint if exists cumplimiento_items_requisito_iso_id_key;
alter table public.cumplimiento_items
  add constraint cumplimiento_items_requisito_iso_id_key unique (requisito_iso_id);

alter table public.cumplimiento_items drop constraint if exists chk_referencia_unica;
alter table public.cumplimiento_items add constraint chk_referencia_unica check (
  (tipo = 'pesv' and requisito_pesv_id is not null and estandar_sgsst_id is null and requisito_iso_id is null)
  or
  (tipo = 'sgsst' and estandar_sgsst_id is not null and requisito_pesv_id is null and requisito_iso_id is null)
  or
  (tipo = 'iso' and requisito_iso_id is not null and requisito_pesv_id is null and estandar_sgsst_id is null)
);

alter table public.cumplimiento_items drop constraint if exists cumplimiento_items_tipo_check;
alter table public.cumplimiento_items add constraint cumplimiento_items_tipo_check
  check (tipo in ('pesv', 'sgsst', 'iso'));

create or replace function public.crear_cumplimiento_iso()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_iso_id)
  values (new.empresa_id, 'iso', new.id);
  return new;
end;
$$;

drop trigger if exists trg_requisito_iso_insert on public.requisitos_iso;
create trigger trg_requisito_iso_insert
  after insert on public.requisitos_iso
  for each row execute procedure public.crear_cumplimiento_iso();


-- ---------------------------------------------------------------------
-- 5) Que las empresas NUEVAS también reciban el catálogo ISO al crearse
-- ---------------------------------------------------------------------
create or replace function public.create_empresa(
  _razon_social text,
  _nit text default null,
  _numero_vehiculos integer default null,
  _numero_trabajadores integer default null,
  _nivel_riesgo_arl text default null
)
returns public.empresas
language plpgsql
security definer
set search_path = public
as $$
declare
  new_empresa public.empresas;
  pilar_tpl record;
  new_pilar_id integer;
  pilar_map jsonb := '{}'::jsonb;
begin
  insert into public.empresas (razon_social, nit, numero_vehiculos, numero_trabajadores, nivel_riesgo_arl, created_by)
  values (_razon_social, _nit, _numero_vehiculos, _numero_trabajadores, _nivel_riesgo_arl, auth.uid())
  returning * into new_empresa;

  insert into public.empresa_members (empresa_id, user_id, role)
  values (new_empresa.id, auth.uid(), 'admin');

  for pilar_tpl in select * from public.pilares_pesv_template order by orden loop
    insert into public.pilares_pesv (empresa_id, orden, nombre, descripcion)
    values (new_empresa.id, pilar_tpl.orden, pilar_tpl.nombre, pilar_tpl.descripcion)
    returning id into new_pilar_id;
    pilar_map := pilar_map || jsonb_build_object(pilar_tpl.id::text, new_pilar_id);
  end loop;

  insert into public.requisitos_pesv (empresa_id, pilar_id, fase_id, codigo, descripcion, fuente_normativa, orden)
  select
    new_empresa.id,
    (pilar_map ->> r.pilar_template_id::text)::integer,
    r.fase_id, r.codigo, r.descripcion, r.fuente_normativa, r.orden
  from public.requisitos_pesv_template r;

  insert into public.estandares_sgsst (empresa_id, fase_id, componente, codigo, descripcion, puntaje, orden)
  select new_empresa.id, fase_id, componente, codigo, descripcion, puntaje, orden
  from public.estandares_sgsst_template;

  insert into public.requisitos_iso (empresa_id, norma_id, fase_id, codigo, descripcion, orden)
  select new_empresa.id, norma_id, fase_id, codigo, descripcion, orden
  from public.requisitos_iso_template;

  return new_empresa;
end;
$$;


-- ---------------------------------------------------------------------
-- 6) Darle el catálogo ISO a las empresas que ya existían antes de
--    esta migración (por ejemplo, la que ya creaste)
-- ---------------------------------------------------------------------
insert into public.requisitos_iso (empresa_id, norma_id, fase_id, codigo, descripcion, orden)
select e.id, r.norma_id, r.fase_id, r.codigo, r.descripcion, r.orden
from public.empresas e
cross join public.requisitos_iso_template r
where not exists (
  select 1 from public.requisitos_iso ri where ri.empresa_id = e.id
);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
