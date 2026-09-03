"use client";

import { useState, useTransition } from "react";
import { createConductor } from "../../lib/actions/conductores";

export default function NewConductorForm({ vehiculos }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await createConductor(data);
      if (res?.error) setError(res.error);
      else document.getElementById("nuevo-conductor-form")?.reset();
    });
  }

  return (
    <div className="card inline-card">
      <h3>Agregar conductor</h3>
      {error && <div className="message error">{error}</div>}
      <form id="nuevo-conductor-form" action={handleSubmit} className="form-grid">
        <div>
          <label>Nombre completo *</label>
          <input name="nombreCompleto" required />
        </div>
        <div>
          <label>Documento *</label>
          <input name="numeroDocumento" required />
        </div>
        <div>
          <label>Teléfono</label>
          <input name="telefono" />
        </div>
        <div style={{ maxWidth: 110 }}>
          <label>Categoría licencia</label>
          <input name="categoriaLicencia" placeholder="C2" />
        </div>
        <div>
          <label>Vence licencia</label>
          <input name="fechaVencimientoLicencia" type="date" />
        </div>
        <div>
          <label>Último examen médico</label>
          <input name="fechaUltimoExamenMedico" type="date" />
        </div>
        <div>
          <label>Vence examen médico</label>
          <input name="fechaVencimientoExamenMedico" type="date" />
        </div>
        <div>
          <label>Curso conducción segura</label>
          <input name="fechaCursoConduccionSegura" type="date" />
        </div>
        <div>
          <label>Vehículo asignado</label>
          <select name="vehiculoAsignadoId" defaultValue="">
            <option value="">Sin asignar</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar conductor"}
        </button>
      </form>
    </div>
  );
}
