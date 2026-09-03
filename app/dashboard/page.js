import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { estadoVencimiento } from "../lib/helpers";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: empresa },
    { data: avancePesv },
    { data: avanceSgsstRows },
    { count: totalVehiculos },
    { count: totalConductores },
    { data: vehiculos },
    { data: conductores },
    { data: incidentesAbiertos },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single(),
    supabase.from("empresa").select("razon_social, numero_vehiculos, numero_trabajadores").limit(1).single(),
    supabase.from("v_avance_pesv").select("*"),
    supabase.from("v_avance_sgsst").select("*"),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }),
    supabase.from("conductores").select("id", { count: "exact", head: true }),
    supabase.from("vehiculos").select("fecha_vencimiento_soat, fecha_vencimiento_tecnomecanica"),
    supabase.from("conductores").select("fecha_vencimiento_licencia, fecha_vencimiento_examen_medico"),
    supabase.from("incidentes").select("id").neq("estado", "cerrado"),
  ]);

  const avanceSgsst = avanceSgsstRows?.[0] || { porcentaje_avance: 0 };
  const totalRequisitosPesv = (avancePesv || []).reduce((s, p) => s + (p.total_requisitos - p.no_aplica), 0);
  const totalCumplidosPesv = (avancePesv || []).reduce((s, p) => s + p.cumplidos, 0);
  const avancePesvGlobal = totalRequisitosPesv > 0
    ? Math.round((totalCumplidosPesv / totalRequisitosPesv) * 100)
    : 0;

  let alertasVencimiento = 0;
  for (const v of vehiculos || []) {
    if (["vencido", "por_vencer"].includes(estadoVencimiento(v.fecha_vencimiento_soat))) alertasVencimiento++;
    if (["vencido", "por_vencer"].includes(estadoVencimiento(v.fecha_vencimiento_tecnomecanica))) alertasVencimiento++;
  }
  for (const c of conductores || []) {
    if (["vencido", "por_vencer"].includes(estadoVencimiento(c.fecha_vencimiento_licencia))) alertasVencimiento++;
    if (["vencido", "por_vencer"].includes(estadoVencimiento(c.fecha_vencimiento_examen_medico))) alertasVencimiento++;
  }

  const displayName = profile?.full_name || profile?.email;

  return (
    <div className="page-body">
      <h1>Hola, {displayName} 👋</h1>
      <p className="page-intro">
        {empresa?.razon_social || "Tu empresa"} · Resumen de cumplimiento
        del PESV y del SG-SST.
      </p>

      <div className="stat-grid">
        <Link href="/dashboard/pesv" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Avance PESV</div>
          <div className="stat-value">{avancePesvGlobal}%</div>
        </Link>
        <Link href="/dashboard/sgsst" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Calificación SG-SST</div>
          <div className="stat-value">{avanceSgsst.porcentaje_avance}%</div>
        </Link>
        <Link href="/dashboard/vehiculos" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Vehículos</div>
          <div className="stat-value">{totalVehiculos || 0}</div>
        </Link>
        <Link href="/dashboard/conductores" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Conductores</div>
          <div className="stat-value">{totalConductores || 0}</div>
        </Link>
        <Link
          href="/dashboard/indicadores"
          className={`stat-card ${alertasVencimiento > 0 ? "alert" : ""}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="stat-label">Documentos por vencer / vencidos</div>
          <div className="stat-value">{alertasVencimiento}</div>
        </Link>
        <Link
          href="/dashboard/incidentes"
          className={`stat-card ${(incidentesAbiertos?.length || 0) > 0 ? "alert" : ""}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="stat-label">Incidentes abiertos</div>
          <div className="stat-value">{incidentesAbiertos?.length || 0}</div>
        </Link>
      </div>

      <section className="section-card">
        <h2>🧭 Accesos rápidos</h2>
        <div className="stat-grid">
          <Link href="/dashboard/pesv" className="button-like">Checklist PESV</Link>
          <Link href="/dashboard/sgsst" className="button-like">Checklist SG-SST</Link>
          <Link href="/dashboard/incidentes" className="button-like">Reportar incidente</Link>
          <Link href="/dashboard/indicadores" className="button-like">Ver indicadores</Link>
        </div>
      </section>
    </div>
  );
}
