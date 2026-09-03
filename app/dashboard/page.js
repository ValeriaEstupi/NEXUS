import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewEmpresaForm from "./NewEmpresaForm";

// Depende de a qué empresas pertenece quien mira (o todas, si es app
// admin) — nunca debe quedar guardado en caché para servirse igual a
// todo el mundo.
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_app_admin")
    .eq("id", user.id)
    .single();

  // "empresas" trae, según las reglas de privacidad: tus propias
  // empresas, o TODAS si eres app admin. Para poder mostrar las dos
  // listas por separado, además consultamos de cuáles eres miembro tú
  // en concreto.
  const [{ data: allVisibleEmpresas }, { data: myMemberships }] = await Promise.all([
    supabase.from("empresas").select("id, razon_social, created_at").order("created_at", { ascending: false }),
    supabase.from("empresa_members").select("empresa_id, role").eq("user_id", user.id),
  ]);

  const myRoleByEmpresa = {};
  (myMemberships || []).forEach((m) => {
    myRoleByEmpresa[m.empresa_id] = m.role;
  });
  const myEmpresas = (allVisibleEmpresas || []).filter((e) => myRoleByEmpresa[e.id]);

  const displayName = profile?.full_name || profile?.email;

  return (
    <div className="page-body">
      <h1>Hola, {displayName} 👋</h1>
      <p className="page-intro">Elige una empresa para ver su cumplimiento del PESV y del SG-SST.</p>

      <section className="section-card">
        <h2>🏢 Tus empresas</h2>

        {myEmpresas.length > 0 ? (
          <div className="group-card-grid">
            {myEmpresas.map((empresa, i) => (
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                role={myRoleByEmpresa[empresa.id]}
                colorIndex={i}
              />
            ))}
          </div>
        ) : (
          <p className="muted">Todavía no eres parte de ninguna empresa. Crea la primera abajo.</p>
        )}
      </section>

      {profile?.is_app_admin && (
        <section className="section-card">
          <h2>🌐 Todas las empresas de la plataforma</h2>
          <p className="muted small">
            Ves esta lista completa porque tu cuenta tiene el rol de app
            admin — incluye empresas de las que no eres miembro.
          </p>

          {allVisibleEmpresas && allVisibleEmpresas.length > 0 ? (
            <div className="group-card-grid">
              {allVisibleEmpresas.map((empresa, i) => (
                <EmpresaCard
                  key={empresa.id}
                  empresa={empresa}
                  role={myRoleByEmpresa[empresa.id]}
                  colorIndex={i}
                  notMember={!myRoleByEmpresa[empresa.id]}
                />
              ))}
            </div>
          ) : (
            <p className="muted">Todavía no hay empresas creadas.</p>
          )}
        </section>
      )}

      <NewEmpresaForm />
    </div>
  );
}

const BANNER_STYLES = [
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 16px), linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #22d3ee 100%)",
  "repeating-linear-gradient(-45deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 16px), linear-gradient(135deg, #0e7490 0%, #0891b2 55%, #22d3ee 100%)",
  "radial-gradient(rgba(255,255,255,0.2) 1.5px, transparent 1.5px) 0 0/16px 16px, linear-gradient(135deg, #065f46 0%, #059669 60%, #6ee7b7 100%)",
  "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 18px), linear-gradient(135deg, #164e63 0%, #0e7490 55%, #67e8f9 100%)",
];

function EmpresaCard({ empresa, role, colorIndex, notMember }) {
  const banner = BANNER_STYLES[colorIndex % BANNER_STYLES.length];

  return (
    <Link href={`/dashboard/empresas/${empresa.id}`} className="group-card">
      <div className="group-card-banner" style={{ background: banner }} />
      <div className="group-card-body">
        <strong>{empresa.razon_social}</strong>
        <span className="muted small">
          {role ? `Tu rol: ${role}` : notMember ? "No eres miembro" : ""}
        </span>
      </div>
    </Link>
  );
}
