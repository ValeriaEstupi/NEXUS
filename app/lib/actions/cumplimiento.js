"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

// Actualiza el estado real de avance de un requisito PESV o un
// estándar SG-SST: estado, responsable, fecha límite u observaciones.
export async function updateCumplimientoItem(itemId, updates) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = {};
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.responsableId !== undefined)
    payload.responsable_id = updates.responsableId || null;
  if (updates.fechaLimite !== undefined)
    payload.fecha_limite = updates.fechaLimite || null;
  if (updates.observaciones !== undefined)
    payload.observaciones = updates.observaciones || null;

  const { error } = await supabase
    .from("cumplimiento_items")
    .update(payload)
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pesv");
  revalidatePath("/dashboard/sgsst");
  revalidatePath("/dashboard");
  return { success: true };
}

// Agrega un requisito nuevo al catálogo del PESV (por ejemplo, si el
// equipo legal detecta que falta uno al validar contra la resolución
// vigente). Se crea sola su fila de seguimiento gracias al trigger de
// la base de datos.
export async function addRequisitoPesv({ pilarId, faseId, codigo, descripcion }) {
  const supabase = createClient();
  await requireUser(supabase);

  const cleanDescripcion = (descripcion || "").trim();
  if (!cleanDescripcion) {
    return { error: "Escribe la descripción del requisito." };
  }
  if (!pilarId) {
    return { error: "Selecciona el pilar." };
  }

  const { error } = await supabase.from("requisitos_pesv").insert({
    pilar_id: pilarId,
    fase_id: faseId || null,
    codigo: codigo || null,
    descripcion: cleanDescripcion,
    fuente_normativa: "Agregado manualmente por el equipo",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pesv");
  return { success: true };
}

// Edita un requisito ya existente del catálogo PESV: texto, código,
// fuente, a qué pilar/fase pertenece, o lo activa/desactiva (en vez de
// borrarlo, para no perder el historial de seguimiento).
export async function updateRequisitoPesv(id, updates) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = {};
  if (updates.pilarId !== undefined) payload.pilar_id = updates.pilarId;
  if (updates.faseId !== undefined) payload.fase_id = updates.faseId || null;
  if (updates.codigo !== undefined) payload.codigo = updates.codigo || null;
  if (updates.descripcion !== undefined) {
    const clean = (updates.descripcion || "").trim();
    if (!clean) return { error: "La descripción no puede quedar vacía." };
    payload.descripcion = clean;
  }
  if (updates.fuenteNormativa !== undefined)
    payload.fuente_normativa = updates.fuenteNormativa || null;
  if (updates.activo !== undefined) payload.activo = updates.activo;

  const { error } = await supabase.from("requisitos_pesv").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pesv");
  return { success: true };
}

// Borra un requisito del catálogo PESV (y, en cascada, su fila de
// seguimiento y las evidencias que tuviera). Solo super admin, desde
// la política de la base de datos.
export async function deleteRequisitoPesv(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("requisitos_pesv").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pesv");
  return { success: true };
}

// Agrega un estándar nuevo al catálogo del SG-SST.
export async function addEstandarSgsst({ faseId, componente, codigo, descripcion, puntaje }) {
  const supabase = createClient();
  await requireUser(supabase);

  const cleanDescripcion = (descripcion || "").trim();
  if (!cleanDescripcion) {
    return { error: "Escribe la descripción del estándar." };
  }
  if (!(componente || "").trim()) {
    return { error: "Escribe el componente al que pertenece." };
  }

  const { error } = await supabase.from("estandares_sgsst").insert({
    fase_id: faseId || null,
    componente: componente.trim(),
    codigo: codigo || "—",
    descripcion: cleanDescripcion,
    puntaje: puntaje ? Number(puntaje) : 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sgsst");
  return { success: true };
}

// Edita un estándar ya existente del catálogo SG-SST, o lo
// activa/desactiva (en vez de borrarlo, para no perder el historial).
export async function updateEstandarSgsst(id, updates) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = {};
  if (updates.faseId !== undefined) payload.fase_id = updates.faseId || null;
  if (updates.componente !== undefined) {
    const clean = (updates.componente || "").trim();
    if (!clean) return { error: "El componente no puede quedar vacío." };
    payload.componente = clean;
  }
  if (updates.codigo !== undefined) payload.codigo = updates.codigo || "—";
  if (updates.descripcion !== undefined) {
    const clean = (updates.descripcion || "").trim();
    if (!clean) return { error: "La descripción no puede quedar vacía." };
    payload.descripcion = clean;
  }
  if (updates.puntaje !== undefined) payload.puntaje = Number(updates.puntaje) || 0;
  if (updates.activo !== undefined) payload.activo = updates.activo;

  const { error } = await supabase.from("estandares_sgsst").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sgsst");
  return { success: true };
}

// Borra un estándar del catálogo SG-SST. Solo super admin, desde la
// política de la base de datos.
export async function deleteEstandarSgsst(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("estandares_sgsst").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sgsst");
  return { success: true };
}

// Sube un archivo de evidencia (PDF, imagen...) al bucket privado
// "evidencias" y guarda la referencia. El archivo viaja dentro del
// mismo FormData del formulario.
export async function uploadEvidencia(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const itemId = formData.get("cumplimiento_item_id");
  const file = formData.get("archivo");

  if (!itemId) {
    return { error: "Falta el ítem de cumplimiento." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const rutaStorage = `${itemId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("evidencias")
    .upload(rutaStorage, file);

  if (uploadError) {
    return {
      error:
        uploadError.message +
        " (¿ya creaste el bucket privado 'evidencias' en Supabase Storage? Ver README.md, Paso 3.)",
    };
  }

  const { error: insertError } = await supabase.from("evidencias").insert({
    cumplimiento_item_id: itemId,
    nombre_archivo: file.name,
    ruta_storage: rutaStorage,
    subido_por: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/pesv");
  revalidatePath("/dashboard/sgsst");
  return { success: true };
}

// Genera un enlace de descarga temporal (10 minutos) para un archivo
// del bucket privado — nunca queda público de forma permanente.
export async function getEvidenciaUrl(rutaStorage) {
  const supabase = createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.storage
    .from("evidencias")
    .createSignedUrl(rutaStorage, 60 * 10);

  if (error) {
    return { error: error.message };
  }
  return { url: data.signedUrl };
}

export async function deleteEvidencia(evidenciaId, rutaStorage) {
  const supabase = createClient();
  await requireUser(supabase);

  await supabase.storage.from("evidencias").remove([rutaStorage]);

  const { error } = await supabase
    .from("evidencias")
    .delete()
    .eq("id", evidenciaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pesv");
  revalidatePath("/dashboard/sgsst");
  return { success: true };
}
