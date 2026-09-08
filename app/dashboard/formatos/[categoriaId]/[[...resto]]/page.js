import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayersIcon, ArrowLeftIcon } from "@/app/dashboard/Icons";
import SubcategoriasClient from "./SubcategoriasClient";
import ArchivosClient from "./ArchivosClient";

export const dynamic = "force-dynamic";

const NOMBRES_SUBCARPETA = { documentos: "Documentos", formatos: "Formatos" };
const BANNERS_SUBCARPETA = {
  documentos: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  formatos: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
};

function CarpetaCard({ href, label, sub, banner }) {
  return (
    <Link href={href} className="group-card">
      <div className="group-card-banner" style={{ background: banner }}>
        <LayersIcon size={20} className="group-card-icon" />
      </div>
      <div className="group-card-body">
        <strong>{label}</strong>
        {sub && <span className="muted small">{sub}</span>}
      </div>
    </Link>
  );
}

export default async function FormatosNivelPage({ params }) {
  const { categoriaId } = params;
  const resto = params.resto || [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: categoria }] = await Promise.all([
    supabase.from("profiles").select("is_app_admin").eq("id", user.id).single(),
    supabase.from("formatos_categoria").select("id, orden, nombre").eq("id", categoriaId).single(),
  ]);
  if (!categoria) notFound();
  const isAppAdmin = !!profile?.is_app_admin;

  // Nivel 0: dentro de la categoría — subcategorías (si existen) o
  // directo las subcarpetas Documentos/Formatos.
  if (resto.length === 0) {
    const { data: subcategorias } = await supabase
      .from("formatos_subcategoria")
      .select("id, orden, nombre")
      .eq("categoria_id", categoriaId)
      .order("orden");

    return (
      <div className="page-body">
        <Link href="/dashboard/formatos" className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
          <ArrowLeftIcon size={14} /> Biblioteca de formatos
        </Link>
        <h1 className="icon-heading"><LayersIcon size={26} /> {categoria.orden}. {categoria.nombre}</h1>

        {subcategorias && subcategorias.length > 0 ? (
          <>
            <p className="page-intro">Elige una subcarpeta.</p>
            <SubcategoriasClient categoriaId={categoria.id} subcategorias={subcategorias} isAppAdmin={isAppAdmin} />
          </>
        ) : (
          <>
            <p className="page-intro">Elige "Documentos" o "Formatos".</p>
            <div className="group-card-grid">
              <CarpetaCard
                href={`/dashboard/formatos/${categoria.id}/documentos`}
                label="Documentos"
                sub="Cualquier tipo de archivo."
                banner={BANNERS_SUBCARPETA.documentos}
              />
              <CarpetaCard
                href={`/dashboard/formatos/${categoria.id}/formatos`}
                label="Formatos"
                sub="Word/Excel con marcadores."
                banner={BANNERS_SUBCARPETA.formatos}
              />
            </div>
            {isAppAdmin && (
              <section className="section-card">
                <h2>¿Necesitas subcarpetas propias aquí (ej. "Planeación", "Comercial")?</h2>
                <SubcategoriasClient categoriaId={categoria.id} subcategorias={[]} isAppAdmin soloFormulario />
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  // Nivel 1: un solo segmento — o es "documentos"/"formatos" (directo
  // bajo la categoría), o es el id de una subcategoría.
  if (resto.length === 1) {
    const seg = resto[0];

    if (NOMBRES_SUBCARPETA[seg]) {
      return renderArchivos({ supabase, categoria, subcategoria: null, subcarpeta: seg, isAppAdmin, volverA: `/dashboard/formatos/${categoria.id}`, volverLabel: `${categoria.orden}. ${categoria.nombre}` });
    }

    const { data: subcategoria } = await supabase
      .from("formatos_subcategoria")
      .select("id, orden, nombre")
      .eq("id", seg)
      .single();
    if (!subcategoria) notFound();

    return (
      <div className="page-body">
        <Link href={`/dashboard/formatos/${categoria.id}`} className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
          <ArrowLeftIcon size={14} /> {categoria.orden}. {categoria.nombre}
        </Link>
        <h1 className="icon-heading"><LayersIcon size={26} /> {subcategoria.nombre}</h1>
        <p className="page-intro">Elige "Documentos" o "Formatos".</p>

        <div className="group-card-grid">
          <CarpetaCard
            href={`/dashboard/formatos/${categoria.id}/${subcategoria.id}/documentos`}
            label="Documentos"
            sub="Cualquier tipo de archivo."
            banner={BANNERS_SUBCARPETA.documentos}
          />
          <CarpetaCard
            href={`/dashboard/formatos/${categoria.id}/${subcategoria.id}/formatos`}
            label="Formatos"
            sub="Word/Excel con marcadores."
            banner={BANNERS_SUBCARPETA.formatos}
          />
        </div>
      </div>
    );
  }

  // Nivel 2: subcategoría + subcarpeta.
  if (resto.length === 2) {
    const [subcategoriaId, subcarpeta] = resto;
    if (!NOMBRES_SUBCARPETA[subcarpeta]) notFound();

    const { data: subcategoria } = await supabase
      .from("formatos_subcategoria")
      .select("id, orden, nombre")
      .eq("id", subcategoriaId)
      .single();
    if (!subcategoria) notFound();

    return renderArchivos({
      supabase,
      categoria,
      subcategoria,
      subcarpeta,
      isAppAdmin,
      volverA: `/dashboard/formatos/${categoria.id}/${subcategoria.id}`,
      volverLabel: subcategoria.nombre,
    });
  }

  notFound();
}

async function renderArchivos({ supabase, categoria, subcategoria, subcarpeta, isAppAdmin, volverA, volverLabel }) {
  let query = supabase
    .from("formatos_plantilla")
    .select("id, nombre_archivo, ruta_storage, created_at")
    .eq("categoria_id", categoria.id)
    .eq("subcarpeta", subcarpeta);
  query = subcategoria ? query.eq("subcategoria_id", subcategoria.id) : query.is("subcategoria_id", null);

  const { data: plantillas } = await query.order("created_at", { ascending: false });

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
      <Link href={volverA} className="top-bar-link" style={{ padding: "6px 0", marginBottom: 8 }}>
        <ArrowLeftIcon size={14} /> {volverLabel}
      </Link>
      <h1 className="icon-heading"><LayersIcon size={26} /> {NOMBRES_SUBCARPETA[subcarpeta]}</h1>
      <p className="page-intro">
        {subcarpeta === "formatos"
          ? 'Word (.docx) o Excel (.xlsx) con marcadores entre paréntesis, por ejemplo "(aquí va el nombre de la empresa)" o "(aquí va el NIT)". Desde la pantalla "Formatos" de cada empresa se genera la versión rellena.'
          : "Cualquier tipo de archivo — se descarga tal cual, sin rellenar marcadores."}
      </p>

      <ArchivosClient
        categoriaId={categoria.id}
        subcategoriaId={subcategoria?.id || null}
        subcarpeta={subcarpeta}
        plantillas={plantillasConUrl}
        isAppAdmin={isAppAdmin}
      />
    </div>
  );
}
