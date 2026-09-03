import "./globals.css";

export const metadata = {
  title: "NEXUS",
  description:
    "Plataforma de cumplimiento normativo para empresas de transporte especial.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
