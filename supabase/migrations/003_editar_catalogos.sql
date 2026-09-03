-- =====================================================================
-- Migración 003 — Dejar los catálogos totalmente editables desde Nexus
-- =====================================================================
-- Antes, un editor solo podía AGREGAR requisitos/estándares nuevos, y
-- los pilares del PESV no se podían crear, editar ni borrar desde la
-- app. Esta migración habilita que el administrador (rol "editor" o
-- "super_admin") pueda modificar y agregar todo el catálogo normativo:
-- pilares, requisitos PESV y estándares SG-SST.
--
-- Solo hace falta correrla si tu proyecto de Supabase ya existía antes
-- de este cambio. Si estás creando el proyecto desde cero, no la
-- necesitas: ya está incluida en supabase/schema.sql.
-- =====================================================================

-- Permite "apagar" un pilar sin borrarlo (por ejemplo, si no aplica a
-- tu operación) en vez de borrarlo directamente.
alter table public.pilares_pesv
  add column if not exists activo boolean not null default true;

create policy "Crear pilares PESV si soy editor"
  on public.pilares_pesv for insert with check (public.is_editor());
create policy "Editar pilares PESV si soy editor"
  on public.pilares_pesv for update using (public.is_editor());
create policy "Borrar pilares PESV si soy super admin"
  on public.pilares_pesv for delete using (public.is_super_admin());

-- Las políticas de insertar/editar/borrar requisitos_pesv y
-- estandares_sgsst ya existían desde el esquema original — lo que
-- faltaba era la pantalla para usarlas (ya viene en este mismo cambio).
