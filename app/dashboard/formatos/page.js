import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";

export const dynamic = "force-dynamic";

const BANNER_STYLES = [
  "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
  "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
  "linear-gradient(135deg, #059669 0%, #065f46 100%)",
  "linear-gradient(135deg, #0891b2 0%, #155e75 100%)",
];

export default async function BibliotecaFormatosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categorias } = await supabase
    .from("formatos_categoria")
    .select("id, orden, nombre")
    .order("orden");

  return (
    <div className="page-body">
      <Link href="/dashboard" className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
        <ArrowLeftIcon size={14} /> Mis empresas
      </Link>
      <h1 className="icon-heading"><LayersIcon size={26} /> Biblioteca de formatos</h1>
      <p className="page-intro">
        Una sola carpeta, igual para todas las empresas. Entra a una
        categoría para ver sus subcarpetas de Documentos y Formatos.
      </p>

      <div className="group-card-grid">
        {(categorias || []).map((cat, i) => (
          <Link key={cat.id} href={`/dashboard/formatos/${cat.id}`} className="group-card">
            <div className="group-card-banner" style={{ background: BANNER_STYLES[i % BANNER_STYLES.length] }}>
              <span className="group-card-initial">{cat.orden}</span>
              <LayersIcon size={20} className="group-card-icon" />
            </div>
            <div className="group-card-body">
              <strong>{cat.nombre}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
