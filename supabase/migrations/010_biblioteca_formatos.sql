-- =====================================================================
-- Migración 010 — Biblioteca compartida de formatos
-- =====================================================================
-- ADITIVA: no toca nada de lo que ya tienes. Agrega una biblioteca de
-- formatos maestros, UNA sola vez para toda la plataforma (no se
-- duplica por empresa), organizada en 6 categorías fijas. Desde la
-- pantalla "Formatos" de cada empresa se genera la versión rellena
-- con los datos de esa empresa puntual, a partir de cualquiera de
-- estos formatos.
--
-- ANTES de correr esto:
-- 1. Ve a Supabase -> Storage -> "New bucket".
-- 2. Nómbralo exactamente "formatos" (en minúsculas).
-- 3. Déjalo como bucket PRIVADO (no marques "Public bucket").
-- 4. Crea el bucket, y LUEGO pega este archivo completo en el SQL
--    Editor y dale "Run".
-- =====================================================================

create table if not exists public.formatos_categoria (
  id serial primary key,
  orden integer not null,
  nombre text not null unique
);

alter table public.formatos_categoria enable row level security;

drop policy if exists "Ver categorías de formatos si estoy logueado" on public.formatos_categoria;
create policy "Ver categorías de formatos si estoy logueado"
  on public.formatos_categoria for select using (auth.uid() is not null);

insert into public.formatos_categoria (orden, nombre) values
  (1, 'G. Estratégica'),
  (2, 'G. Operativa'),
  (3, 'G. Integral'),
  (4, 'G. Talento Humano'),
  (5, 'G. Compras'),
  (6, 'G. Mejora')
on conflict (nombre) do nothing;

create table if not exists public.formatos_plantilla (
  id uuid primary key default gen_random_uuid(),
  categoria_id integer not null references public.formatos_categoria(id),
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.formatos_plantilla enable row level security;

drop policy if exists "Ver plantillas de la biblioteca si estoy logueado" on public.formatos_plantilla;
create policy "Ver plantillas de la biblioteca si estoy logueado"
  on public.formatos_plantilla for select using (auth.uid() is not null);
drop policy if exists "Subir plantillas a la biblioteca si soy app admin" on public.formatos_plantilla;
create policy "Subir plantillas a la biblioteca si soy app admin"
  on public.formatos_plantilla for insert with check (public.is_app_admin());
drop policy if exists "Borrar plantillas de la biblioteca si soy app admin" on public.formatos_plantilla;
create policy "Borrar plantillas de la biblioteca si soy app admin"
  on public.formatos_plantilla for delete using (public.is_app_admin());

-- Reglas del bucket de Storage "formatos" (creado a mano en el paso
-- de arriba). Cualquier persona logueada puede ver/descargar; solo el
-- app admin puede subir o borrar, porque afecta a todas las empresas.
drop policy if exists "Ver formatos de la biblioteca" on storage.objects;
create policy "Ver formatos de la biblioteca"
  on storage.objects for select
  using (bucket_id = 'formatos' and auth.uid() is not null);

drop policy if exists "Subir formatos a la biblioteca si soy app admin" on storage.objects;
create policy "Subir formatos a la biblioteca si soy app admin"
  on storage.objects for insert
  with check (bucket_id = 'formatos' and public.is_app_admin());

drop policy if exists "Borrar formatos de la biblioteca si soy app admin" on storage.objects;
create policy "Borrar formatos de la biblioteca si soy app admin"
  on storage.objects for delete
  using (bucket_id = 'formatos' and public.is_app_admin());

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
