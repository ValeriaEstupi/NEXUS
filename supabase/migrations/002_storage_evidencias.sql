-- =====================================================================
-- Migración 002 — Reglas de acceso al bucket de evidencias
-- =====================================================================
-- ANTES de correr esto:
-- 1. Ve a Supabase -> Storage -> "New bucket".
-- 2. Nómbralo exactamente "evidencias" (en minúsculas).
-- 3. Déjalo como bucket PRIVADO (no marques "Public bucket") — los
--    documentos de cumplimiento no deben quedar accesibles por un
--    enlace público sin control.
-- 4. Crea el bucket, y LUEGO pega este archivo en el SQL Editor y
--    dale "Run".
-- =====================================================================

create policy "Ver evidencias si estoy registrado"
  on storage.objects for select
  using (bucket_id = 'evidencias' and public.is_registered());

create policy "Subir evidencias si soy editor"
  on storage.objects for insert
  with check (bucket_id = 'evidencias' and public.is_editor());

create policy "Borrar evidencias si soy editor"
  on storage.objects for delete
  using (bucket_id = 'evidencias' and public.is_editor());
