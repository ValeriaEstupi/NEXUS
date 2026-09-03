import IsoNormaPage from "../_iso/IsoNormaPage";
import { LeafIcon } from "@/app/dashboard/Icons";

export const dynamic = "force-dynamic";

export default function Iso14001Page({ params }) {
  return (
    <IsoNormaPage
      empresaId={params.id}
      normaCodigo="14001"
      Icon={LeafIcon}
      disclaimer="Esta plantilla de requisitos se basa en la Estructura de Alto Nivel (Anexo SL) de ISO 14001:2015 — es un punto de partida editable, no un texto legal certificado. Valídala contra el texto vigente de la norma antes de una auditoría de certificación."
    />
  );
}
