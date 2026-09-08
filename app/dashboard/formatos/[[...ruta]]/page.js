import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";
import CarpetaClient from "./CarpetaClient";

export const dynamic = "force-dynamic";

export default async function CarpetaFormatosPage({ params }) {
  const ruta = params.ruta || [];
  const carpetaId = ruta.length > 0 ? ruta[ruta.length - 1] : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subcarpetasQuery = carpetaId
    ? supabase.from("formatos_carpeta").select("id, nombre, es_formato").eq("parent_id", carpetaId).order("orden")
    : supabase.from("formatos_carpeta").select("id, nombre, es_formato").is("parent_id", null).order("orden");

  const [{ data: profile }, { data: carpeta }, { data: subcarpetas }, { data: archivos }] = await Promise.all([
    supabase.from("profiles").select("is_app_admin").eq("id", user.id).single(),
    carpetaId
      ? supabase.from("formatos_carpeta").select("id, nombre, es_formato, parent_id").eq("id", carpetaId).single()
      : Promise.resolve({ data: null }),
    subcarpetasQuery,
    carpetaId
      ? supabase
          .from("formatos_archivo")
          .select("id, nombre_archivo, ruta_storage, created_at")
          .eq("carpeta_id", carpetaId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  if (carpetaId && !carpeta) notFound();

  const rutas = (archivos || []).map((a) => a.ruta_storage);
  let urlPorRuta = {};
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage.from("formatos").createSignedUrls(rutas, 600);
    (firmadas || []).forEach((f) => {
      if (f?.signedUrl) urlPorRuta[f.path] = f.signedUrl;
    });
  }
  const archivosConUrl = (archivos || []).map((a) => ({ ...a, url: urlPorRuta[a.ruta_storage] }));

  const volverA = ruta.length > 1 ? `/dashboard/formatos/${ruta.slice(0, -1).join("/")}` : "/dashboard/formatos";
  let volverLabel = ruta.length === 0 ? "Mis empresas" : "Biblioteca de formatos";
  if (ruta.length > 1 && carpeta?.parent_id) {
    const { data: padre } = await supabase.from("formatos_carpeta").select("nombre").eq("id", carpeta.parent_id).single();
    if (padre) volverLabel = padre.nombre;
  }

  return (
    <div className="page-body">
      <Link href={ruta.length === 0 ? "/dashboard" : volverA} className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
        <ArrowLeftIcon size={14} /> {volverLabel}
      </Link>
      <h1 className="icon-heading"><LayersIcon size={26} /> {carpeta ? carpeta.nombre : "Biblioteca de formatos"}</h1>
      {!carpeta && (
        <p className="page-intro">
          Una sola biblioteca de carpetas, igual para todas las
          empresas. Entra a una carpeta para ver sus subcarpetas y
          archivos.
        </p>
      )}
      {carpeta && (
        <p className="page-intro">
          Cualquier tipo de archivo. Si subes un Word (.docx) o Excel
          (.xlsx) con marcadores entre paréntesis — por ejemplo "(aquí
          va el nombre de la empresa)" o "(aquí va el NIT)" — se genera
          automáticamente la versión rellena en todas las empresas.
        </p>
      )}

      <CarpetaClient
        carpetaId={carpetaId}
        nombreActual={carpeta?.nombre}
        rutaSegmentos={ruta}
        subcarpetas={subcarpetas || []}
        archivos={archivosConUrl}
        isAppAdmin={!!profile?.is_app_admin}
      />
    </div>
  );
}
