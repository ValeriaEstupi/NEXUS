import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import Link from "next/link";
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

  const [{ canEdit }, { data: documentos }, { data: carpetas }, { data: archivos }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase
      .from("documentos_generados")
      .select("id, nombre_archivo, ruta_storage, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false }),
    // Consultas planas aparte (no anidadas) — evita depender de que
    // Supabase resuelva bien una relación anidada.
    supabase.from("formatos_carpeta").select("id, nombre"),
    supabase.from("formatos_archivo").select("id, carpeta_id, nombre_archivo").order("nombre_archivo"),
  ]);

  // Solo Word/Excel se pueden rellenar — cualquier otro tipo de
  // archivo de la biblioteca (PDF, imágenes...) queda fuera de esta
  // lista, sin importar en qué carpeta esté.
  const nombreCarpeta = {};
  (carpetas || []).forEach((c) => {
    nombreCarpeta[c.id] = c.nombre;
  });
  const archivosRellenables = (archivos || []).filter((a) => /\.(docx|xlsx)$/i.test(a.nombre_archivo));
  const archivosPorCarpeta = {};
  archivosRellenables.forEach((a) => {
    const nombre = nombreCarpeta[a.carpeta_id] || "Otros";
    if (!archivosPorCarpeta[nombre]) archivosPorCarpeta[nombre] = [];
    archivosPorCarpeta[nombre].push(a);
  });
  const carpetasConArchivos = Object.entries(archivosPorCarpeta).map(([nombre, items]) => ({
    id: nombre,
    nombre,
    archivos: items,
  }));

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
        Genera el formato ya lleno con los datos de esta empresa a
        partir de la <Link href="/dashboard/formatos">biblioteca compartida</Link>,
        o sube tu propio Word/Excel con marcadores entre paréntesis
        (por ejemplo, "(aquí va el nombre de la empresa)" o "(aquí va el
        NIT)").
      </p>

      <div className="disclaimer-box">
        ⚖️ Marcadores que reconoce por ahora: nombre de la empresa, NIT,
        número de vehículos, número de trabajadores, nivel de riesgo ARL
        y fecha. Cualquier otro paréntesis del documento se deja tal cual
        — no toca el resto del texto ni el diseño del archivo.
      </div>

      <DocumentosClient
        empresaId={empresaId}
        documentos={documentosConUrl}
        canEdit={canEdit}
        carpetasFormato={carpetasConArchivos}
      />
    </div>
  );
}
