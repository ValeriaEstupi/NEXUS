import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { estadoVencimiento } from "../../lib/helpers";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: avancePesv },
    { data: avanceSgsstRows },
    { data: vehiculos },
    { data: conductores },
    { data: incidentes },
  ] = await Promise.all([
    supabase.from("v_avance_pesv").select("*"),
    supabase.from("v_avance_sgsst").select("*"),
    supabase.from("vehiculos").select("fecha_vencimiento_soat, fecha_vencimiento_tecnomecanica"),
    supabase
      .from("conductores")
      .select("fecha_vencimiento_licencia, fecha_vencimiento_examen_medico"),
    supabase.from("incidentes").select("tipo, clasificacion, fecha, estado"),
  ]);

  const avanceSgsst = avanceSgsstRows?.[0] || { porcentaje_avance: 0 };

  const totalRequisitosPesv = (avancePesv || []).reduce((s, p) => s + (p.total_requisitos - p.no_aplica), 0);
  const totalCumplidosPesv = (avancePesv || []).reduce((s, p) => s + p.cumplidos, 0);
  const avancePesvGlobal = totalRequisitosPesv > 0
    ? Math.round((totalCumplidosPesv / totalRequisitosPesv) * 100)
    : 0;

  const alertas = {
    soatVencido: 0,
    soatPorVencer: 0,
    tecnoVencido: 0,
    tecnoPorVencer: 0,
    licenciaVencida: 0,
    licenciaPorVencer: 0,
    examenVencido: 0,
    examenPorVencer: 0,
  };

  for (const v of vehiculos || []) {
    const soat = estadoVencimiento(v.fecha_vencimiento_soat);
    const tecno = estadoVencimiento(v.fecha_vencimiento_tecnomecanica);
    if (soat === "vencido") alertas.soatVencido++;
    if (soat === "por_vencer") alertas.soatPorVencer++;
    if (tecno === "vencido") alertas.tecnoVencido++;
    if (tecno === "por_vencer") alertas.tecnoPorVencer++;
  }

  for (const c of conductores || []) {
    const lic = estadoVencimiento(c.fecha_vencimiento_licencia);
    const exa = estadoVencimiento(c.fecha_vencimiento_examen_medico);
    if (lic === "vencido") alertas.licenciaVencida++;
    if (lic === "por_vencer") alertas.licenciaPorVencer++;
    if (exa === "vencido") alertas.examenVencido++;
    if (exa === "por_vencer") alertas.examenPorVencer++;
  }

  const totalAlertas =
    alertas.soatVencido + alertas.soatPorVencer + alertas.tecnoVencido + alertas.tecnoPorVencer +
    alertas.licenciaVencida + alertas.licenciaPorVencer + alertas.examenVencido + alertas.examenPorVencer;

  const incidentesViales = (incidentes || []).filter((i) => i.tipo === "transito");
  const incidentesLaborales = (incidentes || []).filter((i) => i.tipo === "laboral");
  const incidentesAbiertos = (incidentes || []).filter((i) => i.estado !== "cerrado");

  // Últimos 6 meses, para un mini gráfico de barras de accidentalidad.
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("es-CO", { month: "short" }),
      total: 0,
    });
  }
  for (const i of incidentes || []) {
    const d = new Date(i.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const mes = meses.find((m) => m.key === key);
    if (mes) mes.total++;
  }
  const maxMes = Math.max(1, ...meses.map((m) => m.total));

  return (
    <div className="page-body">
      <h1>📊 Indicadores</h1>
      <p className="page-intro">
        Vista consolidada del avance normativo y de la accidentalidad.
      </p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Avance PESV</div>
          <div className="stat-value">{avancePesvGlobal}%</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${avancePesvGlobal}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Calificación SG-SST</div>
          <div className="stat-value">{avanceSgsst.porcentaje_avance}%</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${avanceSgsst.porcentaje_avance}%` }} />
          </div>
        </div>
        <div className={`stat-card ${totalAlertas > 0 ? "alert" : ""}`}>
          <div className="stat-label">Documentos vencidos o por vencer</div>
          <div className="stat-value">{totalAlertas}</div>
          <div className="stat-sub">SOAT, tecnomecánica, licencias, exámenes médicos</div>
        </div>
        <div className={`stat-card ${incidentesAbiertos.length > 0 ? "alert" : ""}`}>
          <div className="stat-label">Incidentes abiertos</div>
          <div className="stat-value">{incidentesAbiertos.length}</div>
          <div className="stat-sub">
            {incidentesViales.length} viales · {incidentesLaborales.length} laborales (histórico)
          </div>
        </div>
      </div>

      <section className="section-card">
        <h2>Avance del PESV por pilar</h2>
        {(avancePesv || []).map((p) => (
          <div key={p.pilar_id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span>{p.pilar}</span>
              <span className="muted">{p.porcentaje_avance}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${p.porcentaje_avance}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="section-card">
        <h2>Alertas de vencimiento</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Vencidos</th>
                <th>Por vencer (15 días)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SOAT</td>
                <td>{alertas.soatVencido}</td>
                <td>{alertas.soatPorVencer}</td>
              </tr>
              <tr>
                <td>Revisión tecnomecánica</td>
                <td>{alertas.tecnoVencido}</td>
                <td>{alertas.tecnoPorVencer}</td>
              </tr>
              <tr>
                <td>Licencia de conducción</td>
                <td>{alertas.licenciaVencida}</td>
                <td>{alertas.licenciaPorVencer}</td>
              </tr>
              <tr>
                <td>Examen médico ocupacional</td>
                <td>{alertas.examenVencido}</td>
                <td>{alertas.examenPorVencer}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-card">
        <h2>Accidentalidad — últimos 6 meses</h2>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 120, padding: "10px 0" }}>
          {meses.map((m) => (
            <div key={m.key} style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  height: `${(m.total / maxMes) * 90}px`,
                  minHeight: 4,
                  background: "var(--primary)",
                  borderRadius: "6px 6px 0 0",
                }}
              />
              <div className="muted small" style={{ marginTop: 6 }}>{m.label}</div>
              <div style={{ fontWeight: 700, fontSize: "0.8rem" }}>{m.total}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
