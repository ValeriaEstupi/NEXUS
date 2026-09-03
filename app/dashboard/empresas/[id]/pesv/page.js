import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withSignedUrls } from "@/app/lib/evidencias";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import ChecklistItem from "@/app/dashboard/ChecklistItem";
import AddRequisitoForm from "./AddRequisitoForm";
import PilaresManager from "./PilaresManager";

export const dynamic = "force-dynamic";

export default async function PesvPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ role, canEdit, canDelete }, { data: pilares }, { data: fases }, { data: requisitos }, { data: profiles }] =
    await Promise.all([
      getEmpresaRole(supabase, empresaId, user.id),
      supabase
        .from("pilares_pesv")
        .select("id, orden, nombre, descripcion, activo")
        .eq("empresa_id", empresaId)
        .order("orden"),
      supabase.from("fases_phva").select("id, orden, nombre").order("orden"),
      supabase
        .from("requisitos_pesv")
        .select(
          "id, pilar_id, fase_id, codigo, descripcion, fuente_normativa, orden, activo, cumplimiento_items(id, estado, responsable_id, fecha_limite, observaciones, evidencias(id, nombre_archivo, ruta_storage))"
        )
        .eq("empresa_id", empresaId)
        .order("orden"),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);

  // Aplana requisito + su único cumplimiento_item, y les pega enlaces
  // de descarga temporales a las evidencias.
  const flatItems = (requisitos || []).map((r) => ({
    ...r.cumplimiento_items?.[0],
    _requisito: r,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  // % de avance por pilar, calculado acá mismo (sin contar los
  // requisitos inactivos ni los marcados "no aplica").
  const avancePorPilar = {};
  for (const pilar of pilares || []) {
    const items = withUrls.filter((i) => i._requisito.pilar_id === pilar.id && i._requisito.activo);
    const aplicables = items.filter((i) => i.estado !== "no_aplica");
    const cumplidos = aplicables.filter((i) => i.estado === "cumplido");
    avancePorPilar[pilar.id] =
      aplicables.length > 0 ? Math.round((cumplidos.length / aplicables.length) * 100) : 0;
  }

  return (
    <div className="page-body">
      <h1>🚦 Plan Estratégico de Seguridad Vial (PESV)</h1>
      <p className="page-intro">
        Seguimiento por pilar y por ciclo PHVA (Planear, Hacer, Verificar,
        Actuar), conforme a la Resolución 40595 de 2022.
      </p>

      <div className="disclaimer-box">
        ⚖️ Esta plantilla de requisitos es un punto de partida editable, no
        un texto legal certificado. Valídala contra el texto vigente de la
        resolución antes de una auditoría o inspección.
      </div>

      <PilaresManager empresaId={empresaId} pilares={pilares || []} canDelete={canDelete} />

      {(pilares || []).map((pilar) => {
        const items = withUrls.filter((i) => i._requisito.pilar_id === pilar.id);
        const porcentaje = avancePorPilar[pilar.id] || 0;

        return (
          <section key={pilar.id} className="section-card">
            <h2>
              {pilar.orden}. {pilar.nombre}
              <span className="progress-pct">{porcentaje}% cumplido</span>
            </h2>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }} />
            </div>
            {pilar.descripcion && <p className="muted small">{pilar.descripcion}</p>}

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
                          tipo: "pesv",
                          id: item._requisito.id,
                          codigo: item._requisito.codigo,
                          descripcion: item._requisito.descripcion,
                          fuente: item._requisito.fuente_normativa,
                          pilarId: item._requisito.pilar_id,
                          faseId: item._requisito.fase_id,
                          activo: item._requisito.activo,
                        }}
                        profiles={profiles || []}
                        pilares={pilares || []}
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
              <p className="empty-state">Todavía no hay requisitos en este pilar.</p>
            )}

            {canEdit && <AddRequisitoForm empresaId={empresaId} pilarId={pilar.id} fases={fases || []} />}
          </section>
        );
      })}
    </div>
  );
}
