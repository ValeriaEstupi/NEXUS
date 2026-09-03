"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ empresaId, empresaNombre }) {
  const pathname = usePathname();
  const base = `/dashboard/empresas/${empresaId}`;

  const LINKS = [
    { href: base, label: "Resumen", icon: "🏠" },
    { href: `${base}/pesv`, label: "PESV", icon: "🚦" },
    { href: `${base}/sgsst`, label: "SG-SST", icon: "🦺" },
    { href: `${base}/iso-9001`, label: "ISO 9001 (Calidad)", icon: "🎯" },
    { href: `${base}/iso-14001`, label: "ISO 14001 (Ambiental)", icon: "🌱" },
    { href: `${base}/iso-45001`, label: "ISO 45001 (SST)", icon: "🧯" },
    { href: `${base}/vehiculos`, label: "Vehículos", icon: "🚐" },
    { href: `${base}/conductores`, label: "Conductores", icon: "🪪" },
    { href: `${base}/capacitaciones`, label: "Capacitaciones", icon: "🎓" },
    { href: `${base}/incidentes`, label: "Incidentes", icon: "⚠️" },
    { href: `${base}/plan-accion`, label: "Planes de acción", icon: "✅" },
    { href: `${base}/indicadores`, label: "Indicadores", icon: "📊" },
    { href: `${base}/configuracion`, label: "Configuración", icon: "⚙️" },
  ];

  return (
    <nav className="sidebar">
      <Link href="/dashboard" className="back-to-empresas">
        ← Mis empresas
      </Link>
      <div className="brand" style={{ fontSize: "0.95rem", padding: "4px 10px 16px" }}>
        {empresaNombre}
      </div>
      {LINKS.map((link) => {
        const active = link.href === base ? pathname === base : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : ""}>
            <span>{link.icon}</span> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
