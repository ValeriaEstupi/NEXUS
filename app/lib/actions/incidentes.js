"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

export async function createIncidente(empresaId, data) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.descripcion) {
    return { error: "Describe qué pasó." };
  }

  const { error } = await supabase
    .from("incidentes")
    .insert({ ...payload, empresa_id: empresaId, reportado_por: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/incidentes`);
  revalidatePath(`/dashboard/empresas/${empresaId}`);
  revalidatePath(`/dashboard/empresas/${empresaId}/indicadores`);
  return { success: true };
}

export async function updateIncidente(id, data, empresaId) {
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

  if (empresaId) {
    revalidatePath(`/dashboard/empresas/${empresaId}/incidentes`);
    revalidatePath(`/dashboard/empresas/${empresaId}/indicadores`);
  }
  return { success: true };
}

export async function deleteIncidente(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("incidentes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) {
    revalidatePath(`/dashboard/empresas/${empresaId}/incidentes`);
    revalidatePath(`/dashboard/empresas/${empresaId}/indicadores`);
  }
  return { success: true };
}
