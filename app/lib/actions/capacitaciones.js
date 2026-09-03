"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

export async function createCapacitacion(data) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const tema = (data.tema || "").trim();
  if (!tema) {
    return { error: "Ponle un tema a la capacitación." };
  }
  if (!data.fecha) {
    return { error: "La fecha es obligatoria." };
  }

  const { data: nueva, error } = await supabase
    .from("capacitaciones")
    .insert({
      tema,
      tipo: data.tipo || "otra",
      fecha: data.fecha,
      horas: data.horas ? Number(data.horas) : null,
      responsable_id: user.id,
      observaciones: data.observaciones || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const asistentesIds = Array.isArray(data.asistentesIds) ? data.asistentesIds : [];
  if (asistentesIds.length > 0) {
    await supabase.from("capacitacion_asistentes").insert(
      asistentesIds.map((conductorId) => ({
        capacitacion_id: nueva.id,
        conductor_id: conductorId,
      }))
    );
  }

  revalidatePath("/dashboard/capacitaciones");
  return { success: true };
}

export async function updateCapacitacion(id, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const tema = (data.tema || "").trim();
  if (!tema) {
    return { error: "Ponle un tema a la capacitación." };
  }

  const { error } = await supabase
    .from("capacitaciones")
    .update({
      tema,
      tipo: data.tipo || "otra",
      fecha: data.fecha,
      horas: data.horas ? Number(data.horas) : null,
      observaciones: data.observaciones || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/capacitaciones");
  return { success: true };
}

export async function deleteCapacitacion(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("capacitaciones").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/capacitaciones");
  return { success: true };
}

// Marca o quita la asistencia de un conductor a una capacitación
// (checkbox individual, se guarda al vuelo).
export async function toggleAsistente(capacitacionId, conductorId, asiste) {
  const supabase = createClient();
  await requireUser(supabase);

  if (asiste) {
    const { error } = await supabase
      .from("capacitacion_asistentes")
      .upsert(
        { capacitacion_id: capacitacionId, conductor_id: conductorId, asistio: true },
        { onConflict: "capacitacion_id,conductor_id" }
      );
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("capacitacion_asistentes")
      .delete()
      .eq("capacitacion_id", capacitacionId)
      .eq("conductor_id", conductorId);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/capacitaciones");
  return { success: true };
}
