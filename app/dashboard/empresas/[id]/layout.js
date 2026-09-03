import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function EmpresaLayout({ children, params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Las políticas de la base de datos ya impiden ver una empresa de la
  // que no eres miembro (y a la que no eres app admin) — si la consulta
  // no trae nada, es que no tienes acceso (o no existe).
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, razon_social")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    notFound();
  }

  return (
    <div className="shell">
      <Sidebar empresaId={empresaId} empresaNombre={empresa.razon_social} />
      <div className="shell-main">{children}</div>
    </div>
  );
}
