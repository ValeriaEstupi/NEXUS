-- =====================================================================
-- Migración 009 — Formatos automáticos (rellenar Word/Excel con los
-- datos de la empresa)
-- =====================================================================
-- ADITIVA: no toca nada de lo que ya tienes. Agrega la tabla que
-- registra los documentos ya rellenados; el archivo en sí se guarda
-- en el MISMO bucket "evidencias" que ya tienes creado (no hace falta
-- crear un bucket nuevo ni tocar sus reglas de Storage).
--
-- Corre esto UNA sola vez, completo, en el SQL Editor de tu proyecto.
-- =====================================================================

create table if not exists public.documentos_generados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.documentos_generados enable row level security;

drop policy if exists "Ver documentos generados de mis empresas" on public.documentos_generados;
create policy "Ver documentos generados de mis empresas"
  on public.documentos_generados for select using (public.is_empresa_member(empresa_id));

drop policy if exists "Subir documentos generados si soy editor de la empresa" on public.documentos_generados;
create policy "Subir documentos generados si soy editor de la empresa"
  on public.documentos_generados for insert with check (public.is_empresa_editor(empresa_id));

drop policy if exists "Borrar documentos generados si soy editor de la empresa" on public.documentos_generados;
create policy "Borrar documentos generados si soy editor de la empresa"
  on public.documentos_generados for delete using (public.is_empresa_editor(empresa_id));

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
