import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withSignedUrls } from "@/app/lib/evidencias";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import ChecklistItem from "@/app/dashboard/ChecklistItem";
import AddRequisitoIsoForm from "./AddRequisitoIsoForm";

// Componente compartido por las 3 pantallas de ISO (9001, 14001,
// 45001) — cada una es un archivo de ruta aparte (iso-9001/page.js,
// etc.) que solo le pasa el código de su norma. Vive en una carpeta
// que empieza con "_" para que Next.js no la trate como una ruta.
export default async function IsoNormaPage({ empresaId, normaCodigo, icono, disclaimer }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: norma }, { data: fases }, { data: requisitos }, { data: profiles }] =
    await Promise.all([
      getEmpresaRole(supabase, empresaId, user.id),
      supabase.from("normas_iso").select("id, codigo, nombre").eq("codigo", normaCodigo).single(),
      supabase.from("fases_phva").select("id, orden, nombre").order("orden"),
      supabase
        .from("requisitos_iso")
        .select(
          "id, norma_id, fase_id, codigo, descripcion, orden, activo, cumplimiento_items(id, estado, responsable_id, fecha_limite, observaciones, evidencias(id, nombre_archivo, ruta_storage))"
        )
        .eq("empresa_id", empresaId)
        .order("orden"),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);

  if (!norma) {
    return (
      <div className="page-body">
        <p className="empty-state">
          Esta empresa todavía no tiene el catálogo de normas ISO cargado —
          corre la migración 004 en Supabase (ver README) y recarga.
        </p>
      </div>
    );
  }

  const itemsDeEstaNorma = (requisitos || []).filter((r) => r.norma_id === norma.id);
  const flatItems = itemsDeEstaNorma.map((r) => ({
    ...r.cumplimiento_items?.[0],
    _requisito: r,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  const activos = withUrls.filter((i) => i._requisito.activo);
  const aplicables = activos.filter((i) => i.estado !== "no_aplica");
  const cumplidos = aplicables.filter((i) => i.estado === "cumplido");
  const porcentaje = aplicables.length > 0 ? Math.round((cumplidos.length / aplicables.length) * 100) : 0;

  // Se necesita la lista completa de normas para el selector del
  // formulario de "Editar requisito" dentro de ChecklistItem.
  const { data: normas } = await supabase.from("normas_iso").select("id, codigo, nombre").order("orden");

  return (
    <div className="page-body">
      <h1>{icono} {norma.nombre}</h1>
      <p className="page-intro">
        Checklist organizado por el ciclo PHVA (cláusulas 4-6 = Planear,
        7-8 = Hacer, 9 = Verificar, 10 = Actuar).
      </p>

      <div className="disclaimer-box">⚖️ {disclaimer}</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Avance {norma.codigo}</div>
          <div className="stat-value">{porcentaje}%</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      </div>

      <section className="section-card">
        <h2>Requisitos</h2>
        {withUrls.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Requisito</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Fecha límite</th>
                  <th>Evidencia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {withUrls.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    meta={{
                      tipo: "iso",
                      id: item._requisito.id,
                      codigo: item._requisito.codigo,
                      descripcion: item._requisito.descripcion,
                      normaId: item._requisito.norma_id,
                      faseId: item._requisito.fase_id,
                      activo: item._requisito.activo,
                    }}
                    profiles={profiles || []}
                    normas={normas || []}
                    fases={fases || []}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    empresaId={empresaId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay requisitos en esta norma.</p>
        )}

        {canEdit && <AddRequisitoIsoForm empresaId={empresaId} normaId={norma.id} fases={fases || []} />}
      </section>
    </div>
  );
}
