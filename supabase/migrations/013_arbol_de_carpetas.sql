-- =====================================================================
-- Migración 013 — Biblioteca de formatos como árbol de carpetas
-- =====================================================================
-- Reemplaza el modelo fijo (categoría → subcategoría → Documentos/
-- Formatos) por un árbol de carpetas genérico: cualquier carpeta
-- puede tener subcarpetas Y archivos propios, a la profundidad que
-- haga falta — así puedes seguir agregando niveles (como "Marco
-- Estratégico", "Políticas", etc. dentro de Planeación > Documentos)
-- sin que se necesite otra migración cada vez.
--
-- Esto SÍ borra las tablas anteriores de la biblioteca
-- (formatos_categoria/formatos_subcategoria/formatos_plantilla) y las
-- reemplaza — seguro de correr porque, hasta ahora, esas carpetas
-- estaban vacías (sin archivos subidos todavía). NO toca ninguna otra
-- tabla (empresas, PESV, SG-SST, ISO, SARLAFT, documentos_generados
-- de cada empresa, etc. quedan intactos).
--
-- Corre esto UNA sola vez, completo, en el SQL Editor de tu proyecto.
-- =====================================================================

drop table if exists public.formatos_plantilla cascade;
drop table if exists public.formatos_subcategoria cascade;
drop table if exists public.formatos_categoria cascade;

create table if not exists public.formatos_carpeta (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.formatos_carpeta(id) on delete cascade,
  orden integer not null default 0,
  nombre text not null,
  es_formato boolean not null default false
);

alter table public.formatos_carpeta enable row level security;

drop policy if exists "Ver carpetas de formatos si estoy logueado" on public.formatos_carpeta;
create policy "Ver carpetas de formatos si estoy logueado"
  on public.formatos_carpeta for select using (auth.uid() is not null);
drop policy if exists "Crear carpetas de formatos si soy app admin" on public.formatos_carpeta;
create policy "Crear carpetas de formatos si soy app admin"
  on public.formatos_carpeta for insert with check (public.is_app_admin());
drop policy if exists "Borrar carpetas de formatos si soy app admin" on public.formatos_carpeta;
create policy "Borrar carpetas de formatos si soy app admin"
  on public.formatos_carpeta for delete using (public.is_app_admin());

create table if not exists public.formatos_archivo (
  id uuid primary key default gen_random_uuid(),
  carpeta_id uuid not null references public.formatos_carpeta(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.formatos_archivo enable row level security;

drop policy if exists "Ver archivos de formatos si estoy logueado" on public.formatos_archivo;
create policy "Ver archivos de formatos si estoy logueado"
  on public.formatos_archivo for select using (auth.uid() is not null);
drop policy if exists "Subir archivos de formatos si soy app admin" on public.formatos_archivo;
create policy "Subir archivos de formatos si soy app admin"
  on public.formatos_archivo for insert with check (public.is_app_admin());
drop policy if exists "Borrar archivos de formatos si soy app admin" on public.formatos_archivo;
create policy "Borrar archivos de formatos si soy app admin"
  on public.formatos_archivo for delete using (public.is_app_admin());

-- Vuelve a crear la estructura que ya tenías armada.
do $$
declare
  v_ge uuid; v_plan uuid; v_com uuid; v_plan_doc uuid;
begin
  insert into public.formatos_carpeta (orden, nombre) values (1, 'G. Estratégica') returning id into v_ge;
  insert into public.formatos_carpeta (orden, nombre) values (2, 'G. Operativa');
  insert into public.formatos_carpeta (orden, nombre) values (3, 'G. Integral');
  insert into public.formatos_carpeta (orden, nombre) values (4, 'G. Talento Humano');
  insert into public.formatos_carpeta (orden, nombre) values (5, 'G. Compras');
  insert into public.formatos_carpeta (orden, nombre) values (6, 'G. Mejora');

  insert into public.formatos_carpeta (parent_id, orden, nombre) values (v_ge, 1, 'Planeación') returning id into v_plan;
  insert into public.formatos_carpeta (parent_id, orden, nombre) values (v_ge, 2, 'Comercial') returning id into v_com;

  insert into public.formatos_carpeta (parent_id, orden, nombre, es_formato) values (v_plan, 1, 'Documentos', false) returning id into v_plan_doc;
  insert into public.formatos_carpeta (parent_id, orden, nombre, es_formato) values (v_plan, 2, 'Formatos', true);
  insert into public.formatos_carpeta (parent_id, orden, nombre, es_formato) values (v_com, 1, 'Documentos', false);
  insert into public.formatos_carpeta (parent_id, orden, nombre, es_formato) values (v_com, 2, 'Formatos', true);

  insert into public.formatos_carpeta (parent_id, orden, nombre) values
    (v_plan_doc, 1, 'Marco Estratégico'),
    (v_plan_doc, 2, 'Políticas'),
    (v_plan_doc, 3, 'Caracterizaciones'),
    (v_plan_doc, 4, 'Programas'),
    (v_plan_doc, 5, 'Procedimientos'),
    (v_plan_doc, 6, 'Manuales'),
    (v_plan_doc, 7, 'Reglamentos'),
    (v_plan_doc, 8, 'Códigos');
end $$;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
