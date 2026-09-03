"use client";

import { useState, useTransition } from "react";
import { updateIncidente, deleteIncidente } from "../../lib/actions/incidentes";
import {
  formatFechaHora,
  INCIDENTE_ESTADO_LABEL,
  CLASIFICACION_INCIDENTE_LABEL,
} from "../../lib/helpers";

export default function IncidenteRow({ incidente, vehiculos, conductores, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const vehiculo = vehiculos.find((v) => v.id === incidente.vehiculo_id);
  const conductor = conductores.find((c) => c.id === incidente.conductor_id);

  function handleSave(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updateIncidente(incidente.id, data);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  async function handleDelete() {
    if (!confirm("¿Borrar este registro?")) return;
    const res = await deleteIncidente(incidente.id);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <tr>
        <td>{formatFechaHora(incidente.fecha)}</td>
        <td>{incidente.tipo === "transito" ? "Vial" : "Laboral"}</td>
        <td className="muted small">
          {CLASIFICACION_INCIDENTE_LABEL[incidente.clasificacion] || "—"}
        </td>
        <td>
          {vehiculo?.placa || "—"}
          {conductor && <div className="muted small">{conductor.nombre_completo}</div>}
        </td>
        <td style={{ maxWidth: 240 }}>{incidente.descripcion}</td>
        <td>
          <span className={`badge badge-${incidente.estado}`}>
            {INCIDENTE_ESTADO_LABEL[incidente.estado]}
          </span>
        </td>
        <td className="actions-row">
          {canEdit && (
            <button type="button" className="secondary" onClick={() => setOpen(!open)}>
              {open ? "Cerrar" : "Gestionar"}
            </button>
          )}
          {canDelete && (
            <button type="button" className="danger" onClick={handleDelete}>
              Borrar
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7}>
            <div className="section-card" style={{ margin: "6px 0" }}>
              {error && <div className="message error">{error}</div>}
              <form action={handleSave} className="form-grid">
                <div>
                  <label>Tipo</label>
                  <select name="tipo" defaultValue={incidente.tipo}>
                    <option value="transito">Vial (tránsito)</option>
                    <option value="laboral">Laboral</option>
                  </select>
                </div>
                <div>
                  <label>Clasificación</label>
                  <select name="clasificacion" defaultValue={incidente.clasificacion || ""}>
                    <option value="">Sin definir</option>
                    {Object.entries(CLASIFICACION_INCIDENTE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Estado</label>
                  <select name="estado" defaultValue={incidente.estado}>
                    {Object.entries(INCIDENTE_ESTADO_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>¿Qué pasó?</label>
                  <textarea name="descripcion" rows={2} defaultValue={incidente.descripcion} required />
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>Causas probables</label>
                  <textarea
                    name="causasProbables"
                    rows={2}
                    defaultValue={incidente.causas_probables || ""}
                  />
                </div>
                <button type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
