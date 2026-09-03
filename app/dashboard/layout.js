import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import { ShieldIcon } from "./Icons";

// Todo lo que hay bajo /dashboard depende de quién mira (sus empresas,
// sus datos) — nunca debe quedar guardado en caché para servirse igual
// a todo el mundo.
export const dynamic = "force-dynamic";

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
    .select("full_name, email, is_app_admin")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || user.email;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="top-bar">
        <div className="brand">
          <span className="brand-mark"><ShieldIcon size={20} /></span> NEXUS
        </div>
        <div className="user-chip">
          <div className="user-avatar">{initial}</div>
          <div>
            <div className="user-name">
              {displayName}
              {profile?.is_app_admin && <span className="role-tag">App admin</span>}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
      {children}
    </>
  );
}
