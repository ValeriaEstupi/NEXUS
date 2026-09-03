"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireUser } from "./_shared";

export async function updateEmpresa(id, data) {
  const supabase = createClient();
  await requireUser(supabase);

  const razonSocial = (data.razonSocial || "").trim();
  if (!razonSocial) {
    return { error: "La razón social es obligatoria." };
  }

  const { error } = await supabase
    .from("empresa")
    .update({
      razon_social: razonSocial,
      nit: data.nit || null,
      numero_vehiculos: data.numeroVehiculos ? Number(data.numeroVehiculos) : null,
      numero_trabajadores: data.numeroTrabajadores
        ? Number(data.numeroTrabajadores)
        : null,
      nivel_riesgo_arl: data.nivelRiesgoArl || null,
      notas: data.notas || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

// Solo un super admin puede cambiar el rol de otra persona — la
// función de base de datos "set_user_role" lo vuelve a verificar por
// su cuenta, así que esto es doblemente seguro.
export async function setUserRole(userId, role) {
  const supabase = createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("set_user_role", {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}
