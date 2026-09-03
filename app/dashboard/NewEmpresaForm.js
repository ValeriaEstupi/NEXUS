"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmpresa } from "@/app/lib/actions/empresas";

export default function NewEmpresaForm() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await createEmpresa(data);
      if (res?.error) {
        setError(res.error);
      } else {
        document.getElementById("nueva-empresa-form")?.reset();
        if (res?.empresa?.id) {
          router.push(`/dashboard/empresas/${res.empresa.id}`);
        }
      }
    });
  }

  return (
    <div className="card inline-card">
      <h3>Crear una empresa nueva</h3>
      <p className="muted small">
        Al crearla, arranca con su propia copia editable del catálogo del
        PESV y del SG-SST, y quedas como admin de esa empresa.
      </p>
      {error && <div className="message error">{error}</div>}
      <form id="nueva-empresa-form" action={handleSubmit} className="form-grid">
        <div style={{ flexBasis: "100%" }}>
          <label>Razón social *</label>
          <input name="razonSocial" required />
        </div>
        <div>
          <label>NIT</label>
          <input name="nit" />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>N.º de vehículos</label>
          <input name="numeroVehiculos" type="number" min="0" />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>N.º de trabajadores</label>
          <input name="numeroTrabajadores" type="number" min="0" />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label>Nivel de riesgo ARL</label>
          <select name="nivelRiesgoArl" defaultValue="">
            <option value="">Sin definir</option>
            {["I", "II", "III", "IV", "V"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending}>
          {pending ? "Creando..." : "+ Crear empresa"}
        </button>
      </form>
    </div>
  );
}
