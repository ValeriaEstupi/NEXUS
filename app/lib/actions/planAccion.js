"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

function toPayload(data) {
  return {
    origen: data.origen || "otro",
    incidente_id: data.incidenteId || null,
    descripcion: (data.descripcion || "").trim(),
    responsable_id: data.responsableId || null,
    fecha_limite: data.fechaLimite || null,
    estado: data.estado || "pendiente",
  };
}

export async function createPlanAccion(data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.descripcion) {
    return { error: "Describe la acción a realizar." };
  }

  const { error } = await supabase.from("plan_accion").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/plan-accion");
  return { success: true };
}

export async function updatePlanAccion(id, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.descripcion) {
    return { error: "Describe la acción a realizar." };
  }

  const { error } = await supabase.from("plan_accion").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/plan-accion");
  return { success: true };
}

export async function deletePlanAccion(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("plan_accion").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/plan-accion");
  return { success: true };
}
