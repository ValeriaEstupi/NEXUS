import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estadoVencimiento } from "@/app/lib/helpers";

export const dynamic = "force-dynamic";

export default async function EmpresaResumenPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: empresa },
    { data: requisitos },
    { data: estandares },
    { data: requisitosIso },
    { data: normasIso },
    { count: totalVehiculos },
    { count: totalConductores },
    { data: vehiculos },
    { data: conductores },
    { data: incidentesAbiertos },
  ] = await Promise.all([
    supabase.from("empresas").select("razon_social").eq("id", empresaId).single(),
    supabase
      .from("requisitos_pesv")
      .select("activo, cumplimiento_items(estado)")
      .eq("empresa_id", empresaId),
    supabase
      .from("estandares_sgsst")
      .select("activo, puntaje, cumplimiento_items(estado)")
      .eq("empresa_id", empresaId),
    supabase
      .from("requisitos_iso")
      .select("norma_id, activo, cumplimiento_items(estado)")
      .eq("empresa_id", empresaId),
    supabase.from("normas_iso").select("id, codigo, nombre").order("orden"),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
    supabase.from("conductores").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
    supabase
      .from("vehiculos")
      .select("fecha_vencimiento_soat, fecha_vencimiento_tecnomecanica")
      .eq("empresa_id", empresaId),
    supabase
      .from("conductores")
      .select("fecha_vencimiento_licencia, fecha_vencimiento_examen_medico")
      .eq("empresa_id", empresaId),
    supabase.from("incidentes").select("id").eq("empresa_id", empresaId).neq("estado", "cerrado"),
  ]);

  const requisitosActivos = (requisitos || []).filter((r) => r.activo);
  const totalPesv = requisitosActivos.length;
  const cumplidosPesv = requisitosActivos.filter((r) => r.cumplimiento_items?.[0]?.estado === "cumplido").length;
  const avancePesvGlobal = totalPesv > 0 ? Math.round((cumplidosPesv / totalPesv) * 100) : 0;

  const estandaresActivos = (estandares || []).filter((e) => e.activo);
  const puntajeAplicable = estandaresActivos.reduce((s, e) => s + Number(e.puntaje), 0);
  const puntajeObtenido = estandaresActivos
    .filter((e) => e.cumplimiento_items?.[0]?.estado === "cumplido")
    .reduce((s, e) => s + Number(e.puntaje), 0);
  const avanceSgsstGlobal = puntajeAplicable > 0 ? Math.round((puntajeObtenido / puntajeAplicable) * 100) : 0;

  // Avance de cada norma ISO por separado (9001, 14001, 45001).
  const avancePorNorma = {};
  for (const norma of normasIso || []) {
    const items = (requisitosIso || []).filter((r) => r.norma_id === norma.id && r.activo);
    const cumplidos = items.filter((r) => r.cumplimiento_items?.[0]?.estado === "cumplido").length;
    avancePorNorma[norma.codigo] = items.length > 0 ? Math.round((cumplidos / items.length) * 100) : 0;
  }

  let alertasVencimiento = 0;
  for (const v of vehiculos || []) {
    if (["vencido", "por_vencer"].includes(estadoVencimiento(v.fecha_vencimiento_soat))) alertasVencimiento++;
    if (["vencido", "por_vencer"].includes(estadoVencimiento(v.fecha_vencimiento_tecnomecanica))) alertasVencimiento++;
  }
  for (const c of conductores || []) {
    if (["vencido", "por_vencer"].includes(estadoVencimiento(c.fecha_vencimiento_licencia))) alertasVencimiento++;
    if (["vencido", "por_vencer"].includes(estadoVencimiento(c.fecha_vencimiento_examen_medico))) alertasVencimiento++;
  }

  const base = `/dashboard/empresas/${empresaId}`;

  return (
    <div className="page-body">
      <h1>{empresa?.razon_social}</h1>
      <p className="page-intro">Resumen de cumplimiento del PESV, el SG-SST y el Sistema de Gestión ISO.</p>

      <div className="stat-grid">
        <Link href={`${base}/pesv`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Avance PESV</div>
          <div className="stat-value">{avancePesvGlobal}%</div>
        </Link>
        <Link href={`${base}/sgsst`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Calificación SG-SST</div>
          <div className="stat-value">{avanceSgsstGlobal}%</div>
        </Link>
        <Link href={`${base}/iso-9001`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">ISO 9001 (Calidad)</div>
          <div className="stat-value">{avancePorNorma["9001"] || 0}%</div>
        </Link>
        <Link href={`${base}/iso-14001`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">ISO 14001 (Ambiental)</div>
          <div className="stat-value">{avancePorNorma["14001"] || 0}%</div>
        </Link>
        <Link href={`${base}/iso-45001`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">ISO 45001 (SST)</div>
          <div className="stat-value">{avancePorNorma["45001"] || 0}%</div>
        </Link>
        <Link href={`${base}/vehiculos`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Vehículos</div>
          <div className="stat-value">{totalVehiculos || 0}</div>
        </Link>
        <Link href={`${base}/conductores`} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-label">Conductores</div>
          <div className="stat-value">{totalConductores || 0}</div>
        </Link>
        <Link
          href={`${base}/indicadores`}
          className={`stat-card ${alertasVencimiento > 0 ? "alert" : ""}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="stat-label">Documentos por vencer / vencidos</div>
          <div className="stat-value">{alertasVencimiento}</div>
        </Link>
        <Link
          href={`${base}/incidentes`}
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
          <Link href={`${base}/pesv`} className="button-like">Checklist PESV</Link>
          <Link href={`${base}/sgsst`} className="button-like">Checklist SG-SST</Link>
          <Link href={`${base}/iso-9001`} className="button-like">Checklist ISO 9001</Link>
          <Link href={`${base}/iso-14001`} className="button-like">Checklist ISO 14001</Link>
          <Link href={`${base}/iso-45001`} className="button-like">Checklist ISO 45001</Link>
          <Link href={`${base}/incidentes`} className="button-like">Reportar incidente</Link>
          <Link href={`${base}/indicadores`} className="button-like">Ver indicadores</Link>
        </div>
      </section>
    </div>
  );
}
