"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

export async function createPilar(empresaId, { nombre, descripcion, orden }) {
  const supabase = createClient();
  await requireUser(supabase);

  const clean = (nombre || "").trim();
  if (!clean) {
    return { error: "Ponle un nombre al pilar." };
  }

  const { error } = await supabase.from("pilares_pesv").insert({
    empresa_id: empresaId,
    nombre: clean,
    descripcion: descripcion || null,
    orden: orden ? Number(orden) : 99,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}

export async function updatePilar(id, { nombre, descripcion, orden, activo }, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = {};
  if (nombre !== undefined) {
    const clean = (nombre || "").trim();
    if (!clean) return { error: "Ponle un nombre al pilar." };
    payload.nombre = clean;
  }
  if (descripcion !== undefined) payload.descripcion = descripcion || null;
  if (orden !== undefined) payload.orden = Number(orden) || 0;
  if (activo !== undefined) payload.activo = activo;

  const { error } = await supabase.from("pilares_pesv").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}

// Solo se puede borrar un pilar si ya no tiene requisitos colgando
// (la base de datos lo impide por su cuenta) — si falla, es mejor
// desactivarlo con updatePilar en vez de borrarlo.
export async function deletePilar(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("pilares_pesv").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Este pilar todavía tiene requisitos asociados — muévelos o bórralos primero, o simplemente desactiva el pilar.",
      };
    }
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/pesv`);
  return { success: true };
}
