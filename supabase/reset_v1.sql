-- =====================================================================
-- RESET — Solo para proyectos que ya corrieron la versión anterior
-- (una sola empresa) y quieren pasar a la versión multiempresa.
-- =====================================================================
-- Esto BORRA todas las tablas y datos de la versión anterior. Solo
-- corre esto si tu base de datos está vacía o no te importa perder lo
-- que había (no toca tu login/usuarios de Supabase Auth, solo las
-- tablas de la app).
--
-- Después de correr este archivo, sigue con schema.sql y seed.sql
-- (la versión nueva) como si empezaras de cero.
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.plan_accion cascade;
drop table if exists public.incidentes cascade;
drop table if exists public.capacitacion_asistentes cascade;
drop table if exists public.capacitaciones cascade;
drop table if exists public.evidencias cascade;
drop table if exists public.cumplimiento_items cascade;
drop table if exists public.estandares_sgsst cascade;
drop table if exists public.requisitos_pesv cascade;
drop table if exists public.fases_phva cascade;
drop table if exists public.pilares_pesv cascade;
drop table if exists public.conductores cascade;
drop table if exists public.vehiculos cascade;
drop table if exists public.empresa cascade;
drop table if exists public.profiles cascade;

drop view if exists public.v_avance_pesv cascade;
drop view if exists public.v_avance_sgsst cascade;

drop function if exists public.is_super_admin() cascade;
drop function if exists public.is_editor() cascade;
drop function if exists public.is_registered() cascade;
drop function if exists public.set_user_role(uuid, text) cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.crear_cumplimiento_pesv() cascade;
drop function if exists public.crear_cumplimiento_sgsst() cascade;

-- =====================================================================
-- FIN DEL RESET — ahora corre schema.sql y luego seed.sql
-- =====================================================================
