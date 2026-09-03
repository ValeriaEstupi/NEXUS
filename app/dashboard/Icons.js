// Set de íconos de línea (SVG propios, sin depender de una librería
// externa) usados en el menú lateral, la marca y el título de cada
// pantalla — reemplazan a los emojis para un look más sobrio y
// corporativo, acorde a una plataforma de cumplimiento normativo.

function IconBase({ size = 18, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

export function ShieldIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2.5l7.5 3.5v5.2c0 5-3.2 8.6-7.5 10.3-4.3-1.7-7.5-5.3-7.5-10.3V6l7.5-3.5z" />
    </IconBase>
  );
}

export function HomeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M9.5 19.5V14h5v5.5" />
    </IconBase>
  );
}

export function RouteIcon(props) {
  return (
    <IconBase {...props}>
      <polygon points="3 11.5 21 3 13 21 11 12.5 3 11.5" />
    </IconBase>
  );
}

export function ShieldCheckIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2.5l7.5 3.5v5.2c0 5-3.2 8.6-7.5 10.3-4.3-1.7-7.5-5.3-7.5-10.3V6l7.5-3.5z" />
      <path d="M8.7 12.2l2.2 2.2 4.4-4.6" />
    </IconBase>
  );
}

export function TargetIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function LeafIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 19c-1-5.5 2-13 15-14 0 10-5.5 15-11 15-1.4 0-2.8-.2-4-.6z" />
      <path d="M5 19c2-3 5-5.5 9-7" />
    </IconBase>
  );
}

export function LifeBuoyIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M5 5l3.5 3.5M19 5l-3.5 3.5M5 19l3.5-3.5M19 19l-3.5-3.5" />
    </IconBase>
  );
}

export function TruckIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="1.5" y="7" width="13" height="10" rx="1" />
      <path d="M14.5 10.5h4l3 3v3.5h-7z" />
      <circle cx="6" cy="19" r="1.8" />
      <circle cx="17.5" cy="19" r="1.8" />
    </IconBase>
  );
}

export function IdCardIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M5 16.5c.5-1.8 1.8-2.5 3-2.5s2.5.7 3 2.5" />
      <path d="M14 9.5h5M14 13.5h4" />
    </IconBase>
  );
}

export function GraduationCapIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 11.3v4.3c1.8 1.4 8.2 1.4 10 0v-4.3" />
      <path d="M22 9v6" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5L22 20.5H2z" />
      <path d="M12 9.5v5" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function CheckSquareIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </IconBase>
  );
}

export function BarChartIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 21V10" />
      <path d="M12 21V5" />
      <path d="M20 21v-8" />
      <path d="M2.5 21h19" />
    </IconBase>
  );
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </IconBase>
  );
}

export function BuildingIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-4.5h6V21" />
      <path d="M8 7h2M8 11h2M14 7h2M14 11h2" />
    </IconBase>
  );
}

export function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M15.5 21v-2a3.5 3.5 0 00-3.5-3.5H6a3.5 3.5 0 00-3.5 3.5v2" />
      <circle cx="9" cy="8" r="3.5" />
      <path d="M21.5 21v-2a3.5 3.5 0 00-2.5-3.35" />
      <path d="M15 4.6a3.5 3.5 0 010 6.8" />
    </IconBase>
  );
}

export function LayersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2.5l9 4.8-9 4.8-9-4.8 9-4.8z" />
      <path d="M3 12l9 4.8 9-4.8" />
      <path d="M3 16.7l9 4.8 9-4.8" />
    </IconBase>
  );
}
