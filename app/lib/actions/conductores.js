"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

function toPayload(data) {
  return {
    nombre_completo: (data.nombreCompleto || "").trim(),
    numero_documento: (data.numeroDocumento || "").trim(),
    telefono: data.telefono || null,
    categoria_licencia: data.categoriaLicencia || null,
    fecha_vencimiento_licencia: data.fechaVencimientoLicencia || null,
    fecha_ultimo_examen_medico: data.fechaUltimoExamenMedico || null,
    fecha_vencimiento_examen_medico: data.fechaVencimientoExamenMedico || null,
    fecha_curso_conduccion_segura: data.fechaCursoConduccionSegura || null,
    vehiculo_asignado_id: data.vehiculoAsignadoId || null,
    estado: data.estado || "activo",
    observaciones: data.observaciones || null,
  };
}

export async function createConductor(data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.nombre_completo) {
    return { error: "El nombre completo es obligatorio." };
  }
  if (!payload.numero_documento) {
    return { error: "El número de documento es obligatorio." };
  }

  const { error } = await supabase.from("conductores").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un conductor con ese número de documento." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/conductores");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateConductor(id, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const payload = toPayload(data);
  if (!payload.nombre_completo) {
    return { error: "El nombre completo es obligatorio." };
  }
  if (!payload.numero_documento) {
    return { error: "El número de documento es obligatorio." };
  }

  const { error } = await supabase
    .from("conductores")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/conductores");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteConductor(id) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("conductores").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/conductores");
  return { success: true };
}
