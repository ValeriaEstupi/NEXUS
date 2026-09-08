"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";

const TIPOS_FORMATO = ["docx", "xlsx"];

async function requireAppAdmin(supabase, user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", user.id)
    .single();
  return !!profile?.is_app_admin;
}

function rutaNivel(categoriaId, subcategoriaId) {
  return subcategoriaId
    ? `/dashboard/formatos/${categoriaId}/${subcategoriaId}`
    : `/dashboard/formatos/${categoriaId}`;
}

// Crea una subcategoría dentro de una categoría (ej. "Planeación"
// dentro de "G. Estratégica"). Solo el app admin, porque afecta a
// todas las empresas a la vez.
export async function crearSubcategoria(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede crear subcarpetas en la biblioteca." };
  }

  const categoriaId = formData.get("categoria_id");
  const nombre = (formData.get("nombre") || "").toString().trim();

  if (!categoriaId) return { error: "Falta la categoría." };
  if (!nombre) return { error: "Escribe el nombre de la subcarpeta." };

  const { error } = await supabase.from("formatos_subcategoria").insert({
    categoria_id: categoriaId,
    nombre,
    orden: Date.now() % 100000,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/formatos/${categoriaId}`);
  return { success: true };
}

export async function deleteSubcategoria(id, categoriaId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede borrar subcarpetas de la biblioteca." };
  }

  const { error } = await supabase.from("formatos_subcategoria").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (categoriaId) revalidatePath(`/dashboard/formatos/${categoriaId}`);
  return { success: true };
}

// Sube un archivo a la biblioteca compartida (una sola copia, visible
// para todas las empresas de la plataforma) — solo el app admin puede
// hacerlo, porque afecta a todo el mundo a la vez. La subcarpeta
// "documentos" acepta cualquier tipo de archivo (se descarga tal
// cual); la subcarpeta "formatos" solo Word/Excel (de esos se puede
// generar la versión rellena con los datos de una empresa).
export async function subirPlantillaBiblioteca(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede agregar archivos a la biblioteca." };
  }

  const categoriaId = formData.get("categoria_id");
  const subcategoriaId = formData.get("subcategoria_id") || null;
  const subcarpeta = formData.get("subcarpeta") === "documentos" ? "documentos" : "formatos";
  const file = formData.get("archivo");

  if (!categoriaId) {
    return { error: "Selecciona la categoría." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const nombreOriginal = file.name || "documento";
  const ext = nombreOriginal.split(".").pop()?.toLowerCase();
  if (subcarpeta === "formatos" && !TIPOS_FORMATO.includes(ext)) {
    return { error: "En 'Formatos' solo se aceptan Word (.docx) o Excel (.xlsx) — para rellenar marcadores." };
  }

  const rutaStorage = `${categoriaId}/${subcategoriaId || "_"}/${subcarpeta}/${Date.now()}-${nombreOriginal}`;
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
    subcategoria_id: subcategoriaId,
    subcarpeta,
    nombre_archivo: nombreOriginal,
    ruta_storage: rutaStorage,
    subido_por: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`${rutaNivel(categoriaId, subcategoriaId)}/${subcarpeta}`);
  return { success: true };
}

export async function deletePlantillaBiblioteca(id, rutaStorage, categoriaId, subcategoriaId, subcarpeta) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede borrar archivos de la biblioteca." };
  }

  await supabase.storage.from("formatos").remove([rutaStorage]);

  const { error } = await supabase.from("formatos_plantilla").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (categoriaId && subcarpeta) revalidatePath(`${rutaNivel(categoriaId, subcategoriaId)}/${subcarpeta}`);
  return { success: true };
}
