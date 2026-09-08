"use server";

import { revalidatePath } from "next/cache";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./_shared";
import { rellenarPlaceholders } from "@/app/lib/plantillasFill";

const TIPOS_SOPORTADOS = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Sube un formato (Word o Excel) con marcadores entre paréntesis
// (ej. "(aquí va el nombre de la empresa)") y devuelve, ya guardado,
// el mismo archivo con esos marcadores reemplazados por los datos
// reales de la empresa. Un .docx/.xlsx es, por dentro, un .zip con
// varios archivos .xml — se abre, se reemplaza el texto en cada uno
// y se vuelve a comprimir, sin tocar el resto del formato/diseño.
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
  const ext = nombreOriginal.split(".").pop()?.toLowerCase();
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

  let zip;
  try {
    const bytes = await file.arrayBuffer();
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return { error: "No se pudo abrir el archivo. ¿Es un .docx/.xlsx real (no un archivo renombrado)?" };
  }

  const nombresXml = Object.keys(zip.files).filter((n) => n.endsWith(".xml"));
  for (const nombre of nombresXml) {
    const entry = zip.files[nombre];
    if (entry.dir) continue;
    const contenido = await entry.async("string");
    const relleno = rellenarPlaceholders(contenido, empresa);
    if (relleno !== contenido) {
      zip.file(nombre, relleno);
    }
  }

  const bufferFinal = await zip.generateAsync({ type: "nodebuffer" });

  const rutaStorage = `${empresaId}/documentos/${Date.now()}-${nombreOriginal}`;
  const { error: uploadError } = await supabase.storage
    .from("evidencias")
    .upload(rutaStorage, bufferFinal, { contentType: TIPOS_SOPORTADOS[ext] });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("documentos_generados").insert({
    empresa_id: empresaId,
    nombre_archivo: nombreOriginal,
    ruta_storage: rutaStorage,
    subido_por: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/empresas/${empresaId}/documentos`);
  return { success: true };
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
