-- =====================================================================
-- ESQUEMA DE BASE DE DATOS — NEXU
-- Plataforma de seguimiento del PESV y del Sistema de Gestión Integrado
-- (SG-SST) para empresa de transporte especial
-- =====================================================================
-- Cómo usar este archivo:
-- 1. Entra a tu proyecto de Supabase EN BLANCO, creado solo para NEXU
--    (no el mismo proyecto que usa la app de "tareas", si la tienes).
-- 2. Ve al menú "SQL Editor" (icono de terminal, en la barra lateral).
-- 3. Crea una consulta nueva, pega TODO este archivo y dale "Run".
-- 4. Después corre `supabase/seed.sql` (carga el catálogo de pilares
--    del PESV y de estándares del SG-SST) — ver README.md.
-- Se puede ejecutar una sola vez. Si necesitas volver a correrlo desde
-- cero, avísame antes: hay que borrar las tablas existentes primero.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) PERFILES Y ROLES
-- ---------------------------------------------------------------------
-- Supabase ya trae una tabla interna "auth.users" para el login
-- (guarda el correo y la contraseña de forma segura). Nosotros creamos
-- "profiles" para guardar datos públicos del usuario y su rol dentro
-- de NEXU:
--   - "lector": puede ver todo, pero no puede crear ni editar nada.
--   - "editor": puede ver y editar el PESV, el SG-SST, vehículos,
--     conductores, capacitaciones e incidentes.
--   - "super_admin": todo lo anterior, más borrar registros y cambiar
--     el rol de otras personas (Configuración -> Usuarios).
-- Por defecto, cualquier persona que se registre queda como "lector"
-- hasta que alguien con rol "super_admin" le suba el rol.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'lector'
    check (role in ('super_admin', 'editor', 'lector')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Funciones auxiliares de permisos. Se definen una sola vez y las usan
-- las políticas de TODAS las tablas de abajo.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'editor') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- "¿Esta persona tiene sesión Y ya tiene fila en profiles?" — todas las
-- tablas de datos de la empresa son visibles para cualquiera que haya
-- iniciado sesión (NEXU es una herramienta interna de una sola empresa,
-- no una app multi-cliente), pero nunca para alguien sin sesión.
create or replace function public.is_registered()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create policy "Ver mi perfil o todos si soy super admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_super_admin() or public.is_registered());

create policy "Actualizar mi propio nombre"
  on public.profiles for update
  using (auth.uid() = id);

-- Se ejecuta automáticamente cada vez que alguien se registra: crea su
-- fila en "profiles" (con rol "lector") sin que la app tenga que hacerlo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función para que un super admin cambie el rol de otra persona desde
-- la pantalla de Configuración -> Usuarios (así no exponemos un UPDATE
-- directo sobre "role" a cualquier usuario).
create or replace function public.set_user_role(_user_id uuid, _role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Solo un super admin puede cambiar roles.';
  end if;
  if _role not in ('super_admin', 'editor', 'lector') then
    raise exception 'Rol inválido.';
  end if;
  update public.profiles set role = _role where id = _user_id;
end;
$$;

-- Utilidad compartida: pone "updated_at" al momento de cada UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2) DATOS DE LA EMPRESA
-- ---------------------------------------------------------------------
-- Una sola fila con los datos que determinan qué tan exigente es el
-- PESV y qué grupo de estándares mínimos del SG-SST aplica (Resolución
-- 40595 de 2022 y Resolución 0312 de 2019). Editable desde
-- Configuración -> Empresa.
create table public.empresa (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null default 'Mi empresa de transporte',
  nit text,
  numero_vehiculos integer,
  numero_trabajadores integer,
  nivel_riesgo_arl text check (nivel_riesgo_arl in ('I', 'II', 'III', 'IV', 'V')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresa enable row level security;

create trigger empresa_set_updated_at
  before update on public.empresa
  for each row execute procedure public.set_updated_at();

create policy "Ver datos de la empresa si estoy registrado"
  on public.empresa for select
  using (public.is_registered());

create policy "Editar datos de la empresa si soy editor"
  on public.empresa for update
  using (public.is_editor());


-- ---------------------------------------------------------------------
-- 3) CATÁLOGOS COMPARTIDOS: PILARES DEL PESV Y CICLO PHVA
-- ---------------------------------------------------------------------
-- El PESV (Res. 40595/2022) se organiza en 5 pilares. El SG-SST y el
-- PESV comparten la misma metodología de mejora continua: el ciclo
-- PHVA (Planear, Hacer, Verificar, Actuar). Ambos catálogos se cargan
-- con supabase/seed.sql — aquí solo se crean las tablas.
create table public.pilares_pesv (
  id serial primary key,
  orden integer not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true
);

create table public.fases_phva (
  id serial primary key,
  orden integer not null,
  nombre text not null check (nombre in ('Planear', 'Hacer', 'Verificar', 'Actuar'))
);

alter table public.pilares_pesv enable row level security;
alter table public.fases_phva enable row level security;

create policy "Ver pilares PESV si estoy registrado"
  on public.pilares_pesv for select using (public.is_registered());
create policy "Crear pilares PESV si soy editor"
  on public.pilares_pesv for insert with check (public.is_editor());
create policy "Editar pilares PESV si soy editor"
  on public.pilares_pesv for update using (public.is_editor());
create policy "Borrar pilares PESV si soy super admin"
  on public.pilares_pesv for delete using (public.is_super_admin());

create policy "Ver fases PHVA si estoy registrado"
  on public.fases_phva for select using (public.is_registered());


-- ---------------------------------------------------------------------
-- 4) CHECKLIST NORMATIVO: REQUISITOS PESV Y ESTÁNDARES SG-SST
-- ---------------------------------------------------------------------
-- "requisitos_pesv": catálogo de acciones/requisitos del Plan
-- Estratégico de Seguridad Vial, agrupados por pilar y por fase PHVA.
create table public.requisitos_pesv (
  id uuid primary key default gen_random_uuid(),
  pilar_id integer not null references public.pilares_pesv(id),
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  fuente_normativa text,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- "estandares_sgsst": catálogo de los estándares mínimos del SG-SST
-- (Resolución 0312 de 2019), agrupados por componente y por fase PHVA,
-- con el puntaje que cada uno aporta sobre 100.
create table public.estandares_sgsst (
  id uuid primary key default gen_random_uuid(),
  fase_id integer references public.fases_phva(id),
  componente text not null,
  codigo text not null,
  descripcion text not null,
  puntaje numeric(4, 2) not null default 0,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.requisitos_pesv enable row level security;
alter table public.estandares_sgsst enable row level security;

create policy "Ver requisitos PESV si estoy registrado"
  on public.requisitos_pesv for select using (public.is_registered());
create policy "Crear/editar requisitos PESV si soy editor"
  on public.requisitos_pesv for insert with check (public.is_editor());
create policy "Editar requisitos PESV si soy editor (update)"
  on public.requisitos_pesv for update using (public.is_editor());
create policy "Borrar requisitos PESV si soy super admin"
  on public.requisitos_pesv for delete using (public.is_super_admin());

create policy "Ver estándares SG-SST si estoy registrado"
  on public.estandares_sgsst for select using (public.is_registered());
create policy "Crear estándares SG-SST si soy editor"
  on public.estandares_sgsst for insert with check (public.is_editor());
create policy "Editar estándares SG-SST si soy editor"
  on public.estandares_sgsst for update using (public.is_editor());
create policy "Borrar estándares SG-SST si soy super admin"
  on public.estandares_sgsst for delete using (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 5) SEGUIMIENTO DE CUMPLIMIENTO (el corazón de NEXU)
-- ---------------------------------------------------------------------
-- Una fila por cada requisito PESV o estándar SG-SST, con su estado
-- real de avance, responsable, fecha límite y observaciones. Se crea
-- SOLA (con un disparador/trigger) cada vez que se agrega un requisito
-- o un estándar nuevo al catálogo — así nunca falta el seguimiento de
-- un ítem nuevo que agregue el equipo legal/HSEQ desde la pantalla.
create table public.cumplimiento_items (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('pesv', 'sgsst')),
  requisito_pesv_id uuid references public.requisitos_pesv(id) on delete cascade,
  estandar_sgsst_id uuid references public.estandares_sgsst(id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_progreso', 'cumplido', 'no_aplica')),
  responsable_id uuid references public.profiles(id),
  fecha_limite date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_referencia_unica check (
    (tipo = 'pesv' and requisito_pesv_id is not null and estandar_sgsst_id is null)
    or
    (tipo = 'sgsst' and estandar_sgsst_id is not null and requisito_pesv_id is null)
  ),
  unique (requisito_pesv_id),
  unique (estandar_sgsst_id)
);

alter table public.cumplimiento_items enable row level security;

create trigger cumplimiento_items_set_updated_at
  before update on public.cumplimiento_items
  for each row execute procedure public.set_updated_at();

create policy "Ver cumplimiento si estoy registrado"
  on public.cumplimiento_items for select using (public.is_registered());
create policy "Editar cumplimiento si soy editor"
  on public.cumplimiento_items for update using (public.is_editor());

-- Crea automáticamente la fila de seguimiento cuando se agrega un
-- requisito PESV o un estándar SG-SST nuevo al catálogo.
create or replace function public.crear_cumplimiento_pesv()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (tipo, requisito_pesv_id)
  values ('pesv', new.id);
  return new;
end;
$$;

create trigger trg_requisito_pesv_insert
  after insert on public.requisitos_pesv
  for each row execute procedure public.crear_cumplimiento_pesv();

create or replace function public.crear_cumplimiento_sgsst()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (tipo, estandar_sgsst_id)
  values ('sgsst', new.id);
  return new;
end;
$$;

create trigger trg_estandar_sgsst_insert
  after insert on public.estandares_sgsst
  for each row execute procedure public.crear_cumplimiento_sgsst();


-- ---------------------------------------------------------------------
-- 6) EVIDENCIAS (documentos de soporte)
-- ---------------------------------------------------------------------
-- El archivo en sí se guarda en Supabase Storage, en un bucket PRIVADO
-- llamado "evidencias" (hay que crearlo a mano — ver README.md, Paso
-- 3). Esta tabla solo guarda la referencia al archivo.
create table public.evidencias (
  id uuid primary key default gen_random_uuid(),
  cumplimiento_item_id uuid not null references public.cumplimiento_items(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.evidencias enable row level security;

create policy "Ver evidencias si estoy registrado"
  on public.evidencias for select using (public.is_registered());
create policy "Subir evidencias si soy editor"
  on public.evidencias for insert with check (public.is_editor());
create policy "Borrar evidencias si soy editor"
  on public.evidencias for delete using (public.is_editor());


-- ---------------------------------------------------------------------
-- 7) VEHÍCULOS
-- ---------------------------------------------------------------------
create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  tipo_vehiculo text,
  marca text,
  modelo_anio integer,
  propietario text,
  capacidad_pasajeros integer,
  fecha_vencimiento_soat date,
  fecha_vencimiento_tecnomecanica date,
  fecha_proximo_mantenimiento date,
  estado text not null default 'activo'
    check (estado in ('activo', 'mantenimiento', 'inactivo', 'retirado')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehiculos enable row level security;

create trigger vehiculos_set_updated_at
  before update on public.vehiculos
  for each row execute procedure public.set_updated_at();

create policy "Ver vehículos si estoy registrado"
  on public.vehiculos for select using (public.is_registered());
create policy "Crear vehículos si soy editor"
  on public.vehiculos for insert with check (public.is_editor());
create policy "Editar vehículos si soy editor"
  on public.vehiculos for update using (public.is_editor());
create policy "Borrar vehículos si soy super admin"
  on public.vehiculos for delete using (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 8) CONDUCTORES
-- ---------------------------------------------------------------------
create table public.conductores (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  numero_documento text not null unique,
  telefono text,
  categoria_licencia text,
  fecha_vencimiento_licencia date,
  fecha_ultimo_examen_medico date,
  fecha_vencimiento_examen_medico date,
  fecha_curso_conduccion_segura date,
  vehiculo_asignado_id uuid references public.vehiculos(id) on delete set null,
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'retirado')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conductores enable row level security;

create trigger conductores_set_updated_at
  before update on public.conductores
  for each row execute procedure public.set_updated_at();

create policy "Ver conductores si estoy registrado"
  on public.conductores for select using (public.is_registered());
create policy "Crear conductores si soy editor"
  on public.conductores for insert with check (public.is_editor());
create policy "Editar conductores si soy editor"
  on public.conductores for update using (public.is_editor());
create policy "Borrar conductores si soy super admin"
  on public.conductores for delete using (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 9) CAPACITACIONES
-- ---------------------------------------------------------------------
create table public.capacitaciones (
  id uuid primary key default gen_random_uuid(),
  tema text not null,
  tipo text not null default 'otra' check (tipo in ('pesv', 'sgsst', 'otra')),
  fecha date not null,
  horas numeric(4, 1),
  responsable_id uuid references public.profiles(id),
  observaciones text,
  created_at timestamptz not null default now()
);

create table public.capacitacion_asistentes (
  capacitacion_id uuid not null references public.capacitaciones(id) on delete cascade,
  conductor_id uuid not null references public.conductores(id) on delete cascade,
  asistio boolean not null default true,
  primary key (capacitacion_id, conductor_id)
);

alter table public.capacitaciones enable row level security;
alter table public.capacitacion_asistentes enable row level security;

create policy "Ver capacitaciones si estoy registrado"
  on public.capacitaciones for select using (public.is_registered());
create policy "Crear capacitaciones si soy editor"
  on public.capacitaciones for insert with check (public.is_editor());
create policy "Editar capacitaciones si soy editor"
  on public.capacitaciones for update using (public.is_editor());
create policy "Borrar capacitaciones si soy super admin"
  on public.capacitaciones for delete using (public.is_super_admin());

create policy "Ver asistentes si estoy registrado"
  on public.capacitacion_asistentes for select using (public.is_registered());
create policy "Registrar asistentes si soy editor"
  on public.capacitacion_asistentes for insert with check (public.is_editor());
create policy "Editar asistentes si soy editor"
  on public.capacitacion_asistentes for update using (public.is_editor());
create policy "Quitar asistentes si soy editor"
  on public.capacitacion_asistentes for delete using (public.is_editor());


-- ---------------------------------------------------------------------
-- 10) INCIDENTES Y ACCIDENTES (viales y laborales)
-- ---------------------------------------------------------------------
create table public.incidentes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('transito', 'laboral')),
  clasificacion text
    check (clasificacion in ('incidente', 'solo_danos', 'accidente_leve', 'accidente_grave', 'accidente_mortal')),
  fecha timestamptz not null default now(),
  lugar text,
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  conductor_id uuid references public.conductores(id) on delete set null,
  descripcion text not null,
  causas_probables text,
  estado text not null default 'abierto'
    check (estado in ('abierto', 'en_investigacion', 'cerrado')),
  reportado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incidentes enable row level security;

create trigger incidentes_set_updated_at
  before update on public.incidentes
  for each row execute procedure public.set_updated_at();

create policy "Ver incidentes si estoy registrado"
  on public.incidentes for select using (public.is_registered());
create policy "Reportar incidentes si estoy registrado"
  on public.incidentes for insert with check (public.is_registered() and reportado_por = auth.uid());
create policy "Editar incidentes si soy editor"
  on public.incidentes for update using (public.is_editor());
create policy "Borrar incidentes si soy super admin"
  on public.incidentes for delete using (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 11) PLANES DE ACCIÓN (correctivos/preventivos)
-- ---------------------------------------------------------------------
-- Pueden nacer de un incidente, de una auditoría o de un ítem de
-- cumplimiento que quedó con hallazgos.
create table public.plan_accion (
  id uuid primary key default gen_random_uuid(),
  origen text not null default 'otro' check (origen in ('incidente', 'auditoria', 'cumplimiento', 'otro')),
  incidente_id uuid references public.incidentes(id) on delete cascade,
  cumplimiento_item_id uuid references public.cumplimiento_items(id) on delete cascade,
  descripcion text not null,
  responsable_id uuid references public.profiles(id),
  fecha_limite date,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_progreso', 'cumplido', 'vencido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan_accion enable row level security;

create trigger plan_accion_set_updated_at
  before update on public.plan_accion
  for each row execute procedure public.set_updated_at();

create policy "Ver planes de acción si estoy registrado"
  on public.plan_accion for select using (public.is_registered());
create policy "Crear planes de acción si soy editor"
  on public.plan_accion for insert with check (public.is_editor());
create policy "Editar planes de acción si soy editor"
  on public.plan_accion for update using (public.is_editor());
create policy "Borrar planes de acción si soy super admin"
  on public.plan_accion for delete using (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 12) INDICADORES (vistas calculadas)
-- ---------------------------------------------------------------------
-- % de avance del PESV, por pilar. Los ítems marcados "no_aplica" no
-- cuentan ni en el numerador ni en el denominador.
create or replace view public.v_avance_pesv as
select
  p.id as pilar_id,
  p.orden,
  p.nombre as pilar,
  count(ci.id) as total_requisitos,
  count(ci.id) filter (where ci.estado = 'cumplido') as cumplidos,
  count(ci.id) filter (where ci.estado = 'no_aplica') as no_aplica,
  case
    when count(ci.id) filter (where ci.estado <> 'no_aplica') = 0 then 0
    else round(
      100.0 * count(ci.id) filter (where ci.estado = 'cumplido')
      / count(ci.id) filter (where ci.estado <> 'no_aplica')
    )
  end as porcentaje_avance
from public.pilares_pesv p
left join public.requisitos_pesv r on r.pilar_id = p.id and r.activo
left join public.cumplimiento_items ci on ci.requisito_pesv_id = r.id
group by p.id, p.orden, p.nombre
order by p.orden;

-- % de avance del SG-SST, ponderado por el puntaje oficial de cada
-- estándar (igual que exige la Resolución 0312 de 2019: no todos los
-- estándares valen lo mismo).
create or replace view public.v_avance_sgsst as
select
  coalesce(sum(e.puntaje) filter (where ci.estado = 'cumplido'), 0) as puntaje_obtenido,
  coalesce(sum(e.puntaje) filter (where ci.estado <> 'no_aplica'), 0) as puntaje_aplicable,
  case
    when coalesce(sum(e.puntaje) filter (where ci.estado <> 'no_aplica'), 0) = 0 then 0
    else round(
      100.0 * sum(e.puntaje) filter (where ci.estado = 'cumplido')
      / sum(e.puntaje) filter (where ci.estado <> 'no_aplica'),
      1
    )
  end as porcentaje_avance
from public.estandares_sgsst e
left join public.cumplimiento_items ci on ci.estandar_sgsst_id = e.id
where e.activo;

-- No llevan RLS propia (las vistas no la admiten) — son agregados de
-- toda la empresa, sin datos de una persona en particular, así que se
-- exponen a cualquier usuario registrado. Las tablas que sí tienen
-- datos detallados (cumplimiento_items, requisitos_pesv, etc.) ya
-- están protegidas arriba.
grant select on public.v_avance_pesv to authenticated;
grant select on public.v_avance_sgsst to authenticated;


-- =====================================================================
-- FIN DEL ESQUEMA — sigue con supabase/seed.sql
-- =====================================================================
