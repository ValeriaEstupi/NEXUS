-- Migración 006: rellena filas de seguimiento ("cumplimiento_items")
-- que quedaron faltando para requisitos/estándares que ya existían en
-- el catálogo de alguna empresa antes de que el disparador que las
-- crea automáticamente (trg_requisito_pesv_insert, etc.) existiera en
-- tu base de datos.
--
-- Sin esa fila, el desplegable de "Estado" se ve funcionando (siempre
-- muestra "Pendiente" por defecto, el primer valor de la lista), pero
-- al guardar no hay ninguna fila real que actualizar — por eso el
-- cambio nunca persiste y los porcentajes de avance quedan en 0%.
--
-- Es segura de correr más de una vez: usa "where not exists" así que
-- nunca duplica una fila de seguimiento que ya exista.
--
-- Cómo correrla: pégala completa en el SQL Editor de Supabase y dale
-- "Run".

insert into public.cumplimiento_items (empresa_id, tipo, requisito_pesv_id)
select rp.empresa_id, 'pesv', rp.id
from public.requisitos_pesv rp
where not exists (
  select 1 from public.cumplimiento_items ci where ci.requisito_pesv_id = rp.id
);

insert into public.cumplimiento_items (empresa_id, tipo, estandar_sgsst_id)
select es.empresa_id, 'sgsst', es.id
from public.estandares_sgsst es
where not exists (
  select 1 from public.cumplimiento_items ci where ci.estandar_sgsst_id = es.id
);

insert into public.cumplimiento_items (empresa_id, tipo, requisito_iso_id)
select ri.empresa_id, 'iso', ri.id
from public.requisitos_iso ri
where not exists (
  select 1 from public.cumplimiento_items ci where ci.requisito_iso_id = ri.id
);
