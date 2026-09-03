"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

function toPayload(data) {
  return {
    placa: (data.placa || "").trim().toUpperCase(),
    tipo_vehiculo: data.tipoVehiculo || null,
    marca: data.marca || null,
    modelo_anio: data.modeloAnio ? Number(data.modeloAnio) : null,
    propietario: data.propietario || null,
    capacidad_pasajeros: data.capacidadPasajeros
      ? Number(data.capacidadPasajeros)
      : null,
    fecha_vencimiento_soat: data.fechaVencimientoSoat || null,
    fecha_vencimiento_tecnomecanica: data.fechaVencimientoTecnomecanica || null,
    fecha_proximo_mantenimiento: data.fechaProximoMantenimiento || null,
    estado: data.estado || "activo",
    observaciones: data.observaciones || null,
  };
}

export async function createVehiculo(empresaId, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.placa) {
    return { error: "La placa es obligatoria." };
  }

  const { error } = await supabase
    .from("vehiculos")
    .insert({ ...payload, empresa_id: empresaId });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un vehículo con esa placa en esta empresa." };
    }
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/vehiculos`);
  revalidatePath(`/dashboard/empresas/${empresaId}`);
  return { success: true };
}

export async function updateVehiculo(id, data, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.placa) {
    return { error: "La placa es obligatoria." };
  }

  const { error } = await supabase.from("vehiculos").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) {
    revalidatePath(`/dashboard/empresas/${empresaId}/vehiculos`);
    revalidatePath(`/dashboard/empresas/${empresaId}`);
  }
  return { success: true };
}

export async function deleteVehiculo(id, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("vehiculos").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/vehiculos`);
  return { success: true };
}
