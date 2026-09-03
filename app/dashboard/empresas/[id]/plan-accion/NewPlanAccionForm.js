"use client";

import { useState, useTransition } from "react";
import { createPlanAccion } from "@/app/lib/actions/planAccion";
import { PLAN_ACCION_ORIGEN_LABEL } from "@/app/lib/helpers";

export default function NewPlanAccionForm({ empresaId, incidentes, profiles }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await createPlanAccion(empresaId, data);
      if (res?.error) setError(res.error);
      else document.getElementById("nuevo-plan-form")?.reset();
    });
  }

  return (
    <div className="card inline-card">
      <h3>Agregar acción</h3>
      {error && <div className="message error">{error}</div>}
      <form id="nuevo-plan-form" action={handleSubmit} className="form-grid">
        <div>
          <label>Origen</label>
          <select name="origen" defaultValue="otro">
            {Object.entries(PLAN_ACCION_ORIGEN_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Incidente relacionado</label>
          <select name="incidenteId" defaultValue="">
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
          <select name="responsableId" defaultValue="">
            <option value="">Sin asignar</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Fecha límite</label>
          <input name="fechaLimite" type="date" />
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>¿Qué acción hay que hacer? *</label>
          <textarea name="descripcion" rows={2} required />
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar acción"}
        </button>
      </form>
    </div>
  );
}
