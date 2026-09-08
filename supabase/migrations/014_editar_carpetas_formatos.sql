-- =====================================================================
-- Migración 014 — Permiso para editar carpetas de la biblioteca
-- =====================================================================
-- A la tabla formatos_carpeta le faltaba el permiso de UPDATE — por
-- eso "Renombrar" y los botones ▲▼ de reordenar no hacían nada (la
-- base de datos bloqueaba el cambio en silencio). Corre esto UNA sola
-- vez, en el SQL Editor de tu proyecto.
-- =====================================================================

drop policy if exists "Editar carpetas de formatos si soy app admin" on public.formatos_carpeta;
create policy "Editar carpetas de formatos si soy app admin"
  on public.formatos_carpeta for update using (public.is_app_admin());

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
