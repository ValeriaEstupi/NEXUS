import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withSignedUrls } from "@/app/lib/evidencias";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import ChecklistItem from "@/app/dashboard/ChecklistItem";
import AddRequisitoIsoForm from "./AddRequisitoIsoForm";

export const dynamic = "force-dynamic";

export default async function IsoPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: normas }, { data: fases }, { data: requisitos }, { data: profiles }] =
    await Promise.all([
      getEmpresaRole(supabase, empresaId, user.id),
      supabase.from("normas_iso").select("id, codigo, nombre, orden").order("orden"),
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

  const flatItems = (requisitos || []).map((r) => ({
    ...r.cumplimiento_items?.[0],
    _requisito: r,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  return (
    <div className="page-body">
      <h1>🏅 Sistema de Gestión ISO 9001 · 14001 · 45001</h1>
      <p className="page-intro">
        Checklist de Calidad, Ambiental y Seguridad y Salud en el Trabajo,
        organizado por norma y por el ciclo PHVA (cláusulas 4-6 = Planear,
        7-8 = Hacer, 9 = Verificar, 10 = Actuar).
      </p>

      <div className="disclaimer-box">
        ⚖️ Esta plantilla de requisitos se basa en la Estructura de Alto
        Nivel (Anexo SL) que comparten las tres normas — es un punto de
        partida editable, no un texto legal certificado. Valídala contra
        el texto vigente de cada norma antes de una auditoría de
        certificación.
      </div>

      {(normas || []).map((norma) => {
        const items = withUrls.filter((i) => i._requisito.norma_id === norma.id);
        const activos = items.filter((i) => i._requisito.activo);
        const aplicables = activos.filter((i) => i.estado !== "no_aplica");
        const cumplidos = aplicables.filter((i) => i.estado === "cumplido");
        const porcentaje = aplicables.length > 0 ? Math.round((cumplidos.length / aplicables.length) * 100) : 0;

        return (
          <section key={norma.id} className="section-card">
            <h2>
              {norma.nombre}
              <span className="progress-pct">{porcentaje}% cumplido</span>
            </h2>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }} />
            </div>

            {items.length > 0 ? (
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
                    {items.map((item) => (
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
        );
      })}
    </div>
  );
}
