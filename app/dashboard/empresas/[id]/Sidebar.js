"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  RouteIcon,
  ShieldCheckIcon,
  TargetIcon,
  LeafIcon,
  LifeBuoyIcon,
  TruckIcon,
  IdCardIcon,
  GraduationCapIcon,
  AlertTriangleIcon,
  CheckSquareIcon,
  BarChartIcon,
  SettingsIcon,
  ArrowLeftIcon,
} from "@/app/dashboard/Icons";

export default function Sidebar({ empresaId, empresaNombre }) {
  const pathname = usePathname();
  const base = `/dashboard/empresas/${empresaId}`;

  const LINKS = [
    { href: base, label: "Resumen", Icon: HomeIcon },
    { href: `${base}/pesv`, label: "PESV", Icon: RouteIcon },
    { href: `${base}/sgsst`, label: "SG-SST", Icon: ShieldCheckIcon },
    { href: `${base}/iso-9001`, label: "ISO 9001 (Calidad)", Icon: TargetIcon },
    { href: `${base}/iso-14001`, label: "ISO 14001 (Ambiental)", Icon: LeafIcon },
    { href: `${base}/iso-45001`, label: "ISO 45001 (SST)", Icon: LifeBuoyIcon },
    { href: `${base}/vehiculos`, label: "Vehículos", Icon: TruckIcon },
    { href: `${base}/conductores`, label: "Conductores", Icon: IdCardIcon },
    { href: `${base}/capacitaciones`, label: "Capacitaciones", Icon: GraduationCapIcon },
    { href: `${base}/incidentes`, label: "Incidentes", Icon: AlertTriangleIcon },
    { href: `${base}/plan-accion`, label: "Planes de acción", Icon: CheckSquareIcon },
    { href: `${base}/indicadores`, label: "Indicadores", Icon: BarChartIcon },
    { href: `${base}/configuracion`, label: "Configuración", Icon: SettingsIcon },
  ];

  return (
    <nav className="sidebar">
      <Link href="/dashboard" className="back-to-empresas">
        <ArrowLeftIcon size={14} /> Mis empresas
      </Link>
      <div className="brand" style={{ fontSize: "0.95rem", padding: "4px 10px 16px" }}>
        {empresaNombre}
      </div>
      {LINKS.map(({ href, label, Icon }) => {
        const active = href === base ? pathname === base : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : ""}>
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
