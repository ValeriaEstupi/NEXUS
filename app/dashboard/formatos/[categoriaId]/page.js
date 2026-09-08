import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";

export const dynamic = "force-dynamic";

const SUBCARPETAS = [
  { valor: "documentos", label: "Documentos", nota: "Cualquier tipo de archivo — se descarga tal cual.", banner: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)" },
  { valor: "formatos", label: "Formatos", nota: "Word/Excel con marcadores — se puede generar la versión rellena por empresa.", banner: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)" },
];

export default async function CategoriaPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categoria } = await supabase
    .from("formatos_categoria")
    .select("id, orden, nombre")
    .eq("id", params.categoriaId)
    .single();

  if (!categoria) notFound();

  return (
    <div className="page-body">
      <Link href="/dashboard/formatos" className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
        <ArrowLeftIcon size={14} /> Biblioteca de formatos
      </Link>
      <h1 className="icon-heading"><LayersIcon size={26} /> {categoria.orden}. {categoria.nombre}</h1>
      <p className="page-intro">Elige una subcarpeta.</p>

      <div className="group-card-grid">
        {SUBCARPETAS.map((sub) => (
          <Link key={sub.valor} href={`/dashboard/formatos/${categoria.id}/${sub.valor}`} className="group-card">
            <div className="group-card-banner" style={{ background: sub.banner }}>
              <LayersIcon size={20} className="group-card-icon" />
            </div>
            <div className="group-card-body">
              <strong>{sub.label}</strong>
              <span className="muted small">{sub.nota}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
