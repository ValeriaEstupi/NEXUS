"use client";

import { useState, useTransition } from "react";
import {
  updateCapacitacion,
  deleteCapacitacion,
  toggleAsistente,
} from "../../lib/actions/capacitaciones";
import { formatFecha, CAPACITACION_TIPO_LABEL } from "../../lib/helpers";

export default function CapacitacionRow({ capacitacion, conductores, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const asistentesIds = new Set((capacitacion.capacitacion_asistentes || []).map((a) => a.conductor_id));

  function handleSave(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updateCapacitacion(capacitacion.id, data);
      if (res?.error) setError(res.error);
    });
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar la capacitación "${capacitacion.tema}"?`)) return;
    const res = await deleteCapacitacion(capacitacion.id);
    if (res?.error) setError(res.error);
  }

  async function handleToggleAsistente(conductorId, checked) {
    setError(null);
    const res = await toggleAsistente(capacitacion.id, conductorId, checked);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <tr>
        <td>
          <strong>{capacitacion.tema}</strong>
          <div className="muted small">{CAPACITACION_TIPO_LABEL[capacitacion.tipo]}</div>
        </td>
        <td>{formatFecha(capacitacion.fecha)}</td>
        <td>{capacitacion.horas ?? "—"}</td>
        <td>{asistentesIds.size}</td>
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
          <td colSpan={5}>
            <div className="section-card" style={{ margin: "6px 0" }}>
              {error && <div className="message error">{error}</div>}
              <form action={handleSave} className="form-grid">
                <div style={{ flexBasis: "100%" }}>
                  <label>Tema</label>
                  <input name="tema" defaultValue={capacitacion.tema} required />
                </div>
                <div>
                  <label>Tipo</label>
                  <select name="tipo" defaultValue={capacitacion.tipo}>
                    {Object.entries(CAPACITACION_TIPO_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Fecha</label>
                  <input name="fecha" type="date" defaultValue={capacitacion.fecha} />
                </div>
                <div style={{ maxWidth: 110 }}>
                  <label>Horas</label>
                  <input name="horas" type="number" step="0.5" defaultValue={capacitacion.horas || ""} />
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>Observaciones</label>
                  <textarea name="observaciones" rows={2} defaultValue={capacitacion.observaciones || ""} />
                </div>
                <button type="submit" disabled={pending}>Guardar cambios</button>
              </form>

              <h3 style={{ fontSize: "0.85rem", margin: "16px 0 6px" }}>Asistentes</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                {conductores.map((c) => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto", margin: 0 }}
                      defaultChecked={asistentesIds.has(c.id)}
                      onChange={(e) => handleToggleAsistente(c.id, e.target.checked)}
                    />
                    {c.nombre_completo}
                  </label>
                ))}
                {conductores.length === 0 && <span className="muted small">No hay conductores registrados.</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
