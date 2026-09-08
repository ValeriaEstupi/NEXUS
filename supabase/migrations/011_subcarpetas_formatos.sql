-- =====================================================================
-- Migración 011 — Subcarpetas "Documentos" y "Formatos" dentro de
-- cada categoría de la biblioteca
-- =====================================================================
-- ADITIVA: no borra nada. Cada una de las 6 categorías (G. Estratégica,
-- G. Operativa, G. Integral, G. Talento Humano, G. Compras, G. Mejora)
-- ahora se divide en dos subcarpetas:
--   - "Documentos": cualquier tipo de archivo, se descarga tal cual
--     (sin rellenar marcadores) — para actas, manuales, evidencias de
--     referencia, etc.
--   - "Formatos": Word (.docx) o Excel (.xlsx) con marcadores entre
--     paréntesis — de estos sí se puede generar la versión rellena
--     con los datos de una empresa puntual.
--
-- Corre esto UNA sola vez, completo, en el SQL Editor de tu proyecto.
-- =====================================================================

alter table public.formatos_plantilla
  add column if not exists subcarpeta text not null default 'formatos';

alter table public.formatos_plantilla
  drop constraint if exists formatos_plantilla_subcarpeta_check;
alter table public.formatos_plantilla
  add constraint formatos_plantilla_subcarpeta_check check (subcarpeta in ('documentos', 'formatos'));

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
