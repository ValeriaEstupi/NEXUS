"use client";

import { useState, useTransition } from "react";
import { createVehiculo } from "@/app/lib/actions/vehiculos";

export default function NewVehiculoForm({ empresaId }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await createVehiculo(empresaId, data);
      if (res?.error) setError(res.error);
      else document.getElementById("nuevo-vehiculo-form")?.reset();
    });
  }

  return (
    <div className="card inline-card">
      <h3>Agregar vehículo</h3>
      {error && <div className="message error">{error}</div>}
      <form id="nuevo-vehiculo-form" action={handleSubmit} className="form-grid">
        <div>
          <label>Placa *</label>
          <input name="placa" required placeholder="ABC123" />
        </div>
        <div>
          <label>Tipo</label>
          <input name="tipoVehiculo" placeholder="Van, bus, automóvil..." />
        </div>
        <div>
          <label>Marca / modelo</label>
          <input name="marca" placeholder="Marca" />
        </div>
        <div style={{ maxWidth: 110 }}>
          <label>Año</label>
          <input name="modeloAnio" type="number" min="1980" max="2100" />
        </div>
        <div style={{ maxWidth: 110 }}>
          <label>Capacidad</label>
          <input name="capacidadPasajeros" type="number" min="1" />
        </div>
        <div>
          <label>Propietario</label>
          <input name="propietario" />
        </div>
        <div>
          <label>Vence SOAT</label>
          <input name="fechaVencimientoSoat" type="date" />
        </div>
        <div>
          <label>Vence tecnomecánica</label>
          <input name="fechaVencimientoTecnomecanica" type="date" />
        </div>
        <div>
          <label>Próximo mantenimiento</label>
          <input name="fechaProximoMantenimiento" type="date" />
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar vehículo"}
        </button>
      </form>
    </div>
  );
}
