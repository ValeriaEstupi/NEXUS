-- =====================================================================
-- Migración 001 — Convertir tu cuenta en "app admin" de NEXUS
-- =====================================================================
-- Este rol es el dueño de TODA la plataforma: ve y administra TODAS
-- las empresas, no solo las que creaste o a las que te invitaron.
--
-- Corre esto DESPUÉS de haberte registrado al menos una vez en la app
-- (Paso 6 del README). Cambia el correo de la línea de abajo por el
-- tuyo y dale "Run" en el SQL Editor de Supabase.
-- =====================================================================

update public.profiles
set is_app_admin = true
where email = 'tu-correo@ejemplo.com';
