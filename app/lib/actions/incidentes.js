"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

function toPayload(data) {
  return {
    tipo: data.tipo || "transito",
    clasificacion: data.clasificacion || null,
    fecha: data.fecha || new Date().toISOString(),
    lugar: data.lugar || null,
    vehiculo_id: data.vehiculoId || null,
    conductor_id: data.conductorId || null,
    descripcion: (data.descripcion || "").trim(),
    causas_probables: data.causasProbables || null,
    estado: data.estado || "abierto",
  };
}

export async function createIncidente(data) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.descripcion) {
    return { error: "Describe qué pasó." };
  }

  const { error } = await supabase
    .from("incidentes")
    .insert({ ...payload, reportado_por: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/incidentes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/indicadores");
  return { success: true };
}

export async function updateIncidente(id, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.descripcion) {
    return { error: "Describe qué pasó." };
  }

  const { error } = await supabase
    .from("incidentes")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/incidentes");
  revalidatePath("/dashboard/indicadores");
  return { success: true };
}

export async function deleteIncidente(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("incidentes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/incidentes");
  revalidatePath("/dashboard/indicadores");
  return { success: true };
}
