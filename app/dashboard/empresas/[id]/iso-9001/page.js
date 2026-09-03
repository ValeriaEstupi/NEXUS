import IsoNormaPage from "../_iso/IsoNormaPage";
import { TargetIcon } from "@/app/dashboard/Icons";

export const dynamic = "force-dynamic";

export default function Iso9001Page({ params }) {
  return (
    <IsoNormaPage
      empresaId={params.id}
      normaCodigo="9001"
      Icon={TargetIcon}
      disclaimer="Esta plantilla de requisitos se basa en la Estructura de Alto Nivel (Anexo SL) de ISO 9001:2015 — es un punto de partida editable, no un texto legal certificado. Valídala contra el texto vigente de la norma antes de una auditoría de certificación."
    />
  );
}
