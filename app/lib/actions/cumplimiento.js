"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

function revalidateIso(empresaId) {
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-9001`);
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-14001`);
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-45001`);
}

function revalidateEmpresa(empresaId) {
  revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  revalidatePath(`/dashboard/empresas/${empresaId}/sgsst`);
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-9001`);
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-14001`);
  revalidatePath(`/dashboard/empresas/${empresaId}/iso-45001`);
  revalidatePath(`/dashboard/empresas/${empresaId}`);
}

// Actualiza el estado real de avance de un requisito PESV o un
// estándar SG-SST: estado, responsable, fecha límite u observaciones.
export async function updateCumplimientoItem(itemId, updates, empresaId) {
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

  if (empresaId) revalidateEmpresa(empresaId);
  return { success: true };
}

// Agrega un requisito nuevo al catálogo del PESV de una empresa (por
// ejemplo, si el equipo legal detecta que falta uno al validar contra
// la resolución vigente). Se crea sola su fila de seguimiento gracias
// al trigger de la base de datos.
export async function addRequisitoPesv({ empresaId, pilarId, faseId, codigo, descripcion }) {
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
    empresa_id: empresaId,
    pilar_id: pilarId,
    fase_id: faseId || null,
    codigo: codigo || null,
    descripcion: cleanDescripcion,
    fuente_normativa: "Agregado manualmente por el equipo",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}

// Edita un requisito ya existente del catálogo PESV: texto, código,
// fuente, a qué pilar/fase pertenece, o lo activa/desactiva (en vez de
// borrarlo, para no perder el historial de seguimiento).
export async function updateRequisitoPesv(id, updates, empresaId) {
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

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}

// Borra un requisito del catálogo PESV (y, en cascada, su fila de
// seguimiento y las evidencias que tuviera). Solo admin de la empresa,
// desde la política de la base de datos.
export async function deleteRequisitoPesv(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("requisitos_pesv").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}

// Agrega un estándar nuevo al catálogo del SG-SST de una empresa.
export async function addEstandarSgsst({ empresaId, faseId, componente, codigo, descripcion, puntaje }) {
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
    empresa_id: empresaId,
    fase_id: faseId || null,
    componente: componente.trim(),
    codigo: codigo || "—",
    descripcion: cleanDescripcion,
    puntaje: puntaje ? Number(puntaje) : 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/sgsst`);
  return { success: true };
}

// Edita un estándar ya existente del catálogo SG-SST, o lo
// activa/desactiva (en vez de borrarlo, para no perder el historial).
export async function updateEstandarSgsst(id, updates, empresaId) {
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

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/sgsst`);
  return { success: true };
}

// Borra un estándar del catálogo SG-SST. Solo admin de la empresa.
export async function deleteEstandarSgsst(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("estandares_sgsst").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/sgsst`);
  return { success: true };
}

// Sube un archivo de evidencia (PDF, imagen...) al bucket privado
// "evidencias", en la ruta "<empresa_id>/<cumplimiento_item_id>/archivo".
// El empresa_id de la FILA en la base de datos se calcula solo (ver
// trigger set_evidencia_empresa en schema.sql) — acá solo lo usamos
// para armar la ruta del archivo en Storage.
export async function uploadEvidencia(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const empresaId = formData.get("empresa_id");
  const itemId = formData.get("cumplimiento_item_id");
  const file = formData.get("archivo");

  if (!empresaId || !itemId) {
    return { error: "Falta la empresa o el ítem de cumplimiento." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const rutaStorage = `${empresaId}/${itemId}/${Date.now()}-${file.name}`;

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

  revalidateEmpresa(empresaId);
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

export async function deleteEvidencia(evidenciaId, rutaStorage, empresaId) {
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

  if (empresaId) revalidateEmpresa(empresaId);
  return { success: true };
}

// Agrega un requisito nuevo al catálogo ISO (9001/14001/45001) de una
// empresa.
export async function addRequisitoIso({ empresaId, normaId, faseId, codigo, descripcion }) {
  const supabase = createClient();
  await requireUser(supabase);

  const cleanDescripcion = (descripcion || "").trim();
  if (!cleanDescripcion) {
    return { error: "Escribe la descripción del requisito." };
  }
  if (!normaId) {
    return { error: "Selecciona la norma." };
  }

  const { error } = await supabase.from("requisitos_iso").insert({
    empresa_id: empresaId,
    norma_id: normaId,
    fase_id: faseId || null,
    codigo: codigo || null,
    descripcion: cleanDescripcion,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateIso(empresaId);
  return { success: true };
}

// Edita un requisito ya existente del catálogo ISO, o lo
// activa/desactiva (en vez de borrarlo, para no perder el historial).
export async function updateRequisitoIso(id, updates, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = {};
  if (updates.normaId !== undefined) payload.norma_id = updates.normaId;
  if (updates.faseId !== undefined) payload.fase_id = updates.faseId || null;
  if (updates.codigo !== undefined) payload.codigo = updates.codigo || null;
  if (updates.descripcion !== undefined) {
    const clean = (updates.descripcion || "").trim();
    if (!clean) return { error: "La descripción no puede quedar vacía." };
    payload.descripcion = clean;
  }
  if (updates.activo !== undefined) payload.activo = updates.activo;

  const { error } = await supabase.from("requisitos_iso").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidateIso(empresaId);
  return { success: true };
}

// Borra un requisito del catálogo ISO. Solo admin de la empresa.
export async function deleteRequisitoIso(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("requisitos_iso").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidateIso(empresaId);
  return { success: true };
}
