-- Migración 007: revisión y reparación completa del seguimiento de
-- cumplimiento (PESV / SG-SST / ISO). Agrupa en un solo script las
-- migraciones 005 y 006 (por si alguna quedó a medias) y, al final,
-- te dice EXACTAMENTE cuántas filas arregló — para no depender de un
-- mensaje ambiguo tipo "Success. No rows returned".
--
-- Cómo correrla: pega el archivo COMPLETO en el SQL Editor de
-- Supabase. Antes de darle "Run", presiona Ctrl+A (o Cmd+A) dentro del
-- cuadro para seleccionar todo el texto — si Supabase Studio detecta
-- una parte del texto ya seleccionada al momento de correr, a veces
-- solo ejecuta esa selección en vez del script completo. Es segura de
-- correr más de una vez.
--
-- Al terminar, en la pestaña de resultados busca los mensajes que
-- empiezan con "NOTICE:" — ahí están los números.

-- 1) Reforzar el trigger que permite a cualquier rol marcar el estado
--    (por si la migración 005 no llegó a aplicar completa).
create or replace function public.check_cumplimiento_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_empresa_editor(new.empresa_id) then
    if new.responsable_id is distinct from old.responsable_id
       or new.fecha_limite is distinct from old.fecha_limite
       or new.observaciones is distinct from old.observaciones then
      raise exception 'Solo un editor o admin de la empresa puede cambiar el responsable, la fecha límite o las observaciones.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cumplimiento_items_check_update on public.cumplimiento_items;
create trigger cumplimiento_items_check_update
  before update on public.cumplimiento_items
  for each row execute procedure public.check_cumplimiento_update();

drop policy if exists "Editar cumplimiento si soy editor de la empresa" on public.cumplimiento_items;
drop policy if exists "Marcar estado si soy miembro de la empresa" on public.cumplimiento_items;
create policy "Marcar estado si soy miembro de la empresa"
  on public.cumplimiento_items for update using (public.is_empresa_member(empresa_id));

-- 2) Asegurar que los disparadores que crean la fila de seguimiento al
--    agregar un requisito/estándar existan (por si en tu proyecto se
--    perdieron o nunca se crearon del todo).
create or replace function public.crear_cumplimiento_pesv()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_pesv_id)
  values (new.empresa_id, 'pesv', new.id)
  on conflict (requisito_pesv_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_requisito_pesv_insert on public.requisitos_pesv;
create trigger trg_requisito_pesv_insert
  after insert on public.requisitos_pesv
  for each row execute procedure public.crear_cumplimiento_pesv();

create or replace function public.crear_cumplimiento_sgsst()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, estandar_sgsst_id)
  values (new.empresa_id, 'sgsst', new.id)
  on conflict (estandar_sgsst_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_estandar_sgsst_insert on public.estandares_sgsst;
create trigger trg_estandar_sgsst_insert
  after insert on public.estandares_sgsst
  for each row execute procedure public.crear_cumplimiento_sgsst();

create or replace function public.crear_cumplimiento_iso()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_iso_id)
  values (new.empresa_id, 'iso', new.id)
  on conflict (requisito_iso_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_requisito_iso_insert on public.requisitos_iso;
create trigger trg_requisito_iso_insert
  after insert on public.requisitos_iso
  for each row execute procedure public.crear_cumplimiento_iso();

-- 3) Rellenar TODAS las filas de seguimiento que falten hoy, y
--    contarlas para mostrarte el número.
do $$
declare
  n_pesv int;
  n_sgsst int;
  n_iso int;
  n_huerfanos int;
begin
  insert into public.cumplimiento_items (empresa_id, tipo, requisito_pesv_id)
  select rp.empresa_id, 'pesv', rp.id
  from public.requisitos_pesv rp
  where not exists (select 1 from public.cumplimiento_items ci where ci.requisito_pesv_id = rp.id);
  get diagnostics n_pesv = row_count;

  insert into public.cumplimiento_items (empresa_id, tipo, estandar_sgsst_id)
  select es.empresa_id, 'sgsst', es.id
  from public.estandares_sgsst es
  where not exists (select 1 from public.cumplimiento_items ci where ci.estandar_sgsst_id = es.id);
  get diagnostics n_sgsst = row_count;

  insert into public.cumplimiento_items (empresa_id, tipo, requisito_iso_id)
  select ri.empresa_id, 'iso', ri.id
  from public.requisitos_iso ri
  where not exists (select 1 from public.cumplimiento_items ci where ci.requisito_iso_id = ri.id);
  get diagnostics n_iso = row_count;

  -- Corrige, de paso, cualquier fila de seguimiento que haya quedado
  -- con un empresa_id distinto al de su propio requisito/estándar
  -- (dato corrupto de algún momento anterior).
  update public.cumplimiento_items ci
  set empresa_id = rp.empresa_id
  from public.requisitos_pesv rp
  where ci.requisito_pesv_id = rp.id and ci.empresa_id is distinct from rp.empresa_id;
  get diagnostics n_huerfanos = row_count;

  raise notice 'PESV: % filas de seguimiento creadas', n_pesv;
  raise notice 'SG-SST: % filas de seguimiento creadas', n_sgsst;
  raise notice 'ISO: % filas de seguimiento creadas', n_iso;
  raise notice 'Filas con empresa_id corregido: %', n_huerfanos;
end $$;

-- 4) Verificación final: si esto devuelve filas, todavía hay
--    requisitos/estándares sin su fila de seguimiento — copia el
--    resultado completo si aparece algo aquí.
select 'pesv' as tipo, rp.id, rp.empresa_id, rp.codigo, rp.descripcion
from public.requisitos_pesv rp
where not exists (select 1 from public.cumplimiento_items ci where ci.requisito_pesv_id = rp.id)
union all
select 'sgsst', es.id, es.empresa_id, es.codigo, es.descripcion
from public.estandares_sgsst es
where not exists (select 1 from public.cumplimiento_items ci where ci.estandar_sgsst_id = es.id)
union all
select 'iso', ri.id, ri.empresa_id, ri.codigo, ri.descripcion
from public.requisitos_iso ri
where not exists (select 1 from public.cumplimiento_items ci where ci.requisito_iso_id = ri.id);
