import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withSignedUrls } from "@/app/lib/evidencias";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import ChecklistItem from "@/app/dashboard/ChecklistItem";
import { SearchShieldIcon } from "@/app/dashboard/Icons";
import AddRequisitoSarlaftForm from "./AddRequisitoSarlaftForm";

export const dynamic = "force-dynamic";

export default async function SarlaftPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canTrack, canEdit, canDelete }, { data: fases }, { data: requisitos }, { data: profiles }, { data: cumplimientos }] =
    await Promise.all([
      getEmpresaRole(supabase, empresaId, user.id),
      supabase.from("fases_phva").select("id, orden, nombre").order("orden"),
      supabase
        .from("requisitos_sarlaft")
        .select("id, fase_id, componente, codigo, descripcion, fuente_normativa, orden, activo")
        .eq("empresa_id", empresaId)
        .order("orden"),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      // Por separado (no anidada) por la misma razón que en PESV/SG-SST/ISO.
      supabase
        .from("cumplimiento_items")
        .select("id, requisito_sarlaft_id, estado, responsable_id, fecha_limite, observaciones, evidencias(id, nombre_archivo, ruta_storage)")
        .eq("empresa_id", empresaId)
        .eq("tipo", "sarlaft"),
    ]);

  const cumplimientoPorRequisito = {};
  (cumplimientos || []).forEach((c) => {
    cumplimientoPorRequisito[c.requisito_sarlaft_id] = c;
  });

  const flatItems = (requisitos || []).map((r) => ({
    ...cumplimientoPorRequisito[r.id],
    _requisito: r,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  const activos = withUrls.filter((i) => i._requisito.activo);
  const aplicables = activos.filter((i) => i.estado !== "no_aplica");
  const cumplidos = aplicables.filter((i) => i.estado === "cumplido");
  const porcentaje = aplicables.length > 0 ? Math.round((cumplidos.length / aplicables.length) * 100) : 0;

  return (
    <div className="page-body">
      <h1 className="icon-heading"><SearchShieldIcon size={26} /> SARLAFT</h1>
      <p className="page-intro">
        Sistema de Administración del Riesgo de Lavado de Activos y de la
        Financiación del Terrorismo, organizado por el ciclo PHVA.
      </p>

      <div className="disclaimer-box">
        ⚖️ Para una sociedad vigilada por la Superintendencia de Sociedades
        el nombre técnico vigente de este sistema es SAGRLAFT (Circular
        Externa 100-000016 de 2020) — "SARLAFT" es el término que usa la
        Superintendencia Financiera para sus vigilados, pero en la práctica
        ambos se usan indistintamente. Esta plantilla de requisitos es un
        punto de partida editable, no un texto legal certificado. Valídala
        contra la circular vigente antes de una auditoría.
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Avance SARLAFT</div>
          <div className="stat-value">{porcentaje}%</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      </div>

      {(fases || []).map((fase) => {
        const items = withUrls.filter((i) => i._requisito.fase_id === fase.id);
        if (items.length === 0) return null;

        return (
          <section key={fase.id} className="section-card">
            <h2>{fase.orden}. {fase.nombre}</h2>

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
                        tipo: "sarlaft",
                        id: item._requisito.id,
                        codigo: item._requisito.codigo,
                        descripcion: item._requisito.descripcion,
                        sub: item._requisito.componente,
                        componente: item._requisito.componente,
                        fuente: item._requisito.fuente_normativa,
                        faseId: item._requisito.fase_id,
                        activo: item._requisito.activo,
                      }}
                      profiles={profiles || []}
                      fases={fases || []}
                      canTrack={canTrack}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      empresaId={empresaId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {canEdit && <AddRequisitoSarlaftForm empresaId={empresaId} faseId={fase.id} />}
          </section>
        );
      })}
    </div>
  );
}
