import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withSignedUrls } from "@/app/lib/evidencias";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import ChecklistItem from "@/app/dashboard/ChecklistItem";
import { ShieldCheckIcon } from "@/app/dashboard/Icons";
import AddEstandarForm from "./AddEstandarForm";

export const dynamic = "force-dynamic";

export default async function SgsstPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: fases }, { data: estandares }, { data: profiles }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase.from("fases_phva").select("id, orden, nombre").order("orden"),
    supabase
      .from("estandares_sgsst")
      .select(
        "id, fase_id, componente, codigo, descripcion, puntaje, orden, activo, cumplimiento_items(id, estado, responsable_id, fecha_limite, observaciones, evidencias(id, nombre_archivo, ruta_storage))"
      )
      .eq("empresa_id", empresaId)
      .order("orden"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  const flatItems = (estandares || []).map((e) => ({
    ...e.cumplimiento_items?.[0],
    _estandar: e,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  const activos = (estandares || []).filter((e) => e.activo);
  const puntajeAplicable = activos.reduce((s, e) => s + Number(e.puntaje), 0);
  const puntajeObtenido = withUrls
    .filter((i) => i._estandar.activo && i.estado === "cumplido")
    .reduce((s, i) => s + Number(i._estandar.puntaje), 0);
  const porcentajeAvance = puntajeAplicable > 0 ? Math.round((puntajeObtenido / puntajeAplicable) * 1000) / 10 : 0;

  return (
    <div className="page-body">
      <h1 className="icon-heading"><ShieldCheckIcon size={26} /> Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)</h1>
      <p className="page-intro">
        Estándares mínimos según la Resolución 0312 de 2019, organizados por
        el ciclo PHVA.
      </p>

      <div className="disclaimer-box">
        ⚖️ Esta plantilla de estándares y puntajes es un punto de partida
        editable, no un texto legal certificado. Valídala contra el texto
        vigente de la resolución y el grupo de estándares que realmente
        aplica a esta empresa (según ARL y número de trabajadores) antes de
        una auditoría.
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Calificación SG-SST</div>
          <div className="stat-value">{porcentajeAvance}%</div>
          <div className="stat-sub">
            {puntajeObtenido} de {puntajeAplicable} puntos aplicables
          </div>
        </div>
      </div>

      {(fases || []).map((fase) => {
        const items = withUrls.filter((i) => i._estandar.fase_id === fase.id);
        if (items.length === 0) return null;

        return (
          <section key={fase.id} className="section-card">
            <h2>{fase.orden}. {fase.nombre}</h2>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Estándar</th>
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
                        tipo: "sgsst",
                        id: item._estandar.id,
                        codigo: item._estandar.codigo,
                        descripcion: item._estandar.descripcion,
                        sub: `${item._estandar.componente} · ${item._estandar.puntaje} pts`,
                        componente: item._estandar.componente,
                        puntaje: item._estandar.puntaje,
                        faseId: item._estandar.fase_id,
                        activo: item._estandar.activo,
                      }}
                      profiles={profiles || []}
                      fases={fases || []}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      empresaId={empresaId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {canEdit && <AddEstandarForm empresaId={empresaId} faseId={fase.id} />}
          </section>
        );
      })}
    </div>
  );
}
