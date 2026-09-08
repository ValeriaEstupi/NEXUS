import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import { LayersIcon } from "@/app/dashboard/Icons";
import DocumentosClient from "./DocumentosClient";

export const dynamic = "force-dynamic";

export default async function DocumentosPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit }, { data: documentos }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase
      .from("documentos_generados")
      .select("id, nombre_archivo, ruta_storage, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false }),
  ]);

  const rutas = (documentos || []).map((d) => d.ruta_storage);
  let urlPorRuta = {};
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage.from("evidencias").createSignedUrls(rutas, 600);
    (firmadas || []).forEach((f) => {
      if (f?.signedUrl) urlPorRuta[f.path] = f.signedUrl;
    });
  }
  const documentosConUrl = (documentos || []).map((d) => ({ ...d, url: urlPorRuta[d.ruta_storage] }));

  return (
    <div className="page-body">
      <h1 className="icon-heading"><LayersIcon size={26} /> Formatos</h1>
      <p className="page-intro">
        Sube un formato de Word o Excel con marcadores entre paréntesis
        (por ejemplo, "(aquí va el nombre de la empresa)" o "(aquí va el
        NIT)") y te devolvemos el mismo archivo con esos marcadores ya
        reemplazados por los datos de esta empresa.
      </p>

      <div className="disclaimer-box">
        ⚖️ Marcadores que reconoce por ahora: nombre de la empresa, NIT,
        número de vehículos, número de trabajadores, nivel de riesgo ARL
        y fecha. Cualquier otro paréntesis del documento se deja tal cual
        — no toca el resto del texto ni el diseño del archivo.
      </div>

      <DocumentosClient empresaId={empresaId} documentos={documentosConUrl} canEdit={canEdit} />
    </div>
  );
}
