import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon } from "@/app/dashboard/Icons";
import BibliotecaClient from "./BibliotecaClient";

export const dynamic = "force-dynamic";

export default async function BibliotecaFormatosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: categorias }, { data: plantillas }] = await Promise.all([
    supabase.from("profiles").select("is_app_admin").eq("id", user.id).single(),
    supabase.from("formatos_categoria").select("id, orden, nombre").order("orden"),
    supabase
      .from("formatos_plantilla")
      .select("id, categoria_id, nombre_archivo, ruta_storage, created_at")
      .order("created_at", { ascending: false }),
  ]);

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
      <h1 className="icon-heading"><LayersIcon size={26} /> Biblioteca de formatos</h1>
      <p className="page-intro">
        Una sola carpeta de formatos maestros, igual para todas las
        empresas. Desde la pantalla "Formatos" de cada empresa puedes
        generar la versión rellena con los datos de esa empresa
        puntual, a partir de cualquiera de estos.
      </p>

      <div className="disclaimer-box">
        ⚖️ Escribe los marcadores entre paréntesis en el propio texto
        del documento — por ejemplo "(aquí va el nombre de la empresa)"
        o "(aquí va el NIT)". Solo Word (.docx) y Excel (.xlsx).
      </div>

      <BibliotecaClient categorias={categorias || []} plantillas={plantillasConUrl} isAppAdmin={!!profile?.is_app_admin} />
    </div>
  );
}
