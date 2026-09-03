-- =====================================================================
-- Migración 001 — Convertir tu cuenta en "super admin" de NEXUS
-- =====================================================================
-- Corre esto DESPUÉS de haberte registrado al menos una vez en la app
-- (Paso 5 del README). Cambia el correo de la línea de abajo por el
-- tuyo y dale "Run" en el SQL Editor de Supabase.
-- =====================================================================

update public.profiles
set role = 'super_admin'
where email = 'tu-correo@ejemplo.com';
