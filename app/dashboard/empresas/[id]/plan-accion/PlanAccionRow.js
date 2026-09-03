"use client";

import { useState, useTransition } from "react";
import { updatePlanAccion, deletePlanAccion } from "@/app/lib/actions/planAccion";
import {
  formatFecha,
  PLAN_ACCION_ORIGEN_LABEL,
  PLAN_ACCION_ESTADO_LABEL,
} from "@/app/lib/helpers";

export default function PlanAccionRow({ plan, empresaId, incidentes, profiles, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const responsable = profiles.find((p) => p.id === plan.responsable_id);

  function handleSave(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updatePlanAccion(plan.id, data, empresaId);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  async function handleDelete() {
    if (!confirm("¿Borrar esta acción?")) return;
    const res = await deletePlanAccion(plan.id, empresaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <tr>
        <td style={{ maxWidth: 280 }}>{plan.descripcion}</td>
        <td className="muted small">{PLAN_ACCION_ORIGEN_LABEL[plan.origen]}</td>
        <td>{responsable ? responsable.full_name || responsable.email : "—"}</td>
        <td>{formatFecha(plan.fecha_limite)}</td>
        <td>
          <span className={`badge badge-${plan.estado === "vencido" ? "vencido" : plan.estado}`}>
            {PLAN_ACCION_ESTADO_LABEL[plan.estado]}
          </span>
        </td>
        <td className="actions-row">
          {canEdit && (
            <button type="button" className="secondary" onClick={() => setOpen(!open)}>
              {open ? "Cerrar" : "Editar"}
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
          <td colSpan={6}>
            <div className="section-card" style={{ margin: "6px 0" }}>
              {error && <div className="message error">{error}</div>}
              <form action={handleSave} className="form-grid">
                <div>
                  <label>Origen</label>
                  <select name="origen" defaultValue={plan.origen}>
                    {Object.entries(PLAN_ACCION_ORIGEN_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Incidente relacionado</label>
                  <select name="incidenteId" defaultValue={plan.incidente_id || ""}>
                    <option value="">No aplica</option>
                    {incidentes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {new Date(i.fecha).toLocaleDateString("es-CO")} — {i.descripcion.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Responsable</label>
                  <select name="responsableId" defaultValue={plan.responsable_id || ""}>
                    <option value="">Sin asignar</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Fecha límite</label>
                  <input name="fechaLimite" type="date" defaultValue={plan.fecha_limite || ""} />
                </div>
                <div>
                  <label>Estado</label>
                  <select name="estado" defaultValue={plan.estado}>
                    {Object.entries(PLAN_ACCION_ESTADO_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>Descripción</label>
                  <textarea name="descripcion" rows={2} defaultValue={plan.descripcion} required />
                </div>
                <button type="submit" disabled={pending}>Guardar cambios</button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
