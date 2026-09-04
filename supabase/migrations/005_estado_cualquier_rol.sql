-- Migración 005: cualquier persona de la empresa (rol "lector"
-- incluido) puede marcar el estado de avance de un proceso PESV /
-- SG-SST / ISO. Antes solo podían hacerlo editor y admin, y el
-- guardado fallaba en silencio para todos los demás roles.
--
-- Reasignar responsable, mover la fecha límite o editar las
-- observaciones sigue reservado a editor/admin (se controla ahora con
-- un trigger, no solo con la política de la tabla).
--
-- Cómo correrla: pégala completa en el SQL Editor de Supabase y dale
-- "Run". Es segura de correr más de una vez.

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
