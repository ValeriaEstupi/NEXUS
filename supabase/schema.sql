-- =====================================================================
-- ESQUEMA DE BASE DE DATOS — NEXUS (v2, multiempresa)
-- Plataforma de seguimiento del PESV y del SG-SST para varias empresas
-- de transporte especial, cada una con sus datos totalmente separados.
-- =====================================================================
-- Cómo usar este archivo:
-- 1. Si tu proyecto de Supabase está VACÍO (nunca corriste nada acá):
--    ve directo al SQL Editor, pega TODO este archivo y dale Run.
-- 2. Si ya habías corrido la versión anterior (una sola empresa) y no
--    te importa perder esos datos: corre primero `reset_v1.sql`, y
--    LUEGO este archivo.
-- 3. Después corre `seed.sql` (carga el catálogo base de PESV/SG-SST
--    que se copia cada vez que se crea una empresa nueva).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) PERFILES
-- ---------------------------------------------------------------------
-- "is_app_admin" marca a la(s) persona(s) dueña(s) de toda la
-- plataforma NEXUS (por ejemplo, quien la administra para varias
-- empresas cliente): pueden ver y administrar TODAS las empresas, sin
-- necesidad de pertenecer a cada una. Por defecto nadie lo es; se
-- activa a mano con un UPDATE (ver supabase/migrations/001_...).
--
-- El rol de cada persona DENTRO de una empresa (lector/editor/admin)
-- vive aparte, en "empresa_members" — una misma persona puede ser
-- admin de una empresa y solo lectura en otra.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  is_app_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_app_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Esta función se ejecuta automáticamente cada vez que alguien se
-- registra: crea su fila en "profiles" sin que la app tenga que hacerlo.
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

-- Utilidad compartida: pone "updated_at" al momento de cada UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2) EMPRESAS Y SUS MIEMBROS ("grupos de trabajo" por empresa)
-- ---------------------------------------------------------------------
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  nit text,
  numero_vehiculos integer,
  numero_trabajadores integer,
  nivel_riesgo_arl text check (nivel_riesgo_arl in ('I', 'II', 'III', 'IV', 'V')),
  notas text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresas enable row level security;

create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute procedure public.set_updated_at();

-- Cada fila dice "esta persona pertenece a esta empresa, con este rol":
--   - "lector": ve todo, no puede editar nada (salvo reportar incidentes).
--   - "editor": crea y edita el día a día de esa empresa.
--   - "admin": además, borra registros y administra los miembros de
--     ESA empresa (no de las demás).
create table public.empresa_members (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'lector' check (role in ('admin', 'editor', 'lector')),
  joined_at timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

alter table public.empresa_members enable row level security;

-- Funciones auxiliares de permisos por empresa. Un "app admin" siempre
-- pasa, sin importar si pertenece o no a la empresa — igual que la
-- dueña de toda la plataforma.
create or replace function public.is_empresa_member(_empresa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_app_admin() or exists (
    select 1 from public.empresa_members
    where empresa_id = _empresa_id and user_id = auth.uid()
  );
$$;

create or replace function public.empresa_role(_empresa_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.empresa_members
  where empresa_id = _empresa_id and user_id = auth.uid();
$$;

create or replace function public.is_empresa_editor(_empresa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_app_admin() or coalesce(
    public.empresa_role(_empresa_id) in ('editor', 'admin'), false
  );
$$;

create or replace function public.is_empresa_admin(_empresa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_app_admin() or coalesce(
    public.empresa_role(_empresa_id) = 'admin', false
  );
$$;

-- Políticas de "empresas": veo/edito las empresas donde soy miembro
-- (o todas si soy app admin). Cualquier persona registrada puede
-- crear una empresa nueva (queda como admin de esa empresa gracias a
-- la función create_empresa(), más abajo).
create policy "Ver las empresas a las que pertenezco o todas si soy app admin"
  on public.empresas for select
  using (public.is_empresa_member(id));

create policy "Cualquier usuario logueado puede crear una empresa"
  on public.empresas for insert
  with check (auth.uid() = created_by);

create policy "Un admin de la empresa o el app admin puede editarla"
  on public.empresas for update
  using (public.is_empresa_admin(id));

create policy "Un admin de la empresa o el app admin puede eliminarla"
  on public.empresas for delete
  using (public.is_empresa_admin(id));

-- Políticas de "empresa_members".
create policy "Ver miembros de mis empresas o todas si soy app admin"
  on public.empresa_members for select
  using (public.is_empresa_member(empresa_id));

create policy "Unirse a una empresa, ser agregado por un admin, o por el app admin"
  on public.empresa_members for insert
  with check (user_id = auth.uid() or public.is_empresa_admin(empresa_id));

create policy "Un admin de la empresa o el app admin puede cambiar roles"
  on public.empresa_members for update
  using (public.is_empresa_admin(empresa_id));

create policy "Un admin de la empresa o el app admin puede quitar miembros"
  on public.empresa_members for delete
  using (public.is_empresa_admin(empresa_id));

-- Ver a tus compañeros de empresa (para elegir responsables, etc.) y
-- buscar usuarios existentes para invitarlos.
create or replace function public.shares_empresa_with(_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.empresa_members em1
    join public.empresa_members em2 on em1.empresa_id = em2.empresa_id
    where em1.user_id = auth.uid() and em2.user_id = _profile_id
  );
$$;

create policy "Ver mi perfil, compañeros de empresa, o todos si soy app admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_app_admin() or public.shares_empresa_with(id));

create policy "Actualizar mi propio nombre"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.find_user_id_by_email(_email text)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles where email = _email limit 1;
$$;

-- Crea una empresa y dos cosas más en el mismo paso:
--  1) Deja a quien la crea como "admin" de esa empresa.
--  2) Copia el catálogo base del PESV y del SG-SST (las tablas
--     "_template") para que la empresa arranque con su propia copia
--     editable, independiente de las demás empresas.
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

  -- Copiar pilares del PESV, armando un mapa "id de plantilla -> id nuevo".
  for pilar_tpl in select * from public.pilares_pesv_template order by orden loop
    insert into public.pilares_pesv (empresa_id, orden, nombre, descripcion)
    values (new_empresa.id, pilar_tpl.orden, pilar_tpl.nombre, pilar_tpl.descripcion)
    returning id into new_pilar_id;
    pilar_map := pilar_map || jsonb_build_object(pilar_tpl.id::text, new_pilar_id);
  end loop;

  -- Copiar requisitos del PESV, resolviendo el pilar nuevo con el mapa.
  insert into public.requisitos_pesv (empresa_id, pilar_id, fase_id, codigo, descripcion, fuente_normativa, orden)
  select
    new_empresa.id,
    (pilar_map ->> r.pilar_template_id::text)::integer,
    r.fase_id, r.codigo, r.descripcion, r.fuente_normativa, r.orden
  from public.requisitos_pesv_template r;

  -- Copiar los estándares del SG-SST (no dependen de pilares).
  insert into public.estandares_sgsst (empresa_id, fase_id, componente, codigo, descripcion, puntaje, orden)
  select new_empresa.id, fase_id, componente, codigo, descripcion, puntaje, orden
  from public.estandares_sgsst_template;

  -- Copiar los requisitos del Sistema de Gestión ISO (9001/14001/45001).
  insert into public.requisitos_iso (empresa_id, norma_id, fase_id, codigo, descripcion, orden)
  select new_empresa.id, norma_id, fase_id, codigo, descripcion, orden
  from public.requisitos_iso_template;

  return new_empresa;
end;
$$;


-- ---------------------------------------------------------------------
-- 3) CICLO PHVA (catálogo global, fijo, compartido por todas)
-- ---------------------------------------------------------------------
create table public.fases_phva (
  id serial primary key,
  orden integer not null,
  nombre text not null check (nombre in ('Planear', 'Hacer', 'Verificar', 'Actuar'))
);

alter table public.fases_phva enable row level security;

create policy "Ver fases PHVA si estoy logueado"
  on public.fases_phva for select using (auth.uid() is not null);


-- ---------------------------------------------------------------------
-- 4) PLANTILLA BASE del PESV, el SG-SST y el Sistema ISO (catálogo
--    global de partida)
-- ---------------------------------------------------------------------
-- Estas tablas "_template" NO son las que usa cada empresa día a día
-- — son el punto de partida que se copia (ver create_empresa() arriba)
-- cada vez que se crea una empresa nueva. Cada empresa después edita
-- SU PROPIA copia sin afectar a las demás ni a esta plantilla.
create table public.pilares_pesv_template (
  id serial primary key,
  orden integer not null,
  nombre text not null,
  descripcion text
);

create table public.requisitos_pesv_template (
  id uuid primary key default gen_random_uuid(),
  pilar_template_id integer not null references public.pilares_pesv_template(id),
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  fuente_normativa text,
  orden integer not null default 0
);

create table public.estandares_sgsst_template (
  id uuid primary key default gen_random_uuid(),
  fase_id integer references public.fases_phva(id),
  componente text not null,
  codigo text not null,
  descripcion text not null,
  puntaje numeric(4, 2) not null default 0,
  orden integer not null default 0
);

-- Catálogo global y fijo de normas ISO disponibles (igual para todas
-- las empresas — a diferencia de los pilares/estándares, esto no se
-- duplica por empresa).
create table public.normas_iso (
  id serial primary key,
  codigo text not null unique,
  nombre text not null,
  orden integer not null
);

create table public.requisitos_iso_template (
  id uuid primary key default gen_random_uuid(),
  norma_id integer not null references public.normas_iso(id),
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  orden integer not null default 0
);

alter table public.pilares_pesv_template enable row level security;
alter table public.requisitos_pesv_template enable row level security;
alter table public.estandares_sgsst_template enable row level security;
alter table public.normas_iso enable row level security;
alter table public.requisitos_iso_template enable row level security;

create policy "Ver plantilla de pilares si estoy logueado"
  on public.pilares_pesv_template for select using (auth.uid() is not null);
create policy "Ver plantilla de requisitos si estoy logueado"
  on public.requisitos_pesv_template for select using (auth.uid() is not null);
create policy "Ver plantilla de estándares si estoy logueado"
  on public.estandares_sgsst_template for select using (auth.uid() is not null);
create policy "Ver normas ISO si estoy logueado"
  on public.normas_iso for select using (auth.uid() is not null);
create policy "Ver plantilla ISO si estoy logueado"
  on public.requisitos_iso_template for select using (auth.uid() is not null);


-- ---------------------------------------------------------------------
-- 5) CATÁLOGO DE CADA EMPRESA: pilares, requisitos PESV y estándares SG-SST
-- ---------------------------------------------------------------------
-- Esta es la copia PROPIA de cada empresa (creada por create_empresa()
-- a partir de las tablas "_template"). Totalmente editable desde la
-- pantalla, sin afectar a otras empresas.
create table public.pilares_pesv (
  id serial primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  orden integer not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true
);

create table public.requisitos_pesv (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pilar_id integer not null references public.pilares_pesv(id) on delete cascade,
  fase_id integer references public.fases_phva(id),
  codigo text,
  descripcion text not null,
  fuente_normativa text,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.estandares_sgsst (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  fase_id integer references public.fases_phva(id),
  componente text not null,
  codigo text not null,
  descripcion text not null,
  puntaje numeric(4, 2) not null default 0,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Requisitos del Sistema de Gestión ISO (9001/14001/45001) de esta
-- empresa — copia propia, igual que pilares/requisitos_pesv arriba.
create table public.requisitos_iso (
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

alter table public.pilares_pesv enable row level security;
alter table public.requisitos_pesv enable row level security;
alter table public.estandares_sgsst enable row level security;
alter table public.requisitos_iso enable row level security;

create policy "Ver pilares de mis empresas"
  on public.pilares_pesv for select using (public.is_empresa_member(empresa_id));
create policy "Crear pilares si soy editor de la empresa"
  on public.pilares_pesv for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar pilares si soy editor de la empresa"
  on public.pilares_pesv for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar pilares si soy admin de la empresa"
  on public.pilares_pesv for delete using (public.is_empresa_admin(empresa_id));

create policy "Ver requisitos PESV de mis empresas"
  on public.requisitos_pesv for select using (public.is_empresa_member(empresa_id));
create policy "Crear requisitos PESV si soy editor de la empresa"
  on public.requisitos_pesv for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar requisitos PESV si soy editor de la empresa"
  on public.requisitos_pesv for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar requisitos PESV si soy admin de la empresa"
  on public.requisitos_pesv for delete using (public.is_empresa_admin(empresa_id));

create policy "Ver estándares SG-SST de mis empresas"
  on public.estandares_sgsst for select using (public.is_empresa_member(empresa_id));
create policy "Crear estándares SG-SST si soy editor de la empresa"
  on public.estandares_sgsst for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar estándares SG-SST si soy editor de la empresa"
  on public.estandares_sgsst for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar estándares SG-SST si soy admin de la empresa"
  on public.estandares_sgsst for delete using (public.is_empresa_admin(empresa_id));

create policy "Ver requisitos ISO de mis empresas"
  on public.requisitos_iso for select using (public.is_empresa_member(empresa_id));
create policy "Crear requisitos ISO si soy editor de la empresa"
  on public.requisitos_iso for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar requisitos ISO si soy editor de la empresa"
  on public.requisitos_iso for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar requisitos ISO si soy admin de la empresa"
  on public.requisitos_iso for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 6) SEGUIMIENTO DE CUMPLIMIENTO (por empresa)
-- ---------------------------------------------------------------------
create table public.cumplimiento_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('pesv', 'sgsst', 'iso')),
  requisito_pesv_id uuid references public.requisitos_pesv(id) on delete cascade,
  estandar_sgsst_id uuid references public.estandares_sgsst(id) on delete cascade,
  requisito_iso_id uuid references public.requisitos_iso(id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_progreso', 'cumplido', 'no_aplica')),
  responsable_id uuid references public.profiles(id),
  fecha_limite date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_referencia_unica check (
    (tipo = 'pesv' and requisito_pesv_id is not null and estandar_sgsst_id is null and requisito_iso_id is null)
    or
    (tipo = 'sgsst' and estandar_sgsst_id is not null and requisito_pesv_id is null and requisito_iso_id is null)
    or
    (tipo = 'iso' and requisito_iso_id is not null and requisito_pesv_id is null and estandar_sgsst_id is null)
  ),
  unique (requisito_pesv_id),
  unique (estandar_sgsst_id),
  unique (requisito_iso_id)
);

alter table public.cumplimiento_items enable row level security;

create trigger cumplimiento_items_set_updated_at
  before update on public.cumplimiento_items
  for each row execute procedure public.set_updated_at();

-- Cualquier persona de la empresa (lector incluido) puede marcar el
-- estado de avance de un proceso, porque eso es trabajo operativo de
-- todo el equipo. Reasignar responsable, mover la fecha límite o
-- editar las observaciones sigue reservado a editor/admin.
create or replace function public.check_cumplimiento_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_empresa_editor(new.empresa_id) then
    if new.responsable_id is distinct from old.responsable_id
       or new.fecha_limite is distinct from old.fecha_limite
       or new.observaciones is distinct from old.observaciones then
      raise exception 'Solo un editor o admin de la empresa puede cambiar el responsable, la fecha límite o las observaciones.';
    end if;
  end if;
  return new;
end;
$$;

create trigger cumplimiento_items_check_update
  before update on public.cumplimiento_items
  for each row execute procedure public.check_cumplimiento_update();

create policy "Ver cumplimiento de mis empresas"
  on public.cumplimiento_items for select using (public.is_empresa_member(empresa_id));
create policy "Marcar estado si soy miembro de la empresa"
  on public.cumplimiento_items for update using (public.is_empresa_member(empresa_id));

-- Crea automáticamente la fila de seguimiento cuando se agrega un
-- requisito PESV o un estándar SG-SST nuevo al catálogo de una empresa.
create or replace function public.crear_cumplimiento_pesv()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_pesv_id)
  values (new.empresa_id, 'pesv', new.id);
  return new;
end;
$$;

create trigger trg_requisito_pesv_insert
  after insert on public.requisitos_pesv
  for each row execute procedure public.crear_cumplimiento_pesv();

create or replace function public.crear_cumplimiento_sgsst()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, estandar_sgsst_id)
  values (new.empresa_id, 'sgsst', new.id);
  return new;
end;
$$;

create trigger trg_estandar_sgsst_insert
  after insert on public.estandares_sgsst
  for each row execute procedure public.crear_cumplimiento_sgsst();

create or replace function public.crear_cumplimiento_iso()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_iso_id)
  values (new.empresa_id, 'iso', new.id);
  return new;
end;
$$;

create trigger trg_requisito_iso_insert
  after insert on public.requisitos_iso
  for each row execute procedure public.crear_cumplimiento_iso();


-- ---------------------------------------------------------------------
-- 7) EVIDENCIAS (documentos de soporte)
-- ---------------------------------------------------------------------
-- El archivo en sí se guarda en Supabase Storage, bucket privado
-- "evidencias", en la ruta "<empresa_id>/<cumplimiento_item_id>/archivo"
-- — así las reglas de Storage (ver migrations/002) pueden saber de
-- qué empresa es cada archivo con solo mirar la ruta.
create table public.evidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cumplimiento_item_id uuid not null references public.cumplimiento_items(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.evidencias enable row level security;

-- El empresa_id se calcula solo, a partir del ítem de cumplimiento —
-- así no hay que confiar en lo que mande la pantalla.
create or replace function public.set_evidencia_empresa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select empresa_id into new.empresa_id
  from public.cumplimiento_items where id = new.cumplimiento_item_id;
  return new;
end;
$$;

create trigger trg_evidencia_empresa
  before insert on public.evidencias
  for each row execute procedure public.set_evidencia_empresa();

create policy "Ver evidencias de mis empresas"
  on public.evidencias for select using (public.is_empresa_member(empresa_id));
create policy "Subir evidencias si soy editor de la empresa"
  on public.evidencias for insert with check (public.is_empresa_editor(empresa_id));
create policy "Borrar evidencias si soy editor de la empresa"
  on public.evidencias for delete using (public.is_empresa_editor(empresa_id));


-- ---------------------------------------------------------------------
-- 8) VEHÍCULOS (por empresa)
-- ---------------------------------------------------------------------
create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  placa text not null,
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
  updated_at timestamptz not null default now(),
  unique (empresa_id, placa)
);

alter table public.vehiculos enable row level security;

create trigger vehiculos_set_updated_at
  before update on public.vehiculos
  for each row execute procedure public.set_updated_at();

create policy "Ver vehículos de mis empresas"
  on public.vehiculos for select using (public.is_empresa_member(empresa_id));
create policy "Crear vehículos si soy editor de la empresa"
  on public.vehiculos for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar vehículos si soy editor de la empresa"
  on public.vehiculos for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar vehículos si soy admin de la empresa"
  on public.vehiculos for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 9) CONDUCTORES (por empresa)
-- ---------------------------------------------------------------------
create table public.conductores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre_completo text not null,
  numero_documento text not null,
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
  updated_at timestamptz not null default now(),
  unique (empresa_id, numero_documento)
);

alter table public.conductores enable row level security;

create trigger conductores_set_updated_at
  before update on public.conductores
  for each row execute procedure public.set_updated_at();

create policy "Ver conductores de mis empresas"
  on public.conductores for select using (public.is_empresa_member(empresa_id));
create policy "Crear conductores si soy editor de la empresa"
  on public.conductores for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar conductores si soy editor de la empresa"
  on public.conductores for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar conductores si soy admin de la empresa"
  on public.conductores for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 10) CAPACITACIONES (por empresa)
-- ---------------------------------------------------------------------
create table public.capacitaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
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

create policy "Ver capacitaciones de mis empresas"
  on public.capacitaciones for select using (public.is_empresa_member(empresa_id));
create policy "Crear capacitaciones si soy editor de la empresa"
  on public.capacitaciones for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar capacitaciones si soy editor de la empresa"
  on public.capacitaciones for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar capacitaciones si soy admin de la empresa"
  on public.capacitaciones for delete using (public.is_empresa_admin(empresa_id));

create policy "Ver asistentes de mis empresas"
  on public.capacitacion_asistentes for select using (
    exists (
      select 1 from public.capacitaciones c
      where c.id = capacitacion_id and public.is_empresa_member(c.empresa_id)
    )
  );
create policy "Registrar asistentes si soy editor de la empresa"
  on public.capacitacion_asistentes for insert with check (
    exists (
      select 1 from public.capacitaciones c
      where c.id = capacitacion_id and public.is_empresa_editor(c.empresa_id)
    )
  );
create policy "Editar asistentes si soy editor de la empresa"
  on public.capacitacion_asistentes for update using (
    exists (
      select 1 from public.capacitaciones c
      where c.id = capacitacion_id and public.is_empresa_editor(c.empresa_id)
    )
  );
create policy "Quitar asistentes si soy editor de la empresa"
  on public.capacitacion_asistentes for delete using (
    exists (
      select 1 from public.capacitaciones c
      where c.id = capacitacion_id and public.is_empresa_editor(c.empresa_id)
    )
  );


-- ---------------------------------------------------------------------
-- 11) INCIDENTES Y ACCIDENTES (por empresa)
-- ---------------------------------------------------------------------
create table public.incidentes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
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

create policy "Ver incidentes de mis empresas"
  on public.incidentes for select using (public.is_empresa_member(empresa_id));
create policy "Reportar incidentes si soy miembro de la empresa"
  on public.incidentes for insert
  with check (public.is_empresa_member(empresa_id) and reportado_por = auth.uid());
create policy "Editar incidentes si soy editor de la empresa"
  on public.incidentes for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar incidentes si soy admin de la empresa"
  on public.incidentes for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 12) PLANES DE ACCIÓN (por empresa)
-- ---------------------------------------------------------------------
create table public.plan_accion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
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

create policy "Ver planes de acción de mis empresas"
  on public.plan_accion for select using (public.is_empresa_member(empresa_id));
create policy "Crear planes de acción si soy editor de la empresa"
  on public.plan_accion for insert with check (public.is_empresa_editor(empresa_id));
create policy "Editar planes de acción si soy editor de la empresa"
  on public.plan_accion for update using (public.is_empresa_editor(empresa_id));
create policy "Borrar planes de acción si soy admin de la empresa"
  on public.plan_accion for delete using (public.is_empresa_admin(empresa_id));

-- =====================================================================
-- FIN DEL ESQUEMA — sigue con supabase/seed.sql
-- =====================================================================
