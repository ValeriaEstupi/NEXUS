import "./globals.css";

export const metadata = {
  title: "NEXU — PESV y SG-SST",
  description:
    "Seguimiento del Plan Estratégico de Seguridad Vial (PESV) y del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) para empresas de transporte especial.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
