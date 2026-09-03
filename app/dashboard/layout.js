import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import Sidebar from "./Sidebar";
import LogoutButton from "./LogoutButton";

// Todo lo que hay bajo /dashboard depende de quién mira (su rol, sus
// datos) — nunca debe quedar guardado en caché para servirse igual a
// todo el mundo.
export const dynamic = "force-dynamic";

const ROLE_LABEL = {
  super_admin: "Super admin",
  editor: "Editor",
  lector: "Lectura",
};

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || user.email;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <div className="top-bar">
          <div>
            <h2>Plataforma PESV · SG-SST</h2>
            <span className="muted small">Transporte especial</span>
          </div>
          <div className="user-chip">
            <div className="user-avatar">{initial}</div>
            <div>
              <div className="user-name">
                {displayName}
                <span className="role-tag">
                  {ROLE_LABEL[profile?.role] || "Lectura"}
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
