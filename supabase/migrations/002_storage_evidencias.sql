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
--
-- Cada archivo se guarda en la ruta "<empresa_id>/<cumplimiento_item_id>/
-- archivo" — estas reglas leen el primer segmento de la ruta (el
-- empresa_id) para decidir si la persona pertenece a esa empresa,
-- sin necesidad de consultar otra tabla.
-- =====================================================================

create policy "Ver evidencias de mis empresas"
  on storage.objects for select
  using (
    bucket_id = 'evidencias'
    and public.is_empresa_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Subir evidencias si soy editor de la empresa"
  on storage.objects for insert
  with check (
    bucket_id = 'evidencias'
    and public.is_empresa_editor(((storage.foldername(name))[1])::uuid)
  );

create policy "Borrar evidencias si soy editor de la empresa"
  on storage.objects for delete
  using (
    bucket_id = 'evidencias'
    and public.is_empresa_editor(((storage.foldername(name))[1])::uuid)
  );
