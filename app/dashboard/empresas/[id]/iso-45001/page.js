import IsoNormaPage from "../_iso/IsoNormaPage";
import { LifeBuoyIcon } from "@/app/dashboard/Icons";

export const dynamic = "force-dynamic";

export default function Iso45001Page({ params }) {
  return (
    <IsoNormaPage
      empresaId={params.id}
      normaCodigo="45001"
      Icon={LifeBuoyIcon}
      disclaimer="Esta plantilla de requisitos se basa en la Estructura de Alto Nivel (Anexo SL) de ISO 45001:2018 — es un punto de partida editable, no un texto legal certificado. Valídala contra el texto vigente de la norma antes de una auditoría de certificación."
    />
  );
}
