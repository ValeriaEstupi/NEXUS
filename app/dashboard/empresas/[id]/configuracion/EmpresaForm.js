"use client";

import { useState, useTransition } from "react";
import { updateEmpresa } from "@/app/lib/actions/empresas";

export default function EmpresaForm({ empresa, canEdit }) {
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updateEmpresa(empresa.id, data);
      if (res?.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <section className="section-card">
      <h2>🏢 Datos de la empresa</h2>
      <p className="muted small">
        Estos datos determinan qué tan exigente es el PESV y qué grupo de
        estándares mínimos del SG-SST aplica (Res. 40595/2022 y Res.
        0312/2019).
      </p>
      {error && <div className="message error">{error}</div>}
      <form action={handleSubmit} className="form-grid">
        <div style={{ flexBasis: "100%" }}>
          <label>Razón social *</label>
          <input name="razonSocial" defaultValue={empresa.razon_social} required disabled={!canEdit} />
        </div>
        <div>
          <label>NIT</label>
          <input name="nit" defaultValue={empresa.nit || ""} disabled={!canEdit} />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>N.º de vehículos</label>
          <input
            name="numeroVehiculos"
            type="number"
            min="0"
            defaultValue={empresa.numero_vehiculos || ""}
            disabled={!canEdit}
          />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>N.º de trabajadores</label>
          <input
            name="numeroTrabajadores"
            type="number"
            min="0"
            defaultValue={empresa.numero_trabajadores || ""}
            disabled={!canEdit}
          />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>Nivel de riesgo ARL</label>
          <select name="nivelRiesgoArl" defaultValue={empresa.nivel_riesgo_arl || ""} disabled={!canEdit}>
            <option value="">Sin definir</option>
            {["I", "II", "III", "IV", "V"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ flexBasis: "100%" }}>
          <label>Notas</label>
          <textarea name="notas" rows={2} defaultValue={empresa.notas || ""} disabled={!canEdit} />
        </div>
        {canEdit && (
          <button type="submit" disabled={pending}>
            {pending ? "Guardando..." : saved ? "Guardado ✓" : "Guardar cambios"}
          </button>
        )}
      </form>
    </section>
  );
}
