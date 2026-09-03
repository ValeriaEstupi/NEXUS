"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

// Crea una empresa nueva: queda con su propia copia del catálogo del
// PESV y del SG-SST (ver create_empresa() en supabase/schema.sql), y
// quien la crea queda como "admin" de esa empresa automáticamente.
export async function createEmpresa(data) {
  const supabase = createClient();
  await requireUser(supabase);

  const razonSocial = (data.razonSocial || "").trim();
  if (!razonSocial) {
    return { error: "Ponle un nombre a la empresa." };
  }

  const { data: nueva, error } = await supabase.rpc("create_empresa", {
    _razon_social: razonSocial,
    _nit: data.nit || null,
    _numero_vehiculos: data.numeroVehiculos ? Number(data.numeroVehiculos) : null,
    _numero_trabajadores: data.numeroTrabajadores ? Number(data.numeroTrabajadores) : null,
    _nivel_riesgo_arl: data.nivelRiesgoArl || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, empresa: nueva };
}

export async function updateEmpresa(empresaId, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const razonSocial = (data.razonSocial || "").trim();
  if (!razonSocial) {
    return { error: "La razón social es obligatoria." };
  }

  const { error } = await supabase
    .from("empresas")
    .update({
      razon_social: razonSocial,
      nit: data.nit || null,
      numero_vehiculos: data.numeroVehiculos ? Number(data.numeroVehiculos) : null,
      numero_trabajadores: data.numeroTrabajadores ? Number(data.numeroTrabajadores) : null,
      nivel_riesgo_arl: data.nivelRiesgoArl || null,
      notas: data.notas || null,
    })
    .eq("id", empresaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/configuracion`);
  revalidatePath(`/dashboard/empresas/${empresaId}`);
  return { success: true };
}

export async function deleteEmpresa(empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("empresas").delete().eq("id", empresaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Invita a alguien por correo a una empresa (esa persona debe ya
// tener una cuenta creada en NEXUS).
export async function inviteMember(empresaId, email, role) {
  const supabase = createClient();
  await requireUser(supabase);

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return { error: "Escribe un correo." };
  }

  const { data: userId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { _email: cleanEmail }
  );

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!userId) {
    return {
      error:
        "No existe ninguna cuenta con ese correo todavía. Esa persona debe registrarse primero en NEXUS.",
    };
  }

  const { error: insertError } = await supabase
    .from("empresa_members")
    .insert({ empresa_id: empresaId, user_id: userId, role: role || "lector" });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Esa persona ya es parte de esta empresa." };
    }
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/configuracion`);
  return { success: true };
}

export async function updateMemberRole(empresaId, userId, role) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("empresa_members")
    .update({ role })
    .eq("empresa_id", empresaId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/configuracion`);
  return { success: true };
}

export async function removeMember(empresaId, userId) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("empresa_members")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/configuracion`);
  return { success: true };
}
