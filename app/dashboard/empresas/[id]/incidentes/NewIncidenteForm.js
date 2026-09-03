"use client";

import { useState, useTransition } from "react";
import { createIncidente } from "@/app/lib/actions/incidentes";
import { CLASIFICACION_INCIDENTE_LABEL } from "@/app/lib/helpers";

export default function NewIncidenteForm({ empresaId, vehiculos, conductores }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await createIncidente(empresaId, data);
      if (res?.error) setError(res.error);
      else document.getElementById("nuevo-incidente-form")?.reset();
    });
  }

  return (
    <div className="card inline-card">
      <h3>Reportar incidente / accidente</h3>
      {error && <div className="message error">{error}</div>}
      <form id="nuevo-incidente-form" action={handleSubmit} className="form-grid">
        <div>
          <label>Tipo *</label>
          <select name="tipo" required defaultValue="transito">
            <option value="transito">Vial (tránsito)</option>
            <option value="laboral">Laboral</option>
          </select>
        </div>
        <div>
          <label>Clasificación</label>
          <select name="clasificacion" defaultValue="">
            <option value="">Sin definir</option>
            {Object.entries(CLASIFICACION_INCIDENTE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Fecha y hora *</label>
          <input name="fecha" type="datetime-local" required />
        </div>
        <div>
          <label>Lugar</label>
          <input name="lugar" />
        </div>
        <div>
          <label>Vehículo</label>
          <select name="vehiculoId" defaultValue="">
            <option value="">No aplica</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Conductor</label>
          <select name="conductorId" defaultValue="">
            <option value="">No aplica</option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre_completo}</option>
            ))}
          </select>
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>¿Qué pasó? *</label>
          <textarea name="descripcion" rows={2} required />
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>Causas probables</label>
          <textarea name="causasProbables" rows={2} />
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Reportar"}
        </button>
      </form>
    </div>
  );
}
