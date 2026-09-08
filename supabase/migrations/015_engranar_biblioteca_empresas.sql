-- =====================================================================
-- Migración 015 — Vincula los documentos generados con su archivo de
-- origen en la biblioteca
-- =====================================================================
-- ADITIVA: agrega una columna para saber, de cada documento ya
-- generado en una empresa, de qué archivo de la biblioteca vino (si
-- vino de uno) — necesario para que la pantalla "Formatos" de cada
-- empresa pueda mostrar la MISMA estructura de carpetas de la
-- biblioteca, marcando cuáles ya tienen su versión generada para esa
-- empresa y cuáles no.
--
-- Corre esto UNA sola vez, completo, en el SQL Editor de tu proyecto.
-- =====================================================================

alter table public.documentos_generados
  add column if not exists origen_archivo_id uuid references public.formatos_archivo(id) on delete set null;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
