import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";
import CarpetaEmpresaClient from "./CarpetaEmpresaClient";

export const dynamic = "force-dynamic";

// Cada empresa navega la MISMA biblioteca de carpetas (ver
// /dashboard/formatos) — no crea su propia estructura, solo "engrana"
// con la de la biblioteca. Lo único propio de cada empresa es, por
// archivo, si ya se generó (o no) su versión rellena.
export default async function DocumentosEmpresaPage({ params }) {
  const empresaId = params.id;
  const ruta = params.ruta || [];
  const carpetaId = ruta.length > 0 ? ruta[ruta.length - 1] : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { canEdit } = await getEmpresaRole(supabase, empresaId, user.id);

  const subcarpetasQuery = carpetaId
    ? supabase.from("formatos_carpeta").select("id, nombre").eq("parent_id", carpetaId).order("orden")
    : supabase.from("formatos_carpeta").select("id, nombre").is("parent_id", null).order("orden");

  const [{ data: carpeta }, { data: subcarpetas }, { data: archivos }] = await Promise.all([
    carpetaId
      ? supabase.from("formatos_carpeta").select("id, nombre, parent_id").eq("id", carpetaId).single()
      : Promise.resolve({ data: null }),
    subcarpetasQuery,
    carpetaId
      ? supabase
          .from("formatos_archivo")
          .select("id, nombre_archivo, ruta_storage, created_at")
          .eq("carpeta_id", carpetaId)
          .order("nombre_archivo")
      : Promise.resolve({ data: [] }),
  ]);

  if (carpetaId && !carpeta) notFound();

  // Consultas planas aparte (no anidadas) — evita depender de que
  // Supabase resuelva bien una relación anidada.
  const archivoIds = (archivos || []).map((a) => a.id);
  let generadoPorArchivo = {};
  if (archivoIds.length > 0) {
    const { data: generados } = await supabase
      .from("documentos_generados")
      .select("id, ruta_storage, origen_archivo_id, created_at")
      .eq("empresa_id", empresaId)
      .in("origen_archivo_id", archivoIds);
    (generados || []).forEach((g) => {
      generadoPorArchivo[g.origen_archivo_id] = g;
    });
  }

  const rutasGeneradas = Object.values(generadoPorArchivo).map((g) => g.ruta_storage);
  const rutasOriginales = (archivos || [])
    .filter((a) => !/\.(docx|xlsx)$/i.test(a.nombre_archivo))
    .map((a) => a.ruta_storage);

  let urlGeneradas = {};
  let urlOriginales = {};
  if (rutasGeneradas.length > 0) {
    const { data } = await supabase.storage.from("evidencias").createSignedUrls(rutasGeneradas, 600);
    (data || []).forEach((f) => {
      if (f?.signedUrl) urlGeneradas[f.path] = f.signedUrl;
    });
  }
  if (rutasOriginales.length > 0) {
    const { data } = await supabase.storage.from("formatos").createSignedUrls(rutasOriginales, 600);
    (data || []).forEach((f) => {
      if (f?.signedUrl) urlOriginales[f.path] = f.signedUrl;
    });
  }

  const archivosConEstado = (archivos || []).map((a) => {
    const esRellenable = /\.(docx|xlsx)$/i.test(a.nombre_archivo);
    const generado = generadoPorArchivo[a.id];
    return {
      ...a,
      esRellenable,
      generado: generado ? { ...generado, url: urlGeneradas[generado.ruta_storage] } : null,
      urlOriginal: !esRellenable ? urlOriginales[a.ruta_storage] : null,
    };
  });

  // Solo en la raíz: documentos sueltos (subidos a mano, no ligados a
  // ningún archivo de la biblioteca) + el formulario para subir uno.
  let documentosSueltos = [];
  if (ruta.length === 0) {
    const { data: sueltos } = await supabase
      .from("documentos_generados")
      .select("id, nombre_archivo, ruta_storage, created_at")
      .eq("empresa_id", empresaId)
      .is("origen_archivo_id", null)
      .order("created_at", { ascending: false });
    const rutasSueltas = (sueltos || []).map((d) => d.ruta_storage);
    let urlSueltas = {};
    if (rutasSueltas.length > 0) {
      const { data: firmadas } = await supabase.storage.from("evidencias").createSignedUrls(rutasSueltas, 600);
      (firmadas || []).forEach((f) => {
        if (f?.signedUrl) urlSueltas[f.path] = f.signedUrl;
      });
    }
    documentosSueltos = (sueltos || []).map((d) => ({ ...d, url: urlSueltas[d.ruta_storage] }));
  }

  const volverA =
    ruta.length > 1
      ? `/dashboard/empresas/${empresaId}/documentos/${ruta.slice(0, -1).join("/")}`
      : `/dashboard/empresas/${empresaId}/documentos`;
  let volverLabel = ruta.length === 0 ? "Volver a la empresa" : "Formatos";
  if (ruta.length > 1 && carpeta?.parent_id) {
    const { data: padre } = await supabase.from("formatos_carpeta").select("nombre").eq("id", carpeta.parent_id).single();
    if (padre) volverLabel = padre.nombre;
  }

  return (
    <div className="page-body">
      <Link
        href={ruta.length === 0 ? `/dashboard/empresas/${empresaId}` : volverA}
        className="top-bar-link"
        style={{ padding: "6px 0", marginBottom: 8 }}
      >
        <ArrowLeftIcon size={14} /> {volverLabel}
      </Link>
      <h1 className="icon-heading">
        <LayersIcon size={26} /> {carpeta ? carpeta.nombre : "Formatos"}
      </h1>
      {ruta.length === 0 && (
        <p className="page-intro">
          La misma biblioteca de carpetas de{" "}
          <Link href="/dashboard/formatos">todas las empresas</Link>. Entra
          a una carpeta y dale "Generar" a cada Word/Excel para tener la
          versión ya llena con los datos de esta empresa.
        </p>
      )}

      <CarpetaEmpresaClient
        empresaId={empresaId}
        rutaSegmentos={ruta}
        subcarpetas={subcarpetas || []}
        archivos={archivosConEstado}
        canEdit={canEdit}
        documentosSueltos={documentosSueltos}
        mostrarSueltos={ruta.length === 0}
      />
    </div>
  );
}
