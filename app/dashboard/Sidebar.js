"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/pesv", label: "PESV", icon: "🚦" },
  { href: "/dashboard/sgsst", label: "SG-SST", icon: "🦺" },
  { href: "/dashboard/vehiculos", label: "Vehículos", icon: "🚐" },
  { href: "/dashboard/conductores", label: "Conductores", icon: "🪪" },
  { href: "/dashboard/capacitaciones", label: "Capacitaciones", icon: "🎓" },
  { href: "/dashboard/incidentes", label: "Incidentes", icon: "⚠️" },
  { href: "/dashboard/plan-accion", label: "Planes de acción", icon: "✅" },
  { href: "/dashboard/indicadores", label: "Indicadores", icon: "📊" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="brand">
        <span className="brand-mark">🛡️</span> Nexus
      </div>
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "active" : ""}
          >
            <span>{link.icon}</span> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
