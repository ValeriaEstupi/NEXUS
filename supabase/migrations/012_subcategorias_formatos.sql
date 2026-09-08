-- =====================================================================
-- Migración 012 — Subcategorías dentro de una categoría (ej.
-- "Planeación" y "Comercial" dentro de "G. Estratégica")
-- =====================================================================
-- ADITIVA: no borra nada. Una categoría puede ahora tener sus propias
-- subcategorías (creadas por el app admin desde la pantalla); cada
-- subcategoría tiene también sus subcarpetas "Documentos" y
-- "Formatos". Una categoría sin subcategorías sigue mostrando
-- "Documentos"/"Formatos" directo, como hasta ahora.
--
-- Corre esto UNA sola vez, completo, en el SQL Editor de tu proyecto.
-- =====================================================================

create table if not exists public.formatos_subcategoria (
  id uuid primary key default gen_random_uuid(),
  categoria_id integer not null references public.formatos_categoria(id) on delete cascade,
  orden integer not null default 0,
  nombre text not null
);

alter table public.formatos_subcategoria enable row level security;

drop policy if exists "Ver subcategorías de formatos si estoy logueado" on public.formatos_subcategoria;
create policy "Ver subcategorías de formatos si estoy logueado"
  on public.formatos_subcategoria for select using (auth.uid() is not null);
drop policy if exists "Crear subcategorías de formatos si soy app admin" on public.formatos_subcategoria;
create policy "Crear subcategorías de formatos si soy app admin"
  on public.formatos_subcategoria for insert with check (public.is_app_admin());
drop policy if exists "Borrar subcategorías de formatos si soy app admin" on public.formatos_subcategoria;
create policy "Borrar subcategorías de formatos si soy app admin"
  on public.formatos_subcategoria for delete using (public.is_app_admin());

alter table public.formatos_plantilla
  add column if not exists subcategoria_id uuid references public.formatos_subcategoria(id) on delete cascade;

-- Crea "Planeación" y "Comercial" dentro de "G. Estratégica" (si no
-- existen ya).
insert into public.formatos_subcategoria (categoria_id, orden, nombre)
select c.id, v.orden, v.nombre
from (values (1, 'Planeación'), (2, 'Comercial')) as v(orden, nombre)
cross join (select id from public.formatos_categoria where nombre = 'G. Estratégica') c
where not exists (
  select 1 from public.formatos_subcategoria s
  where s.categoria_id = c.id and s.nombre = v.nombre
);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
