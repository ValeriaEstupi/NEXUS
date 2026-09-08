import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";
import SubcarpetaClient from "./SubcarpetaClient";

export const dynamic = "force-dynamic";

const NOMBRES = { documentos: "Documentos", formatos: "Formatos" };

export default async function SubcarpetaPage({ params }) {
  const { categoriaId, subcarpeta } = params;
  if (!NOMBRES[subcarpeta]) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: categoria }, { data: plantillas }] = await Promise.all([
    supabase.from("profiles").select("is_app_admin").eq("id", user.id).single(),
    supabase.from("formatos_categoria").select("id, orden, nombre").eq("id", categoriaId).single(),
    supabase
      .from("formatos_plantilla")
      .select("id, nombre_archivo, ruta_storage, created_at")
      .eq("categoria_id", categoriaId)
      .eq("subcarpeta", subcarpeta)
      .order("created_at", { ascending: false }),
  ]);

  if (!categoria) notFound();

  const rutas = (plantillas || []).map((p) => p.ruta_storage);
  let urlPorRuta = {};
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage.from("formatos").createSignedUrls(rutas, 600);
    (firmadas || []).forEach((f) => {
      if (f?.signedUrl) urlPorRuta[f.path] = f.signedUrl;
    });
  }
  const plantillasConUrl = (plantillas || []).map((p) => ({ ...p, url: urlPorRuta[p.ruta_storage] }));

  return (
    <div className="page-body">
      <Link href={`/dashboard/formatos/${categoriaId}`} className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
        <ArrowLeftIcon size={14} /> {categoria.orden}. {categoria.nombre}
      </Link>
      <h1 className="icon-heading"><LayersIcon size={26} /> {NOMBRES[subcarpeta]}</h1>
      <p className="page-intro">
        {subcarpeta === "formatos"
          ? "Word (.docx) o Excel (.xlsx) con marcadores entre paréntesis, por ejemplo \"(aquí va el nombre de la empresa)\" o \"(aquí va el NIT)\". Desde la pantalla \"Formatos\" de cada empresa se genera la versión rellena."
          : "Cualquier tipo de archivo — se descarga tal cual, sin rellenar marcadores."}
      </p>

      <SubcarpetaClient
        categoriaId={categoriaId}
        subcarpeta={subcarpeta}
        plantillas={plantillasConUrl}
        isAppAdmin={!!profile?.is_app_admin}
      />
    </div>
  );
}
