"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

const TIPOS_SOPORTADOS = ["docx", "xlsx"];

async function requireAppAdmin(supabase, user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", user.id)
    .single();
  return !!profile?.is_app_admin;
}

// Sube un formato maestro a la biblioteca compartida (una sola copia,
// visible para todas las empresas de la plataforma) — solo el app
// admin puede hacerlo, porque afecta a todo el mundo a la vez.
export async function subirPlantillaBiblioteca(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede agregar formatos a la biblioteca." };
  }

  const categoriaId = formData.get("categoria_id");
  const file = formData.get("archivo");

  if (!categoriaId) {
    return { error: "Selecciona la categoría." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const nombreOriginal = file.name || "documento";
  const ext = nombreOriginal.split(".").pop()?.toLowerCase();
  if (!TIPOS_SOPORTADOS.includes(ext)) {
    return { error: "Solo se aceptan formatos de Word (.docx) o Excel (.xlsx)." };
  }

  const rutaStorage = `${categoriaId}/${Date.now()}-${nombreOriginal}`;
  const { error: uploadError } = await supabase.storage
    .from("formatos")
    .upload(rutaStorage, file);

  if (uploadError) {
    return {
      error:
        uploadError.message +
        " (¿ya creaste el bucket privado 'formatos' en Supabase Storage? Ver README.md.)",
    };
  }

  const { error: insertError } = await supabase.from("formatos_plantilla").insert({
    categoria_id: categoriaId,
    nombre_archivo: nombreOriginal,
    ruta_storage: rutaStorage,
    subido_por: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/formatos");
  return { success: true };
}

export async function deletePlantillaBiblioteca(id, rutaStorage) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede borrar formatos de la biblioteca." };
  }

  await supabase.storage.from("formatos").remove([rutaStorage]);

  const { error } = await supabase.from("formatos_plantilla").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/formatos");
  return { success: true };
}
