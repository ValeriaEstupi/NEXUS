"use client";

import { useState, useTransition } from "react";
import { createCapacitacion } from "@/app/lib/actions/capacitaciones";
import { CAPACITACION_TIPO_LABEL } from "@/app/lib/helpers";

export default function NewCapacitacionForm({ empresaId, conductores }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const asistentesIds = formData.getAll("asistentes");
    const data = {
      tema: formData.get("tema"),
      tipo: formData.get("tipo"),
      fecha: formData.get("fecha"),
      horas: formData.get("horas"),
      observaciones: formData.get("observaciones"),
      asistentesIds,
    };
    startTransition(async () => {
      const res = await createCapacitacion(empresaId, data);
      if (res?.error) setError(res.error);
      else document.getElementById("nueva-capacitacion-form")?.reset();
    });
  }

  return (
    <div className="card inline-card">
      <h3>Registrar capacitación</h3>
      {error && <div className="message error">{error}</div>}
      <form id="nueva-capacitacion-form" action={handleSubmit} className="form-grid">
        <div style={{ flexBasis: "100%" }}>
          <label>Tema *</label>
          <input name="tema" required />
        </div>
        <div>
          <label>Tipo</label>
          <select name="tipo" defaultValue="otra">
            {Object.entries(CAPACITACION_TIPO_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Fecha *</label>
          <input name="fecha" type="date" required />
        </div>
        <div style={{ maxWidth: 110 }}>
          <label>Horas</label>
          <input name="horas" type="number" step="0.5" min="0" />
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>Observaciones</label>
          <textarea name="observaciones" rows={2} />
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>Asistentes</label>
          <div
            style={{
              display: "flex", flexWrap: "wrap", gap: "6px 16px",
              border: "1px solid var(--border)", borderRadius: 10, padding: 12,
            }}
          >
            {conductores.length === 0 && <span className="muted small">No hay conductores registrados todavía.</span>}
            {conductores.map((c) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, marginBottom: 0 }}>
                <input type="checkbox" name="asistentes" value={c.id} style={{ width: "auto", margin: 0 }} />
                {c.nombre_completo}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Registrar capacitación"}
        </button>
      </form>
    </div>
  );
}
