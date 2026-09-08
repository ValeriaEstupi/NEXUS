"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";
import { generarFormatoParaTodasLasEmpresas } from "@/app/lib/documentoFill";
import { sanitizarNombreArchivo } from "@/app/lib/sanitizarNombreArchivo";

const TIPOS_FORMATO = ["docx", "xlsx"];

function esArchivoFormato(nombreArchivo) {
  const ext = (nombreArchivo || "").split(".").pop()?.toLowerCase();
  return TIPOS_FORMATO.includes(ext);
}

async function requireAppAdmin(supabase, user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", user.id)
    .single();
  return !!profile?.is_app_admin;
}

function rutaCarpeta(carpetaId) {
  return carpetaId ? `/dashboard/formatos/${carpetaId}` : "/dashboard/formatos";
}

// Crea una subcarpeta dentro de otra (o en la raíz, si parentId viene
// vacío). "esFormato" marca la subcarpeta como de Word/Excel con
// marcadores — si no, acepta cualquier archivo. Solo el app admin,
// porque afecta a todas las empresas a la vez.
export async function crearCarpeta(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede crear subcarpetas en la biblioteca." };
  }

  const parentId = formData.get("parent_id") || null;
  const nombre = (formData.get("nombre") || "").toString().trim();
  const esFormato = formData.get("es_formato") === "on";

  if (!nombre) return { error: "Escribe el nombre de la subcarpeta." };

  const { error } = await supabase.from("formatos_carpeta").insert({
    parent_id: parentId,
    nombre,
    es_formato: esFormato,
    orden: Date.now() % 100000,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(rutaCarpeta(parentId));
  return { success: true };
}

export async function renombrarCarpeta(id, nuevoNombre, parentId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede cambiar nombres en la biblioteca." };
  }

  const nombre = (nuevoNombre || "").toString().trim();
  if (!nombre) return { error: "El nombre no puede quedar vacío." };

  const { data, error } = await supabase.from("formatos_carpeta").update({ nombre }).eq("id", id).select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo guardar: no tienes permiso para editar la biblioteca." };
  }

  revalidatePath(rutaCarpeta(parentId));
  revalidatePath(rutaCarpeta(id));
  return { success: true };
}

// Cambia el orden de una subcarpeta un puesto hacia arriba o hacia
// abajo entre sus hermanas (misma carpeta padre), intercambiando su
// "orden" con la vecina. Solo el app admin.
export async function moverCarpeta(id, direccion, parentId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede reordenar la biblioteca." };
  }

  let query = supabase.from("formatos_carpeta").select("id, orden").order("orden").order("id");
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data: hermanas, error: fetchError } = await query;

  if (fetchError) {
    return { error: fetchError.message };
  }

  const indice = (hermanas || []).findIndex((c) => c.id === id);
  if (indice === -1) return { error: "No se encontró esa carpeta." };

  const vecinoIndice = direccion === "arriba" ? indice - 1 : indice + 1;
  if (vecinoIndice < 0 || vecinoIndice >= hermanas.length) {
    return { success: true }; // ya está en la punta, no hay nada que mover
  }

  const actual = hermanas[indice];
  const vecino = hermanas[vecinoIndice];

  const [{ data: d1, error: e1 }, { data: d2, error: e2 }] = await Promise.all([
    supabase.from("formatos_carpeta").update({ orden: vecino.orden }).eq("id", actual.id).select("id"),
    supabase.from("formatos_carpeta").update({ orden: actual.orden }).eq("id", vecino.id).select("id"),
  ]);

  if (e1 || e2) {
    return { error: (e1 || e2).message };
  }
  if (!d1?.length || !d2?.length) {
    return { error: "No se pudo reordenar: no tienes permiso para editar la biblioteca." };
  }

  revalidatePath(rutaCarpeta(parentId));
  return { success: true };
}

export async function deleteCarpeta(id, parentId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede borrar subcarpetas de la biblioteca." };
  }

  const { error } = await supabase.from("formatos_carpeta").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(rutaCarpeta(parentId));
  return { success: true };
}

// Sube un archivo dentro de una carpeta de la biblioteca compartida
// (una sola copia, visible para todas las empresas) — cualquier tipo
// de archivo, en cualquier carpeta. Si el archivo es Word (.docx) o
// Excel (.xlsx), automáticamente se genera la versión rellena con los
// marcadores entre paréntesis en todas las empresas (sin importar en
// qué carpeta quedó guardado); los demás tipos de archivo se guardan
// tal cual, como referencia. Solo el app admin puede subir.
export async function subirArchivoBiblioteca(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede agregar archivos a la biblioteca." };
  }

  const carpetaId = formData.get("carpeta_id");
  const file = formData.get("archivo");

  if (!carpetaId) {
    return { error: "Falta la carpeta." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const nombreOriginal = file.name || "documento";
  const ext = nombreOriginal.split(".").pop()?.toLowerCase();

  const rutaStorage = `${carpetaId}/${Date.now()}-${sanitizarNombreArchivo(nombreOriginal)}`;
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

  const { error: insertError } = await supabase.from("formatos_archivo").insert({
    carpeta_id: carpetaId,
    nombre_archivo: nombreOriginal,
    ruta_storage: rutaStorage,
    subido_por: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Si es un Word/Excel, lo genera de una vez en todas las empresas
  // (sin importar la carpeta) — no hace falta entrar empresa por
  // empresa a darle "Generar para esta empresa".
  if (esArchivoFormato(nombreOriginal)) {
    try {
      const bytes = await file.arrayBuffer();
      await generarFormatoParaTodasLasEmpresas(supabase, user.id, { nombreOriginal, ext, bytes });
    } catch {
      // No hace fallar la subida del formato en sí si esto falla.
    }
  }

  revalidatePath(rutaCarpeta(carpetaId));
  return { success: true };
}

export async function deleteArchivoBiblioteca(id, rutaStorage, carpetaId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!(await requireAppAdmin(supabase, user))) {
    return { error: "Solo el app admin puede borrar archivos de la biblioteca." };
  }

  await supabase.storage.from("formatos").remove([rutaStorage]);

  const { error } = await supabase.from("formatos_archivo").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (carpetaId) revalidatePath(rutaCarpeta(carpetaId));
  return { success: true };
}
