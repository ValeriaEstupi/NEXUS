"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";
import { rellenarArchivo, guardarDocumentoGenerado, extensionDe, TIPOS_SOPORTADOS } from "@/app/lib/documentoFill";

// Sube un formato propio (Word o Excel) con marcadores entre
// paréntesis y devuelve, ya guardado, el mismo archivo relleno con
// los datos de esta empresa.
export async function generarDocumento(formData) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  const empresaId = formData.get("empresa_id");
  const file = formData.get("archivo");

  if (!empresaId) {
    return { error: "Falta la empresa." };
  }
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const nombreOriginal = file.name || "documento";
  const ext = extensionDe(nombreOriginal);
  if (!TIPOS_SOPORTADOS[ext]) {
    return { error: "Por ahora solo se pueden rellenar formatos de Word (.docx) o Excel (.xlsx)." };
  }

  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("razon_social, nit, numero_vehiculos, numero_trabajadores, nivel_riesgo_arl")
    .eq("id", empresaId)
    .single();

  if (empresaError || !empresa) {
    return { error: "No se pudo leer la información de la empresa." };
  }

  let buffer;
  try {
    const bytes = await file.arrayBuffer();
    buffer = await rellenarArchivo(bytes, empresa);
  } catch {
    return { error: "No se pudo abrir el archivo. ¿Es un .docx/.xlsx real (no un archivo renombrado)?" };
  }

  const res = await guardarDocumentoGenerado(supabase, { empresaId, userId: user.id, nombreOriginal, ext, buffer });
  if (!res.error) revalidatePath(`/dashboard/empresas/${empresaId}/documentos`);
  return res;
}

// Genera, para una empresa puntual, la versión rellena de un archivo
// de la biblioteca compartida (ver formatosBiblioteca.js).
export async function generarDesdeBiblioteca(archivoId, empresaId) {
  const supabase = createClient();
  const user = await requireUser(supabase);

  if (!archivoId || !empresaId) {
    return { error: "Falta el archivo o la empresa." };
  }

  const [{ data: plantilla, error: plantillaError }, { data: empresa, error: empresaError }] = await Promise.all([
    supabase.from("formatos_archivo").select("nombre_archivo, ruta_storage").eq("id", archivoId).single(),
    supabase
      .from("empresas")
      .select("razon_social, nit, numero_vehiculos, numero_trabajadores, nivel_riesgo_arl")
      .eq("id", empresaId)
      .single(),
  ]);

  if (plantillaError || !plantilla) {
    return { error: "No se encontró ese archivo en la biblioteca." };
  }
  if (empresaError || !empresa) {
    return { error: "No se pudo leer la información de la empresa." };
  }

  const ext = extensionDe(plantilla.nombre_archivo);
  if (!TIPOS_SOPORTADOS[ext]) {
    return { error: "Ese archivo de la biblioteca no es un .docx/.xlsx soportado." };
  }

  const { data: descarga, error: descargaError } = await supabase.storage
    .from("formatos")
    .download(plantilla.ruta_storage);

  if (descargaError || !descarga) {
    return { error: descargaError?.message || "No se pudo descargar la plantilla de la biblioteca." };
  }

  let buffer;
  try {
    const bytes = await descarga.arrayBuffer();
    buffer = await rellenarArchivo(bytes, empresa);
  } catch {
    return { error: "No se pudo procesar esa plantilla — puede estar dañada." };
  }

  const res = await guardarDocumentoGenerado(supabase, {
    empresaId,
    userId: user.id,
    nombreOriginal: plantilla.nombre_archivo,
    ext,
    buffer,
  });
  if (!res.error) revalidatePath(`/dashboard/empresas/${empresaId}/documentos`);
  return res;
}

// Enlace de descarga temporal (10 minutos) para un documento generado
// — igual que las evidencias, nunca queda público de forma permanente.
export async function getDocumentoUrl(rutaStorage) {
  const supabase = createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.storage
    .from("evidencias")
    .createSignedUrl(rutaStorage, 60 * 10);

  if (error) {
    return { error: error.message };
  }
  return { url: data.signedUrl };
}

export async function deleteDocumentoGenerado(id, rutaStorage, empresaId) {
  const supabase = createClient();
  await requireUser(supabase);

  await supabase.storage.from("evidencias").remove([rutaStorage]);

  const { error } = await supabase.from("documentos_generados").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (empresaId) revalidatePath(`/dashboard/empresas/${empresaId}/documentos`);
  return { success: true };
}
