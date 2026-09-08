// Funciones compartidas para "rellenar" un formato (Word/Excel) con
// los datos de una empresa y guardar el resultado — las usan tanto
// app/lib/actions/plantillas.js (subir un formato propio, o generar
// uno desde la biblioteca) como app/lib/actions/formatosBiblioteca.js
// (generar automáticamente en todas las empresas al subir un formato
// nuevo a la biblioteca). No lleva "use server" propio porque no son
// acciones en sí — solo funciones de apoyo para las que sí lo son.
import JSZip from "jszip";
import { rellenarPlaceholders } from "@/app/lib/plantillasFill";
import { sanitizarNombreArchivo } from "@/app/lib/sanitizarNombreArchivo";

export const TIPOS_SOPORTADOS = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function extensionDe(nombreArchivo) {
  return (nombreArchivo || "").split(".").pop()?.toLowerCase();
}

// Abre un .docx/.xlsx (por dentro es un .zip de archivos .xml),
// reemplaza los marcadores entre paréntesis en cada .xml con los
// datos de la empresa, y devuelve el archivo final ya comprimido.
export async function rellenarArchivo(bytes, empresa) {
  const zip = await JSZip.loadAsync(bytes);
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
  return zip.generateAsync({ type: "nodebuffer" });
}

// Guarda el resultado ya relleno en el bucket "evidencias" (ruta
// "<empresa_id>/documentos/...") y registra la fila en
// documentos_generados, para que quede listado en esa empresa. No
// llama revalidatePath acá — lo hace quien invoque esta función,
// porque a veces se generan varios documentos seguidos (una empresa
// nueva, o subir un formato a la biblioteca) y no hace falta repetirlo.
export async function guardarDocumentoGenerado(supabase, { empresaId, userId, nombreOriginal, ext, buffer }) {
  const rutaStorage = `${empresaId}/documentos/${Date.now()}-${sanitizarNombreArchivo(nombreOriginal)}`;
  const { error: uploadError } = await supabase.storage
    .from("evidencias")
    .upload(rutaStorage, buffer, { contentType: TIPOS_SOPORTADOS[ext] });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("documentos_generados").insert({
    empresa_id: empresaId,
    nombre_archivo: nombreOriginal,
    ruta_storage: rutaStorage,
    subido_por: userId,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true };
}

// Cuando se sube un formato NUEVO a la biblioteca compartida, genera
// de una vez la versión rellena en TODAS las empresas de la
// plataforma (no hay que entrar empresa por empresa a darle
// "Generar"). Es "best effort": si una empresa puntual falla, sigue
// con las demás — nunca hace fallar la subida del formato en sí.
export async function generarFormatoParaTodasLasEmpresas(supabase, userId, { nombreOriginal, ext, bytes }) {
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, razon_social, nit, numero_vehiculos, numero_trabajadores, nivel_riesgo_arl");

  for (const empresa of empresas || []) {
    try {
      const buffer = await rellenarArchivo(bytes, empresa);
      await guardarDocumentoGenerado(supabase, {
        empresaId: empresa.id,
        userId,
        nombreOriginal,
        ext,
        buffer,
      });
    } catch {
      // Sigue con las demás empresas aunque una falle.
    }
  }
}

// Cuando se crea una empresa NUEVA, genera de una vez la versión
// rellena de TODOS los formatos que ya existan en la biblioteca
// compartida. También "best effort".
export async function generarBibliotecaParaEmpresa(supabase, userId, empresa) {
  const { data: carpetas } = await supabase
    .from("formatos_carpeta")
    .select("id")
    .eq("es_formato", true);

  const idsCarpetas = (carpetas || []).map((c) => c.id);
  if (idsCarpetas.length === 0) return;

  const { data: archivos } = await supabase
    .from("formatos_archivo")
    .select("nombre_archivo, ruta_storage")
    .in("carpeta_id", idsCarpetas);

  for (const archivo of archivos || []) {
    const ext = extensionDe(archivo.nombre_archivo);
    if (!TIPOS_SOPORTADOS[ext]) continue;
    try {
      const { data: descarga } = await supabase.storage.from("formatos").download(archivo.ruta_storage);
      if (!descarga) continue;
      const bytes = await descarga.arrayBuffer();
      const buffer = await rellenarArchivo(bytes, empresa);
      await guardarDocumentoGenerado(supabase, {
        empresaId: empresa.id,
        userId,
        nombreOriginal: archivo.nombre_archivo,
        ext,
        buffer,
      });
    } catch {
      // Sigue con los demás archivos aunque uno falle.
    }
  }
}
