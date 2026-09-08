-- =====================================================================
-- Migración 008 — SARLAFT (Sistema de Administración del Riesgo de
-- Lavado de Activos y de la Financiación del Terrorismo)
-- =====================================================================
-- ADITIVA: no borra ni toca nada de lo que ya tienes (PESV, SG-SST,
-- ISO, vehículos, conductores, etc. siguen intactos). Agrega un cuarto
-- checklist, con el mismo patrón que los demás: cada empresa recibe su
-- propia copia editable, organizada por "componente" (igual que el
-- SG-SST) y por el ciclo PHVA.
--
-- Corre esto UNA sola vez, en el SQL Editor de tu proyecto — completo,
-- de una sola vez (selecciona todo con Ctrl+A antes de darle Run).
--
-- ⚠️ Nota legal: para una sociedad comercial vigilada por la
-- Superintendencia de Sociedades (como una empresa de transporte
-- especial), el nombre técnico vigente de este sistema es SAGRLAFT
-- (Circular Externa 100-000016 de 2020). "SARLAFT" es el término que
-- usa la Superintendencia Financiera para sus propios vigilados, pero
-- en la práctica ambos nombres se usan indistintamente. Se conserva
-- "SARLAFT" en la app por ser el más reconocido. Esta plantilla es un
-- punto de partida editable, no un texto legal certificado — el
-- equipo legal/de cumplimiento debe validarla contra la circular
-- vigente antes de una auditoría o inspección.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Plantilla base (global, se copia a cada empresa nueva)
-- ---------------------------------------------------------------------
create table if not exists public.requisitos_sarlaft_template (
  id uuid primary key default gen_random_uuid(),
  fase_id integer references public.fases_phva(id),
  componente text not null,
  codigo text,
  descripcion text not null,
  fuente_normativa text,
  orden integer not null default 0
);

alter table public.requisitos_sarlaft_template enable row level security;

drop policy if exists "Ver plantilla SARLAFT si estoy logueado" on public.requisitos_sarlaft_template;
create policy "Ver plantilla SARLAFT si estoy logueado"
  on public.requisitos_sarlaft_template for select using (auth.uid() is not null);

insert into public.requisitos_sarlaft_template (fase_id, componente, codigo, descripcion, fuente_normativa, orden)
select f.id, v.componente, v.codigo, v.descripcion, v.fuente, v.orden
from (values
  -- PLANEAR — Política y órganos de control
  ('Planear', 'Política y órganos de control', 'P.1', 'Política de administración del riesgo LA/FT aprobada por la Junta Directiva o el Representante Legal.', 'Circular Externa 100-000016/2020 (Supersociedades)', 1),
  ('Planear', 'Política y órganos de control', 'P.2', 'Oficial de Cumplimiento (principal y suplente) designado, con dedicación y jerarquía suficientes.', 'Circular Externa 100-000016/2020 (Supersociedades)', 2),
  ('Planear', 'Política y órganos de control', 'P.3', 'Manual SARLAFT documentado, actualizado y divulgado a toda la organización.', 'Circular Externa 100-000016/2020 (Supersociedades)', 3),
  ('Planear', 'Política y órganos de control', 'P.4', 'Código de ética y conducta que incorpora lineamientos de prevención de LA/FT.', 'Circular Externa 100-000016/2020 (Supersociedades)', 4),
  ('Planear', 'Política y órganos de control', 'P.5', 'Funciones y responsabilidades en LA/FT de Junta Directiva, Representante Legal y Oficial de Cumplimiento, definidas por escrito.', 'Circular Externa 100-000016/2020 (Supersociedades)', 5),
  ('Planear', 'Identificación del riesgo', 'P.6', 'Metodología de identificación de factores de riesgo (clientes, contrapartes, empleados, proveedores, productos, canales, jurisdicciones).', 'Circular Externa 100-000016/2020 (Supersociedades)', 6),
  ('Planear', 'Identificación del riesgo', 'P.7', 'Matriz de riesgo LA/FT elaborada, con calificación de riesgo inherente por factor.', 'Circular Externa 100-000016/2020 (Supersociedades)', 7),
  ('Planear', 'Identificación del riesgo', 'P.8', 'Procedimiento de debida diligencia (conocimiento del cliente/contraparte) aplicado en la vinculación.', 'Circular Externa 100-000016/2020 (Supersociedades)', 8),
  ('Planear', 'Identificación del riesgo', 'P.9', 'Procedimiento de debida diligencia intensificada para contrapartes de mayor riesgo (PEP y similares).', 'Circular Externa 100-000016/2020 (Supersociedades)', 9),
  ('Planear', 'Identificación del riesgo', 'P.10', 'Conocimiento del mercado: segmentación de clientes, contrapartes y proveedores según su perfil de riesgo.', 'Circular Externa 100-000016/2020 (Supersociedades)', 10),

  ('Hacer', 'Medición del riesgo', 'H.1', 'Metodología de medición del riesgo inherente y residual, aplicada a cada factor de riesgo.', 'Circular Externa 100-000016/2020 (Supersociedades)', 11),
  ('Hacer', 'Medición del riesgo', 'H.2', 'Perfil de riesgo LA/FT de la empresa, consolidado y actualizado periódicamente.', 'Circular Externa 100-000016/2020 (Supersociedades)', 12),
  ('Hacer', 'Control del riesgo', 'H.3', 'Señales de alerta definidas para detectar operaciones inusuales o sospechosas.', 'Circular Externa 100-000016/2020 (Supersociedades)', 13),
  ('Hacer', 'Control del riesgo', 'H.4', 'Procedimiento de análisis y documentación de operaciones inusuales detectadas.', 'Circular Externa 100-000016/2020 (Supersociedades)', 14),
  ('Hacer', 'Control del riesgo', 'H.5', 'Consulta en listas restrictivas y vinculantes (ONU, OFAC y otras) en la vinculación y de forma periódica.', 'Circular Externa 100-000016/2020 (Supersociedades)', 15),
  ('Hacer', 'Control del riesgo', 'H.6', 'Segregación de funciones entre las áreas comercial/operativa y la función de cumplimiento.', 'Circular Externa 100-000016/2020 (Supersociedades)', 16),
  ('Hacer', 'Capacitación y divulgación', 'H.7', 'Programa anual de capacitación en LA/FT, dirigido según el nivel de riesgo de cada cargo.', 'Circular Externa 100-000016/2020 (Supersociedades)', 17),
  ('Hacer', 'Capacitación y divulgación', 'H.8', 'Registro y evaluación de la capacitación en LA/FT impartida al personal.', 'Circular Externa 100-000016/2020 (Supersociedades)', 18),
  ('Hacer', 'Capacitación y divulgación', 'H.9', 'Divulgación efectiva del código de ética y del manual SARLAFT a todo el personal.', 'Circular Externa 100-000016/2020 (Supersociedades)', 19),

  ('Verificar', 'Monitoreo del riesgo', 'V.1', 'Monitoreo continuo de operaciones para identificar comportamientos inusuales.', 'Circular Externa 100-000016/2020 (Supersociedades)', 20),
  ('Verificar', 'Monitoreo del riesgo', 'V.2', 'Indicadores de gestión del riesgo LA/FT (alertas generadas, ROS presentados, capacitaciones realizadas).', 'Circular Externa 100-000016/2020 (Supersociedades)', 21),
  ('Verificar', 'Auditoría', 'V.3', 'Auditoría anual (interna o externa) del sistema SARLAFT.', 'Circular Externa 100-000016/2020 (Supersociedades)', 22),
  ('Verificar', 'Auditoría', 'V.4', 'Revisión del sistema por la Junta Directiva/Representante Legal, con seguimiento a los hallazgos.', 'Circular Externa 100-000016/2020 (Supersociedades)', 23),

  ('Actuar', 'Reportes', 'A.1', 'Reporte de Operación Sospechosa (ROS) a la UIAF, cuando corresponda.', 'Ley 526 de 1999 (UIAF)', 24),
  ('Actuar', 'Reportes', 'A.2', 'Reporte de ausencia de operaciones sospechosas ante la UIAF, cuando no hubo ROS en el periodo.', 'Ley 526 de 1999 (UIAF)', 25),
  ('Actuar', 'Reportes', 'A.3', 'Conservación de los soportes documentales del SARLAFT por el término legal (mínimo 5 años).', 'Circular Externa 100-000016/2020 (Supersociedades)', 26),
  ('Actuar', 'Mejora continua', 'A.4', 'Plan de mejoramiento con acciones correctivas derivadas de hallazgos de auditoría o monitoreo.', 'Circular Externa 100-000016/2020 (Supersociedades)', 27),
  ('Actuar', 'Mejora continua', 'A.5', 'Actualización del manual y la matriz de riesgo ante cambios normativos o del entorno del negocio.', 'Circular Externa 100-000016/2020 (Supersociedades)', 28)
) as v(fase_nombre, componente, codigo, descripcion, fuente, orden)
join public.fases_phva f on f.nombre = v.fase_nombre
where not exists (select 1 from public.requisitos_sarlaft_template limit 1);


-- ---------------------------------------------------------------------
-- 2) Catálogo de cada empresa (copia propia, editable)
-- ---------------------------------------------------------------------
create table if not exists public.requisitos_sarlaft (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  fase_id integer references public.fases_phva(id),
  componente text not null,
  codigo text,
  descripcion text not null,
  fuente_normativa text,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.requisitos_sarlaft enable row level security;

drop policy if exists "Ver requisitos SARLAFT de mis empresas" on public.requisitos_sarlaft;
create policy "Ver requisitos SARLAFT de mis empresas"
  on public.requisitos_sarlaft for select using (public.is_empresa_member(empresa_id));
drop policy if exists "Crear requisitos SARLAFT si soy editor de la empresa" on public.requisitos_sarlaft;
create policy "Crear requisitos SARLAFT si soy editor de la empresa"
  on public.requisitos_sarlaft for insert with check (public.is_empresa_editor(empresa_id));
drop policy if exists "Editar requisitos SARLAFT si soy editor de la empresa" on public.requisitos_sarlaft;
create policy "Editar requisitos SARLAFT si soy editor de la empresa"
  on public.requisitos_sarlaft for update using (public.is_empresa_editor(empresa_id));
drop policy if exists "Borrar requisitos SARLAFT si soy admin de la empresa" on public.requisitos_sarlaft;
create policy "Borrar requisitos SARLAFT si soy admin de la empresa"
  on public.requisitos_sarlaft for delete using (public.is_empresa_admin(empresa_id));


-- ---------------------------------------------------------------------
-- 3) Conectar con el seguimiento de cumplimiento (cumplimiento_items)
-- ---------------------------------------------------------------------
alter table public.cumplimiento_items
  add column if not exists requisito_sarlaft_id uuid references public.requisitos_sarlaft(id) on delete cascade;

alter table public.cumplimiento_items
  drop constraint if exists cumplimiento_items_requisito_sarlaft_id_key;
alter table public.cumplimiento_items
  add constraint cumplimiento_items_requisito_sarlaft_id_key unique (requisito_sarlaft_id);

alter table public.cumplimiento_items drop constraint if exists chk_referencia_unica;
alter table public.cumplimiento_items add constraint chk_referencia_unica check (
  (tipo = 'pesv' and requisito_pesv_id is not null and estandar_sgsst_id is null and requisito_iso_id is null and requisito_sarlaft_id is null)
  or
  (tipo = 'sgsst' and estandar_sgsst_id is not null and requisito_pesv_id is null and requisito_iso_id is null and requisito_sarlaft_id is null)
  or
  (tipo = 'iso' and requisito_iso_id is not null and requisito_pesv_id is null and estandar_sgsst_id is null and requisito_sarlaft_id is null)
  or
  (tipo = 'sarlaft' and requisito_sarlaft_id is not null and requisito_pesv_id is null and estandar_sgsst_id is null and requisito_iso_id is null)
);

alter table public.cumplimiento_items drop constraint if exists cumplimiento_items_tipo_check;
alter table public.cumplimiento_items add constraint cumplimiento_items_tipo_check
  check (tipo in ('pesv', 'sgsst', 'iso', 'sarlaft'));

create or replace function public.crear_cumplimiento_sarlaft()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_sarlaft_id)
  values (new.empresa_id, 'sarlaft', new.id);
  return new;
end;
$$;

drop trigger if exists trg_requisito_sarlaft_insert on public.requisitos_sarlaft;
create trigger trg_requisito_sarlaft_insert
  after insert on public.requisitos_sarlaft
  for each row execute procedure public.crear_cumplimiento_sarlaft();


-- ---------------------------------------------------------------------
-- 4) Que las empresas NUEVAS también reciban el catálogo SARLAFT
-- ---------------------------------------------------------------------
create or replace function public.create_empresa(
  _razon_social text,
  _nit text default null,
  _numero_vehiculos integer default null,
  _numero_trabajadores integer default null,
  _nivel_riesgo_arl text default null
)
returns public.empresas
language plpgsql
security definer
set search_path = public
as $$
declare
  new_empresa public.empresas;
  pilar_tpl record;
  new_pilar_id integer;
  pilar_map jsonb := '{}'::jsonb;
begin
  insert into public.empresas (razon_social, nit, numero_vehiculos, numero_trabajadores, nivel_riesgo_arl, created_by)
  values (_razon_social, _nit, _numero_vehiculos, _numero_trabajadores, _nivel_riesgo_arl, auth.uid())
  returning * into new_empresa;

  insert into public.empresa_members (empresa_id, user_id, role)
  values (new_empresa.id, auth.uid(), 'admin');

  for pilar_tpl in select * from public.pilares_pesv_template order by orden loop
    insert into public.pilares_pesv (empresa_id, orden, nombre, descripcion)
    values (new_empresa.id, pilar_tpl.orden, pilar_tpl.nombre, pilar_tpl.descripcion)
    returning id into new_pilar_id;
    pilar_map := pilar_map || jsonb_build_object(pilar_tpl.id::text, new_pilar_id);
  end loop;

  insert into public.requisitos_pesv (empresa_id, pilar_id, fase_id, codigo, descripcion, fuente_normativa, orden)
  select
    new_empresa.id,
    (pilar_map ->> r.pilar_template_id::text)::integer,
    r.fase_id, r.codigo, r.descripcion, r.fuente_normativa, r.orden
  from public.requisitos_pesv_template r;

  insert into public.estandares_sgsst (empresa_id, fase_id, componente, codigo, descripcion, puntaje, orden)
  select new_empresa.id, fase_id, componente, codigo, descripcion, puntaje, orden
  from public.estandares_sgsst_template;

  insert into public.requisitos_iso (empresa_id, norma_id, fase_id, codigo, descripcion, orden)
  select new_empresa.id, norma_id, fase_id, codigo, descripcion, orden
  from public.requisitos_iso_template;

  insert into public.requisitos_sarlaft (empresa_id, fase_id, componente, codigo, descripcion, fuente_normativa, orden)
  select new_empresa.id, fase_id, componente, codigo, descripcion, fuente_normativa, orden
  from public.requisitos_sarlaft_template;

  return new_empresa;
end;
$$;


-- ---------------------------------------------------------------------
-- 5) Darle el catálogo SARLAFT a las empresas que ya existían antes de
--    esta migración
-- ---------------------------------------------------------------------
insert into public.requisitos_sarlaft (empresa_id, fase_id, componente, codigo, descripcion, fuente_normativa, orden)
select e.id, r.fase_id, r.componente, r.codigo, r.descripcion, r.fuente_normativa, r.orden
from public.empresas e
cross join public.requisitos_sarlaft_template r
where not exists (
  select 1 from public.requisitos_sarlaft rs where rs.empresa_id = e.id
);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
